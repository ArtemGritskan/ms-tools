jQuery(document).ready(function($) {
    const resultFields = '.mc-out-kw, .mc-out-kvth, .mc-out-single-cost, .mc-out-total-cost, .mc-tax-inc-val, .mc-tax-stage1, .mc-tax-stage2, .mc-tax-total, .mc-tax-eff-rate';

    function showError(box, message) {
        box.find(resultFields).text('—');
        box.find('.mc-tax-legal-notes').empty();
        box.find('.mc-calc-error').text(message).prop('hidden', false);
    }

    function clearError(box) {
        box.find('.mc-calc-error').text('').prop('hidden', true);
    }

    function prepareFields(box) {
        box.find('input[type="number"]').each(function() {
            const field = $(this);
            const errorId = field.attr('id') + '-error';
            field.attr('aria-describedby', errorId);
            $('<small>', { id: errorId, class: 'mc-field-error', hidden: true }).insertAfter(field);
        });
    }

    function readNumber(field, positive) {
        const input = field[0];
        let message = '';
        const value = input.valueAsNumber;
        if (!input.disabled) {
            if (input.value === '' || !Number.isFinite(value)) message = 'Введите число.';
            else if (positive && value <= 0) message = 'Введите число больше нуля.';
            else if (input.validity.rangeUnderflow) message = 'Минимальное значение: ' + input.min + '.';
            else if (input.validity.rangeOverflow) message = 'Максимальное значение: ' + input.max + '.';
            else if (input.validity.stepMismatch) message = input.step === '1' ? 'Введите целое число.' : 'Допустимый шаг: ' + input.step + '.';
        }
        field.attr('aria-invalid', message ? 'true' : 'false');
        field.next('.mc-field-error').text(message).prop('hidden', !message);
        return message ? NaN : (input.disabled ? 0 : value);
    }

    function validScale(scale) {
        if (!Array.isArray(scale) || scale.length === 0) return false;
        let previous = 0;
        return scale.every(function(step, index) {
            if (!step || !Number.isFinite(step.rate) || step.rate < 0 || step.rate > 1) return false;
            if (index === scale.length - 1) return step.limit === null;
            if (!Number.isFinite(step.limit) || step.limit <= previous) return false;
            previous = step.limit;
            return true;
        });
    }

    function validRules(rules) {
        if (!rules || !validScale(rules.mining_scale) || !validScale(rules.sale_scale)) return false;
        if (!['fiz', 'ip', 'org'].every(function(status) {
            const config = rules[status];
            return config && ['source_stage1', 'source_stage2'].every(key => typeof config[key] === 'string' && config[key].trim() !== '');
        })) return false;
        if (!['fiz', 'ip'].every(status => typeof rules[status].link === 'string' && rules[status].link.trim() !== '')) return false;
        return ['rate_stage1', 'rate_stage2'].every(key => Number.isFinite(rules.org[key]) && rules.org[key] >= 0 && rules.org[key] <= 1);
    }
    
    //1. КАЛЬКУЛЯТОР СТОИМОСТИ РАЗМЕЩЕНИЯ
    $('.mc-hosting-calc-container').each(function() {
        const box = jQuery(this);
        const model = box.find('.mc-asic-model');
        const customBlock = box.find('.mc-custom-power-block');
        const customInput = box.find('.mc-custom-power');
        const count = box.find('.mc-asic-count');
        const tariff = box.find('.mc-tariff');
        const uptime = box.find('.mc-uptime');
        prepareFields(box);

        function calculateHosting() {
            let powerW = model.val() === null || model.val() === '' ? NaN : Number(model.val());
            customInput.prop('disabled', powerW !== 0);
            if (powerW === 0) {
                customBlock.show();
                powerW = readNumber(customInput, true);
            } else {
                customBlock.hide();
                readNumber(customInput, true);
            }
            const countVal = readNumber(count);
            const tariffVal = readNumber(tariff);
            const uptimeVal = readNumber(uptime) / 100;
            if (![powerW, countVal, tariffVal, uptimeVal].every(Number.isFinite) || powerW <= 0) {
                showError(box, 'Расчёт недоступен: проверьте заполненные поля.');
                return;
            }

            const singleKw = powerW / 1000;
            const totalKw = singleKw * countVal;
            const totalKvth = totalKw * 730 * uptimeVal;
            const totalCost = totalKvth * tariffVal;
            const singleCost = countVal > 0 ? totalCost / countVal : 0;
            if (![totalKw, totalKvth, totalCost, singleCost].every(Number.isFinite)) {
                showError(box, 'Расчёт недоступен: введены слишком большие значения.');
                return;
            }
            clearError(box);

            box.find('.mc-out-kw').text(totalKw.toFixed(2));
            box.find('.mc-out-kvth').text(Math.round(totalKvth).toLocaleString('ru-RU'));
            box.find('.mc-out-single-cost').text(Math.round(singleCost).toLocaleString('ru-RU'));
            box.find('.mc-out-total-cost').text(Math.round(totalCost).toLocaleString('ru-RU'));
        }
        box.on('input change', 'input, select', calculateHosting);
        calculateHosting();
    });

    //  2. НАЛОГОВЫЙ КАЛЬКУЛЯТОР МАЙНЕРА
    $('.mc-tax-calc-container').each(function() {
        const box = jQuery(this);
        
        let rules;
        try {
            // конфиг из php
            rules = JSON.parse(box.find('.mc-tax-rules-json').val());
            if (!validRules(rules)) throw new Error('Некорректная структура налоговых правил');
        } catch(e) {
            console.error("Ошибка парсинга JSON-конфигурации шкал:", e);
            showError(box, 'Расчёт недоступен: не удалось загрузить налоговые правила.');
            return;
        }
        prepareFields(box);

        // из конфига!
        const miningScale = rules.mining_scale;
        const saleScale = rules.sale_scale;

        const fizRules = rules.fiz;
        const ipRules = rules.ip;
        const orgRules = rules.org;

        //универсальная функция 
        function calculateProgressiveTax(taxableBase, scale) {
            if (taxableBase <= 0) return 0;
            let accumulatedTax = 0;
            let previousLimit = 0;

            for (let i = 0; i < scale.length; i++) {
                let currentLimit = scale[i].limit;
                let currentRate = scale[i].rate;

                if (currentLimit === null || taxableBase <= currentLimit) {
                    accumulatedTax += (taxableBase - previousLimit) * currentRate;
                    break;
                } else {
                    accumulatedTax += (currentLimit - previousLimit) * currentRate;
                    previousLimit = currentLimit;
                }
            }
            return accumulatedTax;
        }

        function calculateTaxes() {
            const status = box.find('.mc-tax-status').val();
            const btc = readNumber(box.find('.mc-tax-btc'));
            const rateInc = readNumber(box.find('.mc-tax-rate-inc'), true);
            const isSoldChecked = box.find('.mc-tax-is-sold').is(':checked');
            const saleInput = box.find('.mc-tax-rate-sell');
            saleInput.prop('disabled', !isSoldChecked);
            const rateSell = readNumber(saleInput, true);
            
            const powerCost = readNumber(box.find('.mc-tax-power-cost'));
            const otherCost = readNumber(box.find('.mc-tax-other-cost'));
            const totalExpenses = powerCost + otherCost;

            const sellRow = box.find('.mc-tax-sell-row');
            if (isSoldChecked) { 
                sellRow.show(); 
            } else {
                sellRow.hide();
            }
            if (!['fiz', 'ip', 'org'].includes(status) || ![btc, rateInc, rateSell, powerCost, otherCost].every(Number.isFinite)) {
                showError(box, 'Расчёт недоступен: проверьте заполненные поля и налоговый статус.');
                return;
            }

            const grossIncomeStage1 = btc * rateInc;
            if (![grossIncomeStage1, totalExpenses, btc * rateSell].every(Number.isFinite)) {
                showError(box, 'Расчёт недоступен: введены слишком большие значения.');
                return;
            }
            let taxStage1 = 0;
            let noteStage1 = "";

            // Расчет1 
            if (status === 'fiz' || status === 'ip') {
                const config = status === 'fiz' ? fizRules : ipRules;
                const statusName = status === 'fiz' ? 'Физлицо' : 'ИП (НДФЛ)';
                const taxableBase1 = Math.max(0, grossIncomeStage1 - totalExpenses);

                taxStage1 = calculateProgressiveTax(taxableBase1, miningScale);
                noteStage1 = '<b>Этап 1 (' + statusName + '):</b> Рассчитан с чистой базы по прогрессивной шкале майнинга.<br><i>Методика: <a href="' + config.link + '" target="_blank" rel="noopener">' + config.link + '</a>.<br>Обоснование: ' + config.source_stage1 + '</i>';
            
            } else if (status === 'org') {
                const taxableBase1 = Math.max(0, grossIncomeStage1 - totalExpenses);
                taxStage1 = taxableBase1 * orgRules.rate_stage1;
                noteStage1 = '<b>Этап 1 (Юрлицо ОСНО):</b> Налог на прибыль организаций со стоимости добытых блоков по ставке ' + (orgRules.rate_stage1 * 100) + '%. <br><i>Источник: ' + orgRules.source_stage1 + '</i>';
            }

            // Расчет  2 
            let taxStage2 = 0;
            let noteStage2 = "<b>Этап 2:</b> Криптовалюта удерживается на балансе, налог на реализацию равен 0 ₽.";

            if (isSoldChecked) {
                const priceDifferencePerBtc = rateSell - rateInc;

                if (priceDifferencePerBtc > 0) {
                    const cryptoProfit = btc * priceDifferencePerBtc;

                    if (status === 'fiz' || status === 'ip') {
                        const config = status === 'fiz' ? fizRules : ipRules;
                        
                        //  независимо с нуля по шкале sale_scale
                        taxStage2 = calculateProgressiveTax(cryptoProfit, saleScale);
                        noteStage2 = '<b>Этап 2:</b> Налог с положительной курсовой разницы активов по обособленной шкале ФНС.<br><i>Официальная методика: <a href="' + config.link + '" target="_blank">' + config.link + '</a>.<br>Обоснование: ' + config.source_stage2 + '</i>';
                    } else if (status === 'org') {
                        taxStage2 = cryptoProfit * orgRules.rate_stage2;
                        noteStage2 = '<b>Этап 2 (Юрлицо):</b> Налог на прибыль ' + (orgRules.rate_stage2 * 100) + '% от реализации валюты по правилам раздельного учета ФНС. <br><i>Источник: ' + orgRules.source_stage2 + '</i>';
                    }
                } else {
                    noteStage2 = "<b>Этап 2:</b> Монеты реализованы без прибыли. Налоговая база реализации равна 0 ₽.";
                }
            }

            const totalTax = taxStage1 + taxStage2;
            const effectiveRate = grossIncomeStage1 > 0 ? (totalTax / grossIncomeStage1) * 100 : 0;
            if (![taxStage1, taxStage2, totalTax, effectiveRate].every(Number.isFinite)) {
                showError(box, 'Расчёт недоступен: введены слишком большие значения.');
                return;
            }
            clearError(box);

            box.find('.mc-tax-inc-val').text(Math.round(grossIncomeStage1).toLocaleString('ru-RU') + ' ₽');
            box.find('.mc-tax-stage1').text(Math.round(taxStage1).toLocaleString('ru-RU') + ' ₽');
            box.find('.mc-tax-stage2').text(Math.round(taxStage2).toLocaleString('ru-RU') + ' ₽');
            
            box.find('.mc-tax-total').text(Math.round(totalTax).toLocaleString('ru-RU'));
            box.find('.mc-tax-eff-rate').text(effectiveRate.toFixed(1));
            
            box.find('.mc-tax-legal-notes').html('<p style="margin-bottom:10px;">' + noteStage1 + '</p><p style="margin:0;">' + noteStage2 + '</p>');
        }

        box.on('input change', 'input, select', calculateTaxes);
        calculateTaxes();
    });
});

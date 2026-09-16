jQuery(document).ready(function($) {
    
    //1. КАЛЬКУЛЯТОР СТОИМОСТИ РАЗМЕЩЕНИЯ
    $('.mc-hosting-calc-container').each(function() {
        const $box = $(this);
        const $model = $box.find('.mc-asic-model');
        const $customBlock = $box.find('.mc-custom-power-block');
        const $customInput = $box.find('.mc-custom-power');
        const $count = $box.find('.mc-asic-count');
        const $tariff = $box.find('.mc-tariff');
        const $uptime = $box.find('.mc-uptime');

        function calculateHosting() {
            let powerW = parseFloat($model.val()) || 0;
            if (powerW === 0) {
                $customBlock.show();
                powerW = parseFloat($customInput.val()) || 0;
            } else {
                $customBlock.hide();
            }
            const count = parseInt($count.val()) || 0;
            const tariff = parseFloat($tariff.val()) || 0;
            const uptime = (parseFloat($uptime.val()) || 0) / 100;

            const singleKw = powerW / 1000;
            const totalKw = singleKw * count;
            const totalKvth = totalKw * 730 * uptime;
            const totalCost = totalKvth * tariff;
            const singleCost = count > 0 ? totalCost / count : 0;

            $box.find('.mc-out-kw').text(totalKw.toFixed(2));
            $box.find('.mc-out-kvth').text(Math.round(totalKvth).toLocaleString('ru-RU'));
            $box.find('.mc-out-single-cost').text(Math.round(singleCost).toLocaleString('ru-RU') + ' ₽');
            $box.find('.mc-out-total-cost').text(Math.round(totalCost).toLocaleString('ru-RU'));
        }
        $box.on('input change', 'input, select', calculateHosting);
        calculateHosting();
    });

    //2. НАЛОГОВЫЙ КАЛЬКУЛЯТОР МАЙНЕРА
    $('.mc-tax-calc-container').each(function() {
        const $box = $(this);
        const rules = JSON.parse($box.attr('data-rules') || '{}');

        const fizRules = rules.fiz || { threshold: 2400000, rate_under_threshold: 0.13, rate_over_threshold: 0.15, source_stage1: "", source_stage2: "" };
        const ipRules = rules.ip || { threshold: 2400000, rate_under_threshold: 0.13, rate_over_threshold: 0.15, source_stage1: "", source_stage2: "" };
        const orgRules = rules.org || { rate_stage1: 0.25, rate_stage2: 0.25, source_stage1: "", source_stage2: "" };

        function calculateTaxes() {
            const status = $box.find('.mc-tax-status').val();
            const btc = parseFloat($box.find('.mc-tax-btc').val()) || 0;
            const rateInc = parseFloat($box.find('.mc-tax-rate-inc').val()) || 0;
            const isSoldChecked = $box.find('.mc-tax-is-sold').is(':checked');
            const rateSell = parseFloat($box.find('.mc-tax-rate-sell').val()) || 0;
            
            const powerCost = parseFloat($box.find('.mc-tax-power-cost').val()) || 0;
            const otherCost = parseFloat($box.find('.mc-tax-other-cost').val()) || 0;
            const totalExpenses = powerCost + otherCost;

        
            const $sellRow = $box.find('.mc-tax-sell-row');
            if (isSoldChecked) { 
                $sellRow.show(); 
            } else { 
                $sellRow.hide(); 
            }

            const grossIncomeStage1 = btc * rateInc;
            let taxStage1 = 0;
            let noteStage1 = "";

            // Расчет ЭТАПА 1
            if (status === 'fiz' || status === 'ip') {
                const config = status === 'fiz' ? fizRules : ipRules;
                const statusName = status === 'fiz' ? 'Физлицо' : 'ИП (НДФЛ)';
                
                const taxableBase1 = Math.max(0, grossIncomeStage1 - totalExpenses);

                if (taxableBase1 <= config.threshold) {
                    taxStage1 = taxableBase1 * config.rate_under_threshold;
                } else {
                    taxStage1 = (config.threshold * config.rate_under_threshold) + 
                                ((taxableBase1 - config.threshold) * config.rate_over_threshold);
                }
                noteStage1 = `<b>Этап 1 (${statusName}):</b> Налог НДФЛ рассчитан по прогрессивной шкале с чистой базы (Доход минус Расходы). Порог: ${(config.threshold/1000000).toFixed(1)} млн ₽. <br><i>Источник: ${config.source_stage1}</i>`;
            
            } else if (status === 'org') {
                const taxableBase1 = Math.max(0, grossIncomeStage1 - totalExpenses);
                taxStage1 = taxableBase1 * orgRules.rate_stage1;
                noteStage1 = `<b>Этап 1 (Юрлицо ОСНО):</b> Налог на прибыль организаций со стоимости добытых блоков за вычетом затрат по ставке ${orgRules.rate_stage1 * 100}%. <br><i>Источник: ${orgRules.source_stage1}</i>`;
            }

            //этап 2
            let taxStage2 = 0;
            let noteStage2 = "<b>Этап 2:</b> Криптовалюта удерживается на балансе, налог на реализацию равен 0 ₽.";

            if (isSoldChecked) {
                const priceDifferencePerBtc = rateSell - rateInc;

                if (priceDifferencePerBtc > 0) {
                    const cryptoProfit = btc * priceDifferencePerBtc;

                    if (status === 'fiz') {
                        taxStage2 = cryptoProfit * fizRules.rate_under_threshold;
                        noteStage2 = `<b>Этап 2 (Физлицо):</b> НДФЛ ${fizRules.rate_under_threshold * 100}% со стоимости курсовой разницы при продаже имущества. <br><i>Источник: ${fizRules.source_stage2}</i>`;
                    } else if (status === 'ip') {
                        taxStage2 = cryptoProfit * ipRules.rate_under_threshold;
                        noteStage2 = `<b>Этап 2 (ИП):</b> НДФЛ по ставке ${ipRules.rate_under_threshold * 100}% с положительной курсовой разницы активов. <br><i>Источник: ${ipRules.source_stage2}</i>`;
                    } else if (status === 'org') {
                        taxStage2 = cryptoProfit * orgRules.rate_stage2;
                        noteStage2 = `<b>Этап 2 (Юрлицо):</b> Налог на прибыль ${orgRules.rate_stage2 * 100}% от реализации валюты по правилам раздельного учета ФНС. <br><i>Источник: ${orgRules.source_stage2}</i>`;
                    }
                } else {
                    noteStage2 = "<b>Этап 2:</b> Монеты проданы без прибыли (курс продажи ниже или равен курсу зачисления). Налоговая база реализации равна 0 ₽.";
                }
            }

            const totalTax = (taxStage1 || 0) + (taxStage2 || 0);
            const effectiveRate = grossIncomeStage1 > 0 ? (totalTax / grossIncomeStage1) * 100 : 0;

            $box.find('.mc-tax-inc-val').text(Math.round(grossIncomeStage1 || 0).toLocaleString('ru-RU') + ' ₽');
            $box.find('.mc-tax-stage1').text(Math.round(taxStage1 || 0).toLocaleString('ru-RU') + ' ₽');
            $box.find('.mc-tax-stage2').text(Math.round(taxStage2 || 0).toLocaleString('ru-RU') + ' ₽');
            
            $box.find('.mc-tax-total').text(Math.round(totalTax || 0).toLocaleString('ru-RU'));
            $box.find('.mc-tax-eff-rate').text((effectiveRate || 0).toFixed(1));
            
            $box.find('.mc-tax-legal-notes').html(`<p style="margin-bottom:10px;">${noteStage1}</p><p style="margin:0;">${noteStage2}</p>`);
        }

        //  обработчик событий на любые изменения внутри блока
        $box.on('input change', 'input, select', calculateTaxes);
        
      
        calculateTaxes();
    });
});

jQuery(document).ready(function() {
    
    //1. КАЛЬКУЛЯТОР СТОИМОСТИ РАЗМЕЩЕНИЯ
    jQuery('.mc-hosting-calc-container').each(function() {
        const box = jQuery(this);
        const model = box.find('.mc-asic-model');
        const customBlock = box.find('.mc-custom-power-block');
        const customInput = box.find('.mc-custom-power');
        const count = box.find('.mc-asic-count');
        const tariff = box.find('.mc-tariff');
        const uptime = box.find('.mc-uptime');

        function calculateHosting() {
            let powerW = parseFloat(model.val()) || 0;
            if (powerW === 0) {
                customBlock.show();
                powerW = parseFloat(customInput.val()) || 0;
            } else {
                customBlock.hide();
            }
            const countVal = parseInt(count.val()) || 0;
            const tariffVal = parseFloat(tariff.val()) || 0;
            const uptimeVal = (parseFloat(uptime.val()) || 0) / 100;

            const singleKw = powerW / 1000;
            const totalKw = singleKw * countVal;
            const totalKvth = totalKw * 730 * uptimeVal;
            const totalCost = totalKvth * tariffVal;
            const singleCost = countVal > 0 ? totalCost / countVal : 0;

            box.find('.mc-out-kw').text(totalKw.toFixed(2));
            box.find('.mc-out-kvth').text(Math.round(totalKvth).toLocaleString('ru-RU'));
            box.find('.mc-out-single-cost').text(Math.round(singleCost).toLocaleString('ru-RU') + ' ₽');
            box.find('.mc-out-total-cost').text(Math.round(totalCost).toLocaleString('ru-RU'));
        }
        box.on('input change', 'input, select', calculateHosting);
        calculateHosting();
    });

    // 2. НАЛОГОВЫЙ КАЛЬКУЛЯТОР МАЙНЕРА
    jQuery('.mc-tax-calc-container').each(function() {
        const box = jQuery(this);

        // 5 ступ шкала 
        const scale = [
            { limit: 2400000, rate: 0.13 },
            { limit: 5000000, rate: 0.15 },
            { limit: 20000000, rate: 0.18 },
            { limit: 50000000, rate: 0.20 },
            { limit: null, rate: 0.22 }
        ];

        function calculateProgressiveTax(taxableBase) {
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
            const btc = parseFloat(box.find('.mc-tax-btc').val()) || 0;
            const rateInc = parseFloat(box.find('.mc-tax-rate-inc').val()) || 0;
            const isSoldChecked = box.find('.mc-tax-is-sold').is(':checked');
            const rateSell = parseFloat(box.find('.mc-tax-rate-sell').val()) || 0;
            
            const powerCost = parseFloat(box.find('.mc-tax-power-cost').val()) || 0;
            const otherCost = parseFloat(box.find('.mc-tax-other-cost').val()) || 0;
            const totalExpenses = powerCost + otherCost;

            const sellRow = box.find('.mc-tax-sell-row');
            if (isSoldChecked) { 
                sellRow.show(); 
            } else { 
                sellRow.hide(); 
            }

            const grossIncomeStage1 = btc * rateInc;
            let taxStage1 = 0;
            let noteStage1 = "";

            if (status === 'fiz' || status === 'ip') {
                const statusName = status === 'fiz' ? 'Физлицо' : 'ИП (НДФЛ)';
                const linkUrl = status === 'fiz' ? '/doc/fns-fizlitsa/' : '/doc/fns-ip/';
                const taxableBase1 = Math.max(0, grossIncomeStage1 - totalExpenses);

                taxStage1 = calculateProgressiveTax(taxableBase1);
                
                noteStage1 = '<b>Этап 1 (' + statusName + '):</b> Рассчитан с чистой базы по 5-ступенчатой прогрессивной шкале сайта.<br><i>Официальная методика: <a href="' + linkUrl + '" target="_blank">' + linkUrl + '</a>.</i>';
            
            } else if (status === 'org') {
                const taxableBase1 = Math.max(0, grossIncomeStage1 - totalExpenses);
                taxStage1 = taxableBase1 * 0.25;
                noteStage1 = '<b>Этап 1 (Юрлицо ОСНО):</b> Налог на прибыль организаций со стоимости добытых блоков по ставке 25%.';
            }

            let taxStage2 = 0;
            let noteStage2 = "<b>Этап 2:</b> Криптовалюта удерживается на балансе, налог на реализацию равен 0 ₽.";

            if (isSoldChecked) {
                const priceDifferencePerBtc = rateSell - rateInc;

                if (priceDifferencePerBtc > 0) {
                    const cryptoProfit = btc * priceDifferencePerBtc;

                    if (status === 'fiz' || status === 'ip') {
                        const linkUrl = status === 'fiz' ? '/doc/fns-fizlitsa/' : '/doc/fns-ip/';
                        taxStage2 = calculateProgressiveTax(cryptoProfit);
                        noteStage2 = '<b>Этап 2:</b> Налог с положительной курсовой разницы активов по обособленной шкале ФНС.<br><i>Подробнее на: <a href="' + linkUrl + '" target="_blank">' + linkUrl + '</a>.</i>';
                    } else if (status === 'org') {
                        taxStage2 = cryptoProfit * 0.25;
                        noteStage2 = '<b>Этап 2 (Юрлицо):</b> Налог на прибыль 25% от реализации валюты по правилам раздельного учета ФНС.';
                    }
                } else {
                    noteStage2 = "<b>Этап 2:</b> Монеты реализованы без прибыли. Налоговая база реализации равна 0 ₽.";
                }
            }

            const totalTax = (taxStage1 || 0) + (taxStage2 || 0);
            const effectiveRate = grossIncomeStage1 > 0 ? (totalTax / grossIncomeStage1) * 100 : 0;

            box.find('.mc-tax-inc-val').text(Math.round(grossIncomeStage1 || 0).toLocaleString('ru-RU') + ' ₽');
            box.find('.mc-tax-stage1').text(Math.round(taxStage1 || 0).toLocaleString('ru-RU') + ' ₽');
            box.find('.mc-tax-stage2').text(Math.round(taxStage2 || 0).toLocaleString('ru-RU') + ' ₽');
            
            box.find('.mc-tax-total').text(Math.round(totalTax || 0).toLocaleString('ru-RU'));
            box.find('.mc-tax-eff-rate').text((effectiveRate || 0).toFixed(1));
            
            box.find('.mc-tax-legal-notes').html('<p style="margin-bottom:10px;">' + noteStage1 + '</p><p style="margin:0;">' + noteStage2 + '</p>');
        }

        box.on('input change', 'input, select', calculateTaxes);
        calculateTaxes();
    });
});

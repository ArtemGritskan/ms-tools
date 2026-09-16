jQuery(document).ready(function($) {
    
    // === 1. КАЛЬКУЛЯТОР СТОИМОСТИ РАЗМЕЩЕНИЯ ===
    $('.mc-hosting-calc-container').each(function() {
        const $box = $(this);
        const $model = $box.find('.mc-asic-model');
        const $customBlock = $box.find('.mc-custom-power-block');
        const $customInput = $box.find('.mc-custom-power');
        const $count = $box.find('.mc-asic-count');
        const $tariff = $box.find('.mc-tariff');
        const $uptime = $box.find('.mc-uptime');

        function calculateHosting() {
            let powerW = parseFloat($model.val());  
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
            $box.find('.mc-out-single-cost').text(Math.round(singleCost).toLocaleString('ru-RU'));
            $box.find('.mc-out-total-cost').text(Math.round(totalCost).toLocaleString('ru-RU'));
        }
        $box.on('input change', 'input, select', calculateHosting);
        calculateHosting();
    });

    // === 2. НАЛОГОВЫЙ КАЛЬКУЛЯТОР МАЙНЕРА ===
    $('.mc-tax-calc-container').each(function() {
        const $box = $(this);
        const rules = JSON.parse($box.attr('data-rules') || '{}');
        const $isSold = $box.find('.mc-tax-is-sold');
        const $sellRow = $box.find('.mc-tax-sell-row');

        function calculateTaxes() {
            const status = $box.find('.mc-tax-status').val();
            const btc = parseFloat($box.find('.mc-tax-btc').val()) || 0;
            const rateInc = parseFloat($box.find('.mc-tax-rate-inc').val()) || 0;
            const isSoldChecked = $isSold.is(':checked');
            const rateSell = parseFloat($box.find('.mc-tax-rate-sell').val()) || 0;
            
            const powerCost = parseFloat($box.find('.mc-tax-power-cost').val()) || 0;
            const otherCost = parseFloat($box.find('.mc-tax-other-cost').val()) || 0;
            const totalExpenses = powerCost + otherCost;

            if (isSoldChecked) { $sellRow.show(); } else { $sellRow.hide(); }

            const incomeStage1 = btc * rateInc;
            let taxStage1 = 0;
            let noteStage1 = "";

            if (status === 'fiz') {
                if (incomeStage1 <= 5000000) {
                    taxStage1 = incomeStage1 * 0.13;
                    noteStage1 = `<b>Этап 1 (Физлицо):</b> НДФЛ по базовой ставке 13% со стоимости BTC на дату зачисления. <br><i>Источник: ${rules.fiz.source_stage1}</i>`;
                } else {
                    taxStage1 = (5000000 * 0.13) + ((incomeStage1 - 5000000) * 0.15);
                    noteStage1 = `<b>Этап 1 (Физлицо):</b> НДФЛ по прогрессивной ставке (13% до 5 млн ₽ + 15% с перерасхода). <br><i>Источник: ${rules.fiz.source_stage1}</i>`;
                }
            } else if (status === 'ip') {
                taxStage1 = incomeStage1 * rules.ip.rate_stage1;
                noteStage1 = `<b>Этап 1 (ИП):</b> Налог УСН 'Доходы' по ставке ${rules.ip.rate_stage1 * 100}% без учета операционных затрат. <br><i>Источник: ${rules.ip.source_stage1}</i>`;
            } else if (status === 'org') {
                taxStage1 = Math.max(0, (incomeStage1 - totalExpenses) * rules.org.rate_stage1);
                noteStage1 = `<b>Этап 1 (Юрлицо):</b> Налог на прибыль организаций со стоимости добытых блоков за вычетом затрат, ставка ${rules.org.rate_stage1 * 100}%. <br><i>Источник: ${rules.org.source_stage1}</i>`;
            }

            let taxStage2 = 0;
            let noteStage2 = "<b>Этап 2:</b> Криптовалюта удерживается на балансе, налог на реализацию равен 0 ₽.";

            if (isSoldChecked) {
                const incomeStage2 = btc * rateSell;
                const priceDifference = incomeStage2 - incomeStage1;

                if (priceDifference > 0) {
                    if (status === 'fiz') {
                        taxStage2 = priceDifference * rules.fiz.rate_stage2;
                        noteStage2 = `<b>Этап 2 (Физлицо):</b> НДФЛ ${rules.fiz.rate_stage2 * 100}% с положительной курсовой разницы при продаже имущества. <br><i>Источник: ${rules.fiz.source_stage2}</i>`;
                    } else if (status === 'ip') {
                        taxStage2 = priceDifference * rules.ip.rate_stage2;
                        noteStage2 = `<b>Этап 2 (ИП):</b> УСН ${rules.ip.rate_stage2 * 100}% с прибыли от курсовой разницы при реализации монет. <br><i>Источник: ${rules.ip.source_stage2}</i>`;
                    } else if (status === 'org') {
                        taxStage2 = priceDifference * rules.org.rate_stage2;
                        noteStage2 = `<b>Этап 2 (Юрлицо):</b> Налог на прибыль ${rules.org.rate_stage2 * 100}% от реализации цифровой валюты по правилам раздельного учета. <br><i>Источник: ${rules.org.source_stage2}</i>`;
                    }
                } else {
                    noteStage2 = "<b>Этап 2:</b> Монеты проданы по курсу ниже курса зачисления. Налоговая база реализации отсутствует, налог равен 0 ₽.";
                }
            }

            const totalTax = taxStage1 + taxStage2;
            const effectiveRate = incomeStage1 > 0 ? (totalTax / incomeStage1) * 100 : 0;

            $box.find('.mc-tax-inc-val').text(Math.round(incomeStage1).toLocaleString('ru-RU'));
            $box.find('.mc-tax-stage1').text(Math.round(taxStage1).toLocaleString('ru-RU'));
            $box.find('.mc-tax-stage2').text(Math.round(taxStage2).toLocaleString('ru-RU'));
            $box.find('.mc-tax-total').text(Math.round(totalTax).toLocaleString('ru-RU'));
            $box.find('.mc-tax-eff-rate').text(effectiveRate.toFixed(1));
            $box.find('.mc-tax-legal-notes').html(`<p style="margin-bottom:10px;">${noteStage1}</p><p style="margin:0;">${noteStage2}</p>`);
        }

        $box.on('input change', 'input, select', calculateTaxes);
        calculateTaxes();
    });
});

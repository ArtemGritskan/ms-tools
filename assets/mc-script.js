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

            const grossIncomeStage1 = btc * rateInc;
            let taxStage1 = 0;
            let noteStage1 = "";

            // Новая логика: Физлица и ИП уменьшают базу на расходы, считаются по шкале 2025/2026 года
            if (status === 'fiz' || status === 'ip') {
                const config = status === 'fiz' ? rules.fiz : rules.ip;
                const statusName = status === 'fiz' ? 'Физлицо' : 'ИП (НДФЛ)';
                
                // База = Доход - Расходы по правилам страниц сайта
                const taxableBase1 = Math.max(0, grossIncomeStage1 - totalExpenses);

                if (taxableBase1 <= config.threshold) {
                    taxStage1 = taxableBase1 * config.rate_under_threshold;
                } else {
                    taxStage1 = (config.threshold * config.rate_under_threshold) + 
                                ((taxableBase1 - config.threshold) * config.rate_over_threshold);
                }
                noteStage1 = `<b>Этап 1 (${statusName}):</b> Налог НДФЛ рассчитан по прогрессивной шкале с чистой базы (Доход минус Расходы). Порог: ${(config.threshold/1000000).toFixed(1)} млн ₽. <br><i>Источник: ${config.source_stage1}</i>`;
            
            } else if (status === 'org') {
                // Юрлица (ОСНО) - 25% с чистой прибыли
                const taxableBase1 = Math.max(0, grossIncomeStage1 - totalExpenses);
                taxStage1 = taxableBase1 * rules.org.rate_stage1;
                noteStage1 = `<b>Этап 1 (Юрлицо ОСНО):</b> Налог на прибыль организаций со стоимости добытых блоков за вычетом затрат по ставке ${rules.org.rate_stage1 * 100}%. <br><i>Источник: ${rules.org.source_stage1}</i>`;
            }

            let taxStage2 = 0;
            let noteStage2 = "<b>Этап 2:</b> Криптовалюта удерживается на балансе, налог на реализацию равен 0 ₽.";

            if (isSoldChecked) {
                const incomeStage2 = btc * rateSell;
                const priceDifference = incomeStage2 - grossIncomeStage1;

                if (priceDifference > 0) {
                    if (status === 'fiz') {
                        taxStage2 = priceDifference * rules.fiz.rate_stage2;
                        noteStage2 = `<b>Этап 2 (Физлицо):</b> НДФЛ ${rules.fiz.rate_stage2 * 100}% со стоимости курсовой разницы при продаже имущества. <br><i>Источник: ${rules.fiz.source_stage2}</i>`;
                    } else if (status === 'ip') {
                        taxStage2 = priceDifference * rules.ip.rate_stage2;
                        noteStage2 = `<b>Этап 2 (ИП):</b> НДФЛ по ставке ${rules.ip.rate_stage2 * 100}% с положительной курсовой разницы активов. <br><i>Источник: ${rules.ip.source_stage2}</i>`;
                    } else if (status === 'org') {
                        taxStage2 = priceDifference * rules.org.rate_stage2;
                        noteStage2 = `<b>Этап 2 (Юрлицо):</b> Налог на прибыль ${rules.org.rate_stage2 * 100}% от реализации валюты по правилам раздельного учета ФНС. <br><i>Источник: ${rules.org.source_stage2}</i>`;
                    }
                } else {
                    noteStage2 = "<b>Этап 2:</b> Монеты проданы без прибыли (курс ниже или равен курсу зачисления). Налоговая база реализации равна 0 ₽.";
                }
            }

            const totalTax = taxStage1 + taxStage2;
            const effectiveRate = grossIncomeStage1 > 0 ? (totalTax / grossIncomeStage1) * 100 : 0;

            $box.find('.mc-tax-inc-val').text(Math.round(grossIncomeStage1).toLocaleString('ru-RU'));
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

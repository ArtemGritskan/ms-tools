<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function mc_tax_calc_shortcode( $atts ) {
    $args = shortcode_atts( array(
        'status' => 'select', 
    ), $atts );

    $config_path = dirname( __DIR__ ) . '/config/tax-rules-2026.json';
    $config_data = file_exists( $config_path ) ? file_get_contents( $config_path ) : '{}';

    ob_start();
    ?>
    <div class="mc-calc-box" id="mc-tax-calc" data-rules='<?php echo esc_attr($config_data); ?>'>
        <h3>Налоговый калькулятор майнера</h3>
        
        <?php if ( $args['status'] === 'select' ) : ?>
            <div class="mc-field">
                <label for="mc-tax-status">Ваш налоговый статус</label>
                <select id="mc-tax-status">
                    <option value="fiz">Физическое лицо</option>
                    <option value="ip">Индивидуальный предприниматель (ИП)</option>
                    <option value="org">Юридическое лицо (Организация)</option>
                </select>
            </div>
        <?php else : ?>
            <input type="hidden" id="mc-tax-status" value="<?php echo esc_attr( $args['status'] ); ?>">
            <p style="font-size:13px; color:#8c8c8c; margin-bottom:15px; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                Методика расчета: <strong style="color:#007aff;">
                    <?php 
                        if($args['status'] == 'fiz') echo 'Физлицо';
                        if($args['status'] == 'ip') echo 'ИП (УСН)';
                        if($args['status'] == 'org') echo 'Юрлицо (ОСНО)';
                    ?>
                </strong>
            </p>
        <?php endif; ?>

        <div class="mc-field">
            <label for="mc-tax-btc">Намайнено цифровой валюты за период (BTC)</label>
            <input type="number" step="0.00000001" id="mc-tax-btc" value="0.10000000" min="0">
        </div>

        <div class="mc-field">
            <label for="mc-tax-rate-inc">Курс BTC в ₽ (на дату зачисления)</label>
            <input type="number" id="mc-tax-rate-inc" value="6000000" min="0">
        </div>

        <div class="mc-field mc-checkbox-wrapper" style="display: flex; align-items: center; margin: 15px 0;">
            <input type="checkbox" id="mc-tax-is-sold" checked style="width: auto; margin-right: 8px;">
            <label for="mc-tax-is-sold" style="margin: 0; font-size: 14px; color:#111; cursor:pointer;">Криптовалюта уже реализована (продана)</label>
        </div>

        <div class="mc-field" id="mc-tax-sell-row">
            <label for="mc-tax-rate-sell">Курс продажи BTC в ₽</label>
            <input type="number" id="mc-tax-rate-sell" value="6500000" min="0">
        </div>

        <div class="mc-field">
            <label for="mc-tax-power-cost">Расходы на электроэнергию (₽)</label>
            <input type="number" id="mc-tax-power-cost" value="150000" min="0">
        </div>

        <div class="mc-field">
            <label for="mc-tax-other-cost">Прочие расходы: размещение, амортизация (₽)</label>
            <input type="number" id="mc-tax-other-cost" value="50000" min="0">
        </div>

        <div class="mc-outputs">
            <p class="mc-price-row">Итого налог: <span id="mc-tax-total">0</span> ₽</p>
            
            <p class="mc-info-row">Доход при получении: <span><span id="mc-tax-inc-val">0</span> ₽</span></p>
            <p class="mc-info-row">Этап 1: Налог на добычу: <span><span id="mc-tax-stage1">0</span> ₽</span></p>
            <p class="mc-info-row">Этап 2: Налог при реализации: <span><span id="mc-tax-stage2">0</span> ₽</span></p>
            <p class="mc-info-row">Эффективная ставка: <span><span id="mc-tax-eff-rate">0</span>%</span></p>
            
            <details class="mc-tax-methodology" style="margin-top: 15px; font-size: 13px;">
                <summary style="cursor: pointer; color: #007aff; font-weight: 500;">Посмотреть обоснование и статьи НК РФ</summary>
                <div id="mc-tax-legal-notes" style="margin-top: 10px; background: #f8fafc; padding: 10px; border-radius: 6px; color: #4a5568; line-height: 1.4;"></div>
            </details>

            <small class="mc-note" style="color: #e53e3e; font-weight: 600; text-align: center; border-top: 1px dashed #fed7d7; padding-top: 10px; margin-top: 15px;">
                Точную цену считает менеджер • Расчет не является налоговой консультацией.
            </small>
        </div>

        <a href="#popup_request" class="mc-btn-submit">Получить консультацию</a>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode( 'mc_tax_calc', 'mc_tax_calc_shortcode' );

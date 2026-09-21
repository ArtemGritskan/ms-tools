<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function mc_tax_calc_shortcode( $atts ) {
    wp_enqueue_style( 'mc-style' );
    wp_enqueue_script( 'mc-script' );

    $args = shortcode_atts( array( 'status' => 'select' ), $atts );
    
    $config_path = dirname( __DIR__ ) . '/config/tax-rules-2026.json';
    $config_data = file_exists( $config_path ) ? file_get_contents( $config_path ) : '{}';

    ob_start();
    ?>
    <div class="mc-calc-box mc-tax-calc-container" data-rules='<?php echo esc_attr($config_data); ?>'>
        <h3>Налоговый калькулятор майнера</h3>
        
        <?php if ( $args['status'] === 'select' ) : ?>
            <div class="mc-field">
                <label>Ваш налоговый статус</label>
                <select class="mc-tax-status">
                    <option value="fiz">Физическое лицо (НДФЛ)</option>
                    <option value="ip">Индивидуальный предприниматель (НДФЛ для ИП)</option>
                    <option value="org">Юридическое лицо (Организация ОСНО)</option>
                </select>
            </div>
        <?php else : ?>
            <input type="hidden" class="mc-tax-status" value="<?php echo esc_attr( $args['status'] ); ?>">
            <p class="mc-status-meta">
                Методика расчета: <strong>
                    <?php 
                        if($args['status'] == 'fiz') echo 'Физическое лицо (НДФЛ)';
                        if($args['status'] == 'ip') echo 'ИП (НДФЛ)';
                        if($args['status'] == 'org') echo 'Юрлицо (ОСНО)';
                    ?>
                </strong>
            </p>
        <?php endif; ?>

        <div class="mc-field">
            <label>Намайнено цифровой валюты за период (BTC)</label>
            <input type="number" step="0.00000001" class="mc-tax-btc" value="1.00000000" min="0">
        </div>

        <div class="mc-field">
            <label>Курс BTC в ₽ (на дату зачисления)</label>
            <input type="number" class="mc-tax-rate-inc" value="6000000" min="0">
        </div>

        <div class="mc-field mc-checkbox-wrapper">
            <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" class="mc-tax-is-sold" checked style="width: auto; margin-right: 8px;">
                Криптовалюта уже реализована (продана)
            </label>
        </div>

        <div class="mc-field mc-tax-sell-row">
            <label>Курс продажи BTC в ₽</label>
            <input type="number" class="mc-tax-rate-sell" value="6500000" min="0">
        </div>

        <div class="mc-field">
            <label>Расходы на электроэнергию (₽)</label>
            <input type="number" class="mc-tax-power-cost" value="1000000" min="0">
        </div>

        <div class="mc-field">
            <label>Прочие расходы: размещение, амортизация (₽)</label>
            <input type="number" class="mc-tax-other-cost" value="60000" min="0">
        </div>

        <div class="mc-outputs">
            <p class="mc-price-row">Итого налог: <span class="mc-tax-total">0</span> ₽</p>
            <p class="mc-info-row">Доход при получении: <span><span class="mc-tax-inc-val">0</span></span></p>
            <p class="mc-info-row">Этап 1: Налог на добычу: <span><span class="mc-tax-stage1">0</span></span></p>
            <p class="mc-info-row">Этап 2: Налог при реализации: <span><span class="mc-tax-stage2">0</span></span></p>
            <p class="mc-info-row">Эффективная ставка: <span><span class="mc-tax-eff-rate">0</span>%</span></p>
            
            <details class="mc-tax-methodology">
                <summary>Посмотреть обоснование и статьи НК РФ</summary>
                <div class="mc-tax-legal-notes"></div>
            </details>

            <small class="mc-note-disclaimer">
                Расчет ориентировочный и не является налоговой консультацией.
            </small>
        </div>

        <a href="#popup_request" class="mc-btn-submit">Получить консультацию</a>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode( 'mc_tax_calc', 'mc_tax_calc_shortcode' );

<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function mc_hosting_calc_shortcode() {
    // только при вызове шорткода 
    wp_enqueue_style( 'mc-style' );
    wp_enqueue_script( 'mc-script' );

    $config_path = dirname( __DIR__ ) . '/config/hosting-config.json';
    if ( ! file_exists( $config_path ) ) return '';
    $config = json_decode( file_get_contents( $config_path ), true );
    
    ob_start();
    ?>
    <div class="mc-calc-box mc-hosting-calc-container">
        <h3>Калькулятор стоимости размещения</h3>
        
        <div class="mc-field">
            <label>Модель ASIC</label>
            <select class="mc-asic-model">
                <?php if ( ! empty( $config['asics'] ) ) : ?>
                    <?php foreach ( $config['asics'] as $asic ) : ?>
                        <option value="<?php echo esc_attr($asic['power_w']); ?>">
                            <?php echo esc_html($asic['name']); ?>
                        </option>
                    <?php endforeach; ?>
                <?php endif; ?>
            </select>
        </div>

        <div class="mc-field mc-custom-power-block" style="display:none;">
            <label>Потребление одной машины (Ватт)</label>
            <input type="number" class="mc-custom-power" value="0" min="0">
        </div>

        <div class="mc-field">
            <label>Количество машин (шт)</label>
            <input type="number" class="mc-asic-count" value="10" min="1">
        </div>

        <div class="mc-field">
            <label>Тариф (₽ за кВт·ч)</label>
            <input type="number" step="0.1" class="mc-tariff" value="<?php echo esc_attr($config['default_tariff'] ?? 3.3); ?>">
        </div>

        <div class="mc-field">
            <label>Аптайм (%)</label>
            <input type="number" class="mc-uptime" value="<?php echo esc_attr($config['default_uptime'] ?? 99); ?>" min="0" max="100">
        </div>

        <div class="mc-outputs">
            <p class="mc-price-row">Стоимость: <span class="mc-out-total-cost">0</span> ₽</p>
            <p class="mc-info-row">Суммарная мощность: <span><span class="mc-out-kw">0</span> кВт</span></p>
            <p class="mc-info-row">Потребление в месяц: <span><span class="mc-out-kvth">0</span> кВт·ч</span></p>
            <p class="mc-info-row">На одну машину: <span><span class="mc-out-single-cost">0</span> ₽/мес</span></p>
        </div>

        <a href="#popup_request" class="mc-btn-submit">Заказать</a>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode( 'mc_hosting_calc', 'mc_hosting_calc_shortcode' );

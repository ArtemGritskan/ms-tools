<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function mc_hosting_calc_shortcode() {
    // только при вызове шорткода 
    wp_enqueue_style( 'mc-style' );
    wp_enqueue_script( 'mc-script' );

    $config_path = dirname( __DIR__ ) . '/config/hosting-config.json';
    $config = mc_tools_load_config( $config_path, 'hosting' );
    if ( $config === null ) return mc_tools_config_error( 'Расчёт недоступен: не удалось загрузить настройки размещения.' );
    $prefix = wp_unique_id( 'mc-hosting-' );
    
    ob_start();
    ?>
    <div class="mc-calc-box mc-hosting-calc-container">
        <h3>Калькулятор стоимости размещения</h3>
        
        <div class="mc-field">
            <label for="<?php echo esc_attr( $prefix . '-model' ); ?>">Модель ASIC</label>
            <select id="<?php echo esc_attr( $prefix . '-model' ); ?>" class="mc-asic-model">
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
            <label for="<?php echo esc_attr( $prefix . '-power' ); ?>">Потребление одной машины (Ватт)</label>
            <input id="<?php echo esc_attr( $prefix . '-power' ); ?>" type="number" step="any" class="mc-custom-power" value="0" min="0" required>
        </div>

        <div class="mc-field">
            <label for="<?php echo esc_attr( $prefix . '-count' ); ?>">Количество машин (шт)</label>
            <input id="<?php echo esc_attr( $prefix . '-count' ); ?>" type="number" step="1" class="mc-asic-count" value="10" min="1" required>
        </div>

        <div class="mc-field">
            <label for="<?php echo esc_attr( $prefix . '-tariff' ); ?>">Тариф (₽ за кВт·ч)</label>
            <input id="<?php echo esc_attr( $prefix . '-tariff' ); ?>" type="number" step="any" min="0" required class="mc-tariff" value="<?php echo esc_attr($config['default_tariff']); ?>">
        </div>

        <div class="mc-field">
            <label for="<?php echo esc_attr( $prefix . '-uptime' ); ?>">Аптайм (%)</label>
            <input id="<?php echo esc_attr( $prefix . '-uptime' ); ?>" type="number" step="any" required class="mc-uptime" value="<?php echo esc_attr($config['default_uptime']); ?>" min="0" max="100">
        </div>

        <p class="mc-calc-error" role="alert" hidden></p>
        <div class="mc-outputs">
            <p class="mc-price-row">Стоимость: <span class="mc-out-total-cost">—</span> ₽</p>
            <p class="mc-info-row">Суммарная мощность: <span><span class="mc-out-kw">—</span> кВт</span></p>
            <p class="mc-info-row">Потребление в месяц: <span><span class="mc-out-kvth">—</span> кВт·ч</span></p>
            <p class="mc-info-row">На одну машину: <span><span class="mc-out-single-cost">—</span> ₽/мес</span></p>
        </div>

        <a href="#popup_request" class="mc-btn-submit">Заказать</a>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode( 'mc_hosting_calc', 'mc_hosting_calc_shortcode' );

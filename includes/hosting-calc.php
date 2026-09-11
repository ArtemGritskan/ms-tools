<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function mc_hosting_calc_shortcode() {
    $config_path = dirname( __DIR__ ) . '/config/hosting-config.json';
    
    if ( ! file_exists( $config_path ) ) {
        return '<p style="color:red;">Ошибка: Файл конфигурации hosting-config.json не найден!</p>';
    }
    
    $config = json_decode( file_get_contents( $config_path ), true );
    
    ob_start();
    ?>
    <div class="mc-calc-box" id="mc-hosting-calc">
        <h3>Калькулятор стоимости размещения</h3>
        
        <div class="mc-field">
            <label for="mc-asic-model">Модель ASIC</label>
            <select id="mc-asic-model">
                <?php if ( ! empty( $config['asics'] ) ) : ?>
                    <?php foreach ( $config['asics'] as $asic ) : ?>
                        <option value="<?php echo esc_attr($asic['power_w']); ?>">
                            <?php echo esc_html($asic['name']); ?>
                        </option>
                    <?php endforeach; ?>
                <?php endif; ?>
            </select>
        </div>

        <div class="mc-field" id="mc-custom-power-block" style="display:none;">
            <label for="mc-custom-power">Потребление одной машины (Ватт)</label>
            <input type="number" id="mc-custom-power" value="0" min="0">
        </div>

        <div class="mc-field">
            <label for="mc-asic-count">Количество машин (шт)</label>
            <input type="number" id="mc-asic-count" value="10" min="1">
        </div>

        <div class="mc-field">
            <label for="mc-tariff">Тариф (₽ за кВт·ч)</label>
            <input type="number" step="0.1" id="mc-tariff" value="<?php echo esc_attr($config['default_tariff'] ?? 3.3); ?>">
        </div>

        <div class="mc-field">
            <label for="mc-uptime">Аптайм (%)</label>
            <input type="number" id="mc-uptime" value="<?php echo esc_attr($config['default_uptime'] ?? 99); ?>" min="0" max="100">
        </div>

        <div class="mc-outputs">
            <!-- Акцентная синяя цена в стиле скриншота -->
            <p class="mc-price-row">от <span id="mc-out-total-cost">0</span> ₽</p>
            
            <!-- Информационные строки технических характеристик расчета -->
            <p class="mc-info-row">Суммарная мощность: <span><span id="mc-out-kw">0</span> кВт</span></p>
            <p class="mc-info-row">Потребление в месяц: <span><span id="mc-out-kvth">0</span> кВт·ч</span></p>
            <p class="mc-info-row">На одну машину: <span><span id="mc-out-single-cost">0</span> ₽/мес</span></p>
            
            <small class="mc-note">✓ в наличии • точную цену считает менеджер</small>
        </div>

        <a href="#popup_request" class="mc-btn-submit">Заказать</a>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode( 'mc_hosting_calc', 'mc_hosting_calc_shortcode' );

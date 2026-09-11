<?php
/*
Plugin Name: Mining Cluster Tools
Description: Инструменты размещения для Mining Cluster.
Version: 0.1.0
Author: Артём
*/

if ( ! defined( 'ABSPATH' ) ) exit;

// Безопасное подключение стилей и скриптов
function mc_tools_load_assets() {
    wp_enqueue_style( 'mc-style', plugins_url( 'assets/mc-style.css', __FILE__ ), array(), '0.1.0' );
    wp_enqueue_script( 'mc-script', plugins_url( 'assets/mc-script.js', __FILE__ ), array('jquery'), '0.1.0', true );
}
add_action( 'wp_enqueue_scripts', 'mc_tools_load_assets' );


// Прямое подключение калькулятора размещения
require_once plugin_dir_path( __FILE__ ) . 'includes/hosting-calc.php';

// Жесткое подключение налогового калькулятора майнера
require_once plugin_dir_path( __FILE__ ) . 'includes/tax-calc.php';

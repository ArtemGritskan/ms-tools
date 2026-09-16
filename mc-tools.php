<?php
/*
Plugin Name: Mining Cluster Tools
Description: Инструменты размещения и налогового расчета для Mining Cluster.
Version: 0.2.0
Author: Артём
*/

if ( ! defined( 'ABSPATH' ) ) exit;

// без глоб. подключения 
function mc_tools_register_assets() {
    wp_register_style( 'mc-style', plugin_dir_url( __FILE__ ) . 'assets/mc-style.css', array(), '0.1.0' );
    wp_register_script( 'mc-script', plugin_dir_url( __FILE__ ) . 'assets/mc-script.js', array('jquery'), '0.1.0', true );
}
add_action( 'wp_enqueue_scripts', 'mc_tools_register_assets' );

// Подключаем файлы шорткодов
require_once plugin_dir_path( __FILE__ ) . 'includes/hosting-calc.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/tax-calc.php';

<?php
/*
Plugin Name: Mining Cluster Tools
Description: Инструменты размещения и налогового расчета для Mining Cluster.
Version: 0.2.1
Author: Артём
*/

if ( ! defined( 'ABSPATH' ) ) exit;

// для сброса кэша
function mc_tools_register_assets() {
    $css_path = plugin_dir_path( __FILE__ ) . 'assets/mc-style.css';
    $js_path = plugin_dir_path( __FILE__ ) . 'assets/mc-script.js';
    
    // +-дефолт 
    $css_ver = file_exists( $css_path ) ? filemtime( $css_path ) : '0.1.1';
    $js_ver = file_exists( $js_path ) ? filemtime( $js_path ) : '0.1.1';

    wp_register_style( 'mc-style', plugin_dir_url( __FILE__ ) . 'assets/mc-style.css', array(), $css_ver );
    wp_register_script( 'mc-script', plugin_dir_url( __FILE__ ) . 'assets/mc-script.js', array('jquery'), $js_ver, true );
}
add_action( 'wp_enqueue_scripts', 'mc_tools_register_assets' );

// файлы шорткодов 
require_once plugin_dir_path( __FILE__ ) . 'includes/hosting-calc.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/tax-calc.php';
 
<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function mc_tools_number_in_range( $value, $min, $max = PHP_FLOAT_MAX ) {
    return ( is_int( $value ) || is_float( $value ) ) && is_finite( (float) $value ) && $value >= $min && $value <= $max;
}

function mc_tools_valid_scale( $scale ) {
    if ( ! is_array( $scale ) || empty( $scale ) || array_keys( $scale ) !== range( 0, count( $scale ) - 1 ) ) return false;
    $previous = 0;
    foreach ( $scale as $index => $step ) {
        if ( ! is_array( $step ) || ! array_key_exists( 'limit', $step ) || ! isset( $step['rate'] ) || ! mc_tools_number_in_range( $step['rate'], 0, 1 ) ) return false;
        if ( $step['limit'] === null ) return $index === count( $scale ) - 1;
        if ( ! mc_tools_number_in_range( $step['limit'], 0 ) || $step['limit'] <= $previous ) return false;
        $previous = $step['limit'];
    }
    return false;
}

function mc_tools_valid_config( $config, $type ) {
    if ( ! is_array( $config ) ) return false;
    if ( $type === 'tax' ) {
        if ( ! mc_tools_valid_scale( $config['mining_scale'] ?? null ) || ! mc_tools_valid_scale( $config['sale_scale'] ?? null ) ) return false;
        foreach ( array( 'fiz', 'ip', 'org' ) as $status ) {
            if ( ! isset( $config[$status] ) || ! is_array( $config[$status] ) ) return false;
            foreach ( array( 'source_stage1', 'source_stage2' ) as $key ) {
                if ( ! isset( $config[$status][$key] ) || ! is_string( $config[$status][$key] ) || trim( $config[$status][$key] ) === '' ) return false;
            }
        }
        foreach ( array( 'fiz', 'ip' ) as $status ) {
            if ( ! isset( $config[$status]['link'] ) || ! is_string( $config[$status]['link'] ) || trim( $config[$status]['link'] ) === '' ) return false;
        }
        return mc_tools_number_in_range( $config['org']['rate_stage1'] ?? null, 0, 1 ) && mc_tools_number_in_range( $config['org']['rate_stage2'] ?? null, 0, 1 );
    }
    if ( $type !== 'hosting' || ! mc_tools_number_in_range( $config['default_tariff'] ?? null, 0 ) || ! mc_tools_number_in_range( $config['default_uptime'] ?? null, 0, 100 ) ) return false;
    if ( empty( $config['asics'] ) || ! is_array( $config['asics'] ) || array_keys( $config['asics'] ) !== range( 0, count( $config['asics'] ) - 1 ) ) return false;
    foreach ( $config['asics'] as $asic ) {
        if ( ! is_array( $asic ) || ! isset( $asic['name'] ) || ! is_string( $asic['name'] ) || trim( $asic['name'] ) === '' || ! mc_tools_number_in_range( $asic['power_w'] ?? null, 0 ) ) return false;
    }
    return true;
}

function mc_tools_load_config( $path, $type ) {
    $data = is_file( $path ) && is_readable( $path ) ? @file_get_contents( $path ) : false;
    if ( $data === false ) {
        error_log( 'MC Tools: configuration cannot be read: ' . $path );
        return null;
    }
    $config = json_decode( $data, true );
    if ( json_last_error() !== JSON_ERROR_NONE || ! mc_tools_valid_config( $config, $type ) ) {
        error_log( 'MC Tools: invalid configuration: ' . $path );
        return null;
    }
    return $config;
}

function mc_tools_config_error( $message ) {
    return '<div class="mc-calc-box"><p class="mc-calc-error" role="alert">' . esc_html( $message ) . '</p></div>';
}

<?php
/**
 * Rendu d'un point de ramassage (`couturier/pickup-point`).
 *
 * Contenu enregistré : nom (`core/heading`, `<h3>`) puis horaires
 * (`p.wp-block-couturier-pickup-point__hours`). Avec une adresse, le texte du
 * nom est placé dans un `<button>` (`aria-pressed`) qui affiche le point sur la
 * carte (`resources/js/pickup-map.js`) ; son `aria-controls` est posé par le
 * bloc parent. La pastille numérotée est un pseudo-élément CSS.
 *
 * Sans nom : rien n'est rendu.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML enregistré : nom puis horaires.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

use Theme\Support\GoogleMapsEmbed;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Nom (balise ouvrante conservée : classes, ancre), texte du nom, horaires.
if ( ! preg_match( '#^\s*(<h([2-6])\b[^>]*>)(.*?)</h\2>(.*)$#s', $content, $couturier_point ) ) {
    return;
}

[ , $couturier_point_open, $couturier_point_level, $couturier_point_name, $couturier_point_hours ] = $couturier_point;

if ( '' === trim( wp_strip_all_tags( $couturier_point_name ) ) ) {
    return;
}

$couturier_point_address = trim( (string) ( $attributes['address'] ?? '' ) );
$couturier_point_src     = GoogleMapsEmbed::url( $couturier_point_address );

$couturier_point_heading = new WP_HTML_Tag_Processor( $couturier_point_open );
$couturier_point_heading->next_tag();
$couturier_point_heading->add_class( 'wp-block-couturier-pickup-point__name' );

if ( '' !== $couturier_point_src ) {
    $couturier_point_name = sprintf(
        '<button type="button" class="wp-block-couturier-pickup-point__button" aria-pressed="false" data-map-src="%1$s" data-map-address="%2$s" data-map-label="%3$s">%4$s</button>',
        esc_url( $couturier_point_src ),
        esc_attr( $couturier_point_address ),
        esc_attr( wp_strip_all_tags( $couturier_point_name ) ),
        $couturier_point_name
    );
}

printf(
    '<li %1$s>%2$s<span class="wp-block-couturier-pickup-point__label">%3$s</span></h%4$s>%5$s</li>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_point_heading->get_updated_html(), // phpcs:ignore WordPress.Security.EscapeOutput -- balise du titre enregistré.
    $couturier_point_name, // phpcs:ignore WordPress.Security.EscapeOutput -- nom enregistré, attributs du bouton échappés.
    esc_attr( $couturier_point_level ),
    trim( $couturier_point_hours ) // phpcs:ignore WordPress.Security.EscapeOutput -- horaires enregistrés.
);

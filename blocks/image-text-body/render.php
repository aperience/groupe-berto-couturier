<?php
/**
 * Rendu du texte du bloc « Image et texte » (`couturier/image-text-body`).
 *
 * Paragraphes vides retirés ; sans texte, rien n'est rendu. Texte enveloppé avec
 * le bouton du repli « … Plus » / « Moins » (desktop).
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML enregistré : paragraphes et listes.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$couturier_image_text_body = trim( preg_replace( '#<p\b[^>]*>\s*</p>#', '', $content ) ?? $content );

if ( '' === trim( wp_strip_all_tags( $couturier_image_text_body ) ) ) {
    return;
}

// Repli « … Plus » / « Moins » en desktop (modèle Disclosure,
// `resources/js/image-text.js`) : le texte est enveloppé avec un bouton `hidden`,
// relié par `aria-controls`. Sans JS (et en mobile), texte entier et pas de
// bouton ; avec, le texte est coupé à quelques lignes et le bouton n'apparaît que
// s'il déborde.
$couturier_image_text_body_id = wp_unique_id( 'image-text-' );

printf(
    '<div %1$s><div class="wp-block-couturier-image-text-body__text" id="%2$s">%3$s</div><button type="button" class="wp-block-couturier-image-text-body__more" aria-expanded="false" aria-controls="%2$s" hidden><span class="wp-block-couturier-image-text-body__more-label">%4$s</span><span class="wp-block-couturier-image-text-body__less-label">%5$s</span></button></div>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    esc_attr( $couturier_image_text_body_id ),
    $couturier_image_text_body, // phpcs:ignore WordPress.Security.EscapeOutput -- texte enregistré.
    esc_html__( 'Plus', 'couturier' ),
    esc_html__( 'Moins', 'couturier' )
);

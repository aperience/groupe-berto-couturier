<?php
/**
 * Rendu du bloc « Appel à action compact » (`couturier/compact-cta`).
 *
 * Balisage : `section.wp-block-couturier-compact-cta.is-style-…` > h2, p,
 * `div.wp-block-buttons` — enfants directs, comme dans le canvas, mis en grille
 * par `block/_compact-cta.scss`. Titre et texte sont obligatoires : si l'un des
 * deux est vide, rien n'est rendu.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML des blocs imbriqués.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$couturier_compact_cta_filled = [ 'core/heading' => false, 'core/paragraph' => false ];

foreach ( $block->inner_blocks as $couturier_compact_cta_inner ) {
    if ( array_key_exists( $couturier_compact_cta_inner->name, $couturier_compact_cta_filled ) ) {
        $couturier_compact_cta_filled[ $couturier_compact_cta_inner->name ] = '' !== trim( wp_strip_all_tags( $couturier_compact_cta_inner->inner_html ) );
    }
}

if ( in_array( false, $couturier_compact_cta_filled, true ) ) {
    return;
}

// Espace avant une ponctuation haute rendue insécable (cf. `cta/render.php`).
$couturier_compact_cta_content = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $content ) ?? $content;

printf(
    '<section %s>%s</section>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_compact_cta_content // phpcs:ignore WordPress.Security.EscapeOutput -- HTML des blocs imbriqués.
);

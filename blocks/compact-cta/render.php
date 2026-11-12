<?php
/**
 * Rendu du bloc « Appel à action compact » (`couturier/compact-cta`).
 *
 * Balisage : `section.wp-block-couturier-compact-cta[.is-bg-…][.is-wide][.has-media]`
 * > div.__media (image facultative), h2, p (facultatif), `div.wp-block-buttons` —
 * enfants directs, comme dans le canvas, mis en grille par `block/_compact-cta.scss`.
 * Titre obligatoire : s'il est vide, rien n'est rendu. Fond (`background`) autre que pétrole clair :
 * classe `is-bg-{fond}`.
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

// Titre obligatoire : sans lui, rien n'est rendu. Texte facultatif : un
// paragraphe vide est retiré du rendu.
$couturier_compact_cta_content = '';
$couturier_compact_cta_has_heading = false;

foreach ( $block->inner_blocks as $couturier_compact_cta_inner ) {
    $couturier_compact_cta_is_empty = '' === trim( wp_strip_all_tags( $couturier_compact_cta_inner->inner_html ) );

    if ( 'core/heading' === $couturier_compact_cta_inner->name ) {
        $couturier_compact_cta_has_heading = ! $couturier_compact_cta_is_empty;
    } elseif ( 'core/paragraph' === $couturier_compact_cta_inner->name && $couturier_compact_cta_is_empty ) {
        continue;
    }

    $couturier_compact_cta_content .= $couturier_compact_cta_inner->render();
}

if ( ! $couturier_compact_cta_has_heading ) {
    return;
}

// Espace avant une ponctuation haute rendue insécable (cf. `cta/render.php`).
$couturier_compact_cta_content = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $couturier_compact_cta_content ) ?? $couturier_compact_cta_content;

// Image assez large (≥ 640 px) : pleine largeur en mobile (`is-media-wide`).
$couturier_compact_cta_src        = empty( $attributes['imageId'] ) ? false : wp_get_attachment_image_src( (int) $attributes['imageId'], 'full' );
$couturier_compact_cta_media_wide = $couturier_compact_cta_src && (int) $couturier_compact_cta_src[1] >= 640;

// Image facultative à gauche, 165 × 100 recadrée. `alt` repris de la médiathèque,
// vide à défaut ; pièce jointe supprimée : chaîne vide, bandeau sans image.
$couturier_compact_cta_image = empty( $attributes['imageId'] ) ? '' : wp_get_attachment_image(
    (int) $attributes['imageId'],
    'medium_large',
    false,
    [
        'class'    => 'wp-block-couturier-compact-cta__image',
        'sizes'    => $couturier_compact_cta_media_wide ? '(min-width: 992px) 165px, 100vw' : '165px',
        'loading'  => 'lazy',
        'decoding' => 'async',
    ]
);

$couturier_compact_cta_classes = trim( implode( ' ', [
    \Theme\Support\CardBackground::class_name( $attributes, $block ),
    'wide' === ( $attributes['width'] ?? 'compact' ) ? 'is-wide' : '',
    $couturier_compact_cta_image ? 'has-media' : '',
    $couturier_compact_cta_media_wide ? 'is-media-wide' : '',
] ) );

printf(
    '<section %s>%s%s</section>',
    get_block_wrapper_attributes( [ 'class' => $couturier_compact_cta_classes ] ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_compact_cta_image ? '<div class="wp-block-couturier-compact-cta__media">' . $couturier_compact_cta_image . '</div>' : '', // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par wp_get_attachment_image().
    $couturier_compact_cta_content // phpcs:ignore WordPress.Security.EscapeOutput -- HTML des blocs imbriqués.
);

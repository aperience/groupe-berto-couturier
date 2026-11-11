<?php
/**
 * Rendu d'une carte du bloc « Cartes illustrées » (`couturier/image-card`).
 *
 * `<li>` : image de fond décorative (`alt` vide, point focal en `--focal`),
 * bulle du pictogramme (masque CSS peint en `currentColor`, décoratif), puis le
 * contenu enregistré — titre (`core/heading`, `<h3>`) et texte
 * (`p.wp-block-couturier-image-card__text`).
 *
 * Sans titre : rien n'est rendu. Sans image ou sans pictogramme (ou pièce jointe
 * supprimée) : rendue sans eux — sans pictogramme, pas de bulle.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML enregistré : titre puis texte.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! preg_match( '#^\s*<h([2-6])\b[^>]*>(.*?)</h\1>#s', $content, $couturier_card_title )
    || '' === trim( wp_strip_all_tags( $couturier_card_title[2] ) )
) {
    return;
}

// ─── Image de fond ────────────────────────────────────────────────────────────
// Point focal → `object-position` (même calcul que `objectPosition()` dans `index.js`).
$couturier_card_focal = is_array( $attributes['focalPoint'] ?? null ) ? $attributes['focalPoint'] : [];
$couturier_card_x     = round( min( max( (float) ( $couturier_card_focal['x'] ?? 0.5 ), 0.0 ), 1.0 ) * 100, 1 );
$couturier_card_y     = round( min( max( (float) ( $couturier_card_focal['y'] ?? 0.5 ), 0.0 ), 1.0 ) * 100, 1 );

// 360 px : largeur maximale d'une carte (trois par ligne dans le conteneur de 1136 px).
$couturier_card_image = empty( $attributes['imageId'] ) ? '' : wp_get_attachment_image(
    (int) $attributes['imageId'],
    'medium_large',
    false,
    [
        'class'    => 'wp-block-couturier-image-card__image',
        'alt'      => '',
        'sizes'    => '(min-width: 992px) 362px, (min-width: 768px) 50vw, 100vw',
        'loading'  => 'lazy',
        'decoding' => 'async',
    ]
);

$couturier_card_background = $couturier_card_image
    ? sprintf(
        '<div class="wp-block-couturier-image-card__background" style="%s"><div class="wp-block-couturier-image-card__media">%s</div></div>',
        esc_attr( sprintf( '--focal: %s%% %s%%', $couturier_card_x, $couturier_card_y ) ),
        $couturier_card_image
    )
    : '';

// ─── Pictogramme ──────────────────────────────────────────────────────────────
$couturier_card_icon = empty( $attributes['iconId'] ) ? false : wp_get_attachment_url( (int) $attributes['iconId'] );

$couturier_card_badge = $couturier_card_icon
    ? sprintf(
        '<span class="wp-block-couturier-image-card__badge" aria-hidden="true"><span class="wp-block-couturier-image-card__icon" style="%s"></span></span>',
        esc_attr( '--icon: url("' . esc_url( $couturier_card_icon ) . '")' )
    )
    : '';

printf(
    '<li %s>%s%s%s</li>',
    get_block_wrapper_attributes( $couturier_card_badge ? [ 'class' => 'has-icon' ] : [] ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_card_background, // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par wp_get_attachment_image() et esc_attr().
    $couturier_card_badge, // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par esc_attr().
    trim( $content ) // phpcs:ignore WordPress.Security.EscapeOutput -- titre et texte enregistrés.
);

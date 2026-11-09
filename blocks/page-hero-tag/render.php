<?php
/**
 * Rendu d'un tag du visuel du héros de page (`couturier/page-hero-tag`).
 *
 * Contenu enregistré : le libellé (`p.__label`), avec d'éventuels liens sur une
 * partie du texte (format « Lien », mots en orange). Rendu :
 *
 *   span.wp-block-couturier-page-hero-tag.has-icon-{dot|dot-petrol|pin|play|calendar}[.is-hidden-mobile]
 *          (style : --tag-x, --tag-y, de 0 à 100)
 *     span.__icon (décoratif)  span.__label
 *
 * Position (`position`, x et y de 0 à 1) : appliquée par le CSS sur le visuel. Sans
 * libellé, rien n'est rendu.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML enregistré.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! preg_match( '#<p class="wp-block-couturier-page-hero-tag__label">(.*?)</p>#s', $content, $couturier_hero_tag_match )
    || '' === trim( wp_strip_all_tags( $couturier_hero_tag_match[1] ) )
) {
    return;
}

$couturier_hero_tag_label = trim( $couturier_hero_tag_match[1] );

// Position, bornée à 0–100.
$couturier_hero_tag_position = is_array( $attributes['position'] ?? null ) ? $attributes['position'] : [];
$couturier_hero_tag_x        = round( min( max( (float) ( $couturier_hero_tag_position['x'] ?? 0.15 ), 0.0 ), 1.0 ) * 100, 1 );
$couturier_hero_tag_y        = round( min( max( (float) ( $couturier_hero_tag_position['y'] ?? 0.2 ), 0.0 ), 1.0 ) * 100, 1 );

$couturier_hero_tag_icon = in_array( $attributes['icon'] ?? 'none', [ 'dot', 'dot-petrol', 'pin', 'play', 'calendar' ], true ) ? $attributes['icon'] : '';

// ─── Ancien lien sur tout le tag (attribut `link`, abandonné) ──────────────────
// Repris par l'éditeur à la prochaine ouverture ; d'ici là, posé sur tout le
// libellé s'il ne contient pas déjà de lien.
$couturier_hero_tag_link = is_array( $attributes['link'] ?? null ) ? $attributes['link'] : [];
$couturier_hero_tag_href = esc_url( (string) ( $couturier_hero_tag_link['url'] ?? '' ) );

if ( $couturier_hero_tag_href && ! str_contains( $couturier_hero_tag_label, '<a ' ) ) {
    $couturier_hero_tag_label = sprintf(
        '<a href="%s"%s>%s</a>',
        $couturier_hero_tag_href,
        empty( $couturier_hero_tag_link['opensInNewTab'] ) ? '' : ' target="_blank" rel="noreferrer noopener"',
        $couturier_hero_tag_label
    );
}

$couturier_hero_tag_attributes = get_block_wrapper_attributes(
    [
        'class' => trim(
            ( $couturier_hero_tag_icon ? 'has-icon-' . $couturier_hero_tag_icon : '' )
            . ( empty( $attributes['hideOnMobile'] ) ? '' : ' is-hidden-mobile' )
        ),
        'style' => sprintf( '--tag-x: %s; --tag-y: %s', $couturier_hero_tag_x, $couturier_hero_tag_y ),
    ]
);

printf(
    '<span %1$s>%2$s<span class="wp-block-couturier-page-hero-tag__label">%3$s</span></span>',
    $couturier_hero_tag_attributes, // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_hero_tag_icon ? '<span class="wp-block-couturier-page-hero-tag__icon" aria-hidden="true"></span>' : '',
    $couturier_hero_tag_label // phpcs:ignore WordPress.Security.EscapeOutput -- contenu enregistré.
);

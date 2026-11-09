<?php
/**
 * Rendu d'un tag du visuel du héros de page (`couturier/page-hero-tag`).
 *
 * Contenu enregistré : le libellé (`p.__label`). Rendu : un lien (`<a>`) si une
 * adresse est renseignée, sinon un `<span>` :
 *
 *   a|span.wp-block-couturier-page-hero-tag.has-icon-{dot|dot-petrol|pin|play|calendar}[.is-hidden-mobile]
 *          (style : --tag-x, --tag-y, de 0 à 100)
 *     span.__icon (décoratif)  span.__label
 *
 * Position (`position`, x et y de 0 à 1) : appliquée par le CSS sur le visuel. Sans
 * libellé, rien n'est rendu. L'URL d'un contenu est recalculée à partir de son ID ;
 * nouvel onglet annoncé en texte masqué.
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

// ─── Lien ─────────────────────────────────────────────────────────────────────
$couturier_hero_tag_link = is_array( $attributes['link'] ?? null ) ? $attributes['link'] : [];
$couturier_hero_tag_href = (string) ( $couturier_hero_tag_link['url'] ?? '' );
$couturier_hero_tag_id   = (int) ( $couturier_hero_tag_link['id'] ?? 0 );

if ( $couturier_hero_tag_id > 0 ) {
    $couturier_hero_tag_kind = $couturier_hero_tag_link['kind'] ?? '';

    if ( 'post-type' === $couturier_hero_tag_kind && 'publish' === get_post_status( $couturier_hero_tag_id ) ) {
        $couturier_hero_tag_href = (string) get_permalink( $couturier_hero_tag_id );
    } elseif ( 'taxonomy' === $couturier_hero_tag_kind ) {
        $couturier_hero_tag_term = get_term_link( $couturier_hero_tag_id, (string) ( $couturier_hero_tag_link['type'] ?? '' ) );
        $couturier_hero_tag_href = is_wp_error( $couturier_hero_tag_term ) ? $couturier_hero_tag_href : $couturier_hero_tag_term;
    }
}

$couturier_hero_tag_href    = esc_url( $couturier_hero_tag_href );
$couturier_hero_tag_new_tab = $couturier_hero_tag_href && ! empty( $couturier_hero_tag_link['opensInNewTab'] );

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
    '<%1$s %2$s%3$s>%4$s<span class="wp-block-couturier-page-hero-tag__label">%5$s</span>%6$s</%1$s>',
    $couturier_hero_tag_href ? 'a' : 'span',
    $couturier_hero_tag_attributes, // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_hero_tag_href
        ? ' href="' . $couturier_hero_tag_href . '"' . ( $couturier_hero_tag_new_tab ? ' target="_blank" rel="noopener"' : '' )
        : '', // phpcs:ignore WordPress.Security.EscapeOutput -- URL échappée par esc_url().
    $couturier_hero_tag_icon ? '<span class="wp-block-couturier-page-hero-tag__icon" aria-hidden="true"></span>' : '',
    $couturier_hero_tag_label, // phpcs:ignore WordPress.Security.EscapeOutput -- contenu enregistré.
    $couturier_hero_tag_new_tab ? '<span class="visually-hidden"> ' . esc_html__( '(nouvel onglet)', 'couturier' ) . '</span>' : ''
);

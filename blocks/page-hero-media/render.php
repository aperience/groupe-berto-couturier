<?php
/**
 * Rendu du visuel du héros de page (`couturier/page-hero-media`).
 *
 * Contenu enregistré : surtitre (`p.__eyebrow`), titre (`p.__title`, gras et saut
 * de ligne), libellé du bouton (`p.__button`). Rendu :
 *
 *   div.wp-block-couturier-page-hero-media
 *     div.__frame > img.__image          ← image (`alt` de la médiathèque), point focal
 *     div.__overlay                      ← surtitre, titre, bouton (si l'un d'eux est rempli)
 *       p.__eyebrow, p.__title
 *       div.wp-block-buttons.__buttons > div.wp-block-button.is-style-outline.has-arrow > a
 *
 * La forme inclinée derrière l'image est un pseudo-élément (CSS). Sans image (ou
 * image supprimée de la médiathèque), rien n'est rendu : surimpression comprise. Le
 * bouton n'est rendu qu'avec un libellé et un lien ; l'URL d'un contenu est
 * recalculée à partir de son ID, nouvel onglet annoncé en texte masqué.
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

// Image du héros : au-dessus de la ligne de flottaison, chargée en priorité.
// 429 px en desktop ; en mobile, la largeur du contenu moins la place de la forme.
$couturier_hero_media_image = empty( $attributes['imageId'] ) ? '' : wp_get_attachment_image(
    (int) $attributes['imageId'],
    'large',
    false,
    [
        'class'         => 'wp-block-couturier-page-hero-media__image',
        'sizes'         => '(min-width: 992px) 429px, calc(100vw - 56px)',
        'loading'       => false,
        'fetchpriority' => 'high',
        'decoding'      => 'async',
    ]
);

if ( '' === $couturier_hero_media_image ) {
    return;
}

// Espace avant une ponctuation haute rendue insécable (cf. `render.php` du CTA).
$couturier_hero_media_content = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $content ) ?? $content;

// Champs enregistrés : HTML intérieur de chaque `<p>`.
$couturier_hero_media_parts = [];

if ( preg_match_all( '#<p class="wp-block-couturier-page-hero-media__(eyebrow|title|button)">(.*?)</p>#s', $couturier_hero_media_content, $couturier_hero_media_matches, PREG_SET_ORDER ) ) {
    foreach ( $couturier_hero_media_matches as $couturier_hero_media_match ) {
        $couturier_hero_media_parts[ $couturier_hero_media_match[1] ] = trim( $couturier_hero_media_match[2] );
    }
}

$couturier_hero_media_filled = static fn ( string $key ): bool => '' !== trim( wp_strip_all_tags( $couturier_hero_media_parts[ $key ] ?? '' ) );

// ─── Bouton ───────────────────────────────────────────────────────────────────
$couturier_hero_media_link = is_array( $attributes['buttonLink'] ?? null ) ? $attributes['buttonLink'] : [];
$couturier_hero_media_href = (string) ( $couturier_hero_media_link['url'] ?? '' );
$couturier_hero_media_id   = (int) ( $couturier_hero_media_link['id'] ?? 0 );

if ( $couturier_hero_media_id > 0 ) {
    $couturier_hero_media_kind = $couturier_hero_media_link['kind'] ?? '';

    if ( 'post-type' === $couturier_hero_media_kind && 'publish' === get_post_status( $couturier_hero_media_id ) ) {
        $couturier_hero_media_href = (string) get_permalink( $couturier_hero_media_id );
    } elseif ( 'taxonomy' === $couturier_hero_media_kind ) {
        $couturier_hero_media_term = get_term_link( $couturier_hero_media_id, (string) ( $couturier_hero_media_link['type'] ?? '' ) );
        $couturier_hero_media_href = is_wp_error( $couturier_hero_media_term ) ? $couturier_hero_media_href : $couturier_hero_media_term;
    }
}

$couturier_hero_media_href   = esc_url( $couturier_hero_media_href );
$couturier_hero_media_button = '';

if ( $couturier_hero_media_href && $couturier_hero_media_filled( 'button' ) ) {
    $couturier_hero_media_new_tab = ! empty( $couturier_hero_media_link['opensInNewTab'] );
    $couturier_hero_media_button  = sprintf(
        '<div class="wp-block-buttons wp-block-couturier-page-hero-media__buttons"><div class="wp-block-button is-style-outline has-arrow"><a class="wp-block-button__link wp-element-button" href="%s"%s>%s%s</a></div></div>',
        $couturier_hero_media_href,
        $couturier_hero_media_new_tab ? ' target="_blank" rel="noopener"' : '',
        $couturier_hero_media_parts['button'],
        $couturier_hero_media_new_tab ? '<span class="visually-hidden"> ' . esc_html__( '(nouvel onglet)', 'couturier' ) . '</span>' : ''
    );
}

// ─── Surimpression ────────────────────────────────────────────────────────────
$couturier_hero_media_overlay = ( $couturier_hero_media_filled( 'eyebrow' ) ? '<p class="wp-block-couturier-page-hero-media__eyebrow">' . $couturier_hero_media_parts['eyebrow'] . '</p>' : '' )
    . ( $couturier_hero_media_filled( 'title' ) ? '<p class="wp-block-couturier-page-hero-media__title">' . $couturier_hero_media_parts['title'] . '</p>' : '' )
    . $couturier_hero_media_button;

// Point focal → `object-position` (même calcul que `objectPosition()` dans `index.js`).
$couturier_hero_media_focal = is_array( $attributes['focalPoint'] ?? null ) ? $attributes['focalPoint'] : [];
$couturier_hero_media_x     = round( min( max( (float) ( $couturier_hero_media_focal['x'] ?? 0.5 ), 0.0 ), 1.0 ) * 100, 1 );
$couturier_hero_media_y     = round( min( max( (float) ( $couturier_hero_media_focal['y'] ?? 0.5 ), 0.0 ), 1.0 ) * 100, 1 );

printf(
    '<div %1$s><div class="wp-block-couturier-page-hero-media__frame" style="--focal: %2$s%% %3$s%%">%4$s</div>%5$s</div>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    esc_attr( (string) $couturier_hero_media_x ),
    esc_attr( (string) $couturier_hero_media_y ),
    $couturier_hero_media_image, // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par wp_get_attachment_image().
    '' !== $couturier_hero_media_overlay ? '<div class="wp-block-couturier-page-hero-media__overlay">' . $couturier_hero_media_overlay . '</div>' : '' // phpcs:ignore WordPress.Security.EscapeOutput -- contenu enregistré, URL échappée.
);

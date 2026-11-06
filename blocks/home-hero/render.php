<?php
/**
 * Rendu du bloc « Héros de l'accueil » (`couturier/home-hero`).
 *
 * Enveloppe le contenu enregistré (H1, H2, texte) et ajoute l'image de fond
 * (attribut `imageId`, décorative) avec son point focal (`focalPoint`). Le H1 est
 * obligatoire : vide, rien n'est rendu.
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

$couturier_hero_title = null;

foreach ( $block->inner_blocks as $couturier_hero_inner ) {
    if ( 'core/heading' === $couturier_hero_inner->name ) {
        $couturier_hero_title = $couturier_hero_inner;
        break;
    }
}

if ( null === $couturier_hero_title || '' === trim( wp_strip_all_tags( $couturier_hero_title->inner_html ) ) ) {
    return;
}

// Espace avant une ponctuation haute rendue insécable (cf. `render.php` du CTA).
$couturier_hero_content = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $content ) ?? $content;

// Point focal → `object-position` (même calcul que `objectPosition()` dans `index.js`).
$couturier_hero_focal = is_array( $attributes['focalPoint'] ?? null ) ? $attributes['focalPoint'] : [];
$couturier_hero_x     = round( min( max( (float) ( $couturier_hero_focal['x'] ?? 0.5 ), 0.0 ), 1.0 ) * 100, 1 );
$couturier_hero_y     = round( min( max( (float) ( $couturier_hero_focal['y'] ?? 0.5 ), 0.0 ), 1.0 ) * 100, 1 );

// Image décorative (`alt` vide), élément LCP de l'accueil : chargée sans délai, en
// priorité. `sizes` : en mobile, l'image (paysage) remplit un cadre portrait en
// hauteur et n'en montre qu'un tiers environ, d'où 330vw.
$couturier_hero_image = empty( $attributes['imageId'] ) ? '' : wp_get_attachment_image(
    (int) $attributes['imageId'],
    'full',
    false,
    [
        'class'         => 'wp-block-couturier-home-hero__image',
        'alt'           => '',
        'sizes'         => '(min-width: 992px) calc(100vw - 60px), 330vw',
        'loading'       => false,
        'fetchpriority' => 'high',
        'decoding'      => 'async',
    ]
);

printf(
    '<section %1$s><div class="wp-block-couturier-home-hero__background" style="--focal: %2$s%% %3$s%%">%4$s</div><div class="wp-block-couturier-home-hero__content">%5$s</div></section>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    esc_attr( (string) $couturier_hero_x ),
    esc_attr( (string) $couturier_hero_y ),
    $couturier_hero_image ? '<div class="wp-block-couturier-home-hero__media">' . $couturier_hero_image . '</div>' : '', // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par wp_get_attachment_image().
    $couturier_hero_content // phpcs:ignore WordPress.Security.EscapeOutput -- HTML des blocs imbriqués.
);

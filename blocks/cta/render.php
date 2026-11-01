<?php
/**
 * Rendu du bloc « Appel à l'action » (`couturier/cta`).
 *
 * Enveloppe le contenu enregistré (titre, texte, boutons) et ajoute l'image
 * facultative (attribut `imageId`). Titre et texte sont obligatoires : si l'un des
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

$couturier_cta_filled = [ 'core/heading' => false, 'core/paragraph' => false ];

foreach ( $block->inner_blocks as $couturier_cta_inner ) {
    if ( array_key_exists( $couturier_cta_inner->name, $couturier_cta_filled ) ) {
        $couturier_cta_filled[ $couturier_cta_inner->name ] = '' !== trim( wp_strip_all_tags( $couturier_cta_inner->inner_html ) );
    }
}

if ( in_array( false, $couturier_cta_filled, true ) ) {
    return;
}

// Espace saisie avant une ponctuation haute (« permis ? ») rendue insécable : sans
// cela, le navigateur peut renvoyer le signe seul à la ligne. Les balises situées
// entre l'espace et le signe (mise en avant, lien…) sont conservées.
$couturier_cta_content = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $content ) ?? $content;

// Image facultative, `is-cropped` si elle remplit le cadre 432 × 260 en étant
// recadrée : format entre 3:2 et celui du cadre (cf. `imageClassName()` dans
// `index.js`, mêmes valeurs). Une image moins allongée n'est jamais recadrée.
$couturier_cta_size    = empty( $attributes['imageId'] ) ? false : wp_get_attachment_image_src( (int) $attributes['imageId'], 'large' );
$couturier_cta_ratio   = $couturier_cta_size && $couturier_cta_size[2] ? $couturier_cta_size[1] / $couturier_cta_size[2] : 0;
$couturier_cta_cropped = $couturier_cta_ratio >= 3 / 2 && $couturier_cta_ratio < 432 / 260;

// Image facultative. `alt` repris de la médiathèque, vide à défaut (image décorative) ;
// pièce jointe supprimée : chaîne vide, le bloc s'affiche sans colonne image.
// `sizes` donne la largeur réelle de l'image ; le `auto` que WordPress y ajoute est
// retiré par `Theme\Features\Blocks\BlockImageSizes`.
$couturier_cta_image = empty( $attributes['imageId'] ) ? '' : wp_get_attachment_image(
    (int) $attributes['imageId'],
    'large',
    false,
    [
        'class'    => 'wp-block-couturier-cta__image' . ( $couturier_cta_cropped ? ' is-cropped' : '' ),
        'sizes'    => '(min-width: 992px) 432px, 100vw',
        'loading'  => 'lazy',
        'decoding' => 'async',
    ]
);

printf(
    '<section %s><div class="wp-block-couturier-cta__content">%s</div>%s</section>',
    get_block_wrapper_attributes( [ 'class' => $couturier_cta_image ? 'has-image' : '' ] ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_cta_content, // phpcs:ignore WordPress.Security.EscapeOutput -- HTML des blocs imbriqués.
    $couturier_cta_image ? '<div class="wp-block-couturier-cta__media">' . $couturier_cta_image . '</div>' : '' // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par wp_get_attachment_image().
);

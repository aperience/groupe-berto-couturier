<?php
/**
 * Rendu du bloc « Image et texte » (`couturier/image-text`).
 *
 * Enveloppe le contenu enregistré (surtitre, titre, texte, boutons) et y ajoute
 * l'image facultative (attribut `imageId`), placée avant le texte dans le DOM :
 * toujours au-dessus en mobile, à gauche ou à droite en desktop
 * (`imagePosition`, classe `is-image-{left|right}`). Sans image, le texte prend
 * toute la largeur.
 *
 * Titre vide retiré ; sans surtitre, titre ni texte, rien n'est rendu.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML enregistré : surtitre, puis blocs imbriqués rendus.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Texte saisi dans un bloc imbriqué ou l'un de ses descendants (liste).
$couturier_image_text_has_text = static function ( WP_Block $inner ) use ( &$couturier_image_text_has_text ): bool {
    if ( '' !== trim( wp_strip_all_tags( $inner->inner_html ) ) ) {
        return true;
    }

    foreach ( $inner->inner_blocks as $child ) {
        if ( $couturier_image_text_has_text( $child ) ) {
            return true;
        }
    }

    return false;
};

$couturier_image_text_filled = 1 === preg_match( '#<p class="wp-block-couturier-image-text__surtitre">(.*?)</p>#s', $content, $couturier_image_text_match )
    && '' !== trim( wp_strip_all_tags( $couturier_image_text_match[1] ) );

foreach ( $block->inner_blocks as $couturier_image_text_inner ) {
    if ( in_array( $couturier_image_text_inner->name, [ 'core/heading', 'couturier/image-text-body' ], true ) && $couturier_image_text_has_text( $couturier_image_text_inner ) ) {
        $couturier_image_text_filled = true;
    }
}

if ( ! $couturier_image_text_filled ) {
    return;
}

// Titre vide (facultatif) retiré.
$couturier_image_text_content = preg_replace( '#<h2\b[^>]*>\s*</h2>#', '', $content ) ?? $content;

// Espace saisie avant une ponctuation haute (« permis ? ») rendue insécable : sans
// cela, le navigateur peut renvoyer le signe seul à la ligne. Les balises situées
// entre l'espace et le signe (mise en avant, lien…) sont conservées.
$couturier_image_text_content = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $couturier_image_text_content ) ?? $couturier_image_text_content;

// Image facultative. `alt` repris de la médiathèque, vide à défaut (image
// décorative) ; pièce jointe supprimée : chaîne vide, texte pleine largeur.
// `sizes` donne la largeur réelle de l'image (moitié du conteneur de 1136 px en
// desktop) ; le `auto` que WordPress y ajoute est retiré par
// `Theme\Features\Blocks\BlockImageSizes`.
$couturier_image_text_image = empty( $attributes['imageId'] ) ? '' : wp_get_attachment_image(
    (int) $attributes['imageId'],
    'large',
    false,
    [
        'class'    => 'wp-block-couturier-image-text__image',
        'sizes'    => '(min-width: 1200px) 556px, (min-width: 992px) calc(50vw - 36px), calc(100vw - 24px)',
        'loading'  => 'lazy',
        'decoding' => 'async',
    ]
);

$couturier_image_text_position = 'right' === ( $attributes['imagePosition'] ?? 'left' ) ? 'right' : 'left';

printf(
    '<section %s>%s<div class="wp-block-couturier-image-text__content">%s</div></section>',
    get_block_wrapper_attributes( [ 'class' => 'is-image-' . $couturier_image_text_position . ( $couturier_image_text_image ? ' has-image' : '' ) ] ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_image_text_image ? '<div class="wp-block-couturier-image-text__media">' . $couturier_image_text_image . '</div>' : '', // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par wp_get_attachment_image().
    $couturier_image_text_content // phpcs:ignore WordPress.Security.EscapeOutput -- HTML enregistré et blocs imbriqués.
);

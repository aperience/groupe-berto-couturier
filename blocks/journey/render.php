<?php
/**
 * Rendu du bloc « Parcours en étapes » (`couturier/journey`).
 *
 * Image facultative (attribut `imageId`), placée avant les étapes dans le DOM
 * (au-dessus en mobile, à gauche en desktop), puis la liste des étapes
 * (`journey-list/render.php`). Sans image (ou pièce jointe supprimée), les étapes
 * prennent toute la largeur. Aucune étape complète : rien n'est rendu.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML de la liste des étapes rendue.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! str_contains( $content, 'wp-block-couturier-journey-step__button' ) ) {
    return;
}

// Espace saisie avant une ponctuation haute (« permis ? ») rendue insécable. Les
// balises situées entre l'espace et le signe (mise en avant, lien…) sont conservées.
$couturier_journey_content = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $content ) ?? $content;

// Image facultative : `alt` de la médiathèque, vide à défaut (image décorative).
// `sizes` : moitié du conteneur de 1136 px en desktop.
$couturier_journey_image = empty( $attributes['imageId'] ) ? '' : wp_get_attachment_image(
    (int) $attributes['imageId'],
    'large',
    false,
    [
        'class'    => 'wp-block-couturier-journey__image',
        'sizes'    => '(min-width: 1200px) 556px, (min-width: 992px) calc(50vw - 36px), calc(100vw - 24px)',
        'loading'  => 'lazy',
        'decoding' => 'async',
    ]
);

printf(
    '<section %s>%s<div class="wp-block-couturier-journey__steps">%s</div></section>',
    get_block_wrapper_attributes( $couturier_journey_image ? [ 'class' => 'has-image' ] : [] ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_journey_image ? '<div class="wp-block-couturier-journey__media">' . $couturier_journey_image . '</div>' : '', // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par wp_get_attachment_image().
    $couturier_journey_content // phpcs:ignore WordPress.Security.EscapeOutput -- étapes rendues.
);

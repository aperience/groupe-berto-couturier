<?php
/**
 * Rendu d'un atout du bloc « Réassurance » (`couturier/reassurance-item`).
 *
 * `<li>` : pastille du pictogramme (masque CSS peint en `currentColor`,
 * décoratif), puis le contenu enregistré dans `__body` — titre
 * (`core/heading`, `<h3>`) et texte (`p.wp-block-couturier-reassurance-item__text`).
 *
 * Sans titre : rien n'est rendu. Sans pictogramme (ou pièce jointe supprimée) :
 * pas de pastille.
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

if ( ! preg_match( '#^\s*<h([2-6])\b[^>]*>(.*?)</h\1>#s', $content, $couturier_item_title )
    || '' === trim( wp_strip_all_tags( $couturier_item_title[2] ) )
) {
    return;
}

$couturier_item_icon = empty( $attributes['iconId'] ) ? false : wp_get_attachment_url( (int) $attributes['iconId'] );

printf(
    '<li %s>%s<div class="wp-block-couturier-reassurance-item__body">%s</div></li>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_item_icon
        ? sprintf(
            '<span class="wp-block-couturier-reassurance-item__badge" aria-hidden="true"><span class="wp-block-couturier-reassurance-item__icon" style="%s"></span></span>',
            esc_attr( '--icon: url("' . esc_url( $couturier_item_icon ) . '")' )
        )
        : '',
    trim( $content ) // phpcs:ignore WordPress.Security.EscapeOutput -- titre et texte enregistrés.
);

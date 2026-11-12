<?php
/**
 * Rendu d'une carte du bloc « Formules » (`couturier/formula-card`).
 *
 * `<li>` : pastille (carte mise en avant), titre (`<h3>`), prix, public visé, détails
 * et bouton. Sans titre : rien n'est rendu. Prix, public visé ou détails vides : retirés ;
 * bouton sans libellé : retiré.
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

if ( ! preg_match( '#<h([2-6])\b[^>]*>(.*?)</h\1>#s', $content, $couturier_formula_title )
    || '' === trim( wp_strip_all_tags( $couturier_formula_title[2] ) )
) {
    return;
}

// Paragraphes vides, puis groupe dont le bouton n'a pas de libellé.
$couturier_formula_content = preg_replace( '#<p\b[^>]*>\s*</p>#', '', $content ) ?? $content;
$couturier_formula_content = preg_replace(
    '#<div class="wp-block-buttons[^"]*">\s*<div class="wp-block-button[^"]*">\s*<a\b[^>]*>\s*</a>\s*</div>\s*</div>#',
    '',
    $couturier_formula_content
) ?? $couturier_formula_content;

// Espace saisie avant une ponctuation haute rendue insécable.
$couturier_formula_content = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $couturier_formula_content ) ?? $couturier_formula_content;

printf(
    '<li %s>%s</li>',
    get_block_wrapper_attributes( [ 'class' => empty( $attributes['featured'] ) ? '' : 'is-featured' ] ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    trim( $couturier_formula_content ) // phpcs:ignore WordPress.Security.EscapeOutput -- contenu enregistré.
);

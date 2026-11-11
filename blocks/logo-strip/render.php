<?php
/**
 * Rendu du bloc « Logos partenaires » (`couturier/logo-strip`).
 *
 * `section.wp-block-couturier-logo-strip[.is-bg-…]` > titre H2, texte, encart
 * des logos (`ul`), chacun facultatif. Titre vide retiré ; sans titre, texte
 * ni logo, rien n'est rendu. Fond (`background`) autre que pêche/100 : classe `is-bg-{fond}`.
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

// Titre vide (facultatif) retiré.
$couturier_logo_strip_content = preg_replace( '#<h2\b[^>]*>\s*</h2>#', '', $content ) ?? $content;

// Ni titre, ni texte, ni logo : rien n'est rendu.
if ( '' === trim( wp_strip_all_tags( $couturier_logo_strip_content ) ) ) {
    return;
}

// Espace avant une ponctuation haute rendue insécable (cf. `cta/render.php`).
$couturier_logo_strip_content = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $couturier_logo_strip_content ) ?? $couturier_logo_strip_content;

printf(
    '<section %s>%s</section>',
    get_block_wrapper_attributes( [ 'class' => \Theme\Support\CardBackground::class_name( $attributes, $block ) ] ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_logo_strip_content // phpcs:ignore WordPress.Security.EscapeOutput -- HTML des blocs imbriqués.
);

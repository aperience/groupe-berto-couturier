<?php
/**
 * Rendu d'une colonne du bloc « Texte repliable » (`couturier/collapsible-text-column`).
 *
 * Paragraphes vides retirés ; colonne sans texte : rien n'est rendu (le bloc
 * parent passe alors sur une seule colonne, pleine largeur).
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML enregistré : paragraphes et listes.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$couturier_collapsible_text_column = trim( preg_replace( '#<p\b[^>]*>\s*</p>#', '', $content ) ?? $content );

if ( '' === trim( wp_strip_all_tags( $couturier_collapsible_text_column ) ) ) {
    return;
}

printf(
    '<div %s>%s</div>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_collapsible_text_column // phpcs:ignore WordPress.Security.EscapeOutput -- texte enregistré.
);

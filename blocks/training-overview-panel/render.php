<?php
/**
 * Rendu d'un panneau du bloc « Objectifs et programme »
 * (`couturier/training-overview-panel`) : titre (`<h3>`) facultatif, paragraphes
 * et listes, bouton facultatif. Éléments vides retirés ; ni titre ni texte : rien
 * n'est rendu (un bouton seul ne suffit pas). Repris de `formula-note/render.php`.
 *
 * Fond (`background`) autre que le défaut : classe `is-bg-{fond}`.
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

// Titre, paragraphes et éléments de liste vides retirés, puis listes vidées.
$couturier_panel_content = preg_replace( '#<(h[2-6]|p|li)\b[^>]*>\s*</\1>#', '', $content ) ?? $content;
$couturier_panel_content = preg_replace( '#<(ul|ol)\b[^>]*>\s*</\1>#', '', $couturier_panel_content ) ?? $couturier_panel_content;

// Texte hors bouton : ni titre ni texte, rien n'est rendu.
$couturier_panel_text = preg_replace( '#<div\b[^>]*\bwp-block-buttons\b.*#s', '', $couturier_panel_content ) ?? $couturier_panel_content;

if ( '' === trim( wp_strip_all_tags( $couturier_panel_text ) ) ) {
    return;
}

// Espace saisie avant une ponctuation haute rendue insécable.
$couturier_panel_content = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $couturier_panel_content ) ?? $couturier_panel_content;

printf(
    '<div %s>%s</div>',
    get_block_wrapper_attributes( [ 'class' => \Theme\Support\CardBackground::class_name( $attributes, $block ) ] ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    trim( $couturier_panel_content ) // phpcs:ignore WordPress.Security.EscapeOutput -- contenu enregistré.
);

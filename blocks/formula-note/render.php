<?php
/**
 * Rendu d'un encart du bloc « Formules » (`couturier/formula-note`) : titre
 * (`<h3>`) facultatif, listes à puces et paragraphes. Éléments vides retirés ;
 * ni titre ni texte : rien n'est rendu.
 *
 * Fond (`background`) autre que pétrole clair : classe `is-bg-{fond}`.
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
$couturier_note_content = preg_replace( '#<(h[2-6]|p|li)\b[^>]*>\s*</\1>#', '', $content ) ?? $content;
$couturier_note_content = preg_replace( '#<ul\b[^>]*>\s*</ul>#', '', $couturier_note_content ) ?? $couturier_note_content;

// Ni titre ni texte : rien n'est rendu.
if ( '' === trim( wp_strip_all_tags( $couturier_note_content ) ) ) {
    return;
}

// Espace saisie avant une ponctuation haute rendue insécable.
$couturier_note_content = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $couturier_note_content ) ?? $couturier_note_content;

printf(
    '<div %s>%s</div>',
    get_block_wrapper_attributes( [ 'class' => \Theme\Support\CardBackground::class_name( $attributes, $block ) ] ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    trim( $couturier_note_content ) // phpcs:ignore WordPress.Security.EscapeOutput -- contenu enregistré.
);

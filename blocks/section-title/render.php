<?php
/**
 * Rendu du bloc « Titre de section » (`couturier/section-title`).
 *
 * Enveloppe le contenu enregistré (titre, puis sous-titre facultatif) dans un
 * `<hgroup>`. Le titre est obligatoire : vide, rien n'est rendu.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML enregistré : titre et sous-titre.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$couturier_section_title_has_title = false;

foreach ( $block->inner_blocks as $couturier_section_title_inner ) {
    if ( 'core/heading' === $couturier_section_title_inner->name ) {
        $couturier_section_title_has_title = '' !== trim( wp_strip_all_tags( $couturier_section_title_inner->inner_html ) );
    }
}

if ( ! $couturier_section_title_has_title ) {
    return;
}

// Espace saisie avant une ponctuation haute (« permis ? ») rendue insécable : sans
// cela, le navigateur peut renvoyer le signe seul à la ligne. Les balises situées
// entre l'espace et le signe (mise en avant, lien…) sont conservées.
$couturier_section_title_content = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $content ) ?? $content;

printf(
    '<hgroup %s>%s</hgroup>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_section_title_content // phpcs:ignore WordPress.Security.EscapeOutput -- HTML enregistré du bloc.
);

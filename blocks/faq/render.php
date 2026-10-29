<?php
/**
 * Rendu du bloc « Questions fréquentes » (`couturier/faq`).
 *
 * Enveloppe le contenu enregistré (titre, texte, bouton, liste des questions).
 * Le titre et au moins une question complète sont obligatoires : sinon, rien
 * n'est rendu. Le texte est facultatif : vide, il est retiré.
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

$couturier_faq_has_title = false;

foreach ( $block->inner_blocks as $couturier_faq_inner ) {
    if ( 'core/heading' === $couturier_faq_inner->name ) {
        $couturier_faq_has_title = '' !== trim( wp_strip_all_tags( $couturier_faq_inner->inner_html ) );
    }
}

// Questions : les questions incomplètes ne sont pas rendues (`faq-item/render.php`).
if ( ! $couturier_faq_has_title || ! str_contains( $content, 'wp-block-couturier-faq-item__button' ) ) {
    return;
}

// Texte vide : le paragraphe enregistré est retiré.
$couturier_faq_content = preg_replace( '#<p\b[^>]*>\s*</p>#', '', $content ) ?? $content;

// Espace saisie avant une ponctuation haute (« permis ? ») rendue insécable : sans
// cela, le navigateur peut renvoyer le signe seul à la ligne. Les balises situées
// entre l'espace et le signe (mise en avant, lien…) sont conservées.
$couturier_faq_content = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $couturier_faq_content ) ?? $couturier_faq_content;

printf(
    '<section %s>%s</section>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_faq_content // phpcs:ignore WordPress.Security.EscapeOutput -- HTML des blocs imbriqués.
);

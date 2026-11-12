<?php
/**
 * Rendu du bloc « Formules » (`couturier/formulas`).
 *
 * Enveloppe le contenu enregistré (titre, sous-titre, cartes). Le titre et au
 * moins une carte titrée sont obligatoires : sinon, rien n'est rendu. Le
 * sous-titre est facultatif : vide, il est retiré.
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

$couturier_formulas_has_title = false;

foreach ( $block->inner_blocks as $couturier_formulas_inner ) {
    if ( 'core/heading' === $couturier_formulas_inner->name ) {
        $couturier_formulas_has_title = '' !== trim( wp_strip_all_tags( $couturier_formulas_inner->inner_html ) );
    }
}

// Cartes : celles sans titre ne sont pas rendues (`formula-card/render.php`).
if ( ! $couturier_formulas_has_title || ! str_contains( $content, 'wp-block-couturier-formula-card' ) ) {
    return;
}

// Sous-titre vide : le paragraphe enregistré est retiré.
$couturier_formulas_content = preg_replace( '#<p\b[^>]*>\s*</p>#', '', $content ) ?? $content;

// Espace saisie avant une ponctuation haute (« niveau ? ») rendue insécable : sans
// cela, le navigateur peut renvoyer le signe seul à la ligne. Les balises situées
// entre l'espace et le signe (mise en avant, lien…) sont conservées.
$couturier_formulas_content = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $couturier_formulas_content ) ?? $couturier_formulas_content;

// Formules par ligne en desktop (1 à 4, 3 par défaut).
$couturier_formulas_columns = min( 4, max( 1, absint( $attributes['columns'] ?? 3 ) ) );

printf(
    '<section %s>%s</section>',
    get_block_wrapper_attributes( [ 'style' => '--formulas-columns:' . $couturier_formulas_columns ] ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_formulas_content // phpcs:ignore WordPress.Security.EscapeOutput -- HTML des blocs imbriqués.
);

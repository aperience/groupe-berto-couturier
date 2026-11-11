<?php
/**
 * Rendu du bloc « Texte repliable » (`couturier/collapsible-text`).
 *
 * Le contenu est le titre (`core/heading`, `<h3>`) suivi des deux colonnes
 * rendues (`collapsible-text-column/render.php`, qui omet une colonne vide). Il
 * est mis en forme d'en-tête (titre et bouton « Réduire » / « Lire la suite »)
 * et de corps repliable, relié au bouton par `aria-controls`. Le corps (hauteur
 * animée) enveloppe le contenu (colonnes), qui garde sa hauteur naturelle. Le
 * bouton reste `hidden` tant que le script du front ne l'a pas activé (desktop) :
 * sans lui, le texte est entier.
 *
 * Titre vide, ou aucune colonne rendue : rien n'est rendu.
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

// Titre (en tête, cf. `index.js`), puis colonnes.
if ( ! preg_match( '#^\s*(<h([23])\b[^>]*>.*?</h\2>)(.*)$#s', $content, $couturier_collapsible_text ) ) {
    return;
}

[ , $couturier_collapsible_text_heading, , $couturier_collapsible_text_body ] = $couturier_collapsible_text;

$couturier_collapsible_text_body = trim( $couturier_collapsible_text_body );

if ( '' === trim( wp_strip_all_tags( $couturier_collapsible_text_heading ) ) || '' === trim( wp_strip_all_tags( $couturier_collapsible_text_body ) ) ) {
    return;
}

// Espace saisie avant une ponctuation haute (« permis ? ») rendue insécable : sans
// cela, le navigateur peut renvoyer le signe seul à la ligne. Les balises situées
// entre l'espace et le signe (mise en avant, lien…) sont conservées.
$couturier_collapsible_text_heading = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $couturier_collapsible_text_heading ) ?? $couturier_collapsible_text_heading;
$couturier_collapsible_text_body    = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $couturier_collapsible_text_body ) ?? $couturier_collapsible_text_body;

// Réglages : une seule colonne (colonnes empilées, pleine largeur) ; texte
// repliable ou non (sinon, ni bouton ni identifiant : texte toujours entier).
$couturier_collapsible_text_single      = ! empty( $attributes['singleColumn'] );
$couturier_collapsible_text_collapsible = ! isset( $attributes['isCollapsible'] ) || (bool) $attributes['isCollapsible'];

$couturier_collapsible_text_classes = implode(
    ' ',
    array_filter(
        [
            $couturier_collapsible_text_single ? 'is-single-column' : '',
            $couturier_collapsible_text_collapsible ? '' : 'is-not-collapsible',
        ]
    )
);

$couturier_collapsible_text_wrapper = get_block_wrapper_attributes( '' !== $couturier_collapsible_text_classes ? [ 'class' => $couturier_collapsible_text_classes ] : [] );

if ( ! $couturier_collapsible_text_collapsible ) {
    printf(
        '<section %1$s><div class="wp-block-couturier-collapsible-text__header">%2$s</div><div class="wp-block-couturier-collapsible-text__body"><div class="wp-block-couturier-collapsible-text__content">%3$s</div></div></section>',
        $couturier_collapsible_text_wrapper, // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
        $couturier_collapsible_text_heading, // phpcs:ignore WordPress.Security.EscapeOutput -- titre enregistré.
        $couturier_collapsible_text_body // phpcs:ignore WordPress.Security.EscapeOutput -- texte enregistré.
    );
    return;
}

$couturier_collapsible_text_id = wp_unique_id( 'collapsible-text-' );

printf(
    '<section %1$s><div class="wp-block-couturier-collapsible-text__header">%2$s<button type="button" class="wp-block-couturier-collapsible-text__toggle" aria-expanded="true" aria-controls="%3$s" hidden><span class="wp-block-couturier-collapsible-text__toggle-less">%4$s</span><span class="wp-block-couturier-collapsible-text__toggle-more">%5$s</span></button></div><div class="wp-block-couturier-collapsible-text__body" id="%3$s"><div class="wp-block-couturier-collapsible-text__content">%6$s</div></div></section>',
    $couturier_collapsible_text_wrapper, // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_collapsible_text_heading, // phpcs:ignore WordPress.Security.EscapeOutput -- titre enregistré.
    esc_attr( $couturier_collapsible_text_id ),
    esc_html__( 'Réduire', 'couturier' ),
    esc_html__( 'Lire la suite', 'couturier' ),
    $couturier_collapsible_text_body // phpcs:ignore WordPress.Security.EscapeOutput -- texte enregistré.
);

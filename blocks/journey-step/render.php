<?php
/**
 * Rendu d'une étape du bloc « Parcours en étapes » (`couturier/journey-step`).
 *
 * Le contenu reçu est le titre (`core/heading`, `<h3>`) suivi du texte rendu
 * (`journey-step-body/render.php`, vide sans texte). Il est mis en forme
 * d'élément d'accordéon (modèle WAI-ARIA « Accordion ») : pastille, « Étape N »,
 * titre et « Étape N sur M » dans un `<button>`, texte dans un panneau repliable.
 * Numéros, identifiants et première étape ouverte : `journey-list/render.php`,
 * qui remplit les `<span>` vides de la pastille et des libellés.
 *
 * Titre ou texte vide : rien n'est rendu.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML : titre puis texte rendu.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Titre (balise ouvrante conservée : classes, ancre), niveau, texte du titre, texte de l'étape.
if ( ! preg_match( '#^\s*(<h([2-6])\b[^>]*>)(.*?)</h\2>(.*)$#s', $content, $couturier_journey_step ) ) {
    return;
}

[ , $couturier_journey_step_open, $couturier_journey_step_level, $couturier_journey_step_title, $couturier_journey_step_body ] = $couturier_journey_step;

if ( '' === trim( wp_strip_all_tags( $couturier_journey_step_title ) ) || '' === trim( wp_strip_all_tags( $couturier_journey_step_body ) ) ) {
    return;
}

$couturier_journey_step_heading = new WP_HTML_Tag_Processor( $couturier_journey_step_open );
$couturier_journey_step_heading->next_tag();
$couturier_journey_step_heading->add_class( 'wp-block-couturier-journey-step__heading' );

// Couleur de la pastille : liste fermée du `block.json`, pêche par défaut (aucune classe).
$couturier_journey_step_bg = \Theme\Support\CardBackground::class_name( $attributes, $block );

printf(
    '<div %1$s>%2$s<button type="button" class="wp-block-couturier-journey-step__button collapsed" data-bs-toggle="collapse" aria-expanded="false">'
    . '<span class="wp-block-couturier-journey-step__badge" aria-hidden="true"></span>'
    . '<span class="wp-block-couturier-journey-step__label"></span>'
    . '<span class="wp-block-couturier-journey-step__title">%3$s</span>'
    . '<span class="wp-block-couturier-journey-step__count"></span>'
    . '</button></h%4$s><div class="wp-block-couturier-journey-step__collapse collapse"><div class="wp-block-couturier-journey-step__body">%5$s</div></div></div>',
    get_block_wrapper_attributes( $couturier_journey_step_bg ? [ 'class' => $couturier_journey_step_bg ] : [] ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_journey_step_heading->get_updated_html(), // phpcs:ignore WordPress.Security.EscapeOutput -- balise du titre enregistré.
    $couturier_journey_step_title, // phpcs:ignore WordPress.Security.EscapeOutput -- texte du titre enregistré.
    esc_attr( $couturier_journey_step_level ),
    trim( $couturier_journey_step_body ) // phpcs:ignore WordPress.Security.EscapeOutput -- texte rendu.
);

<?php
/**
 * Rendu du texte d'une étape du bloc « Parcours en étapes » (`couturier/journey-step-body`).
 *
 * Paragraphes vides retirés ; sans texte : rien n'est rendu (l'étape
 * n'est alors pas rendue non plus).
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

$couturier_journey_step_body = trim( preg_replace( '#<p\b[^>]*>\s*</p>#', '', $content ) ?? $content );

if ( '' === trim( wp_strip_all_tags( $couturier_journey_step_body ) ) ) {
    return;
}

printf(
    '<div %s>%s</div>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_journey_step_body // phpcs:ignore WordPress.Security.EscapeOutput -- texte enregistré.
);

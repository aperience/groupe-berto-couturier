<?php
/**
 * Rendu d'une étape du bloc « Étapes » (`couturier/step`).
 *
 * `<li>` : contenu enregistré — titre (`core/heading`, `<h3>`) et texte
 * (`p.wp-block-couturier-step__text`). La pastille numérotée est un
 * pseudo-élément CSS (`block/_steps.scss`).
 *
 * Sans titre : rien n'est rendu.
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

if ( ! preg_match( '#^\s*<h([2-6])\b[^>]*>(.*?)</h\1>#s', $content, $couturier_step_title )
    || '' === trim( wp_strip_all_tags( $couturier_step_title[2] ) )
) {
    return;
}

printf(
    '<li %s>%s</li>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    trim( $content ) // phpcs:ignore WordPress.Security.EscapeOutput -- titre et texte enregistrés.
);

<?php
/**
 * Rendu du bloc « Étapes » (`couturier/steps`) : liste ordonnée des étapes
 * rendues (`step/render.php`). Numéros et couleurs des pastilles : CSS.
 *
 * `role="list"` : Safari retire la sémantique de liste d'un `list-style: none`.
 *
 * Aucune étape titrée : rien n'est rendu.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML des étapes rendues.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! str_contains( $content, '<li' ) ) {
    return;
}

printf(
    '<ol role="list" %s>%s</ol>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    trim( $content ) // phpcs:ignore WordPress.Security.EscapeOutput -- étapes rendues.
);

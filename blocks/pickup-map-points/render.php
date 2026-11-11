<?php
/**
 * Rendu de la liste des points de ramassage (`couturier/pickup-map-points`) :
 * liste ordonnée des points rendus (`pickup-point/render.php`).
 *
 * `role="list"` : Safari retire la sémantique de liste d'un `list-style: none`.
 * Aucun point rendu : rien n'est rendu (le bloc parent n'affiche alors ni
 * onglets ni liste).
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML des points rendus.
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
    trim( $content ) // phpcs:ignore WordPress.Security.EscapeOutput -- points rendus.
);

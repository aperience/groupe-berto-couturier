<?php
/**
 * Rendu de l'encart des logos du bloc « Logos partenaires » (`couturier/logo-strip-items`).
 *
 * Les logos sans légende ne sont pas rendus (`logo-strip-item/render.php`) ;
 * sans aucun logo rendu, rien n'est rendu (et le bloc parent non plus).
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    Logos rendus (`<li>`).
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
    '<ul %s>%s</ul>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    trim( $content ) // phpcs:ignore WordPress.Security.EscapeOutput -- logos rendus.
);

<?php
/**
 * Rendu de la rangée d'icônes du bloc « Image et texte » (`couturier/image-text-icons`).
 *
 * Les icônes incomplètes ne sont pas rendues (`image-text-icon/render.php`) ;
 * sans aucune icône rendue, rien n'est rendu.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    Icônes rendues (`<li>`).
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
    trim( $content ) // phpcs:ignore WordPress.Security.EscapeOutput -- icônes rendues.
);

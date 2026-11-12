<?php
/**
 * Rendu des panneaux du bloc « Objectifs et programme »
 * (`couturier/training-overview-panels`). Aucun panneau rendu : rien.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML des panneaux rendus.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( '' === trim( $content ) ) {
    return;
}

printf(
    '<div %s>%s</div>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    trim( $content ) // phpcs:ignore WordPress.Security.EscapeOutput -- panneaux rendus.
);

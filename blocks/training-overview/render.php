<?php
/**
 * Rendu du bloc « Objectifs et programme » (`couturier/training-overview`) :
 * panneaux puis cartes d'informations, rendus par leurs propres blocs. Ni panneau
 * ni carte : rien n'est rendu.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML des blocs imbriqués rendus.
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
    trim( $content ) // phpcs:ignore WordPress.Security.EscapeOutput -- blocs imbriqués rendus.
);

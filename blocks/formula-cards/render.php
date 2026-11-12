<?php
/**
 * Rendu des cartes du bloc « Formules » (`couturier/formula-cards`) : liste
 * (`<ul>`) des cartes rendues (`formula-card/render.php`). Aucune carte titrée :
 * rien n'est rendu.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML des cartes rendues.
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
    trim( $content ) // phpcs:ignore WordPress.Security.EscapeOutput -- cartes rendues.
);

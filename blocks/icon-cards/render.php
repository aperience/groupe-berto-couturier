<?php
/**
 * Rendu du bloc « Cartes à pictogramme » (`couturier/icon-cards`) : liste des
 * cartes rendues (`icon-card/render.php`).
 *
 * Aucune carte titrée : rien n'est rendu.
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

// Réglage « Cartes par ligne » : quatre en desktop (`xl`), trois par défaut.
$wrapper_extra = 4 === (int) ( $attributes['columns'] ?? 3 ) ? [ 'class' => 'has-4-columns' ] : [];

printf(
    '<ul %s>%s</ul>',
    get_block_wrapper_attributes( $wrapper_extra ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    trim( $content ) // phpcs:ignore WordPress.Security.EscapeOutput -- cartes rendues.
);

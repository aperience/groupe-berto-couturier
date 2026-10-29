<?php
/**
 * Rendu du bloc « Chiffres clés » (`couturier/key-figures`).
 *
 * Enveloppe la liste enregistrée dans un `<div>`, après en avoir retiré les
 * chiffres incomplets (classe `is-incomplete` posée par `save()` : valeur ou
 * libellé vide). Sans chiffre complet, rien n'est rendu.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML enregistré : la liste des chiffres.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Balisage produit par `save()` : pas de `<li>` imbriqué, une expression suffit.
$couturier_key_figures_content = preg_replace(
    '#<li class="[^"]*\bis-incomplete\b[^"]*">.*?</li>#s',
    '',
    $content
) ?? $content;

if ( ! str_contains( $couturier_key_figures_content, '<li' ) ) {
    return;
}

printf(
    '<div %s>%s</div>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_key_figures_content // phpcs:ignore WordPress.Security.EscapeOutput -- HTML enregistré du bloc.
);

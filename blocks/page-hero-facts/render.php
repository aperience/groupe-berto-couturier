<?php
/**
 * Rendu du bloc « Chiffres clés du héros » (`couturier/page-hero-facts`).
 *
 * Enveloppe la liste enregistrée (`dl`) dans un `<div>`, après en avoir retiré les
 * chiffres incomplets (classe `is-incomplete` posée par `save()` : libellé ou
 * valeur vide). Sans chiffre complet, rien n'est rendu — et le héros n'ajoute
 * alors pas `has-facts`.
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

// Balisage produit par `save()` : pas de `<div>` imbriqué dans un chiffre.
$couturier_page_hero_facts_content = preg_replace(
    '#<div class="[^"]*\bis-incomplete\b[^"]*">.*?</div>#s',
    '',
    $content
) ?? $content;

if ( ! str_contains( $couturier_page_hero_facts_content, '<dt' ) ) {
    return;
}

printf(
    '<div %s>%s</div>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_page_hero_facts_content // phpcs:ignore WordPress.Security.EscapeOutput -- HTML enregistré du bloc.
);

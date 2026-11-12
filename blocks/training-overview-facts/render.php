<?php
/**
 * Rendu des cartes d'informations du bloc « Objectifs et programme »
 * (`couturier/training-overview-facts`).
 *
 * Enveloppe la liste enregistrée (`dl`) dans un `<div>`, après en avoir retiré les
 * cartes incomplètes (classe `is-incomplete` posée par `save()` : valeur vide).
 * Sans carte complète, rien n'est rendu. Repris de `page-hero-facts/render.php`.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML enregistré : la liste des cartes.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Balisage produit par `save()` : pas de `<div>` imbriqué dans une carte.
$couturier_facts_content = preg_replace(
    '#<div class="[^"]*\bis-incomplete\b[^"]*"[^>]*>.*?</div>#s',
    '',
    $content
) ?? $content;

// Libellé vide retiré (carte rendue sur sa seule valeur).
$couturier_facts_content = preg_replace( '#<dt\b[^>]*>\s*</dt>#', '', $couturier_facts_content ) ?? $couturier_facts_content;

if ( ! str_contains( $couturier_facts_content, '<dd' ) ) {
    return;
}

printf(
    '<div %s>%s</div>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_facts_content // phpcs:ignore WordPress.Security.EscapeOutput -- HTML enregistré du bloc.
);

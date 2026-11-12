<?php
/**
 * Rendu du bloc « Équipe » (`couturier/team`) : liste des cartes, rendues par
 * les blocs enfants `couturier/team-member` (`$content`, rien pour un contact
 * dépublié ou sans nom affiché). Aucune carte : bloc non rendu.
 *
 * Rendu dynamique : nom et fonction viennent du contact, pas du contenu de la
 * page — ils ne sont donc pas comptés par le compteur de mots de l'éditeur (assumé).
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    Cartes rendues par les blocs enfants.
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
    '<div %1$s><ul class="wp-block-couturier-team__track" role="list">%2$s</ul></div>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $content // phpcs:ignore WordPress.Security.EscapeOutput -- rendu des blocs enfants.
);

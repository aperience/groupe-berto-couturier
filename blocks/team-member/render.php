<?php
/**
 * Rendu d'un membre du bloc « Équipe » (`couturier/team-member`) : carte du
 * contact (`Contact::render_card()`), rien s'il est dépublié ou sans nom affiché.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    Contenu enregistré (vide).
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

use Theme\Features\Contacts\Contact;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$couturier_member_bg_meta = $block->block_type->attributes['background'] ?? [];
$couturier_member_bg      = (string) ( $attributes['background'] ?? '' );

if ( ! in_array( $couturier_member_bg, (array) ( $couturier_member_bg_meta['enum'] ?? [] ), true ) ) {
    $couturier_member_bg = (string) ( $couturier_member_bg_meta['default'] ?? '' );
}

// Point focal → `--focal` (même calcul que `objectPosition()` dans `index.js`), omis au centre.
$couturier_member_focal = is_array( $attributes['focalPoint'] ?? null ) ? $attributes['focalPoint'] : [];
$couturier_member_x     = round( min( max( (float) ( $couturier_member_focal['x'] ?? 0.5 ), 0.0 ), 1.0 ) * 100, 1 );
$couturier_member_y     = round( min( max( (float) ( $couturier_member_focal['y'] ?? 0.5 ), 0.0 ), 1.0 ) * 100, 1 );
$couturier_member_style = ( 50.0 === $couturier_member_x && 50.0 === $couturier_member_y ) ? '' : sprintf( '--focal: %s%% %s%%', $couturier_member_x, $couturier_member_y );

echo Contact::render_card( (int) ( $attributes['contactId'] ?? 0 ), $couturier_member_bg, $couturier_member_style ); // phpcs:ignore WordPress.Security.EscapeOutput -- gabarit Twig échappé.

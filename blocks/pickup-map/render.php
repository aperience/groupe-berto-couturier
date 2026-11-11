<?php
/**
 * Rendu du bloc « Centre et points de ramassage » (`couturier/pickup-map`).
 *
 * Titre, onglets (avec des points seulement), carte Google Maps en iframe, liste
 * des points, note. Modèle WAI-ARIA « Tabs » : les deux onglets commandent un
 * même panneau, la carte (`aria-labelledby` tenu à jour par
 * `resources/js/pickup-map.js`). « Le centre » montre l'adresse du centre ;
 * « Points de ramassage » le point choisi dans la liste (le premier au départ).
 * Sans points : ni onglets ni rôle de panneau, la carte du centre seule.
 *
 * L'adresse du lieu affiché est écrite sous la carte (alternative à l'iframe).
 *
 * Rien n'est rendu sans titre ou sans adresse du centre.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML des blocs imbriqués, puis la note.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

use Theme\Support\GoogleMapsEmbed;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$couturier_map_address = trim( (string) ( $attributes['centerAddress'] ?? '' ) );
$couturier_map_src     = GoogleMapsEmbed::url( $couturier_map_address );
$couturier_map_title   = '';
$couturier_map_points  = '';

foreach ( $block->inner_blocks as $couturier_map_inner ) {
    if ( 'core/heading' === $couturier_map_inner->name ) {
        $couturier_map_title = trim( $couturier_map_inner->render() );
    } elseif ( 'couturier/pickup-map-points' === $couturier_map_inner->name ) {
        $couturier_map_points = trim( $couturier_map_inner->render() );
    }
}

if ( '' === $couturier_map_src || '' === trim( wp_strip_all_tags( $couturier_map_title ) ) ) {
    return;
}

// Espace avant une ponctuation haute rendue insécable (cf. `faq/render.php`).
$couturier_map_title = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $couturier_map_title ) ?? $couturier_map_title;

$couturier_map_note = preg_match( '#<p class="wp-block-couturier-pickup-map__note">.*?</p>#s', $content, $couturier_map_match ) ? $couturier_map_match[0] : '';

$couturier_map_id         = wp_unique_id( 'pickup-map-' );
$couturier_map_panel      = "{$couturier_map_id}-map";
$couturier_map_has_points = '' !== $couturier_map_points;
$couturier_map_center     = __( 'Le centre', 'couturier' );

/* translators: %s : lieu affiché (« Le centre » ou nom du point de ramassage). */
$couturier_map_frame_title = sprintf( __( 'Carte Google Maps : %s', 'couturier' ), $couturier_map_center );

$couturier_map_tabs = '';

if ( $couturier_map_has_points ) {
    // Boutons des points : commandent la carte.
    $couturier_map_list = new WP_HTML_Tag_Processor( $couturier_map_points );

    while ( $couturier_map_list->next_tag( [ 'class_name' => 'wp-block-couturier-pickup-point__button' ] ) ) {
        $couturier_map_list->set_attribute( 'aria-controls', $couturier_map_panel );
    }

    $couturier_map_points = $couturier_map_list->get_updated_html();

    $couturier_map_tabs = sprintf(
        '<div class="wp-block-couturier-pickup-map__tabs" role="tablist" aria-label="%1$s">'
        . '<button type="button" role="tab" class="wp-block-couturier-pickup-map__tab" id="%2$s-tab-center" aria-selected="true" aria-controls="%3$s" data-map-src="%4$s" data-map-address="%5$s" data-map-label="%6$s">%6$s</button>'
        . '<button type="button" role="tab" class="wp-block-couturier-pickup-map__tab" id="%2$s-tab-points" aria-selected="false" aria-controls="%3$s" tabindex="-1">%7$s</button>'
        . '</div>',
        esc_attr__( 'Lieu affiché sur la carte', 'couturier' ),
        esc_attr( $couturier_map_id ),
        esc_attr( $couturier_map_panel ),
        esc_url( $couturier_map_src ),
        esc_attr( $couturier_map_address ),
        esc_html( $couturier_map_center ),
        esc_html__( 'Points de ramassage', 'couturier' )
    );
}

$couturier_map_html = sprintf(
    '<div class="wp-block-couturier-pickup-map__map" id="%1$s"%2$s>'
    . '<iframe class="wp-block-couturier-pickup-map__frame" src="%3$s" title="%4$s" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>'
    . '<p class="wp-block-couturier-pickup-map__address"><span class="visually-hidden">%5$s </span><span class="wp-block-couturier-pickup-map__address-text">%6$s</span></p>'
    . '</div>',
    esc_attr( $couturier_map_panel ),
    $couturier_map_has_points ? sprintf( ' role="tabpanel" aria-labelledby="%s-tab-center"', esc_attr( $couturier_map_id ) ) : '',
    esc_url( $couturier_map_src ),
    esc_attr( $couturier_map_frame_title ),
    esc_html__( 'Adresse :', 'couturier' ),
    esc_html( $couturier_map_address )
);

printf(
    '<section %1$s>%2$s%3$s%4$s%5$s%6$s</section>',
    get_block_wrapper_attributes( [ 'class' => $couturier_map_has_points ? 'has-points' : '' ] ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_map_title, // phpcs:ignore WordPress.Security.EscapeOutput -- titre enregistré.
    $couturier_map_tabs, // phpcs:ignore WordPress.Security.EscapeOutput -- échappé ci-dessus.
    $couturier_map_html, // phpcs:ignore WordPress.Security.EscapeOutput -- échappé ci-dessus.
    $couturier_map_points, // phpcs:ignore WordPress.Security.EscapeOutput -- points rendus.
    $couturier_map_note // phpcs:ignore WordPress.Security.EscapeOutput -- note enregistrée.
);

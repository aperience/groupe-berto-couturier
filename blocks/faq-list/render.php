<?php
/**
 * Rendu de la liste des questions (`couturier/faq-list`) : accordéon Bootstrap
 * (Collapse, `data-bs-parent` : une seule question ouverte à la fois).
 *
 * Chaque question (`faq-item/render.php`) arrive avec son bouton et son panneau,
 * sans identifiant : la liste les relie ici (`id`, `aria-controls`,
 * `data-bs-target`, `data-bs-parent`), avec un préfixe unique dans la page. Pas
 * d'`aria-labelledby` sur le panneau : ARIA interdit de nommer une `div` sans rôle.
 * La première question est ouverte au chargement.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML des questions rendues.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( '' === trim( $content ) ) {
    return;
}

$couturier_faq_list_id = wp_unique_id( 'faq-' );
$couturier_faq_list    = new WP_HTML_Tag_Processor( $content );
$couturier_faq_index   = 0;

while ( $couturier_faq_list->next_tag() ) {
    if ( $couturier_faq_list->has_class( 'wp-block-couturier-faq-item__button' ) ) {
        ++$couturier_faq_index;
        $couturier_faq_panel = "{$couturier_faq_list_id}-answer-{$couturier_faq_index}";

        $couturier_faq_list->set_attribute( 'id', "{$couturier_faq_list_id}-question-{$couturier_faq_index}" );
        $couturier_faq_list->set_attribute( 'aria-controls', $couturier_faq_panel );
        $couturier_faq_list->set_attribute( 'data-bs-target', "#{$couturier_faq_panel}" );

        if ( 1 === $couturier_faq_index ) {
            $couturier_faq_list->set_attribute( 'aria-expanded', 'true' );
            $couturier_faq_list->remove_class( 'collapsed' );
        }
    } elseif ( $couturier_faq_index && $couturier_faq_list->has_class( 'wp-block-couturier-faq-item__collapse' ) ) {
        $couturier_faq_list->set_attribute( 'id', "{$couturier_faq_list_id}-answer-{$couturier_faq_index}" );
        $couturier_faq_list->set_attribute( 'data-bs-parent', "#{$couturier_faq_list_id}" );

        if ( 1 === $couturier_faq_index ) {
            $couturier_faq_list->add_class( 'show' );
        }
    }
}

if ( ! $couturier_faq_index ) {
    return;
}

printf(
    '<div %s>%s</div>',
    get_block_wrapper_attributes( [ 'id' => $couturier_faq_list_id ] ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_faq_list->get_updated_html() // phpcs:ignore WordPress.Security.EscapeOutput -- HTML des questions, attributs échappés par le processeur.
);

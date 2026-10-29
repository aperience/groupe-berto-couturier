<?php
/**
 * Rendu d'une question du bloc « Questions fréquentes » (`couturier/faq-item`).
 *
 * Le contenu enregistré est le titre (`core/heading`, `<h3>`) suivi de la réponse
 * (`p.wp-block-couturier-faq-item__answer`). Il est mis en forme d'élément
 * d'accordéon (modèle WAI-ARIA « Accordion ») : le texte du titre est placé dans
 * un `<button>`, la réponse dans un panneau repliable. Identifiants et première
 * question ouverte : `faq-list/render.php`.
 *
 * Question ou réponse vide : rien n'est rendu.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML enregistré : titre puis réponse.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Titre (balise ouvrante conservée : classes, ancre), texte du titre, réponse.
if ( ! preg_match( '#^\s*(<h([2-6])\b[^>]*>)(.*?)</h\2>(.*)$#s', $content, $couturier_faq_item ) ) {
    return;
}

[ , $couturier_faq_item_open, $couturier_faq_item_level, $couturier_faq_item_question, $couturier_faq_item_answer ] = $couturier_faq_item;

if ( '' === trim( wp_strip_all_tags( $couturier_faq_item_question ) ) || '' === trim( wp_strip_all_tags( $couturier_faq_item_answer ) ) ) {
    return;
}

$couturier_faq_item_heading = new WP_HTML_Tag_Processor( $couturier_faq_item_open );
$couturier_faq_item_heading->next_tag();
$couturier_faq_item_heading->add_class( 'wp-block-couturier-faq-item__heading' );

printf(
    '<div %1$s>%2$s<button type="button" class="wp-block-couturier-faq-item__button collapsed" data-bs-toggle="collapse" aria-expanded="false">%3$s</button></h%4$s><div class="wp-block-couturier-faq-item__collapse collapse"><div class="wp-block-couturier-faq-item__body">%5$s</div></div></div>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_faq_item_heading->get_updated_html(), // phpcs:ignore WordPress.Security.EscapeOutput -- balise du titre enregistré.
    $couturier_faq_item_question, // phpcs:ignore WordPress.Security.EscapeOutput -- texte du titre enregistré.
    esc_attr( $couturier_faq_item_level ),
    trim( $couturier_faq_item_answer ) // phpcs:ignore WordPress.Security.EscapeOutput -- réponse enregistrée.
);

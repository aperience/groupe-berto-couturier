<?php
/**
 * Rendu de la liste des étapes (`couturier/journey-list`) : accordéon Bootstrap
 * (Collapse, `data-bs-parent` : une seule étape ouverte à la fois).
 *
 * Chaque étape (`journey-step/render.php`) arrive avec son bouton et son panneau,
 * sans identifiant ni numéro : la liste les relie ici (`id`, `aria-controls`,
 * `data-bs-target`, `data-bs-parent`), avec un préfixe unique dans la page, et
 * numérote les étapes **rendues** (une étape incomplète ne décale rien) : chiffre
 * de la pastille, « Étape N » (desktop), « Étape N sur M » (mobile). La
 * première étape est ouverte au chargement.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML des étapes rendues.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$couturier_journey_total = substr_count( $content, 'wp-block-couturier-journey-step__button' );

if ( ! $couturier_journey_total ) {
    return;
}

// Numéros : les trois `<span>` vides de chaque étape, dans l'ordre pastille,
// « Étape N », « Étape N sur M ».
$couturier_journey_number = 0;
$couturier_journey_html   = preg_replace_callback(
    '#(<span class="wp-block-couturier-journey-step__(badge|label|count)"[^>]*>)</span>#',
    static function ( array $match ) use ( &$couturier_journey_number, $couturier_journey_total ): string {
        if ( 'badge' === $match[2] ) {
            ++$couturier_journey_number;
        }

        $text = match ( $match[2] ) {
            'badge' => (string) $couturier_journey_number,
            /* translators: %d : numéro de l'étape. */
            'label' => sprintf( __( 'Étape %d', 'couturier' ), $couturier_journey_number ),
            /* translators: 1 : numéro de l'étape, 2 : nombre d'étapes. */
            default => sprintf( __( 'Étape %1$d sur %2$d', 'couturier' ), $couturier_journey_number, $couturier_journey_total ),
        };

        return $match[1] . esc_html( $text ) . '</span>';
    },
    $content
) ?? $content;

$couturier_journey_list_id = wp_unique_id( 'journey-' );
$couturier_journey_list    = new WP_HTML_Tag_Processor( $couturier_journey_html );
$couturier_journey_index   = 0;

while ( $couturier_journey_list->next_tag() ) {
    if ( $couturier_journey_list->has_class( 'wp-block-couturier-journey-step__button' ) ) {
        ++$couturier_journey_index;
        $couturier_journey_panel = "{$couturier_journey_list_id}-panel-{$couturier_journey_index}";

        $couturier_journey_list->set_attribute( 'id', "{$couturier_journey_list_id}-step-{$couturier_journey_index}" );
        $couturier_journey_list->set_attribute( 'aria-controls', $couturier_journey_panel );
        $couturier_journey_list->set_attribute( 'data-bs-target', "#{$couturier_journey_panel}" );

        if ( 1 === $couturier_journey_index ) {
            $couturier_journey_list->set_attribute( 'aria-expanded', 'true' );
            $couturier_journey_list->remove_class( 'collapsed' );
        }
    } elseif ( $couturier_journey_index && $couturier_journey_list->has_class( 'wp-block-couturier-journey-step__collapse' ) ) {
        $couturier_journey_list->set_attribute( 'id', "{$couturier_journey_list_id}-panel-{$couturier_journey_index}" );
        $couturier_journey_list->set_attribute( 'data-bs-parent', "#{$couturier_journey_list_id}" );

        if ( 1 === $couturier_journey_index ) {
            $couturier_journey_list->add_class( 'show' );
        }
    }
}

printf(
    '<div %s>%s</div>',
    get_block_wrapper_attributes( [ 'id' => $couturier_journey_list_id ] ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_journey_list->get_updated_html() // phpcs:ignore WordPress.Security.EscapeOutput -- HTML des étapes, attributs échappés par le processeur.
);

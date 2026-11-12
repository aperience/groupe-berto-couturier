<?php
/**
 * Sessions de formation : secteurs (logique sans hook)
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\TrainingSessions;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Secteurs des sessions de formation (taxonomie `couturier_sector`) : libellés
 * des boutons du filtre du bloc « Sessions de formation ».
 *
 * Un secteur regroupe une ou plusieurs villes (« Dreux » : Dreux et
 * Sainte-Gemme-Moronval) ; la ville affichée sur une session reste saisie dans
 * le bloc. Le bloc n'enregistre que l'ID du secteur : son nom est lu au rendu.
 */
final class Sector {

    /** Nom de la taxonomie. */
    public const TAXONOMY = 'couturier_sector';

    /** Slug de l'écran d'administration (`edit-tags.php?taxonomy=…`). */
    public const SCREEN_URL = 'edit-tags.php?taxonomy=' . self::TAXONOMY;

    /**
     * Secteurs, par ordre alphabétique (ordre des boutons du filtre).
     *
     * @return list<array{id: int, name: string}>
     */
    public static function all(): array {
        $terms = get_terms(
            [
                'taxonomy'   => self::TAXONOMY,
                'hide_empty' => false,
                'orderby'    => 'name',
                'order'      => 'ASC',
            ]
        );

        if ( ! is_array( $terms ) ) {
            return [];
        }

        return array_values(
            array_map(
                static fn( \WP_Term $term ): array => [
                    'id'   => (int) $term->term_id,
                    'name' => $term->name,
                ],
                $terms
            )
        );
    }

    /** Nom d'un secteur, chaîne vide s'il n'existe plus. */
    public static function name( int $id ): string {
        if ( $id <= 0 ) {
            return '';
        }

        $term = get_term( $id, self::TAXONOMY );

        return $term instanceof \WP_Term ? $term->name : '';
    }
}

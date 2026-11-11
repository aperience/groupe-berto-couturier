<?php
/**
 * URL d'une carte Google Maps intégrable (iframe), à partir d'une adresse.
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Support;

/**
 * Carte « Embed » sans clé d'API : `maps.google.com/maps?q=…&output=embed`.
 * Google géocode l'adresse saisie et centre la carte sur un seul repère.
 * Utilisée par les blocs « Centre et points de ramassage »
 * (`blocks/pickup-map`, `blocks/pickup-point`).
 */
final class GoogleMapsEmbed {

    /** Niveau de zoom : le quartier, rues lisibles. */
    private const ZOOM = 15;

    /** URL de la carte, ou chaîne vide sans adresse. */
    public static function url( string $address ): string {
        $address = trim( $address );

        if ( '' === $address ) {
            return '';
        }

        return 'https://maps.google.com/maps?' . http_build_query(
            [
                'q'      => $address,
                'z'      => self::ZOOM,
                'hl'     => substr( determine_locale(), 0, 2 ),
                'output' => 'embed',
            ],
            '',
            '&',
            PHP_QUERY_RFC3986
        );
    }
}

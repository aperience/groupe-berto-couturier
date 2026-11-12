<?php
/**
 * Sessions de formation : dates (logique sans hook)
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\TrainingSessions;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Dates d'une session du bloc « Sessions de formation » : lecture des attributs
 * (`Y-m-d`, fuseau du site), session passée, période affichée.
 *
 * Période : « 8 déc. 2026 » (un jour), « 20–22 oct. 2026 » (même mois),
 * « 30 oct.–2 nov. 2026 » (même année), « 28 déc. 2026–3 janv. 2027 ».
 */
final class SessionDate {

    /** Date `Y-m-d` valide, à minuit dans le fuseau du site ; `null` sinon. */
    public static function parse( string $value ): ?\DateTimeImmutable {
        $date = \DateTimeImmutable::createFromFormat( '!Y-m-d', $value, wp_timezone() );

        return $date && $date->format( 'Y-m-d' ) === $value ? $date : null;
    }

    /** Fin de la session : date de fin, ou de début si absente ou antérieure. */
    public static function end( \DateTimeImmutable $start, string $end_value ): \DateTimeImmutable {
        $end = self::parse( $end_value );

        return $end && $end > $start ? $end : $start;
    }

    /** Session terminée : son dernier jour est passé (fuseau du site). */
    public static function is_past( \DateTimeImmutable $end ): bool {
        return $end->format( 'Y-m-d' ) < wp_date( 'Y-m-d' );
    }

    /** Session commencée : son premier jour est arrivé (fuseau du site). */
    public static function has_started( \DateTimeImmutable $start ): bool {
        return $start->format( 'Y-m-d' ) <= wp_date( 'Y-m-d' );
    }

    /** Période affichée (texte brut, à échapper). */
    public static function period( \DateTimeImmutable $start, \DateTimeImmutable $end ): string {
        $day   = static fn( \DateTimeImmutable $date ): string => $date->format( 'j' );
        $month = static fn( \DateTimeImmutable $date ): string => self::month( (int) $date->format( 'n' ) );
        $full  = static fn( \DateTimeImmutable $date ): string => sprintf(
            /* translators: date d'une session : 1 : jour, 2 : mois abrégé, 3 : année, ex. « 8 déc. 2026 ». */
            __( '%1$s %2$s %3$s', 'couturier' ),
            $day( $date ),
            $month( $date ),
            $date->format( 'Y' )
        );

        if ( $start->format( 'Y-m-d' ) === $end->format( 'Y-m-d' ) ) {
            return $full( $start );
        }

        if ( $start->format( 'Y-m' ) === $end->format( 'Y-m' ) ) {
            $first = $day( $start );
        } elseif ( $start->format( 'Y' ) === $end->format( 'Y' ) ) {
            /* translators: premier jour d'une période dans la même année : 1 : jour, 2 : mois abrégé, ex. « 30 oct. ». */
            $first = sprintf( __( '%1$s %2$s', 'couturier' ), $day( $start ), $month( $start ) );
        } else {
            $first = $full( $start );
        }

        /* translators: période d'une session : 1 : premier jour, 2 : dernier jour, ex. « 20–22 oct. 2026 ». */
        return sprintf( __( '%1$s–%2$s', 'couturier' ), $first, $full( $end ) );
    }

    /**
     * Mois abrégé, à la française (« janv. », « déc. ») : les abréviations de
     * WordPress (« Déc ») ne suivent pas la maquette.
     */
    private static function month( int $month ): string {
        $months = [
            1  => _x( 'janv.', 'mois abrégé', 'couturier' ),
            2  => _x( 'févr.', 'mois abrégé', 'couturier' ),
            3  => _x( 'mars', 'mois abrégé', 'couturier' ),
            4  => _x( 'avr.', 'mois abrégé', 'couturier' ),
            5  => _x( 'mai', 'mois abrégé', 'couturier' ),
            6  => _x( 'juin', 'mois abrégé', 'couturier' ),
            7  => _x( 'juil.', 'mois abrégé', 'couturier' ),
            8  => _x( 'août', 'mois abrégé', 'couturier' ),
            9  => _x( 'sept.', 'mois abrégé', 'couturier' ),
            10 => _x( 'oct.', 'mois abrégé', 'couturier' ),
            11 => _x( 'nov.', 'mois abrégé', 'couturier' ),
            12 => _x( 'déc.', 'mois abrégé', 'couturier' ),
        ];

        return $months[ $month ] ?? '';
    }
}

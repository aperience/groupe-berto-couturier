<?php
/**
 * Accès à l'API Sarbacane
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Sarbacane;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Journal, requêtes HTTP, liste unique et champs Sarbacane.
 *
 * Reprise à l'identique du script fourni par le client (`sb_log`, `sb_request`,
 * `sb_items`, `sb_list_id`, `sb_fields`, `sb_field_id`), mêmes options et
 * transients. Écarts : les clés viennent de `wp-config.php`
 * (`SARBACANE_ACCOUNT_ID`, `SARBACANE_API_KEY`), le nom de la liste se règle
 * sur la page « Sarbacane » (option `sb_list_name`), et l'ID mémorisé est
 * rattaché à ce nom.
 * Ne pose aucun hook.
 */
final class SarbacaneApi {

    /** Liste cible par défaut (celle du client). */
    public const DEFAULT_LIST = 'BASE-COUTURIER AE-Formulaires site';

    /** Racine de l'API. */
    private const BASE_URL = 'https://sarbacaneapis.com/v1';

    /**
     * Correspondance libellé normalisé → ID de champ, pour la requête en cours.
     *
     * @var array<string, string>|null
     */
    private static ?array $map = null;

    /** Les deux clés sont-elles définies dans wp-config.php ? */
    public static function is_configured(): bool {
        return defined( 'SARBACANE_ACCOUNT_ID' ) && defined( 'SARBACANE_API_KEY' )
            && '' !== (string) SARBACANE_ACCOUNT_ID && '' !== (string) SARBACANE_API_KEY;
    }

    /** Option du nom de la liste, réglée sur la page « Sarbacane ». */
    public const LIST_OPTION = 'sb_list_name';

    /** Nom de la liste cible : celui de la page « Sarbacane », sinon celle du client. */
    public static function list_name(): string {
        $name = trim( (string) get_option( self::LIST_OPTION, '' ) );
        return '' !== $name ? $name : self::DEFAULT_LIST;
    }

    /** Ajoute une ligne au journal (30 dernières gardées) et au log PHP. */
    public static function log( string $msg ): void {
        $log   = (array) get_option( 'sb_last_log', [] );
        $log[] = gmdate( 'Y-m-d H:i:s' ) . ' ' . $msg;
        update_option( 'sb_last_log', array_slice( $log, -30 ), false );
        error_log( '[Sarbacane] ' . $msg ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- journal voulu par le script client.
    }

    /**
     * Appelle l'API ; null en cas d'échec (journalisé).
     *
     * @param string     $method Verbe HTTP.
     * @param string     $path   Chemin après /v1.
     * @param mixed      $body   Corps JSON, ou null.
     * @param bool|null  $ok     Reçoit true si la réponse est < 300.
     * @return mixed Réponse décodée.
     */
    public static function request( string $method, string $path, mixed $body = null, ?bool &$ok = null ): mixed {
        $ok   = false;
        $args = [
            'method'  => $method,
            'timeout' => 60,
            'headers' => [
                'accountId'    => SARBACANE_ACCOUNT_ID,
                'apiKey'       => SARBACANE_API_KEY,
                'Content-Type' => 'application/json',
            ],
        ];
        if ( null !== $body ) {
            $args['body'] = wp_json_encode( $body );
        }
        $res = wp_remote_request( self::BASE_URL . $path, $args );
        if ( is_wp_error( $res ) ) {
            self::log( "$method $path : " . $res->get_error_message() );
            return null;
        }
        $code = (int) wp_remote_retrieve_response_code( $res );
        $raw  = (string) wp_remote_retrieve_body( $res );
        if ( $code >= 300 ) {
            self::log( "$method $path HTTP $code : " . substr( $raw, 0, 400 ) );
            return null;
        }
        $ok = true;
        if ( 'POST' === $method && str_contains( $path, '/upsert' ) ) {
            self::log( "Contact envoye (HTTP $code)" );
        }
        return json_decode( $raw, true );
    }

    /**
     * Extrait le tableau d'éléments d'une réponse, quelle que soit sa clé.
     *
     * @param mixed $res Réponse décodée.
     * @return array<int|string, mixed>
     */
    public static function items( mixed $res ): array {
        if ( ! is_array( $res ) ) {
            return [];
        }
        foreach ( [ 'fields', 'data', 'lists', 'items', 'results' ] as $k ) {
            if ( isset( $res[ $k ] ) && is_array( $res[ $k ] ) ) {
                return $res[ $k ];
            }
        }
        return $res;
    }

    /** ID de la liste unique : trouvée par son nom ou créée. */
    public static function list_id(): ?string {
        $name = self::list_name();
        $id   = get_option( 'sb_main_list_id' );
        if ( $id && get_option( 'sb_main_list_name' ) === $name ) {
            return (string) $id;
        }
        $id = null;
        foreach ( self::items( self::request( 'GET', '/lists?limit=1000' ) ) as $l ) {
            if ( SarbacaneContact::norm( $l['name'] ?? '' ) === SarbacaneContact::norm( $name ) ) {
                $id = $l['id'] ?? null;
                break;
            }
        }
        if ( ! $id ) {
            $res = self::request( 'POST', '/lists', [ 'name' => $name ], $ok );
            $id  = $res['id'] ?? null;
            if ( $id ) {
                self::log( 'Liste creee : ' . $name );
            }
        }
        if ( $id ) {
            update_option( 'sb_main_list_id', $id, false );
            update_option( 'sb_main_list_name', $name, false );
        } else {
            self::log( 'Impossible de trouver ou creer la liste ' . $name );
        }
        return $id ? (string) $id : null;
    }

    /**
     * Champs de la liste : libellé normalisé → ID (cache d'un jour).
     *
     * @param string $list_id ID de la liste.
     * @param bool   $fresh   Ignorer les caches.
     * @return array<string, string>
     */
    public static function fields( string $list_id, bool $fresh = false ): array {
        if ( null !== self::$map && ! $fresh ) {
            return self::$map;
        }
        if ( ! $fresh ) {
            $m = get_transient( 'sb_fields_' . $list_id );
            if ( is_array( $m ) ) {
                return self::$map = $m;
            }
        }
        self::$map = [];
        foreach ( self::items( self::request( 'GET', "/lists/$list_id/fields" ) ) as $f ) {
            $cap = $f['caption'] ?? '';
            if ( ! empty( $f['id'] ) && '' !== $cap ) {
                self::$map[ SarbacaneContact::norm( $cap ) ] = $f['id'];
            }
        }
        set_transient( 'sb_fields_' . $list_id, self::$map, DAY_IN_SECONDS );
        return self::$map;
    }

    /** ID d'un champ par son libellé, créé s'il n'existe pas. */
    public static function field_id( string $list_id, string $caption, string $kind = 'STRING' ): ?string {
        $k   = SarbacaneContact::norm( $caption );
        $map = self::fields( $list_id );
        if ( isset( $map[ $k ] ) ) {
            return $map[ $k ];
        }
        $map = self::fields( $list_id, true );
        if ( isset( $map[ $k ] ) ) {
            return $map[ $k ];
        }
        $res = self::request( 'POST', "/lists/$list_id/fields", [ 'kind' => $kind, 'caption' => $caption ], $ok );
        if ( $ok ) {
            self::log( "Champ cree : $caption" );
        }
        $map = self::fields( $list_id, true );
        return $map[ $k ] ?? ( $res['id'] ?? null );
    }
}

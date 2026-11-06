<?php
/**
 * Restriction des niveaux de titre dans l'éditeur
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Blocks;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\ThemeContext;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Limite les niveaux de titre proposés dans l'éditeur (H2 et H3 par défaut), pour
 * `core/heading` comme pour tout bloc qui expose un choix de niveau.
 *
 * **Le mécanisme est celui du core.** Tout bloc à niveau (`core/heading`,
 * `core/post-title`, `core/query-title`…) déclare un attribut `levelOptions` ; sa
 * valeur **par défaut**, lue à l'enregistrement du bloc, fixe les niveaux offerts.
 * Pour `core/heading`, dont le niveau se choisit depuis WordPress 7 par ses variations
 * H1…H6, le core désenregistre même les variations absentes de cette liste : elles
 * disparaissent de la barre latérale, de l'inserteur et de la commande `/`. Il suffit
 * donc de réécrire ce défaut côté serveur, sur `register_block_type_args` : la
 * définition est transmise à l'éditeur avec celle du bloc.
 *
 * Un bloc qui propose aussi le niveau 0 (un `<p>` plutôt qu'un titre, ex.
 * `core/site-tagline`, `core/term-name`) le conserve.
 *
 * **Garde-fou dans l'éditeur.** Le raccourci Markdown (`#### `), le collage de HTML,
 * l'éditeur de code ou une transformation créent un titre sans passer par les
 * variations. `resources/js/editor/restrict-heading-levels.js` surveille donc les blocs
 * et ramène tout niveau hors de `levelOptions` au plus proche autorisé. Il est lu sur
 * disque et injecté en inline, sans build.
 *
 * Un titre d'un autre niveau déjà présent dans un contenu est corrigé à la prochaine
 * ouverture de ce contenu dans l'éditeur, et enregistré avec lui ; le front, lui, rend
 * le contenu tel qu'il est en base.
 *
 * **Exception : les blocs de `exempt_parents`** (le héros de l'accueil, seul à porter le
 * `<h1>` de la page). Le garde-fou ignore les titres qui sont leurs enfants directs : le
 * bloc parent fixe lui-même leur niveau (cf. `useLockedContent()`,
 * `blocks/_shared/locked-content.js`). Les variations H1 restant désenregistrées, un
 * rédacteur ne peut toujours pas créer de H1 ailleurs.
 */
final class RestrictHeadingLevels implements FeatureInterface {

    /** Niveaux autorisés par défaut. */
    private const DEFAULT_LEVELS = [ 2, 3 ];

    /** Garde-fou de l'éditeur, relatif à la racine du thème. */
    private const SCRIPT = 'resources/js/editor/restrict-heading-levels.js';

    /**
     * @param ThemeContext $context Identité du thème, pour le handle du script.
     * @param int[]        $levels         Niveaux de titre proposés dans l'éditeur.
     * @param string[]     $exempt_parents Blocs dont les titres enfants directs échappent au garde-fou.
     */
    public function __construct(
        private readonly ThemeContext $context,
        private readonly array $levels = self::DEFAULT_LEVELS,
        private readonly array $exempt_parents = [],
    ) {}

    /** Enregistre la restriction des blocs et le garde-fou de l'éditeur. */
    public function register(): void {
        add_filter( 'register_block_type_args', [ $this, 'restrict_levels' ], 10, 2 );
        add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue_guard' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        $levels = implode( ', ', array_map( static fn( int $level ): string => 'H' . $level, $this->levels ) );

        return sprintf(
            /* translators: %s : niveaux autorisés, ex. « H2, H3 ». */
            __( 'Limite les niveaux de titre proposés dans l\'éditeur à %s.', 'couturier' ),
            $levels
        );
    }

    /**
     * Injecte le garde-fou dans l'éditeur, sur un handle sans source, précédé de sa
     * configuration (`window.couturierHeadingGuard`).
     */
    public function enqueue_guard(): void {
        $path = get_theme_file_path( self::SCRIPT );

        if ( ! is_readable( $path ) ) {
            return;
        }

        $handle = $this->context->handle( 'restrict-heading-levels' );

        wp_register_script( $handle, false, [ 'wp-data', 'wp-blocks', 'wp-block-editor' ], null, true );
        wp_enqueue_script( $handle );
        wp_add_inline_script(
            $handle,
            'window.couturierHeadingGuard = ' . wp_json_encode( [ 'exemptParents' => array_values( $this->exempt_parents ) ] ) . ';'
        );
        wp_add_inline_script( $handle, (string) file_get_contents( $path ) );
    }

    /**
     * Réécrit le défaut de `levelOptions` des blocs qui en déclarent un.
     *
     * @param array  $args       Arguments du type de bloc.
     * @param string $block_type Nom du bloc.
     * @return array
     */
    public function restrict_levels( array $args, string $block_type ): array {
        if ( ! isset( $args['attributes']['levelOptions'] ) ) {
            return $args;
        }

        // Le niveau 0 (un `<p>`) se conserve s'il figurait dans la liste d'origine, ou
        // s'il est le niveau par défaut du bloc (`core/term-name`, sans liste déclarée).
        $current        = $args['attributes']['levelOptions']['default'] ?? [];
        $paragraph_ok   = in_array( 0, $current, true ) || 0 === ( $args['attributes']['level']['default'] ?? null );
        $levels         = $paragraph_ok ? [ 0, ...$this->levels ] : $this->levels;

        $args['attributes']['levelOptions']['default'] = $levels;

        return $args;
    }
}

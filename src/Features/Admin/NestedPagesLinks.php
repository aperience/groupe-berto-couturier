<?php
/**
 * Liens de l'admin vers la liste des pages de Nested Pages
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Admin;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\ThemeContext;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Fait pointer vers la vue arborescente de Nested Pages (`admin.php?page=nestedpages`)
 * les liens de l'admin qui mènent à la liste native des pages (`edit.php?post_type=page`) :
 *
 * - le lien « X pages publiées » du module « D'un coup d'œil » du tableau de bord ;
 * - le chevron de retour, en haut à gauche de l'éditeur de blocs, sur une page.
 *   Les articles et les autres types de contenu gardent leur lien natif.
 *
 * **Nested Pages est détecté par son écran, pas par le plugin.** `menu_page_url()`
 * ne renvoie une URL que si la page `nestedpages` est enregistrée : plugin actif,
 * vue activée pour les pages dans ses réglages, et droits suffisants de
 * l'utilisateur. Dans tous les autres cas, les liens natifs sont conservés.
 *
 * **Tableau de bord : pas de filtre dans le core.** `wp_dashboard_right_now()`
 * construit l'URL en dur et l'imprime aussitôt : le rappel du module est donc
 * enveloppé, sa sortie mise en tampon, et l'URL native remplacée — elle seule.
 *
 * **Éditeur : le bouton de retour est remplacé par l'API de l'éditeur.** Nested Pages
 * tente de réécrire l'attribut `href` en jQuery, sur un sélecteur
 * (`.edit-post-header`) qui n'existe plus. `resources/js/editor/nested-pages-back-link.js`
 * remplit l'emplacement `MainDashboardButton` avec le bouton du core
 * (`FullscreenModeClose`), auquel il passe l'URL de Nested Pages : même rendu, même
 * libellé. Il est lu sur disque et injecté en inline, sans build.
 */
final class NestedPagesLinks implements FeatureInterface {

    /** Identifiant du module « D'un coup d'œil ». */
    private const WIDGET_ID = 'dashboard_right_now';

    /** Slug de l'écran des pages de Nested Pages. */
    private const MENU_SLUG = 'nestedpages';

    /** Bouton de retour de l'éditeur, relatif à la racine du thème. */
    private const SCRIPT = 'resources/js/editor/nested-pages-back-link.js';

    /** Variable globale qui transmet l'URL au script de l'éditeur. */
    private const SCRIPT_DATA = 'couturierNestedPagesBackLink';

    /**
     * @param ThemeContext $context Identité du thème, pour le handle du script.
     */
    public function __construct(
        private readonly ThemeContext $context,
    ) {}

    /** Enregistre l'enveloppe du module et le script de l'éditeur. */
    public function register(): void {
        add_action( 'wp_dashboard_setup', [ $this, 'wrap_widget' ], PHP_INT_MAX );
        add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue_back_link' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Fait pointer vers la vue arborescente de Nested Pages les liens de l\'admin qui mènent à la liste des pages (tableau de bord, retour de l\'éditeur).', 'couturier' );
    }

    /**
     * Remplace le rappel du module par une enveloppe qui réécrit le lien des pages.
     */
    public function wrap_widget(): void {
        global $wp_meta_boxes;

        foreach ( $wp_meta_boxes['dashboard'] ?? [] as $context => $priorities ) {
            foreach ( $priorities as $priority => $boxes ) {
                $box = $boxes[ self::WIDGET_ID ] ?? null;

                if ( ! is_array( $box ) || ! is_callable( $box['callback'] ?? null ) ) {
                    continue;
                }

                $callback = $box['callback'];

                $wp_meta_boxes['dashboard'][ $context ][ $priority ][ self::WIDGET_ID ]['callback'] =
                    fn( mixed ...$args ) => $this->render_widget( $callback, $args );
            }
        }
    }

    /**
     * Injecte le bouton de retour vers Nested Pages dans l'éditeur d'une page.
     */
    public function enqueue_back_link(): void {
        $screen = get_current_screen();

        if ( ! $screen || 'post' !== $screen->base || 'page' !== $screen->post_type ) {
            return;
        }

        $nested_url = $this->nested_pages_url();
        $path       = get_theme_file_path( self::SCRIPT );

        if ( '' === $nested_url || ! is_readable( $path ) ) {
            return;
        }

        $handle = $this->context->handle( 'nested-pages-back-link' );

        wp_register_script( $handle, false, [ 'wp-plugins', 'wp-edit-post', 'wp-element' ], null, true );
        wp_enqueue_script( $handle );
        wp_add_inline_script(
            $handle,
            'window.' . self::SCRIPT_DATA . ' = ' . wp_json_encode( [ 'href' => $nested_url ] ) . ';',
            'before'
        );
        wp_add_inline_script( $handle, (string) file_get_contents( $path ) );
    }

    /**
     * Rend le module d'origine en y substituant l'URL de Nested Pages.
     *
     * @param callable $callback Rappel d'origine du module.
     * @param array    $args     Arguments transmis par `do_meta_boxes()`.
     */
    private function render_widget( callable $callback, array $args ): void {
        $nested_url = $this->nested_pages_url();

        if ( '' === $nested_url ) {
            $callback( ...$args );
            return;
        }

        // Même construction que wp_dashboard_right_now(), pour retrouver la chaîne imprimée.
        $native_url = add_query_arg(
            [
                'post_status' => 'publish',
                'post_type'   => 'page',
            ],
            admin_url( 'edit.php' )
        );

        ob_start();
        $callback( ...$args );
        $html = (string) ob_get_clean();

        echo str_replace(
            'href="' . esc_url( $native_url ) . '"',
            'href="' . esc_url( $nested_url ) . '"',
            $html
        ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- HTML du core, seule l'URL est substituée (échappée).
    }

    /** URL de la liste des pages de Nested Pages, ou chaîne vide si elle n'est pas disponible. */
    private function nested_pages_url(): string {
        return menu_page_url( self::MENU_SLUG, false );
    }
}

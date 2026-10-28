<?php
/**
 * Page d'aide de l'admin
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Admin;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\ThemeContext;
use Timber\Timber;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Ajoute au menu de l'admin une page « Aide », réservée aux éditeurs et aux
 * administrateurs, qui explique les fonctionnalités propres au thème : un onglet
 * par fonctionnalité.
 *
 * **Ce sont les features qui déclarent leurs onglets**, sur le filtre `TABS_FILTER` :
 * l'écran n'en connaît aucun. Retirer un provider retire donc aussi l'aide de ses
 * features. Sans onglet, le menu n'est pas ajouté.
 *
 * ```php
 * add_filter( HelpScreen::TABS_FILTER, static fn( array $tabs ): array => $tabs + [
 *     'current-offer' => [
 *         'label'    => __( 'Offre du moment', 'couturier' ),
 *         'priority' => 10,                          // facultatif, croissant
 *         'context'  => [ 'url' => admin_url() ],    // facultatif, données du gabarit
 *     ],
 * ] );
 * ```
 *
 * **Ordre des onglets** : `priority` croissante (`DEFAULT_PRIORITY` si absente), puis
 * ordre de déclaration à égalité. Laisser des écarts (10, 20, 30…) pour pouvoir
 * intercaler un onglet sans renuméroter les autres.
 *
 * **Contenu** : `resources/views/admin/help/{slug}.twig`, rendu par Timber avec le
 * `context` de l'onglet. Un texte long se rédige mieux en Twig qu'en chaînes PHP.
 *
 * **Des liens, pas des onglets JavaScript.** La barre d'onglets est celle de
 * WordPress (`nav-tab-wrapper`) : chaque onglet est un lien vers `&tab={slug}`,
 * l'actif porte `aria-current="page"`. Aucun script, une URL par onglet, et une
 * navigation clavier native.
 */
final class HelpScreen implements FeatureInterface {

    /** Filtre sur lequel les features déclarent leurs onglets. */
    public const TABS_FILTER = 'couturier_help_tabs';

    /** Priorité d'un onglet qui n'en déclare pas. */
    public const DEFAULT_PRIORITY = 10;

    /** Capability requise pour consulter l'aide (éditeurs et administrateurs). */
    public const CAPABILITY = 'edit_others_pages';

    /** Slug de l'écran, préfixé par le slug du thème. */
    public const MENU_SLUG = 'help';

    /** Position dans le menu : tout en bas, après Réglages (80). */
    private const MENU_POSITION = 99;

    /** Dossier des gabarits des onglets, relatif à `resources/views/`. */
    private const VIEWS = 'admin/help/';

    /**
     * @param ThemeContext $context Identité du thème, pour le slug de l'écran.
     */
    public function __construct(
        private readonly ThemeContext $context,
    ) {}

    /** Enregistre l'écran. */
    public function register(): void {
        add_action( 'admin_menu', [ $this, 'add_page' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Écran « Aide » : explique aux éditeurs les fonctionnalités du thème, un onglet par fonctionnalité.', 'couturier' );
    }

    /** Ajoute l'écran au menu principal, tout en bas, s'il a au moins un onglet. */
    public function add_page(): void {
        if ( [] === $this->tabs() ) {
            return;
        }

        add_menu_page(
            __( 'Aide', 'couturier' ),
            __( 'Aide', 'couturier' ),
            self::CAPABILITY,
            $this->context->handle( self::MENU_SLUG ),
            [ $this, 'render' ],
            'dashicons-editor-help',
            self::MENU_POSITION
        );
    }

    /** Affiche l'écran : barre d'onglets, puis le contenu de l'onglet courant. */
    public function render(): void {
        if ( ! current_user_can( self::CAPABILITY ) ) {
            return;
        }

        $tabs    = $this->tabs();
        $current = sanitize_key( (string) ( $_GET['tab'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- simple navigation.
        $current = isset( $tabs[ $current ] ) ? $current : (string) array_key_first( $tabs );
        $url     = admin_url( 'admin.php?page=' . $this->context->handle( self::MENU_SLUG ) );

        echo '<div class="wrap">';
        echo '<h1>' . esc_html( get_admin_page_title() ) . '</h1>';

        printf( '<nav class="nav-tab-wrapper" aria-label="%s">', esc_attr__( 'Rubriques de l\'aide', 'couturier' ) );
        foreach ( $tabs as $slug => $tab ) {
            printf(
                '<a class="nav-tab%1$s" href="%2$s"%3$s>%4$s</a>',
                $slug === $current ? ' nav-tab-active' : '',
                esc_url( add_query_arg( 'tab', $slug, $url ) ),
                $slug === $current ? ' aria-current="page"' : '',
                esc_html( $tab['label'] )
            );
        }
        echo '</nav>';

        // Largeur de lecture limitée à ~150 caractères par ligne : un texte long reste lisible sur un grand écran.
        echo '<div style="max-width: 150ch;">';
        echo Timber::compile( self::VIEWS . $current . '.twig', $tabs[ $current ]['context'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- gabarit Twig, échappement automatique.
        echo '</div></div>';
    }

    /**
     * Onglets déclarés par les features, normalisés et triés par priorité.
     *
     * Une entrée dont le slug n'est pas une clé valide (il sert de nom de gabarit) ou
     * sans libellé est ignorée.
     *
     * @return array<string, array{label: string, priority: int, context: array<string, mixed>}>
     */
    private function tabs(): array {
        $tabs = [];

        foreach ( (array) apply_filters( self::TABS_FILTER, [] ) as $slug => $tab ) {
            if ( ! is_string( $slug ) || sanitize_key( $slug ) !== $slug || '' === (string) ( $tab['label'] ?? '' ) ) {
                continue;
            }

            $tabs[ $slug ] = [
                'label'    => (string) $tab['label'],
                'priority' => (int) ( $tab['priority'] ?? self::DEFAULT_PRIORITY ),
                'context'  => (array) ( $tab['context'] ?? [] ),
            ];
        }

        // Tri stable (PHP ≥ 8.0) : à priorité égale, l'ordre de déclaration est conservé.
        uasort( $tabs, static fn( array $a, array $b ): int => $a['priority'] <=> $b['priority'] );

        return $tabs;
    }
}

<?php
/**
 * Écran d'admin du pied de page
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Footer;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\ThemeContext;
use Theme\Features\Admin\HelpScreen;
use Theme\Support\PageCache;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Ajoute au menu « Apparence » un écran « Pied de page » : certifications (logo de la
 * médiathèque, lien facultatif), réseaux sociaux (adresse), tous deux dans l'ordre
 * d'affichage et avec un interrupteur « Activer », et texte du copyright.
 *
 * **Settings API, ouverte aux éditeurs**, comme l'écran « Offre du moment » : le
 * filtre `option_page_capability_{groupe}` abaisse l'exigence de `options.php` à
 * `CAPABILITY` pour ce seul groupe de réglages.
 *
 * **Deux tableaux réordonnables, une ligne par élément**, pour tenir peu de place
 * (classes `couturier-sortable__*`, communes aux deux). Une poignée « ≡ » par ligne :
 * glisser-déposer (jQuery UI Sortable, comme Nested Pages), flèches ↑ ↓ au clavier,
 * ou clic pour un menu de déplacement ; « Supprimer » en plus pour les certifications.
 * Chaque déplacement est annoncé par une région `role="status"`.
 * Les réseaux sont une liste fixe (`Footer::NETWORKS`, une icône chacun) : ni ajout
 * ni retrait, un réseau inutile se désactive ou reste sans adresse.
 *
 * **Lignes sans index.** Les champs sont postés en tableaux parallèles
 * (`image_id[]`, `url[]`, `enabled[]` ; `network[]`, `url[]`, `enabled[]`) : leur ordre
 * est celui du DOM, que le script de l'écran (`resources/js/editor/footer-settings.js`)
 * réordonne sans avoir à renuméroter les noms. L'interrupteur « Activer » est une case
 * sans nom, recopiée par le script dans un champ caché `enabled[]` (1 ou 0) : une case
 * décochée n'est pas postée, et décalerait les tableaux.
 */
final class FooterSettings implements FeatureInterface {

    /** Capability requise (éditeurs et administrateurs). */
    public const CAPABILITY = 'edit_others_pages';

    /** Groupe de réglages, transmis par le formulaire à `options.php`. */
    private const GROUP = 'couturier_footer';

    /** Script de l'écran, relatif à la racine du thème. */
    private const SCRIPT = 'resources/js/editor/footer-settings.js';

    /** Jeton remplacé par une clé unique dans le gabarit d'une nouvelle ligne. */
    private const ROW_KEY = '__KEY__';

    /** Suffixe de hook de l'écran, pour n'y charger le script qu'à lui. */
    private string $hook_suffix = '';

    /**
     * Réglages déjà nettoyés pendant la requête : à la première sauvegarde,
     * WordPress appelle le nettoyage deux fois (`update_option()` puis
     * `add_option()`), et chaque erreur s'afficherait en double.
     */
    private ?array $sanitized = null;

    /**
     * @param ThemeContext $context Identité du thème, pour le slug et les handles.
     */
    public function __construct(
        private readonly ThemeContext $context,
    ) {}

    /** Enregistre l'écran, le réglage, le script et la purge du cache de page. */
    public function register(): void {
        add_action( 'admin_menu', [ $this, 'add_page' ] );
        add_action( 'admin_init', [ $this, 'register_setting' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue' ] );

        // Le pied de page est sur toutes les pages : son enregistrement vide le cache de page.
        add_action( 'add_option_' . Footer::OPTION, [ PageCache::class, 'purge' ], 10, 0 );
        add_action( 'update_option_' . Footer::OPTION, [ PageCache::class, 'purge' ], 10, 0 );
        add_filter( 'option_page_capability_' . self::GROUP, static fn(): string => self::CAPABILITY );

        add_filter( HelpScreen::TABS_FILTER, [ $this, 'help_tab' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Écran « Pied de page » : logos des certifications et leurs liens, réseaux sociaux, texte du copyright.', 'couturier' );
    }

    /**
     * Ajoute l'écran au menu « Apparence ».
     *
     * Un éditeur n'a pas `edit_theme_options`, requis par « Apparence » : WordPress
     * affiche alors le menu pour lui avec ce seul sous-menu, et le fait pointer
     * dessus (cf. `wp-admin/includes/menu.php`).
     */
    public function add_page(): void {
        $this->hook_suffix = (string) add_theme_page(
            __( 'Pied de page', 'couturier' ),
            __( 'Pied de page', 'couturier' ),
            self::CAPABILITY,
            $this->context->handle( Footer::MENU_SLUG ),
            [ $this, 'render' ]
        );
    }

    /**
     * Déclare l'onglet « Pied de page » de la page d'aide
     * (gabarit `resources/views/admin/help/footer.twig`).
     *
     * Le lien vers Apparence › Menus n'est donné qu'à qui peut modifier les menus
     * (`edit_theme_options`) : un éditeur ne le peut pas.
     *
     * @param array<string, array<string, mixed>> $tabs Onglets déjà déclarés.
     * @return array<string, array<string, mixed>>
     */
    public function help_tab( array $tabs ): array {
        $tabs['footer'] = [
            'label'    => __( 'Pied de page', 'couturier' ),
            'priority' => 20,
            'context'  => [
                'footer_url' => admin_url( 'themes.php?page=' . $this->context->handle( Footer::MENU_SLUG ) ),
                'media_url'  => admin_url( 'upload.php' ),
                'menus_url'  => current_user_can( 'edit_theme_options' ) ? admin_url( 'nav-menus.php' ) : '',
                'networks'   => array_values( Footer::NETWORKS ),
            ],
        ];

        return $tabs;
    }

    /** Déclare l'option, autoloadée, et son nettoyage. */
    public function register_setting(): void {
        register_setting(
            self::GROUP,
            Footer::OPTION,
            [
                'type'              => 'object',
                'sanitize_callback' => [ $this, 'sanitize' ],
                'show_in_rest'      => false,
                'autoload'          => true,
            ]
        );
    }

    /**
     * Charge la modale de la médiathèque et le script de l'écran, sur cet écran seulement.
     *
     * Le script est injecté en ligne, sur un handle sans source, comme ceux de
     * l'éditeur : rien à builder, rien à servir depuis `dist/`.
     */
    public function enqueue( string $hook_suffix ): void {
        if ( '' === $this->hook_suffix || $hook_suffix !== $this->hook_suffix ) {
            return;
        }

        $path = get_theme_file_path( self::SCRIPT );

        if ( ! is_readable( $path ) ) {
            return;
        }

        wp_enqueue_media();

        $handle = $this->context->handle( 'footer-settings' );
        $l10n   = [
            'rowKey'       => self::ROW_KEY,
            'mediaTitle'   => __( 'Logo de la certification', 'couturier' ),
            'mediaButton'  => __( 'Utiliser cette image', 'couturier' ),
            'changeImage'  => __( 'Changer', 'couturier' ),
            'yes'          => __( 'Oui', 'couturier' ),
            'no'           => __( 'Non', 'couturier' ),
            'added'        => __( 'Certification ajoutée. Choisissez son image.', 'couturier' ),
            'imageChosen'  => __( 'Image choisie.', 'couturier' ),
        ];

        wp_register_script( $handle, false, [ 'media-editor', 'jquery-ui-sortable' ], null, true );
        wp_enqueue_script( $handle );
        wp_add_inline_script( $handle, 'window.couturierFooterSettings = ' . wp_json_encode( $l10n ) . ';', 'before' );
        wp_add_inline_script( $handle, (string) file_get_contents( $path ) );

        // Mise en forme des tableaux, propre à cet écran. Interrupteur « Activer » :
        // la case à cocher native, redessinée en glissière (même clavier, même
        // lecteur d'écran). Contrastes sur blanc (WCAG 1.4.11) : contour et pastille
        // grise `#8c8f94` 3,3:1, piste pétrole `#004e63` 9,25:1.
        wp_add_inline_style( 'common', '
            .couturier-sortable { max-width: 60rem; }
            .widefat.couturier-sortable tbody th, .widefat.couturier-sortable tbody td { vertical-align: middle; }
            .couturier-sortable .column-logo { width: 14rem; }
            .couturier-sortable .column-network { width: 10rem; }
            .couturier-sortable .column-enabled { width: 6rem; }
            .couturier-sortable .column-number { position: relative; width: 4rem; white-space: nowrap; }
            .couturier-sortable .column-actions { width: 5.5rem; text-align: right; }
            .couturier-sortable__number { display: inline-block; min-width: 1.25rem; }
            .couturier-sortable__placeholder td { height: 3rem; background: #f0f4f6; outline: 2px dashed #8c8f94; outline-offset: -2px; }
            .couturier-sortable__row.ui-sortable-helper { display: table; background: #fff; box-shadow: 0 6px 20px rgba(0, 0, 0, .15); }
            .couturier-sortable__handle { display: inline-flex; align-items: center; justify-content: center; width: 1.5rem; height: 1.5rem; margin-left: .25rem; padding: 0; color: #8c8f94; vertical-align: middle; background: none; border: 0; border-radius: 3px; cursor: grab; }
            .couturier-sortable__handle:hover, .couturier-sortable__handle[aria-expanded="true"] { color: #1d2327; }
            .couturier-sortable__handle:focus-visible { color: #1d2327; outline: 2px solid #004e63; outline-offset: 1px; }
            .couturier-sortable__handle:active { cursor: grabbing; }
            .couturier-sortable__menu { position: absolute; z-index: 10; top: calc(100% - .25rem); left: .5rem; min-width: 11rem; padding: .25rem 0; text-align: left; background: #fff; border: 1px solid #c3c4c7; border-radius: 4px; box-shadow: 0 4px 12px rgba(0, 0, 0, .15); }
            .couturier-sortable__menu[hidden] { display: none; }
            .couturier-sortable__menu button { display: block; width: 100%; padding: .4rem .75rem; text-align: left; background: none; border: 0; cursor: pointer; }
            .couturier-sortable__menu button:hover:not(:disabled), .couturier-sortable__menu button:focus { background: #f0f4f6; outline: none; }
            .couturier-sortable__menu button:disabled { color: #a7aaad; cursor: default; }
            .couturier-sortable .column-enabled label { display: inline-flex; align-items: center; gap: .5rem; min-height: 1.5rem; cursor: pointer; }
            .couturier-sortable input[type="checkbox"].couturier-sortable__toggle { appearance: none; position: relative; flex: none; width: 2.5rem; height: 1.375rem; margin: 0; border: 1px solid #8c8f94; border-radius: 999px; background: #fff; box-shadow: none; cursor: pointer; transition: background-color .15s, border-color .15s; }
            .couturier-sortable input[type="checkbox"].couturier-sortable__toggle::before { content: none; }
            .couturier-sortable input[type="checkbox"].couturier-sortable__toggle::after { content: ""; position: absolute; top: 2px; left: 2px; width: 1rem; height: 1rem; border-radius: 50%; background: #8c8f94; transition: transform .15s, background-color .15s; }
            .couturier-sortable input[type="checkbox"].couturier-sortable__toggle:checked { background: #004e63; border-color: #004e63; }
            .couturier-sortable input[type="checkbox"].couturier-sortable__toggle:checked::after { background: #fff; transform: translateX(1.125rem); }
            .couturier-sortable input[type="checkbox"].couturier-sortable__toggle:focus-visible { outline: 2px solid #004e63; outline-offset: 2px; }
            @media (prefers-reduced-motion: reduce) { .couturier-sortable input[type="checkbox"].couturier-sortable__toggle, .couturier-sortable input[type="checkbox"].couturier-sortable__toggle::after { transition: none; } }
            .couturier-certification__logo { display: flex; align-items: center; gap: .75rem; }
            .couturier-certification__preview { display: flex; align-items: center; justify-content: center; width: 6rem; height: 2.5rem; }
            .couturier-certification__preview img { max-width: 100%; max-height: 100%; width: auto; height: auto; }
            .couturier-certification__alt-warning { margin: .25rem 0 0; }
            .couturier-network { display: inline-flex; align-items: center; gap: .5rem; }
            .couturier-network svg { width: 1.25rem; height: 1.25rem; color: #1d2327; }
        ' );
    }

    /**
     * Nettoie la saisie : certifications avec image, adresses web valides.
     *
     * Une adresse invalide est retirée, signalée par une erreur qui nomme la
     * certification ou le réseau en cause (WCAG 3.3.1).
     *
     * @param mixed $input Valeurs postées.
     * @return array{certifications: list<array{image_id: int, url: string, enabled: bool}>, social: list<array{network: string, url: string, enabled: bool}>, copyright: string}
     */
    public function sanitize( mixed $input ): array {
        if ( null !== $this->sanitized ) {
            return $this->sanitized;
        }

        $input = is_array( $input ) ? $input : [];

        // Certifications : tableaux parallèles, dans l'ordre du formulaire.
        $posted    = is_array( $input['certifications'] ?? null ) ? $input['certifications'] : [];
        $image_ids = array_values( (array) ( $posted['image_id'] ?? [] ) );
        $urls      = array_values( (array) ( $posted['url'] ?? [] ) );
        $enabled   = array_values( (array) ( $posted['enabled'] ?? [] ) );

        $certifications = [];

        foreach ( $image_ids as $index => $image_id ) {
            $image_id = absint( $image_id );
            $raw_url  = trim( (string) ( $urls[ $index ] ?? '' ) );

            if ( ! Footer::is_valid_image( $image_id ) ) {
                if ( '' !== $raw_url ) {
                    add_settings_error(
                        Footer::OPTION,
                        'certification-' . $index,
                        /* translators: %d : numéro de la certification dans la liste. */
                        sprintf( __( 'Certification %d : aucune image choisie, elle a été ignorée.', 'couturier' ), $index + 1 ),
                        'warning'
                    );
                }

                continue;
            }

            $url = $this->sanitize_url( $raw_url );

            if ( '' !== $raw_url && '' === $url ) {
                add_settings_error(
                    Footer::OPTION,
                    'certification-' . $index,
                    /* translators: %d : numéro de la certification dans la liste. */
                    sprintf( __( 'Certification %d : le lien n\'est pas une adresse web valide (https://…), il a été retiré.', 'couturier' ), $index + 1 )
                );
            }

            $certifications[] = [
                'image_id' => $image_id,
                'url'      => $url,
                'enabled'  => '0' !== (string) ( $enabled[ $index ] ?? '1' ),
            ];
        }

        // Réseaux sociaux : tableaux parallèles, dans l'ordre du formulaire.
        $posted_social = is_array( $input['social'] ?? null ) ? $input['social'] : [];
        $networks      = array_values( (array) ( $posted_social['network'] ?? [] ) );
        $social_urls   = array_values( (array) ( $posted_social['url'] ?? [] ) );
        $social_on     = array_values( (array) ( $posted_social['enabled'] ?? [] ) );
        $social        = [];

        foreach ( $networks as $index => $network ) {
            $network = sanitize_key( (string) $network );

            if ( ! isset( Footer::NETWORKS[ $network ] ) || in_array( $network, array_column( $social, 'network' ), true ) ) {
                continue;
            }

            $raw_url = trim( (string) ( $social_urls[ $index ] ?? '' ) );
            $url     = $this->sanitize_url( $raw_url );

            if ( '' !== $raw_url && '' === $url ) {
                add_settings_error(
                    Footer::OPTION,
                    'social-' . $network,
                    /* translators: %s : nom du réseau social. */
                    sprintf( __( '%s : l\'adresse n\'est pas une adresse web valide (https://…), elle a été retirée.', 'couturier' ), Footer::NETWORKS[ $network ] )
                );
            }

            $social[] = [
                'network' => $network,
                'url'     => $url,
                'enabled' => '0' !== (string) ( $social_on[ $index ] ?? '1' ),
            ];
        }

        return $this->sanitized = [
            'certifications' => $certifications,
            'social'         => $social,
            'copyright'      => sanitize_text_field( (string) ( $input['copyright'] ?? '' ) ),
        ];
    }

    /** Affiche l'écran : certifications, réseaux sociaux, copyright. */
    public function render(): void {
        if ( ! current_user_can( self::CAPABILITY ) ) {
            return;
        }

        $settings = Footer::settings();
        $errors   = array_column( get_settings_errors( Footer::OPTION ), 'code' );
        $name     = static fn( string $field ): string => Footer::OPTION . '[' . $field . ']';

        echo '<div class="wrap">';
        echo '<h1>' . esc_html( get_admin_page_title() ) . '</h1>';

        // Notice verte après l'enregistrement. WordPress ne l'ajoute que sur les écrans
        // du menu Réglages (`options-head.php`) : celui-ci est sous Apparence. Les
        // avertissements éventuels (adresse retirée…) s'affichent en plus : la saisie
        // a bien été enregistrée, corrigée.
        if ( isset( $_GET['settings-updated'] ) && 'true' === $_GET['settings-updated'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- simple affichage, posé par options.php.
            add_settings_error( Footer::OPTION, 'settings_updated', __( 'Réglages enregistrés.', 'couturier' ), 'success' );
        }

        settings_errors( Footer::OPTION );

        echo '<form method="post" action="options.php" novalidate="novalidate">';
        settings_fields( self::GROUP );

        // Certifications.
        echo '<h2>' . esc_html__( 'Logos de réassurance et certifications', 'couturier' ) . '</h2>';
        echo '<p id="couturier-certifications-description">' . esc_html__( 'Logos affichés en tête du pied de page, dans cet ordre. Le texte alternatif de chaque image, saisi dans la médiathèque, sert d\'intitulé au logo : par exemple « Qualiopi, processus certifié ».', 'couturier' ) . '</p>';

        $this->open_table(
            'couturier-certifications',
            'couturier-certifications-description',
            [ 'column-logo' => __( 'Logo', 'couturier' ), '' => __( 'Lien (facultatif)', 'couturier' ) ],
            /* translators: %d : nouvelle position de la certification. */
            __( 'Certification déplacée en position %d.', 'couturier' ),
            __( 'Certification supprimée.', 'couturier' )
        );

        foreach ( Footer::certifications() as $index => $certification ) {
            $this->render_certification( (string) $index, $index + 1, $certification['image_id'], $certification['url'], $certification['enabled'] );
        }

        echo '</tbody></table>';

        // Gabarit d'une ligne vierge, cloné par le script.
        echo '<template id="couturier-certification-template">';
        $this->render_certification( self::ROW_KEY, 0, 0, '', true );
        echo '</template>';

        printf(
            '<p><button type="button" class="button" id="couturier-certification-add">%s</button></p>',
            esc_html__( 'Ajouter une certification', 'couturier' )
        );

        // Réseaux sociaux.
        echo '<h2>' . esc_html__( 'Réseaux sociaux', 'couturier' ) . '</h2>';
        echo '<p id="couturier-social-description">' . esc_html__( 'Pastilles affichées en bas du pied de page, dans cet ordre. Adresse complète de chaque page (https://…) : un réseau sans adresse, ou désactivé, n\'est pas affiché.', 'couturier' ) . '</p>';

        $this->open_table(
            'couturier-social',
            'couturier-social-description',
            [ 'column-network' => __( 'Réseau', 'couturier' ), '' => __( 'Adresse', 'couturier' ) ],
            /* translators: %d : nouvelle position du réseau social. */
            __( 'Réseau déplacé en position %d.', 'couturier' ),
            ''
        );

        foreach ( Footer::networks() as $index => $network ) {
            $this->render_network( $index + 1, $network, in_array( 'social-' . $network['network'], $errors, true ) );
        }

        echo '</tbody></table>';

        // Annonces des déplacements, retraits et ajouts, communes aux deux tableaux.
        echo '<p class="screen-reader-text" role="status" id="couturier-footer-status"></p>';

        // Copyright.
        echo '<h2>' . esc_html__( 'Copyright', 'couturier' ) . '</h2>';
        echo '<table class="form-table" role="presentation"><tbody>';
        printf(
            '<tr><th scope="row"><label for="couturier-footer-copyright">%1$s</label></th><td><input type="text" class="regular-text" id="couturier-footer-copyright" name="%2$s" value="%3$s" placeholder="%4$s" aria-describedby="couturier-footer-copyright-description"><p class="description" id="couturier-footer-copyright-description">%5$s</p></td></tr>',
            esc_html__( 'Texte', 'couturier' ),
            esc_attr( $name( 'copyright' ) ),
            esc_attr( $settings['copyright'] ),
            esc_attr( Footer::default_copyright() ),
            esc_html__( 'Affiché après « © » et l\'année en cours, mise à jour automatiquement. Facultatif : le texte grisé s\'affiche si le champ est vide.', 'couturier' )
        );
        echo '</tbody></table>';

        submit_button();
        echo '</form></div>';
    }

    /**
     * Ouvre un tableau réordonnable : en-têtes (n° et poignée, colonnes propres,
     * « Activer », « Supprimer » si les lignes peuvent l'être) et `<tbody>` qui porte
     * les annonces du script.
     *
     * @param string                $id          Identifiant du `<tbody>`.
     * @param string                $description Identifiant du paragraphe qui décrit le tableau.
     * @param array<string, string> $columns     Colonnes propres : classe => intitulé.
     * @param string                $moved       Annonce d'un déplacement (`%d` : nouvelle position).
     * @param string                $removed     Annonce d'un retrait ('' : pas de retrait, ni de colonne).
     */
    private function open_table( string $id, string $description, array $columns, string $moved, string $removed ): void {
        printf(
            '<table class="widefat striped couturier-sortable" aria-describedby="%1$s"><thead><tr><th scope="col" class="column-number">%2$s</th>',
            esc_attr( $description ),
            esc_html_x( 'N°', 'position dans la liste', 'couturier' )
        );

        foreach ( $columns as $class => $label ) {
            printf( '<th scope="col"%1$s>%2$s</th>', '' !== $class ? ' class="' . esc_attr( $class ) . '"' : '', esc_html( $label ) );
        }

        printf(
            '<th scope="col" class="column-enabled">%1$s</th>%2$s</tr></thead><tbody id="%3$s" class="couturier-sortable__body" data-moved="%4$s" data-removed="%5$s">',
            esc_html__( 'Activer', 'couturier' ),
            '' !== $removed ? '<th scope="col" class="column-actions"><span class="screen-reader-text">' . esc_html__( 'Supprimer', 'couturier' ) . '</span></th>' : '',
            esc_attr( $id ),
            esc_attr( $moved ),
            esc_attr( $removed )
        );
    }

    /**
     * Affiche une certification, en une ligne du tableau : position, logo et bouton
     * de choix, lien, interrupteur, boutons de déplacement et de retrait.
     *
     * La position est l'en-tête de la ligne (`<th scope="row">`) : un lecteur d'écran
     * l'annonce avec chaque champ et chaque bouton, qui n'ont donc pas à la répéter.
     *
     * @param string $key      Clé unique des identifiants de la ligne (`ROW_KEY` dans le gabarit).
     * @param int    $number   Position affichée (0 dans le gabarit : le script la renseigne).
     * @param int    $image_id Image de la médiathèque, 0 si aucune.
     * @param string $url      Lien facultatif.
     * @param bool   $enabled  Certification affichée sur le site.
     */
    private function render_certification( string $key, int $number, int $image_id, string $url, bool $enabled ): void {
        $has_image = Footer::is_valid_image( $image_id );
        $alt       = $has_image ? trim( (string) get_post_meta( $image_id, '_wp_attachment_image_alt', true ) ) : '';
        $field     = Footer::OPTION . '[certifications]';

        echo '<tr class="couturier-sortable__row">';

        printf(
            '<th scope="row" class="column-number"><span class="screen-reader-text">%1$s </span><span class="couturier-sortable__number">%2$s</span>%3$s</th>',
            esc_html__( 'Certification', 'couturier' ),
            esc_html( $number > 0 ? (string) $number : '' ),
            $this->handle() // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- échappé par handle().
        );

        // Logo : aperçu, identifiant posté, bouton de choix, avertissement d'alt manquant.
        echo '<td class="column-logo"><div class="couturier-certification__logo"><div class="couturier-certification__preview">';
        echo $has_image
            ? wp_get_attachment_image( $image_id, 'medium', false, [ 'alt' => '' ] ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- HTML du core.
            : '<em>' . esc_html__( 'Aucune image', 'couturier' ) . '</em>';
        echo '</div>';

        printf(
            '<input type="hidden" class="couturier-certification__image-id" name="%1$s" value="%2$s">',
            esc_attr( $field . '[image_id][]' ),
            esc_attr( $has_image ? (string) $image_id : '' )
        );

        printf(
            '<button type="button" class="button button-small couturier-certification__choose">%s</button></div>',
            esc_html( $has_image ? __( 'Changer', 'couturier' ) : __( 'Choisir', 'couturier' ) )
        );

        // Avertissement non bloquant : sans texte alternatif, le titre de l'image le remplace.
        printf(
            '<p class="description couturier-certification__alt-warning"%1$s>%2$s <a href="%3$s">%4$s</a></p></td>',
            $has_image && '' === $alt ? '' : ' hidden',
            esc_html__( 'Sans texte alternatif :', 'couturier' ),
            esc_url( $has_image ? (string) get_edit_post_link( $image_id ) : '' ),
            esc_html__( 'le renseigner', 'couturier' )
        );

        printf(
            '<td><label for="couturier-certification-url-%1$s" class="screen-reader-text">%2$s</label><input type="url" class="large-text" id="couturier-certification-url-%1$s" name="%3$s" value="%4$s" placeholder="https://"></td>',
            esc_attr( $key ),
            esc_html__( 'Lien (facultatif)', 'couturier' ),
            esc_attr( $field . '[url][]' ),
            esc_attr( $url )
        );

        $this->render_toggle( $field . '[enabled][]', $enabled );

        printf(
            '<td class="column-actions"><button type="button" class="button-link button-link-delete couturier-sortable__remove">%s</button></td>',
            esc_html__( 'Supprimer', 'couturier' )
        );

        echo '</tr>';
    }

    /**
     * Affiche un réseau social, en une ligne du tableau : position, icône et nom
     * (en-tête de la ligne), adresse, interrupteur, boutons de déplacement.
     *
     * @param int                                                          $number  Position affichée.
     * @param array{network: string, name: string, url: string, enabled: bool} $network Réseau.
     * @param bool                                                         $invalid Adresse refusée à la dernière sauvegarde.
     */
    private function render_network( int $number, array $network, bool $invalid ): void {
        $field = Footer::OPTION . '[social]';
        $icon  = get_theme_file_path( 'resources/views/partials/footer/icons/' . $network['network'] . '.svg' );

        printf(
            '<tr class="couturier-sortable__row"><td class="column-number"><span class="couturier-sortable__number">%1$s</span>%6$s</td><th scope="row" class="column-network"><span class="couturier-network">%2$s%3$s</span><input type="hidden" name="%4$s" value="%5$s"></th>',
            esc_html( (string) $number ),
            is_readable( $icon ) ? (string) file_get_contents( $icon ) : '', // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- icône du thème, décorative (aria-hidden).
            esc_html( $network['name'] ),
            esc_attr( $field . '[network][]' ),
            esc_attr( $network['network'] ),
            $this->handle() // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- échappé par handle().
        );

        printf(
            '<td><label for="couturier-social-url-%1$s" class="screen-reader-text">%2$s</label><input type="url" class="large-text" id="couturier-social-url-%1$s" name="%3$s" value="%4$s" placeholder="https://" autocomplete="url"%5$s></td>',
            esc_attr( $network['network'] ),
            esc_html__( 'Adresse', 'couturier' ),
            esc_attr( $field . '[url][]' ),
            esc_attr( $network['url'] ),
            $invalid ? ' aria-invalid="true" aria-describedby="' . esc_attr( 'setting-error-social-' . $network['network'] ) . '"' : ''
        );

        $this->render_toggle( $field . '[enabled][]', $network['enabled'] );

        echo '</tr>';
    }

    /**
     * Cellule « Activer » : interrupteur (case `role="switch"`, nommée « Activer »),
     * état « Oui » / « Non » affiché à côté, masqué aux lecteurs d'écran qui
     * l'annoncent déjà. La case n'a pas de `name` : le script recopie son état dans
     * le champ caché posté.
     *
     * @param string $name    Nom du champ caché posté.
     * @param bool   $enabled État.
     */
    private function render_toggle( string $name, bool $enabled ): void {
        printf(
            '<td class="column-enabled"><input type="hidden" class="couturier-sortable__enabled" name="%1$s" value="%2$s"><label><input type="checkbox" role="switch" class="couturier-sortable__toggle"%3$s><span class="screen-reader-text">%4$s</span> <span class="couturier-sortable__state" aria-hidden="true">%5$s</span></label></td>',
            esc_attr( $name ),
            $enabled ? '1' : '0',
            checked( $enabled, true, false ),
            esc_html__( 'Activer', 'couturier' ),
            esc_html( $enabled ? __( 'Oui', 'couturier' ) : __( 'Non', 'couturier' ) )
        );
    }

    /**
     * Poignée « ≡ » de déplacement, posée après le numéro de la ligne, et son menu.
     *
     * Trois usages (cf. `footer-settings.js`) : on la fait glisser pour déposer la
     * ligne ailleurs ; au clavier, les flèches ↑ ↓ déplacent la ligne ; un clic ouvre
     * un menu « Monter / Descendre / Mettre en premier / Mettre en dernier ».
     *
     * @return string HTML échappé.
     */
    private function handle(): string {
        $html = sprintf(
            '<button type="button" class="couturier-sortable__handle" aria-haspopup="menu" aria-expanded="false" title="%1$s"><span class="dashicons dashicons-menu" aria-hidden="true"></span><span class="screen-reader-text">%2$s</span></button><div class="couturier-sortable__menu" role="menu" hidden>',
            esc_attr__( 'Glisser pour déplacer, ou cliquer', 'couturier' ),
            esc_html__( 'Déplacer', 'couturier' )
        );

        foreach ( [
            'up'    => __( 'Monter', 'couturier' ),
            'down'  => __( 'Descendre', 'couturier' ),
            'first' => __( 'Mettre en premier', 'couturier' ),
            'last'  => __( 'Mettre en dernier', 'couturier' ),
        ] as $action => $label ) {
            $html .= sprintf(
                '<button type="button" role="menuitem" tabindex="-1" data-move="%1$s">%2$s</button>',
                esc_attr( $action ),
                esc_html( $label )
            );
        }

        return $html . '</div>';
    }

    /**
     * Adresse web http(s) valide, ou chaîne vide.
     *
     * `esc_url_raw()` écarte les autres schémas (`javascript:`…) et complète une
     * adresse sans schéma (`www.exemple.fr` → `http://www.exemple.fr`).
     */
    private function sanitize_url( string $url ): string {
        if ( '' === $url ) {
            return '';
        }

        $clean = esc_url_raw( $url, [ 'http', 'https' ] );

        return false !== filter_var( $clean, FILTER_VALIDATE_URL ) ? $clean : '';
    }
}

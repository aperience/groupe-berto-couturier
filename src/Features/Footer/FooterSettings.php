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
use Theme\Support\PageCache;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Ajoute au menu « Apparence » un écran « Pied de page » : certifications (logo de la
 * médiathèque et lien facultatif, dans l'ordre d'affichage), adresses des réseaux
 * sociaux, texte du copyright.
 *
 * **Settings API, ouverte aux éditeurs**, comme l'écran « Offre du moment » : le
 * filtre `option_page_capability_{groupe}` abaisse l'exigence de `options.php` à
 * `CAPABILITY` pour ce seul groupe de réglages.
 *
 * **Liste de certifications sans index.** Les champs sont postés en tableaux
 * parallèles (`image_id[]`, `url[]`, `enabled[]`) : leur ordre est celui du DOM, que le script
 * de l'écran (`resources/js/editor/footer-settings.js`) réordonne sans avoir à
 * renuméroter les noms. Une ligne sans image est ignorée. L'interrupteur
 * « Activer » est une case sans nom, recopiée par le script dans un champ caché
 * `enabled[]` (1 ou 0) : une case décochée n'est pas postée, et décalerait les
 * tableaux.
 *
 * **Un tableau, une ligne par certification**, pour tenir peu de place.
 * Réordonnancement au clavier : boutons « Monter », « Descendre », « Retirer »
 * plutôt qu'un glisser-déposer, annoncés par une région `aria-live` (WCAG 2.1.1,
 * 4.1.3).
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
            /* translators: %d : nouvelle position de la certification. */
            'moved'        => __( 'Certification déplacée en position %d.', 'couturier' ),
            'removed'      => __( 'Certification retirée.', 'couturier' ),
            'added'        => __( 'Certification ajoutée. Choisissez son image.', 'couturier' ),
            'imageChosen'  => __( 'Image choisie.', 'couturier' ),
        ];

        wp_register_script( $handle, false, [ 'media-editor' ], null, true );
        wp_enqueue_script( $handle );
        wp_add_inline_script( $handle, 'window.couturierFooterSettings = ' . wp_json_encode( $l10n ) . ';', 'before' );
        wp_add_inline_script( $handle, (string) file_get_contents( $path ) );

        // Mise en forme du tableau, propre à cet écran. Interrupteur « Activer » :
        // la case à cocher native, redessinée en glissière (même clavier, même
        // lecteur d'écran). Contrastes sur blanc (WCAG 1.4.11) : contour et pastille
        // grise `#8c8f94` 3,3:1, piste pétrole `#004e63` 9,25:1.
        wp_add_inline_style( 'common', '
            .couturier-certifications { max-width: 60rem; }
            .widefat.couturier-certifications tbody th, .widefat.couturier-certifications tbody td { vertical-align: middle; }
            .couturier-certifications .column-number { width: 2.5rem; }
            .couturier-certifications .column-logo { width: 14rem; }
            .couturier-certifications .column-enabled { width: 6rem; }
            .couturier-certifications .column-enabled label { display: inline-flex; align-items: center; gap: .5rem; min-height: 1.5rem; cursor: pointer; }
            .couturier-certifications input[type="checkbox"].couturier-certification__toggle { appearance: none; position: relative; flex: none; width: 2.5rem; height: 1.375rem; margin: 0; border: 1px solid #8c8f94; border-radius: 999px; background: #fff; box-shadow: none; cursor: pointer; transition: background-color .15s, border-color .15s; }
            .couturier-certifications input[type="checkbox"].couturier-certification__toggle::before { content: none; }
            .couturier-certifications input[type="checkbox"].couturier-certification__toggle::after { content: ""; position: absolute; top: 2px; left: 2px; width: 1rem; height: 1rem; border-radius: 50%; background: #8c8f94; transition: transform .15s, background-color .15s; }
            .couturier-certifications input[type="checkbox"].couturier-certification__toggle:checked { background: #004e63; border-color: #004e63; }
            .couturier-certifications input[type="checkbox"].couturier-certification__toggle:checked::after { background: #fff; transform: translateX(1.125rem); }
            .couturier-certifications input[type="checkbox"].couturier-certification__toggle:focus-visible { outline: 2px solid #004e63; outline-offset: 2px; }
            @media (prefers-reduced-motion: reduce) { .couturier-certifications input[type="checkbox"].couturier-certification__toggle, .couturier-certifications input[type="checkbox"].couturier-certification__toggle::after { transition: none; } }
            .couturier-certifications .column-actions { width: 8.5rem; text-align: right; }
            .couturier-certification__logo { display: flex; align-items: center; gap: .75rem; }
            .couturier-certification__preview { display: flex; align-items: center; justify-content: center; width: 6rem; height: 2.5rem; }
            .couturier-certification__preview img { max-width: 100%; max-height: 100%; width: auto; height: auto; }
            .couturier-certification__alt-warning { margin: .25rem 0 0; }
            .couturier-certification__actions { display: inline-flex; gap: .25rem; }
            .couturier-certification__actions .button { display: inline-flex; align-items: center; justify-content: center; min-width: 2rem; min-height: 2rem; padding: 0; }
        ' );
    }

    /**
     * Nettoie la saisie : certifications avec image, adresses web valides.
     *
     * Une adresse invalide est retirée, signalée par une erreur qui nomme la
     * certification ou le réseau en cause (WCAG 3.3.1).
     *
     * @param mixed $input Valeurs postées.
     * @return array{certifications: list<array{image_id: int, url: string, enabled: bool}>, social: array<string, string>, copyright: string}
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

        // Réseaux sociaux.
        $posted_social = is_array( $input['social'] ?? null ) ? $input['social'] : [];
        $social        = [];

        foreach ( Footer::NETWORKS as $network => $name ) {
            $raw_url = trim( (string) ( $posted_social[ $network ] ?? '' ) );
            $url     = $this->sanitize_url( $raw_url );

            if ( '' !== $raw_url && '' === $url ) {
                add_settings_error(
                    Footer::OPTION,
                    'social-' . $network,
                    /* translators: %s : nom du réseau social. */
                    sprintf( __( '%s : l\'adresse n\'est pas une adresse web valide (https://…), elle a été retirée.', 'couturier' ), $name )
                );
            }

            if ( '' !== $url ) {
                $social[ $network ] = $url;
            }
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

        settings_errors( Footer::OPTION );

        echo '<form method="post" action="options.php" novalidate="novalidate">';
        settings_fields( self::GROUP );

        // Certifications.
        echo '<h2>' . esc_html__( 'Certifications', 'couturier' ) . '</h2>';
        echo '<p id="couturier-certifications-description">' . esc_html__( 'Logos affichés en tête du pied de page, dans cet ordre. Le texte alternatif de chaque image, saisi dans la médiathèque, sert d\'intitulé au logo : par exemple « Qualiopi, processus certifié ».', 'couturier' ) . '</p>';

        printf(
            '<table class="widefat striped couturier-certifications" aria-describedby="couturier-certifications-description"><thead><tr><th scope="col" class="column-number">%1$s</th><th scope="col" class="column-logo">%2$s</th><th scope="col">%3$s</th><th scope="col" class="column-enabled">%5$s</th><th scope="col" class="column-actions"><span class="screen-reader-text">%4$s</span></th></tr></thead><tbody id="couturier-certifications">',
            esc_html_x( 'N°', 'position de la certification', 'couturier' ),
            esc_html__( 'Logo', 'couturier' ),
            esc_html__( 'Lien (facultatif)', 'couturier' ),
            esc_html__( 'Ordre et retrait', 'couturier' ),
            esc_html__( 'Activer', 'couturier' )
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
        echo '<p class="screen-reader-text" role="status" id="couturier-certifications-status"></p>';

        // Réseaux sociaux.
        echo '<h2>' . esc_html__( 'Réseaux sociaux', 'couturier' ) . '</h2>';
        echo '<p>' . esc_html__( 'Adresse complète de chaque page (https://…). Un réseau sans adresse n\'est pas affiché.', 'couturier' ) . '</p>';
        echo '<table class="form-table" role="presentation"><tbody>';

        foreach ( Footer::NETWORKS as $network => $network_name ) {
            $field   = 'social-' . $network;
            $invalid = in_array( $field, $errors, true );

            printf(
                '<tr><th scope="row"><label for="couturier-footer-%1$s">%2$s</label></th><td><input type="url" class="regular-text" id="couturier-footer-%1$s" name="%3$s" value="%4$s" autocomplete="url"%5$s></td></tr>',
                esc_attr( $field ),
                esc_html( $network_name ),
                esc_attr( $name( 'social' ) . '[' . $network . ']' ),
                esc_attr( $settings['social'][ $network ] ?? '' ),
                $invalid ? ' aria-invalid="true" aria-describedby="' . esc_attr( 'setting-error-' . $field ) . '"' : ''
            );
        }

        echo '</tbody></table>';

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
     * Affiche une certification, en une ligne du tableau : position, logo et bouton
     * de choix, lien, boutons de déplacement et de retrait.
     *
     * La position est l'en-tête de la ligne (`<th scope="row">`) : un lecteur d'écran
     * l'annonce avec chaque champ et chaque bouton, qui n'ont donc pas à la répéter.
     * Les boutons à icône portent leur intitulé en texte masqué, et en `title` pour
     * la souris.
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

        echo '<tr class="couturier-certification">';

        printf(
            '<th scope="row" class="column-number"><span class="screen-reader-text">%1$s </span><span class="couturier-certification__number">%2$s</span></th>',
            esc_html__( 'Certification', 'couturier' ),
            esc_html( $number > 0 ? (string) $number : '' )
        );

        // Logo : aperçu, identifiant posté, bouton de choix, avertissement d'alt manquant.
        echo '<td class="column-logo"><div class="couturier-certification__logo"><div class="couturier-certification__preview">';
        echo $has_image
            ? wp_get_attachment_image( $image_id, 'medium', false, [ 'alt' => '' ] ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- HTML du core.
            : '<em>' . esc_html__( 'Aucune image', 'couturier' ) . '</em>';
        echo '</div>';

        printf(
            '<input type="hidden" class="couturier-certification__image-id" name="%1$s" value="%2$s">',
            esc_attr( Footer::OPTION . '[certifications][image_id][]' ),
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
            esc_attr( Footer::OPTION . '[certifications][url][]' ),
            esc_attr( $url )
        );

        // Activer : interrupteur (case `role="switch"`, nommée « Activer »), état
        // « Oui » / « Non » affiché à côté, masqué aux lecteurs d'écran qui
        // l'annoncent déjà. La case n'a pas de `name` : le script recopie son état
        // dans le champ caché posté.
        printf(
            '<td class="column-enabled"><input type="hidden" class="couturier-certification__enabled" name="%1$s" value="%2$s"><label><input type="checkbox" role="switch" class="couturier-certification__toggle"%3$s><span class="screen-reader-text">%4$s</span> <span class="couturier-certification__state" aria-hidden="true">%5$s</span></label></td>',
            esc_attr( Footer::OPTION . '[certifications][enabled][]' ),
            $enabled ? '1' : '0',
            checked( $enabled, true, false ),
            esc_html__( 'Activer', 'couturier' ),
            esc_html( $enabled ? __( 'Oui', 'couturier' ) : __( 'Non', 'couturier' ) )
        );

        echo '<td class="column-actions"><span class="couturier-certification__actions">';

        foreach ( [
            'up'     => [ __( 'Monter', 'couturier' ), 'dashicons-arrow-up-alt2' ],
            'down'   => [ __( 'Descendre', 'couturier' ), 'dashicons-arrow-down-alt2' ],
            'remove' => [ __( 'Retirer', 'couturier' ), 'dashicons-no-alt' ],
        ] as $action => [ $label, $icon ] ) {
            printf(
                '<button type="button" class="button couturier-certification__%1$s" title="%2$s"><span class="dashicons %3$s" aria-hidden="true"></span><span class="screen-reader-text">%4$s</span></button>',
                esc_attr( $action ),
                esc_attr( $label ),
                esc_attr( $icon ),
                esc_html( $label )
            );
        }

        echo '</span></td></tr>';
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

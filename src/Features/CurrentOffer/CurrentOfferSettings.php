<?php
/**
 * Écran d'admin de l'offre du moment
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\CurrentOffer;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\ThemeContext;
use Theme\Features\Admin\HelpScreen;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Ajoute au menu de l'admin un écran « Offre du moment » : titre, texte, page dédiée,
 * intitulé du lien, dates de début et de fin, interrupteur actif / inactif. L'écran
 * affiche en tête l'état réel de l'offre (en ligne, programmée, expirée…).
 *
 * **Settings API, ouverte aux éditeurs.** `options.php` exige `manage_options`
 * par défaut. Le filtre `option_page_capability_{groupe}` abaisse cette exigence à
 * `CAPABILITY` pour ce seul groupe de réglages : le client gère l'offre sans être
 * administrateur.
 *
 * **Une saisie incohérente est enregistrée, mais l'offre est désactivée.** Une offre
 * active sans titre, texte ou page, ou une fin antérieure au début, produit une erreur
 * reliée à son champ. Le texte saisi est conservé, pour ne pas obliger le client à
 * tout retaper, mais rien ne s'affiche sur le site.
 *
 * **Invalidation du cache.** Enregistrer l'offre, ou modifier, mettre à la
 * corbeille ou supprimer la page cible, vide le cache de l'offre résolue
 * (`CurrentOffer::flush()`).
 */
final class CurrentOfferSettings implements FeatureInterface {

    /** Capability requise pour gérer l'offre (éditeurs et administrateurs). */
    public const CAPABILITY = 'edit_others_pages';

    /** Groupe de réglages, transmis par le formulaire à `options.php`. */
    private const GROUP = 'couturier_current_offer';

    /**
     * Astérisque des champs obligatoires, masqué aux lecteurs d'écran : le libellé
     * porte à la place « (obligatoire) » en texte masqué.
     *
     * Rouge des erreurs de l'admin, assombri : 5,5:1 sur le fond `#f0f0f1`, là où le
     * `#d63638` du core n'atteint que 4,2:1 (WCAG 1.4.3).
     */
    private const REQUIRED_MARK = '<span aria-hidden="true" style="color: #b32d2e;">*</span>';

    /** Position dans le menu : juste sous Pages (20). */
    private const MENU_POSITION = 21;

    /**
     * Réglages déjà nettoyés pendant la requête.
     *
     * À la première sauvegarde, WordPress appelle le nettoyage deux fois
     * (`update_option()` puis `add_option()`) : sans cette mémoire, chaque erreur
     * s'afficherait en double.
     */
    private ?array $sanitized = null;

    /**
     * @param ThemeContext $context Identité du thème, pour le slug de l'écran.
     */
    public function __construct(
        private readonly ThemeContext $context,
    ) {}

    /** Enregistre l'écran, le réglage et l'invalidation du cache. */
    public function register(): void {
        add_action( 'admin_menu', [ $this, 'add_page' ] );
        add_action( 'admin_init', [ $this, 'register_setting' ] );
        add_filter( 'option_page_capability_' . self::GROUP, static fn(): string => self::CAPABILITY );

        add_action( 'add_option_' . CurrentOffer::OPTION, [ CurrentOffer::class, 'flush' ] );
        add_action( 'update_option_' . CurrentOffer::OPTION, [ CurrentOffer::class, 'flush' ] );
        add_action( 'save_post_page', [ $this, 'flush_if_target' ] );
        add_action( 'trashed_post', [ $this, 'flush_if_target' ] );
        add_action( 'deleted_post', [ $this, 'flush_if_target' ] );

        add_filter( HelpScreen::TABS_FILTER, [ $this, 'help_tab' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Écran « Offre du moment » : une offre datée, activable, qui renvoie vers une page dédiée et s\'affiche en page d\'accueil.', 'couturier' );
    }

    /** Ajoute l'écran au menu principal, sous Pages. */
    public function add_page(): void {
        add_menu_page(
            __( 'Offre du moment', 'couturier' ),
            __( 'Offre du moment', 'couturier' ),
            self::CAPABILITY,
            $this->context->handle( CurrentOffer::MENU_SLUG ),
            [ $this, 'render' ],
            'dashicons-megaphone',
            self::MENU_POSITION
        );
    }

    /** Déclare l'option, autoloadée, et son nettoyage. */
    public function register_setting(): void {
        register_setting(
            self::GROUP,
            CurrentOffer::OPTION,
            [
                'type'              => 'object',
                'sanitize_callback' => [ $this, 'sanitize' ],
                'show_in_rest'      => false,
                'autoload'          => true,
            ]
        );
    }

    /**
     * Nettoie et valide la saisie ; désactive l'offre si elle est incohérente.
     *
     * @param mixed $input Valeurs postées.
     * @return array<string, mixed>
     */
    public function sanitize( mixed $input ): array {
        if ( null !== $this->sanitized ) {
            return $this->sanitized;
        }

        $input = is_array( $input ) ? $input : [];

        $value = [
            'enabled'    => ! empty( $input['enabled'] ),
            'title'      => sanitize_text_field( (string) ( $input['title'] ?? '' ) ),
            'text'       => sanitize_text_field( (string) ( $input['text'] ?? '' ) ),
            'page_id'    => absint( $input['page_id'] ?? 0 ),
            'link_label' => sanitize_text_field( (string) ( $input['link_label'] ?? '' ) ),
            'start'      => $this->sanitize_datetime( (string) ( $input['start_date'] ?? '' ), (string) ( $input['start_time'] ?? '' ) ),
            'end'        => $this->sanitize_datetime( (string) ( $input['end_date'] ?? '' ), (string) ( $input['end_time'] ?? '' ) ),
        ];

        if ( ! CurrentOffer::is_valid_page( $value['page_id'] ) ) {
            $value['page_id'] = 0;
        }

        $errors = [];

        if ( $value['enabled'] && '' === $value['title'] ) {
            $errors['title'] = __( 'Le titre est obligatoire pour activer l\'offre.', 'couturier' );
        }

        if ( $value['enabled'] && '' === $value['text'] ) {
            $errors['text'] = __( 'Le texte est obligatoire pour activer l\'offre.', 'couturier' );
        }

        if ( $value['enabled'] && 0 === $value['page_id'] ) {
            $errors['page_id'] = __( 'Choisissez la page de l\'offre pour l\'activer.', 'couturier' );
        }

        if ( '' !== $value['start'] && '' !== $value['end'] && $value['end'] <= $value['start'] ) {
            $errors['end'] = __( 'La fin doit être postérieure au début.', 'couturier' );
        }

        foreach ( $errors as $field => $message ) {
            add_settings_error( CurrentOffer::OPTION, $field, $message );
        }

        if ( [] !== $errors && $value['enabled'] ) {
            $value['enabled'] = false;
            add_settings_error( CurrentOffer::OPTION, 'disabled', __( 'L\'offre a été enregistrée mais désactivée : corrigez les erreurs ci-dessus puis réactivez-la.', 'couturier' ), 'warning' );
        }

        return $this->sanitized = $value;
    }

    /** Vide le cache de l'offre si la page modifiée est sa page cible. */
    public function flush_if_target( int $post_id ): void {
        if ( $post_id === (int) CurrentOffer::settings()['page_id'] ) {
            CurrentOffer::flush();
        }
    }

    /**
     * Déclare l'onglet « Offre du moment » de la page d'aide
     * (gabarit `resources/views/admin/help/current-offer.twig`).
     *
     * @param array<string, array<string, mixed>> $tabs Onglets déjà déclarés.
     * @return array<string, array<string, mixed>>
     */
    public function help_tab( array $tabs ): array {
        $tabs['current-offer'] = [
            'label'    => __( 'Offre du moment', 'couturier' ),
            'priority' => 10,
            'context'  => [
                'current_offer_url' => admin_url( 'admin.php?page=' . $this->context->handle( CurrentOffer::MENU_SLUG ) ),
                'new_page_url'      => admin_url( 'post-new.php?post_type=page' ),
                'dashboard_url'     => admin_url(),
            ],
        ];

        return $tabs;
    }

    /** Affiche l'écran : état de l'offre, puis le formulaire. */
    public function render(): void {
        if ( ! current_user_can( self::CAPABILITY ) ) {
            return;
        }

        $settings = CurrentOffer::settings();
        $errors   = array_column( get_settings_errors( CurrentOffer::OPTION ), 'code' );
        $name     = static fn( string $field ): string => CurrentOffer::OPTION . '[' . $field . ']';

        echo '<div class="wrap">';
        echo '<h1>' . esc_html( get_admin_page_title() ) . '</h1>';

        // Notice verte après l'enregistrement. WordPress ne l'ajoute que sur les écrans
        // du menu Réglages (`options-head.php`) : celui-ci est un menu à part. Les
        // erreurs éventuelles s'affichent en plus : la saisie a bien été enregistrée,
        // l'offre désactivée si elle est incohérente.
        if ( isset( $_GET['settings-updated'] ) && 'true' === $_GET['settings-updated'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- simple affichage, posé par options.php.
            add_settings_error( CurrentOffer::OPTION, 'settings_updated', __( 'Réglages enregistrés.', 'couturier' ), 'success' );
        }

        settings_errors( CurrentOffer::OPTION );
        CurrentOffer::render_status();

        printf(
            '<p>%s</p>',
            sprintf(
                /* translators: %s : astérisque signalant un champ obligatoire. */
                esc_html__( 'Les champs marqués d\'un astérisque %s sont obligatoires pour activer l\'offre.', 'couturier' ),
                self::REQUIRED_MARK
            )
        );

        echo '<form method="post" action="options.php" novalidate="novalidate">';
        settings_fields( self::GROUP );
        echo '<table class="form-table" role="presentation"><tbody>';

        // Interrupteur.
        echo '<tr><th scope="row">' . esc_html__( 'Activation', 'couturier' ) . '</th><td>';
        printf(
            '<label for="current-offer-enabled"><input type="checkbox" id="current-offer-enabled" name="%1$s" value="1"%2$s> %3$s</label>',
            esc_attr( $name( 'enabled' ) ),
            checked( $settings['enabled'], true, false ),
            esc_html__( 'Afficher l\'offre en page d\'accueil pendant ses dates', 'couturier' )
        );
        echo '</td></tr>';

        // Titre.
        $this->render_row(
            'title',
            __( 'Titre', 'couturier' ),
            sprintf(
                '<input type="text" class="regular-text" id="current-offer-title" name="%1$s" value="%2$s"%3$s>',
                esc_attr( $name( 'title' ) ),
                esc_attr( $settings['title'] ),
                $this->field_attributes( 'title', $errors )
            ),
            __( 'Par exemple : Offre du moment', 'couturier' ),
            $errors,
            true
        );

        // Texte.
        $this->render_row(
            'text',
            __( 'Texte', 'couturier' ),
            sprintf(
                '<input type="text" class="regular-text" id="current-offer-text" name="%1$s" value="%2$s"%3$s>',
                esc_attr( $name( 'text' ) ),
                esc_attr( $settings['text'] ),
                $this->field_attributes( 'text', $errors )
            ),
            __( 'Par exemple : Vacances de la Toussaint – Je me lance', 'couturier' ),
            $errors,
            true
        );

        // Page cible.
        $dropdown = (string) wp_dropdown_pages(
            [
                'name'              => $name( 'page_id' ),
                'id'                => 'current-offer-page_id',
                'selected'          => (int) $settings['page_id'],
                'show_option_none'  => __( '— Choisir une page —', 'couturier' ),
                'option_none_value' => '0',
                'echo'              => false,
            ]
        );
        $this->render_row(
            'page_id',
            __( 'Page de l\'offre', 'couturier' ),
            // wp_dropdown_pages() ne sait pas poser d'attributs ARIA : ils sont ajoutés à la balise ouvrante.
            preg_replace( '/^<select /', '<select' . $this->field_attributes( 'page_id', $errors ) . ' ', $dropdown, 1 ),
            __( 'Page publiée vers laquelle renvoie l\'offre.', 'couturier' ),
            $errors,
            true
        );

        // Intitulé du lien.
        $this->render_row(
            'link_label',
            __( 'Intitulé du lien', 'couturier' ),
            sprintf(
                '<input type="text" class="regular-text" id="current-offer-link_label" name="%1$s" value="%2$s" placeholder="%3$s"%4$s>',
                esc_attr( $name( 'link_label' ) ),
                esc_attr( $settings['link_label'] ),
                esc_attr__( 'Découvrir l\'offre', 'couturier' ),
                $this->field_attributes( 'link_label', $errors )
            ),
            __( 'Facultatif. « Découvrir l\'offre » si le champ est vide.', 'couturier' ),
            $errors
        );

        // Dates : un champ date et un champ heure (00:00 par défaut), recombinés par sanitize().
        foreach ( [
            'start' => [ __( 'Date de début', 'couturier' ), __( 'Heure de début', 'couturier' ), __( 'Facultatif. L\'offre s\'affiche à partir de cet instant ; sans date, dès son activation.', 'couturier' ) ],
            'end'   => [ __( 'Date de fin', 'couturier' ), __( 'Heure de fin', 'couturier' ), __( 'Facultatif. L\'offre disparaît à cet instant (à 00:00, elle n\'est plus affichée ce jour-là) ; sans date, à sa désactivation.', 'couturier' ) ],
        ] as $field => [ $label, $time_label, $help ] ) {
            [ $date, $time ] = array_pad( explode( ' ', $settings[ $field ] ), 2, '' );

            $this->render_row(
                $field,
                $label,
                sprintf(
                    '<input type="date" id="current-offer-%1$s" name="%2$s" value="%3$s"%4$s> <span aria-hidden="true">%5$s</span> <label for="current-offer-%1$s-time" class="screen-reader-text">%6$s</label><input type="time" id="current-offer-%1$s-time" name="%7$s" value="%8$s"%4$s>',
                    esc_attr( $field ),
                    esc_attr( $name( $field . '_date' ) ),
                    esc_attr( $date ),
                    $this->field_attributes( $field, $errors ),
                    esc_html_x( 'à', 'entre la date et l\'heure', 'couturier' ),
                    esc_html( $time_label ),
                    esc_attr( $name( $field . '_time' ) ),
                    esc_attr( '' !== $time ? $time : '00:00' )
                ),
                $help,
                $errors
            );
        }

        echo '</tbody></table>';
        submit_button();
        echo '</form></div>';
    }

    /**
     * Affiche une ligne du formulaire : libellé, champ, aide.
     *
     * @param string   $field  Nom du champ.
     * @param string   $label  Libellé.
     * @param string   $input  HTML du champ, déjà échappé.
     * @param string   $help   Texte d'aide.
     * @param string[] $errors   Codes des erreurs de la dernière sauvegarde.
     * @param bool     $required Champ obligatoire pour activer l'offre : astérisque après le libellé.
     */
    private function render_row( string $field, string $label, string $input, string $help, array $errors, bool $required = false ): void {
        printf(
            '<tr><th scope="row"><label for="current-offer-%1$s">%2$s</label></th><td>%3$s<p class="description" id="current-offer-%1$s-description">%4$s</p></td></tr>',
            esc_attr( $field ),
            esc_html( $label ) . ( $required ? ' ' . self::REQUIRED_MARK . '<span class="screen-reader-text"> ' . esc_html__( '(obligatoire)', 'couturier' ) . '</span>' : '' ),
            $input, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- construit et échappé par l'appelant.
            esc_html( $help )
        );
    }

    /**
     * Attributs ARIA d'un champ : aide et, s'il est en erreur, notice de l'erreur.
     *
     * La notice porte l'id `setting-error-{code}` que lui donne `settings_errors()`.
     *
     * @param string   $field  Nom du champ.
     * @param string[] $errors Codes des erreurs de la dernière sauvegarde.
     */
    private function field_attributes( string $field, array $errors ): string {
        $described = [ 'current-offer-' . $field . '-description' ];
        $invalid   = in_array( $field, $errors, true );

        if ( $invalid ) {
            array_unshift( $described, 'setting-error-' . $field );
        }

        return sprintf( ' aria-describedby="%s"', esc_attr( implode( ' ', $described ) ) ) . ( $invalid ? ' aria-invalid="true"' : '' );
    }

    /** Date et heure `Y-m-d H:i` valides, ou chaîne vide si la date manque ; heure vide = 00:00. */
    private function sanitize_datetime( string $date, string $time ): string {
        $time  = sanitize_text_field( $time );
        $value = sanitize_text_field( $date ) . ' ' . ( '' !== $time ? substr( $time, 0, 5 ) : '00:00' );

        return CurrentOffer::parse_date( $value ) ? $value : '';
    }
}

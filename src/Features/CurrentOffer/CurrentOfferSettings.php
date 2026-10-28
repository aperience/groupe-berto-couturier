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
    private const CAPABILITY = 'edit_others_pages';

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
            $this->context->handle( 'current-offer' ),
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
            'start'      => $this->sanitize_date( (string) ( $input['start'] ?? '' ) ),
            'end'        => $this->sanitize_date( (string) ( $input['end'] ?? '' ) ),
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

        if ( '' !== $value['start'] && '' !== $value['end'] && $value['end'] < $value['start'] ) {
            $errors['end'] = __( 'La date de fin doit être postérieure ou égale à la date de début.', 'couturier' );
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

        settings_errors( CurrentOffer::OPTION );
        $this->render_status( $settings );

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

        // Dates.
        foreach ( [
            'start' => [ __( 'Date de début', 'couturier' ), __( 'Facultatif. L\'offre s\'affiche à partir de 00:00 ce jour-là ; sans date, dès son activation.', 'couturier' ) ],
            'end'   => [ __( 'Date de fin', 'couturier' ), __( 'Facultatif. L\'offre s\'affiche jusqu\'à 23:59 ce jour-là ; sans date, jusqu\'à sa désactivation.', 'couturier' ) ],
        ] as $field => [ $label, $help ] ) {
            $this->render_row(
                $field,
                $label,
                sprintf(
                    '<input type="date" id="current-offer-%1$s" name="%2$s" value="%3$s"%4$s>',
                    esc_attr( $field ),
                    esc_attr( $name( $field ) ),
                    esc_attr( $settings[ $field ] ),
                    $this->field_attributes( $field, $errors )
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
     * Affiche l'état réel de l'offre, dans une notice.
     *
     * @param array<string, mixed> $settings Réglages enregistrés.
     */
    private function render_status( array $settings ): void {
        $format = (string) get_option( 'date_format' );
        $date   = static fn( string $value ): string => ( $parsed = CurrentOffer::parse_date( $value ) )
            ? wp_date( $format, $parsed->getTimestamp() )
            : '';

        [ $type, $message ] = match ( CurrentOffer::status() ) {
            CurrentOffer::STATUS_LIVE      => [
                'success',
                '' !== $settings['end']
                    /* translators: %s : date de fin de l'offre. */
                    ? sprintf( __( 'En ligne jusqu\'au %s inclus.', 'couturier' ), $date( $settings['end'] ) )
                    : __( 'En ligne, sans date de fin.', 'couturier' ),
            ],
            CurrentOffer::STATUS_SCHEDULED => [
                'info',
                '' !== $settings['end']
                    /* translators: 1 : date de début, 2 : date de fin de l'offre. */
                    ? sprintf( __( 'Programmée du %1$s au %2$s inclus.', 'couturier' ), $date( $settings['start'] ), $date( $settings['end'] ) )
                    /* translators: %s : date de début de l'offre. */
                    : sprintf( __( 'Programmée à partir du %s.', 'couturier' ), $date( $settings['start'] ) ),
            ],
            /* translators: %s : date de fin de l'offre. */
            CurrentOffer::STATUS_EXPIRED   => [ 'warning', sprintf( __( 'Expirée depuis le %s : elle n\'est plus affichée.', 'couturier' ), $date( $settings['end'] ) ) ],
            CurrentOffer::STATUS_INVALID   => [ 'error', __( 'Non affichée : la page de l\'offre n\'est plus publiée.', 'couturier' ) ],
            default                        => [ 'info', __( 'Désactivée : l\'offre n\'est pas affichée.', 'couturier' ) ],
        };

        printf(
            '<div class="notice notice-%1$s inline"><p><strong>%2$s</strong> %3$s</p></div>',
            esc_attr( $type ),
            esc_html__( 'État :', 'couturier' ),
            esc_html( $message )
        );
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

    /** Date `Y-m-d` valide, ou chaîne vide. */
    private function sanitize_date( string $value ): string {
        $value = sanitize_text_field( $value );

        return CurrentOffer::parse_date( $value ) ? $value : '';
    }
}

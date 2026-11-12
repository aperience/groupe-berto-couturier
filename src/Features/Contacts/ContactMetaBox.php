<?php
/**
 * Contacts prédéfinis : boîte « Coordonnées »
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Contacts;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use WP_Post;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Boîte « Coordonnées » de l'écran d'un contact : texte affiché (plusieurs lignes),
 * téléphone, e-mail, nom affiché et fonction (bloc « Équipe »). Colonnes
 * correspondantes dans la liste.
 *
 * Enregistrement : nonce, droit de modifier le contenu, ni sauvegarde automatique
 * ni révision. Texte : lignes conservées, balises retirées. Téléphone : texte
 * libre (affiché tel quel, le lien `tel:` est calculé au rendu). E-mail : vidé s'il
 * est invalide, avec un avertissement.
 */
final class ContactMetaBox implements FeatureInterface {

    /** Action et champ du nonce. */
    private const NONCE_ACTION = 'couturier_contact_save';
    private const NONCE_FIELD  = 'couturier_contact_nonce';

    /** Paramètre d'URL de l'avertissement « e-mail invalide ». */
    private const INVALID_EMAIL_ARG = 'couturier_contact_invalid_email';

    /** Enregistre la boîte, son enregistrement et les colonnes de la liste. */
    public function register(): void {
        add_action( 'add_meta_boxes_' . Contact::POST_TYPE, [ $this, 'add_meta_box' ] );
        add_action( 'save_post_' . Contact::POST_TYPE, [ $this, 'save' ], 10, 2 );
        add_action( 'admin_notices', [ $this, 'invalid_email_notice' ] );
        add_filter( 'manage_' . Contact::POST_TYPE . '_posts_columns', [ $this, 'columns' ] );
        add_action( 'manage_' . Contact::POST_TYPE . '_posts_custom_column', [ $this, 'column' ], 10, 2 );
        add_action( 'admin_head-edit.php', [ $this, 'columns_style' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Ajoute à l\'écran d\'un contact la boîte « Coordonnées » (texte affiché, téléphone, e-mail, nom affiché, fonction) et ses colonnes à la liste des contacts.', 'couturier' );
    }

    /** Boîte sous le titre. */
    public function add_meta_box(): void {
        add_meta_box(
            'couturier-contact-details',
            __( 'Coordonnées', 'couturier' ),
            [ $this, 'render' ],
            Contact::POST_TYPE,
            'normal',
            'high'
        );
    }

    /** Champs de la boîte. */
    public function render( WP_Post $post ): void {
        $text  = (string) get_post_meta( $post->ID, Contact::META_TEXT, true );
        $phone = (string) get_post_meta( $post->ID, Contact::META_PHONE, true );
        $email = (string) get_post_meta( $post->ID, Contact::META_EMAIL, true );
        $name  = (string) get_post_meta( $post->ID, Contact::META_DISPLAY_NAME, true );
        $role  = (string) get_post_meta( $post->ID, Contact::META_ROLE, true );

        wp_nonce_field( self::NONCE_ACTION, self::NONCE_FIELD );
        ?>
        <table class="form-table" role="presentation">
            <tr>
                <th scope="row"><label for="couturier-contact-text"><?php esc_html_e( 'Texte affiché', 'couturier' ); ?></label></th>
                <td>
                    <textarea id="couturier-contact-text" name="couturier_contact[text]" rows="3" class="large-text" aria-describedby="couturier-contact-text-help"><?php echo esc_textarea( $text ); ?></textarea>
                    <p class="description" id="couturier-contact-text-help">
                        <?php esc_html_e( 'Affiché en gras à côté de la photo. Un retour à la ligne est conservé, ex. « Une question ? » puis « Eloim vous aide à choisir la formule adaptée ». Sans texte, le contact n\'est pas affiché.', 'couturier' ); ?>
                    </p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="couturier-contact-phone"><?php esc_html_e( 'Téléphone', 'couturier' ); ?></label></th>
                <td>
                    <input type="tel" id="couturier-contact-phone" name="couturier_contact[phone]" value="<?php echo esc_attr( $phone ); ?>" class="regular-text" autocomplete="off">
                    <p class="description"><?php esc_html_e( 'Affiché tel que saisi (ex. 02 37 42 42 69) ; facultatif.', 'couturier' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="couturier-contact-email"><?php esc_html_e( 'E-mail', 'couturier' ); ?></label></th>
                <td>
                    <input type="email" id="couturier-contact-email" name="couturier_contact[email]" value="<?php echo esc_attr( $email ); ?>" class="regular-text" autocomplete="off">
                    <p class="description"><?php esc_html_e( 'Facultatif.', 'couturier' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="couturier-contact-name"><?php esc_html_e( 'Nom affiché', 'couturier' ); ?></label></th>
                <td>
                    <input type="text" id="couturier-contact-name" name="couturier_contact[name]" value="<?php echo esc_attr( $name ); ?>" class="regular-text" autocomplete="off">
                    <p class="description"><?php esc_html_e( 'Nom de la carte du bloc « Équipe », ex. « Eloïm D. ». Sans nom affiché, le contact n\'apparaît pas dans ce bloc.', 'couturier' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="couturier-contact-role"><?php esc_html_e( 'Fonction', 'couturier' ); ?></label></th>
                <td>
                    <input type="text" id="couturier-contact-role" name="couturier_contact[role]" value="<?php echo esc_attr( $role ); ?>" class="regular-text" autocomplete="off">
                    <p class="description"><?php esc_html_e( 'Affichée sous le nom dans le bloc « Équipe », ex. « Enseignant·e de la conduite » ; facultative.', 'couturier' ); ?></p>
                </td>
            </tr>
        </table>
        <?php
    }

    /**
     * Enregistre les coordonnées.
     *
     * @param int     $post_id ID du contact.
     * @param WP_Post $post    Contact.
     */
    public function save( int $post_id, WP_Post $post ): void {
        if ( wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
            return;
        }

        $nonce = isset( $_POST[ self::NONCE_FIELD ] ) ? sanitize_text_field( wp_unslash( $_POST[ self::NONCE_FIELD ] ) ) : '';

        if ( ! wp_verify_nonce( $nonce, self::NONCE_ACTION ) || ! current_user_can( 'edit_post', $post_id ) ) {
            return;
        }

        $fields = isset( $_POST['couturier_contact'] ) && is_array( $_POST['couturier_contact'] )
            ? wp_unslash( $_POST['couturier_contact'] ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- nettoyé champ par champ ci-dessous.
            : [];

        $text      = sanitize_textarea_field( (string) ( $fields['text'] ?? '' ) );
        $phone     = sanitize_text_field( (string) ( $fields['phone'] ?? '' ) );
        $name      = sanitize_text_field( (string) ( $fields['name'] ?? '' ) );
        $role      = sanitize_text_field( (string) ( $fields['role'] ?? '' ) );
        $raw_email = trim( (string) ( $fields['email'] ?? '' ) );
        $email     = sanitize_email( $raw_email );

        if ( '' !== $raw_email && ! is_email( $email ) ) {
            $email = '';
            add_filter( 'redirect_post_location', static fn ( string $location ): string => add_query_arg( self::INVALID_EMAIL_ARG, '1', $location ) );
        }

        // Lignes vides en fin de texte retirées, lignes intérieures conservées.
        $text = trim( (string) preg_replace( '/\R/', "\n", $text ) );

        $this->update( $post_id, Contact::META_TEXT, $text );
        $this->update( $post_id, Contact::META_PHONE, $phone );
        $this->update( $post_id, Contact::META_EMAIL, $email );
        $this->update( $post_id, Contact::META_DISPLAY_NAME, $name );
        $this->update( $post_id, Contact::META_ROLE, $role );
    }

    /** Avertissement après l'enregistrement d'un e-mail invalide. */
    public function invalid_email_notice(): void {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- simple affichage.
        if ( empty( $_GET[ self::INVALID_EMAIL_ARG ] ) || Contact::POST_TYPE !== get_current_screen()?->post_type ) {
            return;
        }

        printf(
            '<div class="notice notice-warning is-dismissible"><p>%s</p></div>',
            esc_html__( 'L\'adresse e-mail saisie n\'est pas valide : elle n\'a pas été enregistrée.', 'couturier' )
        );
    }

    /**
     * Colonnes de la liste : photo avant le nom ; texte, téléphone et e-mail après.
     *
     * @param array<string, string> $columns Colonnes.
     * @return array<string, string>
     */
    public function columns( array $columns ): array {
        $date = $columns['date'] ?? null;
        unset( $columns['date'], $columns['title'] );

        $columns['couturier_contact_photo'] = __( 'Photo', 'couturier' );
        $columns['title']                   = __( 'Nom interne', 'couturier' );
        $columns['couturier_contact_name']  = __( 'Nom affiché', 'couturier' );
        $columns['couturier_contact_role']  = __( 'Fonction', 'couturier' );
        $columns['couturier_contact_text']  = __( 'Texte affiché', 'couturier' );
        $columns['couturier_contact_phone'] = __( 'Téléphone', 'couturier' );
        $columns['couturier_contact_email'] = __( 'E-mail', 'couturier' );

        if ( null !== $date ) {
            $columns['date'] = $date;
        }

        return $columns;
    }

    /** Contenu d'une colonne. */
    public function column( string $column, int $post_id ): void {
        if ( 'couturier_contact_photo' === $column ) {
            $image_id = (int) get_post_thumbnail_id( $post_id );

            if ( $image_id ) {
                echo wp_get_attachment_image( $image_id, 'thumbnail', false, [ 'class' => 'couturier-contact-photo', 'sizes' => '60px', 'alt' => '' ] );
            }

            return;
        }

        $meta = [
            'couturier_contact_name'  => Contact::META_DISPLAY_NAME,
            'couturier_contact_role'  => Contact::META_ROLE,
            'couturier_contact_text'  => Contact::META_TEXT,
            'couturier_contact_phone' => Contact::META_PHONE,
            'couturier_contact_email' => Contact::META_EMAIL,
        ][ $column ] ?? null;

        if ( null !== $meta ) {
            echo nl2br( esc_html( (string) get_post_meta( $post_id, $meta, true ) ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- échappé.
        }
    }

    /** Largeur de la colonne photo et miniature ronde de 60 px (liste des contacts). */
    public function columns_style(): void {
        if ( Contact::POST_TYPE !== get_current_screen()?->post_type ) {
            return;
        }
        ?>
        <style>
            .column-couturier_contact_photo { width: 60px; }
            .couturier-contact-photo { display: block; width: 60px; height: 60px; border-radius: 50%; object-fit: cover; }
        </style>
        <?php
    }

    /** Enregistre une méta, ou la supprime si elle est vide. */
    private function update( int $post_id, string $key, string $value ): void {
        if ( '' === $value ) {
            delete_post_meta( $post_id, $key );
        } else {
            update_post_meta( $post_id, $key, $value );
        }
    }
}

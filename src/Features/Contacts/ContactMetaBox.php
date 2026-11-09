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
 * téléphone, e-mail. Colonnes « Texte », « Téléphone » et « E-mail » dans la liste.
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
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Ajoute à l\'écran d\'un contact la boîte « Coordonnées » (texte affiché, téléphone, e-mail) et ses colonnes à la liste des contacts.', 'couturier' );
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
     * Colonnes de la liste : texte, téléphone et e-mail après le nom.
     *
     * @param array<string, string> $columns Colonnes.
     * @return array<string, string>
     */
    public function columns( array $columns ): array {
        $date = $columns['date'] ?? null;
        unset( $columns['date'] );

        $columns['title']                   = __( 'Nom interne', 'couturier' );
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
        $meta = [
            'couturier_contact_text'  => Contact::META_TEXT,
            'couturier_contact_phone' => Contact::META_PHONE,
            'couturier_contact_email' => Contact::META_EMAIL,
        ][ $column ] ?? null;

        if ( null !== $meta ) {
            echo nl2br( esc_html( (string) get_post_meta( $post_id, $meta, true ) ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- échappé.
        }
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

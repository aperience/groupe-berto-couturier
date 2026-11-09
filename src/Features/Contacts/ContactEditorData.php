<?php
/**
 * Contacts prédéfinis : données de l'éditeur de blocs
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Contacts;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\ThemeContext;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Transmet à l'éditeur de blocs la liste des contacts publiés, lue par
 * `blocks/_shared/contacts.js` (liste de choix, aperçu de l'encart).
 *
 * Le type de contenu n'est pas exposé à l'API REST (`ContactPostType`) : la liste
 * part en script en ligne, `window.couturierContacts`, au chargement de l'éditeur.
 * Un contact créé pendant l'édition d'une page n'y apparaît qu'au rechargement.
 */
final class ContactEditorData implements FeatureInterface {

    public function __construct(
        private readonly ThemeContext $context,
    ) {}

    /** Enregistre l'injection des données dans l'éditeur. */
    public function register(): void {
        add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Transmet la liste des contacts publiés à l\'éditeur de blocs, pour les choisir dans les héros.', 'couturier' );
    }

    /** Script en ligne, sans fichier, qui pose `window.couturierContacts`. */
    public function enqueue(): void {
        $contacts = array_map(
            static function ( array $contact ): array {
                $image = $contact['image_id'] ? wp_get_attachment_image_src( $contact['image_id'], 'thumbnail' ) : false;

                return [
                    'id'    => $contact['id'],
                    'name'  => $contact['name'],
                    'text'  => $contact['text'],
                    'phone' => $contact['phone'],
                    'email' => is_email( $contact['email'] ) ? $contact['email'] : '',
                    'tel'   => Contact::tel_href( $contact['phone'] ),
                    'image' => $image ? $image[0] : '',
                ];
            },
            Contact::all()
        );

        $handle = $this->context->handle( 'contacts' );

        wp_register_script( $handle, false, [], false, false ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters -- script en ligne, sans fichier.
        wp_enqueue_script( $handle );
        wp_add_inline_script( $handle, 'window.couturierContacts = ' . wp_json_encode( $contacts, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG ) . ';' );
    }
}

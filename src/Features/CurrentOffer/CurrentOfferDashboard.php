<?php
/**
 * Widget « Offre du moment » du tableau de bord
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
 * Ajoute au tableau de bord un widget qui résume l'offre du moment : son état réel
 * (le même bloc que l'écran de réglages), un aperçu « titre • texte lien », et un
 * lien vers l'écran de réglages.
 *
 * Réservé aux utilisateurs qui peuvent gérer l'offre (`CurrentOfferSettings::CAPABILITY`).
 */
final class CurrentOfferDashboard implements FeatureInterface {

    /** Identifiant du widget. */
    private const WIDGET_ID = 'couturier_current_offer';

    /**
     * @param ThemeContext $context Identité du thème, pour l'URL de l'écran de réglages.
     */
    public function __construct(
        private readonly ThemeContext $context,
    ) {}

    /** Enregistre le widget. */
    public function register(): void {
        add_action( 'wp_dashboard_setup', [ $this, 'add_widget' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Widget « Offre du moment » sur le tableau de bord : état de l\'offre, titre, texte, page, et lien vers ses réglages.', 'couturier' );
    }

    /** Ajoute le widget pour les utilisateurs qui gèrent l'offre. */
    public function add_widget(): void {
        if ( ! current_user_can( CurrentOfferSettings::CAPABILITY ) ) {
            return;
        }

        wp_add_dashboard_widget( self::WIDGET_ID, __( 'Offre du moment', 'couturier' ), [ $this, 'render' ] );
    }

    /** Affiche le contenu du widget. */
    public function render(): void {
        $settings = CurrentOffer::settings();

        CurrentOffer::render_status();

        if ( '' !== $settings['title'] ) {
            $page_id = (int) $settings['page_id'];
            $label   = '' !== $settings['link_label'] ? $settings['link_label'] : __( 'Voir l\'offre', 'couturier' );

            // Aperçu de l'offre : « Titre • Texte Intitulé du lien », le lien seulement si la page est publiée.
            printf(
                '<p><strong>%1$s</strong> &bull; %2$s %3$s</p>',
                esc_html( $settings['title'] ),
                esc_html( $settings['text'] ),
                CurrentOffer::is_valid_page( $page_id )
                    // Nouvel onglet, signalé comme dans le core : icône visible, texte pour les lecteurs d'écran.
                    ? sprintf(
                        '<a href="%1$s" target="_blank" rel="noopener">%2$s<span class="screen-reader-text"> %3$s</span><span aria-hidden="true" class="dashicons dashicons-external"></span></a>',
                        esc_url( (string) get_permalink( $page_id ) ),
                        esc_html( $label ),
                        esc_html__( '(nouvel onglet)', 'couturier' )
                    )
                    : esc_html( $label )
            );
        }

        printf(
            '<p><a class="button button-primary" href="%1$s">%2$s</a></p>',
            esc_url( menu_page_url( $this->context->handle( CurrentOffer::MENU_SLUG ), false ) ),
            esc_html__( 'Gérer l\'offre du moment', 'couturier' )
        );
    }
}

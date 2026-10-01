<?php
/**
 * E-mails HTML aux couleurs du thème
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Mail;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\Support\ViteManifest;
use PHPMailer\PHPMailer\PHPMailer;
use Timber\Timber;

/**
 * Habille tous les e-mails envoyés par `wp_mail()` — ceux du core (mot de passe oublié,
 * nouveau compte, changement d'adresse…), des plugins et du projet — dans le gabarit
 * `emails/layout.twig`, et les envoie en HTML.
 *
 * Trois cas, selon le corps reçu :
 * - **texte brut** (le core) : échappé, URL rendues cliquables, paragraphes restitués ;
 * - **fragment HTML** (`Content-Type: text/html` déclaré) : inséré tel quel. C'est la forme
 *   des e-mails du projet : un gabarit Twig qui ne contient que le corps du message ;
 * - **document HTML complet** (contient `<html`) : laissé intact, son auteur gère son rendu.
 *
 * La mise en page reprend celle des e-mails par défaut de Laravel (`illuminate/mail`), aux
 * couleurs de la charte Couturier (marine, corail).
 *
 * Le gabarit n'a pas de feuille de style externe : les messageries ne les chargent pas, et
 * Gmail comme Outlook ignorent une partie du `<style>`. Les styles sont donc posés en ligne,
 * y compris sur les balises du corps (cf. `inline_styles()`).
 *
 * Le texte d'origine part en alternative (`AltBody` → `multipart/alternative`) : lu par les
 * messageries en mode texte, et apprécié des filtres anti-spam.
 */
final class HtmlEmails implements FeatureInterface {

    /** Gabarit du document e-mail, relatif à `resources/views/`. */
    private const LAYOUT = 'emails/layout.twig';

    /** Source du logo, telle que référencée dans le manifest Vite (cf. `resources/js/email.js`). */
    private const LOGO = 'resources/images/email-logo.png';

    /**
     * Texte courant : gris ardoise teinté de marine (8,9:1 sur blanc). Le gris des e-mails
     * Laravel (`#718096`, 4,0:1) n'atteint pas l'AA (WCAG 1.4.3).
     */
    private const TEXT_COLOR = '#3d4b5c';

    /** Titres et liens : marine de la charte (11,1:1 sur blanc). */
    private const BRAND_COLOR = '#0a3c6e';

    /**
     * Styles en ligne des balises du corps, qui ne portent pas déjà d'attribut `style`.
     * Doublent les valeurs de `emails/layout.twig` : les deux se modifient ensemble.
     */
    private const TAG_STYLES = [
        'p'  => 'margin:0 0 16px;font-size:16px;line-height:1.5em;color:' . self::TEXT_COLOR . ';text-align:left;',
        'a'  => 'color:' . self::BRAND_COLOR . ';text-decoration:underline;word-break:break-word;',
        'h1' => 'margin:0 0 16px;font-size:18px;line-height:1.5em;font-weight:bold;color:' . self::BRAND_COLOR . ';text-align:left;',
        'h2' => 'margin:0 0 16px;font-size:16px;line-height:1.5em;font-weight:bold;color:' . self::BRAND_COLOR . ';text-align:left;',
        'ul' => 'margin:0 0 16px;padding:0 0 0 24px;line-height:1.5em;color:' . self::TEXT_COLOR . ';',
        'ol' => 'margin:0 0 16px;padding:0 0 0 24px;line-height:1.5em;color:' . self::TEXT_COLOR . ';',
        'li' => 'margin:0 0 8px;',
    ];

    /** Alternative texte de l'envoi en cours, posée sur PHPMailer puis oubliée. */
    private ?string $alt_body = null;

    public function __construct(
        private readonly ViteManifest $manifest = new ViteManifest(),
    ) {}

    /** Enregistre l'habillage du message et son alternative texte. */
    public function register(): void {
        add_filter( 'wp_mail', [ $this, 'wrap' ], 20 );
        add_action( 'phpmailer_init', [ $this, 'set_alt_body' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Envoie tous les e-mails du site en HTML, dans un gabarit aux couleurs du thème, avec une version texte en alternative.', 'couturier' );
    }

    /**
     * Emballe le corps du message dans le gabarit HTML.
     *
     * @param array $atts Arguments de `wp_mail()` : to, subject, message, headers, attachments.
     * @return array
     */
    public function wrap( array $atts ): array {
        $this->alt_body = null;

        $message = (string) ( $atts['message'] ?? '' );
        $headers = $this->normalize_headers( $atts['headers'] ?? [] );

        if ( false !== stripos( $message, '<html' ) ) {
            $atts['headers'] = $this->with_html_content_type( $headers );

            return $atts;
        }

        if ( $this->declares_html( $headers ) ) {
            $content  = $message;
            $alt_body = $this->html_to_text( $message );
        } else {
            $content  = $this->text_to_html( $message );
            $alt_body = $message;
        }

        $html = Timber::compile(
            self::LAYOUT,
            [
                'lang'      => get_bloginfo( 'language' ),
                'charset'   => get_bloginfo( 'charset' ),
                'subject'   => (string) ( $atts['subject'] ?? '' ),
                'preheader' => $this->preheader( $alt_body ),
                'content'   => $this->inline_styles( $content ),
                'logo_url'  => $this->manifest->entry_url( self::LOGO ),
                'site_name' => wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ),
                'home_url'  => home_url( '/' ),
            ]
        );

        // Gabarit introuvable : mieux vaut le message d'origine qu'un e-mail vide.
        if ( ! is_string( $html ) || '' === $html ) {
            return $atts;
        }

        $atts['message'] = $html;
        $atts['headers'] = $this->with_html_content_type( $headers );
        $this->alt_body  = $alt_body;

        return $atts;
    }

    /**
     * Pose l'alternative texte de l'envoi en cours.
     *
     * `wp_mail()` vide `AltBody` avant d'appeler ce hook : la valeur posée ici est donc
     * bien celle qui part. Elle est oubliée aussitôt, pour ne pas fuiter sur un envoi
     * suivant qui ne serait pas passé par `wrap()`.
     */
    public function set_alt_body( PHPMailer $mailer ): void {
        if ( null === $this->alt_body ) {
            return;
        }

        $mailer->AltBody = $this->alt_body;
        $this->alt_body  = null;
    }

    /**
     * Ramène les en-têtes à un tableau d'une ligne par en-tête.
     *
     * @param string|array $headers En-têtes tels que reçus par `wp_mail()`.
     * @return string[]
     */
    private function normalize_headers( string|array $headers ): array {
        if ( is_string( $headers ) ) {
            $headers = explode( "\n", str_replace( "\r\n", "\n", $headers ) );
        }

        return array_values( array_filter( array_map( 'trim', $headers ), 'strlen' ) );
    }

    /**
     * Indique si l'expéditeur a déclaré un corps HTML, par en-tête ou par le filtre du core.
     *
     * @param string[] $headers
     */
    private function declares_html( array $headers ): bool {
        foreach ( $headers as $header ) {
            if ( preg_match( '/^content-type:\s*text\/html/i', $header ) ) {
                return true;
            }
        }

        return 'text/html' === apply_filters( 'wp_mail_content_type', 'text/plain' );
    }

    /**
     * Remplace tout `Content-Type` par celui d'un corps HTML.
     *
     * @param string[] $headers
     * @return string[]
     */
    private function with_html_content_type( array $headers ): array {
        $headers   = array_filter( $headers, static fn( string $header ): bool => ! preg_match( '/^content-type:/i', $header ) );
        $headers[] = 'Content-Type: text/html; charset=' . get_bloginfo( 'charset' );

        return array_values( $headers );
    }

    /**
     * Convertit un corps texte en HTML : échappement, URL cliquables, paragraphes.
     *
     * Certains messages du core entourent encore leurs URL de chevrons (`<https://…>`) :
     * retirés, ils fausseraient le lien produit par `make_clickable()`.
     */
    private function text_to_html( string $text ): string {
        $html = esc_html( str_replace( "\r\n", "\n", $text ) );
        $html = (string) preg_replace( '/&lt;((?:https?:\/\/|mailto:)[^\s]+?)&gt;/i', '$1', $html );

        return wpautop( make_clickable( $html ) );
    }

    /**
     * Déduit l'alternative texte d'un fragment HTML : un lien garde son URL, les blocs
     * leurs sauts de ligne.
     */
    private function html_to_text( string $html ): string {
        $text = (string) preg_replace( '/<a\s[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)<\/a>/is', '$2 ($1)', $html );
        $text = (string) preg_replace( '/<br\s*\/?>/i', "\n", $text );
        $text = (string) preg_replace( '/<\/(p|h[1-6]|li|ul|ol|table|tr|div)>/i', "$0\n\n", $text );
        $text = html_entity_decode( wp_strip_all_tags( $text ), ENT_QUOTES, get_bloginfo( 'charset' ) );
        $text = (string) preg_replace( '/^[ \t]+|[ \t]+$/m', '', $text );

        return trim( (string) preg_replace( "/\n{3,}/", "\n\n", $text ) );
    }

    /** Pose les styles en ligne sur les balises du corps qui n'en ont pas. */
    private function inline_styles( string $html ): string {
        foreach ( self::TAG_STYLES as $tag => $style ) {
            $html = (string) preg_replace(
                '/<' . $tag . '\b(?![^>]*\sstyle=)/i',
                '<' . $tag . ' style="' . esc_attr( $style ) . '"',
                $html
            );
        }

        return $html;
    }

    /**
     * Texte d'aperçu affiché par les messageries sous l'objet : le début du message.
     */
    private function preheader( string $text ): string {
        $text = trim( (string) preg_replace( '/\s+/u', ' ', $text ) );

        return mb_strlen( $text ) > 120 ? rtrim( mb_substr( $text, 0, 119 ) ) . '…' : $text;
    }
}

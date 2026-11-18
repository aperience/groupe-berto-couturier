<?php
/**
 * Données structurées FAQ : construction du nœud (logique sans hook)
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\StructuredData;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Construit un nœud Schema.org `FAQPage` à partir des blocs « Questions
 * fréquentes » d'un contenu (`couturier/faq-item`, à n'importe quelle profondeur,
 * blocs réutilisables compris).
 *
 * Un `faq-item` enregistre un `core/heading` (la question) puis la réponse
 * (`p.wp-block-couturier-faq-item__answer`, dans le HTML propre de l'item) : la
 * structure lue par `blocks/faq-item/render.php`. Question ou réponse vide :
 * l'item est ignoré, comme au rendu.
 */
final class FaqSchema {

    /** Bloc d'une question. */
    private const ITEM = 'couturier/faq-item';

    /** Bloc réutilisable (synchronisé). */
    private const REUSABLE = 'core/block';

    /** Profondeur maximale des blocs réutilisables imbriqués (anti-boucle). */
    private const MAX_REUSABLE_DEPTH = 3;

    /** Balises HTML admises par Google dans une réponse. */
    private const ANSWER_TAGS = [
        'a'      => [ 'href' => true ],
        'br'     => [],
        'p'      => [],
        'strong' => [],
        'b'      => [],
        'em'     => [],
        'i'      => [],
        'ul'     => [],
        'ol'     => [],
        'li'     => [],
    ];

    /**
     * Nœud `FAQPage`, ou `null` si le contenu n'a aucune question valide.
     *
     * @param string $content Contenu (blocs sérialisés).
     * @param string $url     Permalien de la page, base des `@id`.
     * @return array<string, mixed>|null
     */
    public static function build( string $content, string $url ): ?array {
        $questions = self::questions( parse_blocks( $content ), 0 );

        if ( [] === $questions ) {
            return null;
        }

        return [
            '@type'      => 'FAQPage',
            '@id'        => $url . '#faq',
            'url'        => $url,
            'isPartOf'   => [ '@id' => $url . '#webpage' ],
            'mainEntity' => array_map(
                static fn( array $qa ): array => [
                    '@type'          => 'Question',
                    'name'           => $qa['question'],
                    'acceptedAnswer' => [
                        '@type' => 'Answer',
                        'text'  => $qa['answer'],
                    ],
                ],
                $questions
            ),
        ];
    }

    /**
     * Paires question / réponse des blocs, dans l'ordre du contenu.
     *
     * @param array<int, array<string, mixed>> $blocks Blocs analysés.
     * @param int                              $depth  Profondeur de blocs réutilisables.
     * @return list<array{question: string, answer: string}>
     */
    private static function questions( array $blocks, int $depth ): array {
        $found = [];

        foreach ( $blocks as $block ) {
            $name = $block['blockName'] ?? null;

            if ( self::ITEM === $name ) {
                $qa = self::item( $block );
                if ( null !== $qa ) {
                    $found[] = $qa;
                }
                continue;
            }

            if ( self::REUSABLE === $name && $depth < self::MAX_REUSABLE_DEPTH ) {
                $ref = (int) ( $block['attrs']['ref'] ?? 0 );
                $post = $ref ? get_post( $ref ) : null;
                if ( $post && 'publish' === $post->post_status ) {
                    array_push( $found, ...self::questions( parse_blocks( $post->post_content ), $depth + 1 ) );
                }
                continue;
            }

            if ( ! empty( $block['innerBlocks'] ) ) {
                array_push( $found, ...self::questions( $block['innerBlocks'], $depth ) );
            }
        }

        return $found;
    }

    /**
     * Question et réponse d'un `faq-item`, ou `null` si l'une est vide.
     *
     * @param array<string, mixed> $block Bloc analysé.
     * @return array{question: string, answer: string}|null
     */
    private static function item( array $block ): ?array {
        $heading = $block['innerBlocks'][0] ?? null;
        if ( ! $heading || 'core/heading' !== ( $heading['blockName'] ?? null ) ) {
            return null;
        }

        $question = self::plain( (string) ( $heading['innerHTML'] ?? '' ) );
        $answer   = self::answer( (string) ( $block['innerHTML'] ?? '' ) );

        if ( '' === $question || '' === trim( wp_strip_all_tags( $answer ) ) ) {
            return null;
        }

        return [ 'question' => $question, 'answer' => $answer ];
    }

    /** Texte brut : balises retirées, entités décodées, espaces normalisés. */
    private static function plain( string $html ): string {
        $text = html_entity_decode( wp_strip_all_tags( $html ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );

        return trim( (string) preg_replace( '/\s+/u', ' ', $text ) );
    }

    /** Réponse : HTML réduit aux balises admises, entités décodées. */
    private static function answer( string $html ): string {
        $html = wp_kses( $html, self::ANSWER_TAGS );
        $html = html_entity_decode( $html, ENT_QUOTES | ENT_HTML5, 'UTF-8' );

        return trim( (string) preg_replace( '/\s+/u', ' ', $html ) );
    }
}

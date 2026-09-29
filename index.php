<?php
/**
 * Template principal
 *
 * @package Couturier
 */

$context          = Timber\Timber::context();
$context['posts'] = Timber\Timber::get_posts();

// Les chaînes traduisibles sont résolues ici : `wp i18n make-pot` ne lit pas les
// fichiers .twig, les templates ne reçoivent donc que des valeurs déjà traduites.
$context['labels'] = [
    'not_found' => __( 'Aucun contenu trouvé.', 'couturier' ),
];

Timber\Timber::render( 'index.twig', $context );

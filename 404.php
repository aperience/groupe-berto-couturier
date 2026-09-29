<?php
/**
 * Template pour les erreurs 404
 *
 * @package Couturier
 */

$context = Timber\Timber::context();

// Les chaînes traduisibles sont résolues ici : `wp i18n make-pot` ne lit pas les
// fichiers .twig, les templates ne reçoivent donc que des valeurs déjà traduites.
$context['labels'] = [
    'title'     => __( 'Erreur 404 — Page introuvable', 'couturier' ),
    'back_home' => __( 'Retour à la page d\'accueil', 'couturier' ),
];

Timber\Timber::render( '404.twig', $context );

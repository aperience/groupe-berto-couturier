<?php
/**
 * Gabarit des archives de catégorie (blog)
 *
 * Même liste que la page des articles (filtre, cartes, pagination), sous un
 * en-tête : fil d'Ariane, nom de la catégorie en `<h1>`, description.
 *
 * @package Couturier
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$context               = Timber\Timber::context();
$context['posts']      = Timber\Timber::get_posts();
$context['term']       = Timber\Timber::get_term();
$context['breadcrumb'] = \Theme\Support\Breadcrumb::render();

Timber\Timber::render( 'category.twig', $context );

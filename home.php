<?php
/**
 * Gabarit de la page des articles (blog)
 *
 * WordPress ne passe pas par `page.php` pour la page choisie comme « page des articles » :
 * il cherche `home.php`, puis `index.php`. Ce gabarit affiche le contenu Gutenberg de
 * cette page (héros…) au-dessus de la liste des articles.
 *
 * @package Couturier
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$context          = Timber\Timber::context();
$context['posts'] = Timber\Timber::get_posts();

$couturier_posts_page_id = (int) get_option( 'page_for_posts' );
if ( $couturier_posts_page_id > 0 ) {
    $context['post'] = Timber\Timber::get_post( $couturier_posts_page_id );
}

Timber\Timber::render( 'home.twig', $context );

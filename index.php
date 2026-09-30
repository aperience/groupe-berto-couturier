<?php
/**
 * Template principal
 *
 * @package Couturier
 */

$context          = Timber\Timber::context();
$context['posts'] = Timber\Timber::get_posts();

Timber\Timber::render( 'index.twig', $context );

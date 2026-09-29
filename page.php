<?php
/**
 * Template pour les pages
 *
 * @package Couturier
 */

$context         = Timber\Timber::context();
$context['post'] = Timber\Timber::get_post();

Timber\Timber::render( 'page.twig', $context );

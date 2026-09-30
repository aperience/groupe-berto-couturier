<?php
/**
 * Template pour les pages
 *
 * @package Couturier
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$context         = Timber\Timber::context();
$context['post'] = Timber\Timber::get_post();

Timber\Timber::render( 'page.twig', $context );

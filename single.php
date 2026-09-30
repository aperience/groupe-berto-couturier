<?php
/**
 * Template pour les articles individuels
 *
 * @package Couturier
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$context         = Timber\Timber::context();
$context['post'] = Timber\Timber::get_post();

Timber\Timber::render( 'single.twig', $context );

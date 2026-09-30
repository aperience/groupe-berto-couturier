<?php
/**
 * Template pour les erreurs 404
 *
 * @package Couturier
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$context = Timber\Timber::context();

Timber\Timber::render( '404.twig', $context );

<?php
/**
 * Template pour les erreurs 404
 *
 * @package Couturier
 */

$context = Timber\Timber::context();

Timber\Timber::render( '404.twig', $context );

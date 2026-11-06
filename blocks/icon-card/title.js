/**
 * Titre d'une carte à pictogramme (`core/heading` imbriqué dans
 * `couturier/icon-card`) : modèle partagé par la carte (`index.js`) et par la
 * liste, qui crée la carte avec son titre pour y placer le curseur dès l'ajout.
 */
import { __ } from '@wordpress/i18n';

import { LOCKED } from '../_shared/locked-content.js';

/** Le titre d'une carte est toujours un `<h3>`. */
export const LEVEL = 3;

export const TITLE = [ 'core/heading', { level: LEVEL, lock: LOCKED, placeholder: __( 'Titre de la carte', 'couturier' ) } ];

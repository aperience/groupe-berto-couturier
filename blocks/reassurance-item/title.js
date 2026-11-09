/**
 * Titre d'un atout (`core/heading` imbriqué dans `couturier/reassurance-item`) :
 * modèle partagé par l'atout (`index.js`) et par le bloc « Réassurance », qui
 * crée l'atout avec son titre pour y placer le curseur dès l'ajout.
 */
import { __ } from '@wordpress/i18n';

import { LOCKED } from '../_shared/locked-content.js';

/** Le titre d'un atout est toujours un `<h3>`. */
export const LEVEL = 3;

export const TITLE = [ 'core/heading', { level: LEVEL, lock: LOCKED, placeholder: __( 'Titre de l\'atout', 'couturier' ) } ];

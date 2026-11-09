/**
 * Titre d'une étape (`core/heading` imbriqué dans `couturier/step`) : modèle
 * partagé par l'étape (`index.js`) et par la liste, qui crée l'étape avec son
 * titre pour y placer le curseur dès l'ajout.
 */
import { __ } from '@wordpress/i18n';

import { LOCKED } from '../_shared/locked-content.js';

/** Le titre d'une étape est toujours un `<h3>`. */
export const LEVEL = 3;

export const TITLE = [ 'core/heading', { level: LEVEL, lock: LOCKED, placeholder: __( 'Titre de l\'étape', 'couturier' ) } ];

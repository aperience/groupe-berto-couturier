/**
 * Modèle d'une étape du parcours (`couturier/journey-step`) : titre puis texte.
 * Partagé par l'étape (`index.js`) et par la liste, qui crée l'étape avec ses
 * blocs imbriqués pour placer le curseur dans le titre dès l'ajout.
 */
import { __ } from '@wordpress/i18n';

import { LOCKED } from '../_shared/locked-content.js';

/** Le titre d'une étape est toujours un `<h3>`. */
export const LEVEL = 3;

export const BODY = 'couturier/journey-step-body';

export const TEMPLATE = [
	[ 'core/heading', { level: LEVEL, lock: LOCKED, placeholder: __( 'Titre de l\'étape', 'couturier' ) } ],
	[ BODY, { lock: LOCKED }, [ [ 'core/paragraph', { placeholder: __( 'Texte de l\'étape', 'couturier' ) } ] ] ],
];

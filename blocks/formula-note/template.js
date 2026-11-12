/**
 * Contenu d'un encart du bloc « Formules » (`couturier/formula-note`) : modèle
 * partagé par l'encart (`index.js`), par la liste des encarts (`formula-notes`),
 * qui crée l'encart avec son contenu pour placer le curseur dans le titre, et
 * par le bloc « Formules », inséré avec deux encarts.
 */
import { __ } from '@wordpress/i18n';

import { LOCKED } from '../_shared/locked-content.js';

export const ITEM = 'couturier/formula-note';

/** Le titre d'un encart est toujours un `<h3>`. */
export const LEVEL = 3;

export const TEMPLATE = [
	[ 'core/heading', { level: LEVEL, lock: LOCKED, placeholder: __( 'Titre de l\'encart (facultatif)', 'couturier' ) } ],
	// Paragraphe libre : il devient une liste par « - » en début de ligne ou par
	// « Transformer en » ; d'autres paragraphes et listes s'ajoutent par « + ».
	[ 'core/paragraph', { placeholder: __( 'Contenu', 'couturier' ) } ],
];

/** Encart au fond donné (`petrol-100` : défaut, `peach-300`). */
export const note = ( background ) => [ ITEM, background ? { background } : {}, TEMPLATE ];

/**
 * Contenu d'un panneau du bloc « Objectifs et programme »
 * (`couturier/training-overview-panel`) : modèle partagé par le panneau
 * (`index.js`), par la liste des panneaux, qui crée le panneau avec son contenu
 * pour placer le curseur dans le titre, et par le bloc parent, inséré avec deux
 * panneaux. Repris de l'encart des Formules (`formula-note/template.js`).
 */
import { __ } from '@wordpress/i18n';

import { LOCKED } from '../_shared/locked-content.js';

export const ITEM = 'couturier/training-overview-panel';

/** Le titre d'un panneau est toujours un `<h3>` (sous le titre de section). */
export const LEVEL = 3;

export const TEMPLATE = [
	[ 'core/heading', { level: LEVEL, lock: LOCKED, placeholder: __( 'Titre du panneau (facultatif)', 'couturier' ) } ],
	// Paragraphe libre : il devient une liste par « - » ou « 1. » en début de
	// ligne, ou par « Transformer en » ; d'autres paragraphes et listes s'ajoutent par « + ».
	[ 'core/paragraph', { placeholder: __( 'Contenu', 'couturier' ) } ],
];

/** Panneau au fond donné (`orange-100` : défaut). */
export const panel = ( background ) => [ ITEM, background ? { background } : {}, TEMPLATE ];

/**
 * Contenu d'une carte de formule (`couturier/formula-card`) : modèle partagé par
 * la carte (`index.js`), par la liste (`formula-cards`), qui crée la carte avec
 * son contenu pour placer le curseur dans le titre dès l'ajout, et par le bloc
 * « Formules », inséré avec trois cartes.
 */
import { __ } from '@wordpress/i18n';

import { LOCKED } from '../_shared/locked-content.js';

export const ITEM = 'couturier/formula-card';

/** Le titre d'une carte est toujours un `<h3>`. */
export const LEVEL = 3;

export const PRICE_CLASS = 'wp-block-couturier-formula-card__price';
export const NOTE_CLASS = 'wp-block-couturier-formula-card__note';
export const SUBTITLE_CLASS = 'wp-block-couturier-formula-card__subtitle';
export const DETAILS_CLASS = 'wp-block-couturier-formula-card__details';

export const TEMPLATE = [
	[ 'core/heading', { level: LEVEL, lock: LOCKED, placeholder: __( 'Nom de la formule', 'couturier' ) } ],
	[ 'core/paragraph', { lock: LOCKED, className: PRICE_CLASS, placeholder: __( 'Prix (facultatif)', 'couturier' ) } ],
	[ 'core/paragraph', { lock: LOCKED, className: SUBTITLE_CLASS, placeholder: __( 'Public visé (facultatif)', 'couturier' ) } ],
	[
		'core/paragraph',
		{
			lock: LOCKED,
			className: DETAILS_CLASS,
			placeholder: __( 'Conduite, tarif… (Maj + Entrée pour aller à la ligne)', 'couturier' ),
		},
	],
	[
		'core/buttons',
		{ lock: LOCKED },
		[ [ 'core/button', { hasArrow: true, lock: LOCKED, text: __( 'Choisir cette formule', 'couturier' ) } ] ],
	],
	[
		'core/paragraph',
		{ lock: LOCKED, className: NOTE_CLASS, placeholder: __( 'Texte après le bouton (facultatif)', 'couturier' ) },
	],
];

export const CARD = [ ITEM, {}, TEMPLATE ];

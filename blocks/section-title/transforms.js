/**
 * Transformations du bloc « Titre de section » (menu « Transformer en » de la
 * barre d'outils) :
 *
 * - un titre libre (`core/heading`) → titre de section, sans sous-titre ;
 * - un titre suivi d'un paragraphe, sélectionnés ensemble → titre de section,
 *   le paragraphe devenant le sous-titre ;
 * - un titre de section → titre libre, suivi du sous-titre en paragraphe s'il
 *   y en a un : rien n'est perdu.
 *
 * Passent d'un bloc à l'autre le niveau (H2 / H3), le texte (mise en avant
 * comprise) et l'ancre du titre. Le titre imbriqué reçoit le verrou du bloc ; le
 * titre libre le perd, sans quoi il ne pourrait être ni supprimé ni déplacé.
 *
 * Une sélection de blocs de types différents n'est proposée par WordPress qu'à
 * une transformation `blocks: [ '*' ]` : son `isMatch` (qui reçoit les blocs
 * quand `isMultiBlock` est vrai) n'accepte que la paire titre + paragraphe, dans
 * cet ordre.
 */
import { createBlock } from '@wordpress/blocks';
import { RichText } from '@wordpress/block-editor';

import { LOCKED } from '../_shared/locked-content.js';
import metadata from './block.json';

/** Attributs du titre conservés d'un bloc à l'autre. */
const headingAttributes = ( { level, content, anchor } ) => ( { level, content, anchor } );

/** Titre de section depuis les attributs d'un `core/heading` (et un sous-titre). */
const toSectionTitle = ( heading, subtitle ) =>
	createBlock( metadata.name, subtitle ? { subtitle } : {}, [
		createBlock( 'core/heading', { ...headingAttributes( heading ), lock: LOCKED } ),
	] );

/** Paire titre + paragraphe, dans cet ordre. */
const isHeadingAndParagraph = ( blocks ) =>
	2 === blocks.length && 'core/heading' === blocks[ 0 ].name && 'core/paragraph' === blocks[ 1 ].name;

export default {
	from: [
		{
			type: 'block',
			blocks: [ 'core/heading' ],
			transform: ( attributes ) => toSectionTitle( attributes ),
		},
		{
			type: 'block',
			blocks: [ '*' ],
			isMultiBlock: true,
			isMatch: ( attributes, blocks ) => isHeadingAndParagraph( blocks ),
			// `content` du paragraphe : objet `RichTextData`, ramené à son HTML.
			transform: ( [ heading, paragraph ] ) => toSectionTitle( heading, String( paragraph.content ?? '' ) ),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/heading' ],
			transform: ( { subtitle }, innerBlocks ) => {
				const heading = innerBlocks.find( ( block ) => 'core/heading' === block.name );
				const blocks = [ createBlock( 'core/heading', heading ? headingAttributes( heading.attributes ) : { level: 2 } ) ];

				if ( ! RichText.isEmpty( subtitle ) ) {
					blocks.push( createBlock( 'core/paragraph', { content: subtitle } ) );
				}

				return blocks;
			},
		},
	],
};

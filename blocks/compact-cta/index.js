/**
 * Bloc « Appel à action compact » (`couturier/compact-cta`) : bandeau clair arrondi,
 * titre et texte à gauche, un bouton à droite (Figma 301:6347).
 *
 * Même structure que le CTA (`blocks/cta/index.js`) : titre `core/heading` toujours
 * en H2, texte `core/paragraph`, tous deux verrouillés, et un `core/button`
 * facultatif (pétrole foncé avec flèche), remis par le panneau « Bouton ».
 * Couleur du fond : styles de bloc (panneau « Styles »), sans attribut.
 *
 * `save()` n'enregistre que les blocs imbriqués : l'enveloppe est produite par
 * `render.php`, qui n'affiche rien si le titre ou le texte est vide.
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { ButtonsControl, useButtonCount } from '../_shared/buttons.js';
import {
	LOCKED,
	REMOVABLE,
	hideLockedControls,
	textOf,
	useLockedContent,
	useNonBreakingPunctuation,
} from '../_shared/locked-content.js';
import metadata from './block.json';
import './formats.js';

const BUTTONS = [ [ 'core/button', { className: 'is-style-deep', hasArrow: true, lock: REMOVABLE } ] ];

const TEMPLATE = [
	[ 'core/heading', { level: 2, lock: LOCKED, placeholder: __( 'Titre', 'couturier' ) } ],
	[ 'core/paragraph', { lock: LOCKED, placeholder: __( 'Texte', 'couturier' ) } ],
	[ 'core/buttons', { lock: REMOVABLE }, BUTTONS ],
];

/** Le titre est toujours un `<h2>`. */
const LEVEL = 2;

function Edit( { clientId, isSelected } ) {
	const blocks = useSelect( ( select ) => select( blockEditorStore ).getBlocks( clientId ), [ clientId ] );
	const isEditing = useSelect(
		( select ) => isSelected || select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId, isSelected ]
	);

	const heading = blocks.find( ( block ) => block.name === 'core/heading' );
	const paragraph = blocks.find( ( block ) => block.name === 'core/paragraph' );
	const isIncomplete = blocks.length > 0 && ( ! textOf( heading ) || ! textOf( paragraph ) );
	const [ buttonCount, setButtonCount ] = useButtonCount( clientId, blocks, BUTTONS );

	useLockedContent( blocks, { level: LEVEL } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (cf. `blocks/CLAUDE.md`).
	const innerBlocksProps = useInnerBlocksProps(
		useBlockProps(),
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	return (
		<>
			<ButtonsControl count={ buttonCount } setCount={ setButtonCount } max={ 1 } />
			{ isEditing && isIncomplete && (
				<Notice status="warning" isDismissible={ false } className="wp-block-couturier-compact-cta__notice">
					{ __( 'Le titre et le texte sont obligatoires : sans eux, ce bloc n\'est pas affiché sur le site.', 'couturier' ) }
				</Notice>
			) }
			<div { ...innerBlocksProps } />
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );

hideLockedControls( metadata.name );

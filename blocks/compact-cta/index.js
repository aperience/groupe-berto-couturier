/**
 * Bloc « Appel à action compact » (`couturier/compact-cta`) : bandeau clair arrondi,
 * titre et texte à gauche, un ou deux boutons à droite sur une ligne
 * (Figma 301:6347, 301:6801).
 *
 * Même structure que le CTA (`blocks/cta/index.js`) : titre `core/heading` toujours
 * en H2, texte `core/paragraph`, tous deux verrouillés, et zéro à deux
 * `core/button` (panneau « Boutons ») : toujours pétrole foncé avec flèche en
 * premier, orange (style par défaut) en second.
 * Fond (`background`) dans une liste fermée (`_shared/backgrounds.js`), pétrole
 * clair par défaut → classe `is-bg-{fond}`. Anciens styles de bloc
 * (`is-style-peach` / `-pink` / `-default`, supprimés) : migrés à l'ouverture
 * dans l'éditeur (pêche/300, orange/100, défaut), puis classe retirée.
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
import { useEffect } from '@wordpress/element';
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
import { BackgroundPanel, useBackground } from '../_shared/backgrounds.js';
import metadata from './block.json';
import './formats.js';

const BUTTONS = [
	[ 'core/button', { className: 'is-style-deep', hasArrow: true, lock: REMOVABLE } ],
	[ 'core/button', { lock: REMOVABLE } ],
];

const TEMPLATE = [
	[ 'core/heading', { level: 2, lock: LOCKED, placeholder: __( 'Titre', 'couturier' ) } ],
	[ 'core/paragraph', { lock: LOCKED, placeholder: __( 'Texte', 'couturier' ) } ],
	[ 'core/buttons', { lock: REMOVABLE }, BUTTONS ],
];

/** Anciens styles de bloc → fond. */
const LEGACY_STYLES = { default: undefined, peach: 'peach-300', pink: 'orange-100' };
const LEGACY_PATTERN = /(^|\s)is-style-(default|peach|pink)(?=\s|$)/;

/** Le titre est toujours un `<h2>`. */
const LEVEL = 2;

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const blocks = useSelect( ( select ) => select( blockEditorStore ).getBlocks( clientId ), [ clientId ] );
	const isEditing = useSelect(
		( select ) => isSelected || select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId, isSelected ]
	);

	const heading = blocks.find( ( block ) => block.name === 'core/heading' );
	const paragraph = blocks.find( ( block ) => block.name === 'core/paragraph' );
	const isIncomplete = blocks.length > 0 && ( ! textOf( heading ) || ! textOf( paragraph ) );
	const [ buttonCount, setButtonCount ] = useButtonCount( clientId, blocks, BUTTONS );

	const background = useBackground( metadata, attributes.background );

	// Migration des anciens styles de bloc.
	const className = attributes.className ?? '';
	useEffect( () => {
		const match = className.match( LEGACY_PATTERN );
		if ( ! match ) {
			return;
		}
		setAttributes( {
			...( LEGACY_STYLES[ match[ 2 ] ] ? { background: LEGACY_STYLES[ match[ 2 ] ] } : {} ),
			className: className.replace( LEGACY_PATTERN, '' ).trim() || undefined,
		} );
	}, [ className, setAttributes ] );

	useLockedContent( blocks, { level: LEVEL } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (cf. `blocks/CLAUDE.md`).
	const innerBlocksProps = useInnerBlocksProps(
		useBlockProps( { className: background.className } ),
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	return (
		<>
			<BackgroundPanel
				{ ...background }
				title={ __( 'Fond du bandeau', 'couturier' ) }
				onChange={ ( slug ) => setAttributes( { background: slug } ) }
			/>
			<ButtonsControl count={ buttonCount } setCount={ setButtonCount } max={ 2 } />
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

/**
 * Bloc « Titre de section » (`couturier/section-title`) : titre centré, puis
 * sous-titre facultatif.
 *
 * - le titre est un `core/heading` imbriqué (panneau Structure, cf.
 *   `blocks/CLAUDE.md`), verrouillé par `templateLock: 'all'`, en H2 ou H3 au
 *   choix (`LevelControl`), avec mise en avant ;
 * - le sous-titre est un attribut (`source: html`), écrit après le titre par
 *   `save()` : compté par le compteur de mots. Vide, il n'est pas enregistré.
 *
 * `save()` n'enregistre que le titre et le sous-titre : l'enveloppe `<hgroup>`
 * est produite par `render.php`, qui n'affiche rien sans titre.
 */
import { getBlockType, registerBlockType } from '@wordpress/blocks';
import {
	BlockControls,
	HeadingLevelDropdown,
	InnerBlocks,
	RichText,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

import {
	LOCKED,
	hideLockedControls,
	nonBreaking,
	textOf,
	useLockedContent,
	useNonBreakingPunctuation,
} from '../_shared/locked-content.js';
import metadata from './block.json';
import './formats.js';
import transforms from './transforms.js';

const TEMPLATE = [ [ 'core/heading', { level: 2, lock: LOCKED, placeholder: __( 'Titre', 'couturier' ) } ] ];

/** Le titre, seul bloc imbriqué, verrouillé. */
const LOCKED_BLOCKS = [ 'core/heading' ];

/** Niveaux proposés : ceux de `RestrictHeadingLevels` (H2, H3). */
const getLevels = () => getBlockType( 'core/heading' )?.attributes?.levelOptions?.default ?? [ 2, 3 ];

/** Sélecteur de niveau du titre, dans la barre d'outils. */
function LevelControl( { clientId, level } ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	return (
		<BlockControls group="block">
			<HeadingLevelDropdown
				value={ level }
				options={ getLevels() }
				onChange={ ( newLevel ) => updateBlockAttributes( clientId, { level: newLevel } ) }
			/>
		</BlockControls>
	);
}

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const blocks = useSelect( ( select ) => select( blockEditorStore ).getBlocks( clientId ), [ clientId ] );
	// Bloc ou titre sélectionné. Sinon, le canvas montre le rendu du site.
	const isEditing = useSelect(
		( select ) => isSelected || select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId, isSelected ]
	);

	const heading = blocks.find( ( block ) => block.name === 'core/heading' );

	// Titre toujours verrouillé (son niveau reste au choix) ; espace insécable
	// avant « ? ! : ; ».
	useLockedContent( blocks, { names: LOCKED_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
	const { children, ...innerBlocksProps } = useInnerBlocksProps( useBlockProps(), {
		template: blocks.length ? undefined : TEMPLATE,
		templateLock: 'all',
	} );

	return (
		<>
			{ heading && <LevelControl clientId={ heading.clientId } level={ heading.attributes.level } /> }
			<hgroup { ...innerBlocksProps }>
				{ isEditing && blocks.length > 0 && ! textOf( heading ) && (
					<Notice status="warning" isDismissible={ false } className="wp-block-couturier-section-title__notice">
						{ __( 'Le titre est obligatoire : sans lui, ce bloc n\'est pas affiché sur le site.', 'couturier' ) }
					</Notice>
				) }
				{ children }
				<RichText
					tagName="p"
					className="wp-block-couturier-section-title__subtitle"
					aria-label={ __( 'Sous-titre', 'couturier' ) }
					placeholder={ __( 'Sous-titre (facultatif)', 'couturier' ) }
					value={ attributes.subtitle }
					onChange={ ( subtitle ) => setAttributes( { subtitle: nonBreaking( subtitle ) } ) }
					allowedFormats={ [ 'core/bold', 'core/italic', 'core/link' ] }
					disableLineBreaks
				/>
			</hgroup>
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	transforms,
	save: ( { attributes } ) => (
		<>
			<InnerBlocks.Content />
			{ ! RichText.isEmpty( attributes.subtitle ) && (
				<RichText.Content tagName="p" className="wp-block-couturier-section-title__subtitle" value={ attributes.subtitle } />
			) }
		</>
	),
} );

// Titre sélectionné : ni cadenas, ni variations de niveau…
hideLockedControls( metadata.name, LOCKED_BLOCKS );

// … mais le sélecteur de niveau, que `templateLock: 'all'` retire de sa barre
// d'outils : c'est le titre que l'on sélectionne le plus souvent.
addFilter(
	'editor.BlockEdit',
	`${ metadata.name }/heading-level`,
	createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			const isInBlock = useSelect(
				( select ) => {
					const editor = select( blockEditorStore );

					return (
						'core/heading' === props.name &&
						metadata.name === editor.getBlockName( editor.getBlockRootClientId( props.clientId ) )
					);
				},
				[ props.name, props.clientId ]
			);

			return (
				<>
					{ isInBlock && props.isSelected && <LevelControl clientId={ props.clientId } level={ props.attributes.level } /> }
					<BlockEdit { ...props } />
				</>
			);
		},
		'withSectionTitleLevel'
	)
);

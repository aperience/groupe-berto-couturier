/**
 * Bloc « Titre de section » (`couturier/section-title`) : titre, puis
 * sous-titre facultatif, centrés (par défaut) ou alignés à gauche.
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
	AlignmentControl,
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

/** Alignements proposés : gauche ou centré (défaut). */
const ALIGNMENTS = [
	{ icon: 'editor-alignleft', title: __( 'Aligner le texte à gauche', 'couturier' ), align: 'left' },
	{ icon: 'editor-aligncenter', title: __( 'Centrer le texte', 'couturier' ), align: 'center' },
];

/** Classe d'alignement : seul l'alignement à gauche en pose une (centré = défaut). */
const alignClass = ( textAlign ) => ( 'left' === textAlign ? 'has-text-align-left' : undefined );

/**
 * Sélecteurs de niveau du titre et d'alignement du bloc, dans la barre d'outils.
 *
 * @param {Object} props
 * @param {string} props.headingId Identifiant du titre imbriqué.
 * @param {number} props.level     Niveau du titre.
 * @param {string} props.blockId   Identifiant du bloc « Titre de section ».
 * @param {string} props.textAlign Alignement du bloc.
 */
function ToolbarControls( { headingId, level, blockId, textAlign } ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	return (
		<BlockControls group="block">
			{ headingId && (
				<HeadingLevelDropdown
					value={ level }
					options={ getLevels() }
					onChange={ ( newLevel ) => updateBlockAttributes( headingId, { level: newLevel } ) }
				/>
			) }
			<AlignmentControl
				value={ textAlign }
				alignmentControls={ ALIGNMENTS }
				onChange={ ( newAlign ) => updateBlockAttributes( blockId, { textAlign: newAlign ?? 'center' } ) }
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
	const { children, ...innerBlocksProps } = useInnerBlocksProps( useBlockProps( { className: alignClass( attributes.textAlign ) } ), {
		template: blocks.length ? undefined : TEMPLATE,
		templateLock: 'all',
	} );

	return (
		<>
			<ToolbarControls
				headingId={ heading?.clientId }
				level={ heading?.attributes.level }
				blockId={ clientId }
				textAlign={ attributes.textAlign }
			/>
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

// … mais les sélecteurs de niveau et d'alignement, que `templateLock: 'all'`
// retire de sa barre d'outils : c'est le titre que l'on sélectionne le plus souvent.
addFilter(
	'editor.BlockEdit',
	`${ metadata.name }/heading-level`,
	createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			// Bloc parent, s'il s'agit du titre d'un « Titre de section ».
			const parent = useSelect(
				( select ) => {
					if ( 'core/heading' !== props.name ) {
						return null;
					}

					const editor = select( blockEditorStore );
					const parentId = editor.getBlockRootClientId( props.clientId );

					return metadata.name === editor.getBlockName( parentId )
						? { clientId: parentId, textAlign: editor.getBlockAttributes( parentId )?.textAlign }
						: null;
				},
				[ props.name, props.clientId ]
			);

			return (
				<>
					{ parent && props.isSelected && (
						<ToolbarControls
							headingId={ props.clientId }
							level={ props.attributes.level }
							blockId={ parent.clientId }
							textAlign={ parent.textAlign }
						/>
					) }
					<BlockEdit { ...props } />
				</>
			);
		},
		'withSectionTitleLevel'
	)
);

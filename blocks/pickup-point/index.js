/**
 * Point de ramassage (`couturier/pickup-point`) : pastille numérotée, nom,
 * horaires, adresse.
 *
 * - la pastille et son numéro sont du CSS (compteur de la liste) ;
 * - le nom est un `core/heading` imbriqué, toujours un `<h3>` (panneau
 *   Structure), sans format : `render.php` le place dans un `<button>` ;
 * - les horaires sont un attribut écrit dans le HTML enregistré (compteur de
 *   mots) ;
 * - l'adresse, saisie dans la barre latérale, n'est pas affichée : Google la
 *   géocode pour la carte. Sans elle, le point est listé mais ne change pas la
 *   carte.
 *
 * Sans nom, le point n'est pas rendu sur le site (`is-incomplete`).
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	InspectorControls,
	RichText,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { Notice, PanelBody, TextControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { HEADING_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import {
	hideLockedControls,
	nonBreaking,
	textOf,
	useLockedContent,
	useNonBreakingPunctuation,
} from '../_shared/locked-content.js';
import metadata from './block.json';
import { LEVEL, NAME } from './name.js';

const TEMPLATE = [ NAME ];

const NAME_BLOCKS = [ 'core/heading' ];

const ROOT = 'couturier/pickup-map';

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { address, hours } = attributes;

	const { blocks, isEditing } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const [ rootId ] = editor.getBlockParentsByBlockName( clientId, ROOT, true );

			return {
				blocks: editor.getBlocks( clientId ),
				isEditing:
					isSelected ||
					editor.hasSelectedInnerBlock( clientId, true ) ||
					( !! rootId && ( editor.isBlockSelected( rootId ) || editor.hasSelectedInnerBlock( rootId, true ) ) ),
			};
		},
		[ clientId, isSelected ]
	);

	const isIncomplete = blocks.length > 0 && ! textOf( blocks[ 0 ] );

	useLockedContent( blocks, { level: LEVEL, names: NAME_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		useBlockProps( { className: isIncomplete ? 'is-incomplete' : undefined } ),
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Adresse', 'couturier' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Adresse du point de ramassage', 'couturier' ) }
						help={ __( 'Telle qu\'on la chercherait dans Google Maps (ex. « Place de la gare, 28100 Dreux »). Elle n\'est pas affichée : elle place le point sur la carte.', 'couturier' ) }
						value={ address }
						onChange={ ( value ) => setAttributes( { address: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<li { ...innerBlocksProps }>
				{ children }
				<RichText
					tagName="p"
					className="wp-block-couturier-pickup-point__hours"
					aria-label={ __( 'Horaires', 'couturier' ) }
					placeholder={ __( 'Horaires', 'couturier' ) }
					value={ hours }
					onChange={ ( value ) => setAttributes( { hours: nonBreaking( value ) } ) }
					allowedFormats={ [ 'core/bold' ] }
				/>
				{ isEditing && isIncomplete && (
					<Notice status="warning" isDismissible={ false } className="wp-block-couturier-pickup-point__notice">
						{ __( 'Nom obligatoire : sans lui, ce point n\'est pas affiché sur le site.', 'couturier' ) }
					</Notice>
				) }
				{ isEditing && ! isIncomplete && ! address.trim() && (
					<Notice status="warning" isDismissible={ false } className="wp-block-couturier-pickup-point__notice">
						{ __( 'Sans adresse (barre latérale), ce point ne peut pas être affiché sur la carte.', 'couturier' ) }
					</Notice>
				) }
			</li>
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: ( { attributes } ) => (
		<>
			<InnerBlocks.Content />
			{ ! RichText.isEmpty( attributes.hours ) && (
				<RichText.Content tagName="p" className="wp-block-couturier-pickup-point__hours" value={ attributes.hours } />
			) }
		</>
	),
} );

// Aucun format dans le nom : il est rendu dans un `<button>`.
restrictFormats( metadata.name, {
	'core/heading': [ ...HEADING_FORMATS_OFF, 'core/strikethrough', 'core/superscript', 'core/subscript' ],
} );

// Nom sélectionné : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name, NAME_BLOCKS );

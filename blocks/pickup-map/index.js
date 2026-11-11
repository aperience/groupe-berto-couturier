/**
 * Bloc « Centre et points de ramassage » (`couturier/pickup-map`) : titre,
 * carte Google Maps (iframe « Embed », sans clé d'API) et liste facultative de
 * points de ramassage.
 *
 * - le titre est un `core/heading` imbriqué, toujours un `<h2>`, avec mise en
 *   avant (orange foncé) ;
 * - le texte `couturier/pickup-map-body` (paragraphes et listes libres,
 *   facultatif) suit le titre, sur toute la largeur ; un bloc créé avant lui le
 *   reçoit à l'ouverture dans l'éditeur ;
 * - la liste `couturier/pickup-map-points` (verrouillée, son propre
 *   `templateLock: false`) reçoit les points, sans limite ;
 * - l'adresse du centre est saisie dans la barre latérale (commentaire du bloc) ;
 * - la note est un attribut écrit après les blocs imbriqués (compteur de mots).
 *
 * Onglets : « Le centre » seul tant qu'aucun point n'est nommé (pas d'onglets
 * au rendu, la carte prend toute la largeur) ; avec des points, « Points de
 * ramassage » s'ajoute. Dans le canvas, la carte montre toujours le centre et
 * les onglets sont un aperçu inerte.
 *
 * Rien n'est rendu sans titre ou sans adresse du centre.
 */
import { createBlock, registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	InspectorControls,
	RichText,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { Notice, PanelBody, TextControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { LOCKED, hideLockedControls, nonBreaking, textOf, useLockedContent, useNonBreakingPunctuation } from '../_shared/locked-content.js';
import { hasContent } from '../image-text-body/content.js';
import { NAME } from '../pickup-point/name.js';
import metadata from './block.json';
import './formats.js';

const BODY = 'couturier/pickup-map-body';

const TEMPLATE = [
	[ 'core/heading', { level: 2, lock: LOCKED, content: __( 'Le centre et les points de ramassage', 'couturier' ), placeholder: __( 'Titre', 'couturier' ) } ],
	[ BODY, { lock: LOCKED }, [ [ 'core/paragraph', { placeholder: __( 'Texte (facultatif)', 'couturier' ) } ] ] ],
	[ 'couturier/pickup-map-points', { lock: LOCKED }, [ [ 'couturier/pickup-point', {}, [ NAME ] ] ] ],
];

const LOCKED_BLOCKS = [ 'core/heading', BODY, 'couturier/pickup-map-points' ];

const LEVEL = 2;

/** URL de la carte (même forme que `Theme\Support\GoogleMapsEmbed`). */
const mapUrl = ( address ) => `https://maps.google.com/maps?${ new URLSearchParams( { q: address, z: 15, hl: 'fr', output: 'embed' } ) }`;

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { centerAddress, note } = attributes;

	const { blocks, isEditing } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );

			return {
				blocks: editor.getBlocks( clientId ),
				isEditing: isSelected || editor.hasSelectedInnerBlock( clientId, true ),
			};
		},
		[ clientId, isSelected ]
	);

	const heading = blocks.find( ( block ) => 'core/heading' === block.name );
	const body = blocks.find( ( block ) => BODY === block.name );
	const list = blocks.find( ( block ) => 'couturier/pickup-map-points' === block.name );
	const hasPoints = !! list?.innerBlocks.some( ( point ) => !! textOf( point.innerBlocks[ 0 ] ) );
	const address = centerAddress.trim();
	const isIncomplete = blocks.length > 0 && ( ! textOf( heading ) || ! address );

	// Bloc créé avant le texte : texte ajouté après le titre (une seule fois).
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const hasBody = blocks.some( ( block ) => BODY === block.name );

	useEffect( () => {
		if ( ! blocks.length || hasBody ) {
			return;
		}

		const body = createBlock( BODY, { lock: LOCKED }, [ createBlock( 'core/paragraph', { placeholder: __( 'Texte (facultatif)', 'couturier' ) } ) ] );
		const index = blocks.findIndex( ( block ) => 'core/heading' === block.name ) + 1;

		replaceInnerBlocks( clientId, [ ...blocks.slice( 0, index ), body, ...blocks.slice( index ) ], false );
	}, [ blocks.length, hasBody ] ); // eslint-disable-line react-hooks/exhaustive-deps

	useLockedContent( blocks, { level: LEVEL, names: LOCKED_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		// Éléments présents (zones de la grille, `block/_pickup-map.scss`). En
		// cours d'édition, champs vides compris : ils restent saisissables.
		useBlockProps( {
			className: [
				( hasPoints || isEditing ) && 'has-points',
				( isEditing || !! body?.innerBlocks.some( hasContent ) ) && 'has-body',
				( isEditing || ! RichText.isEmpty( note ) ) && 'has-note',
			].filter( Boolean ).join( ' ' ) || undefined,
		} ),
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Le centre', 'couturier' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Adresse du centre', 'couturier' ) }
						help={ __( 'Telle qu\'on la chercherait dans Google Maps. Obligatoire : la carte de l\'onglet « Le centre ».', 'couturier' ) }
						value={ centerAddress }
						onChange={ ( value ) => setAttributes( { centerAddress: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...innerBlocksProps }>
				{ isEditing && isIncomplete && (
					<Notice status="warning" isDismissible={ false } className="wp-block-couturier-pickup-map__notice">
						{ __( 'Le titre et l\'adresse du centre (barre latérale) sont obligatoires : sans eux, ce bloc n\'est pas affiché sur le site.', 'couturier' ) }
					</Notice>
				) }
				{ children }
				{ hasPoints && (
					<div className="wp-block-couturier-pickup-map__tabs" aria-hidden="true">
						<span className="wp-block-couturier-pickup-map__tab" aria-selected="true">{ __( 'Le centre', 'couturier' ) }</span>
						<span className="wp-block-couturier-pickup-map__tab">{ __( 'Points de ramassage', 'couturier' ) }</span>
					</div>
				) }
				<div className="wp-block-couturier-pickup-map__map">
					{ address ? (
						<iframe
							className="wp-block-couturier-pickup-map__frame"
							src={ mapUrl( address ) }
							title={ __( 'Aperçu de la carte du centre', 'couturier' ) }
							loading="lazy"
							referrerPolicy="no-referrer-when-downgrade"
						/>
					) : (
						isEditing && (
							<p className="wp-block-couturier-pickup-map__empty">
								{ __( 'Saisissez l\'adresse du centre dans la barre latérale pour afficher la carte.', 'couturier' ) }
							</p>
						)
					) }
				</div>
				<RichText
					tagName="p"
					className="wp-block-couturier-pickup-map__note"
					aria-label={ __( 'Note', 'couturier' ) }
					placeholder={ __( 'Note (facultative)', 'couturier' ) }
					value={ note }
					onChange={ ( value ) => setAttributes( { note: nonBreaking( value ) } ) }
					allowedFormats={ [ 'core/bold', 'core/italic', 'core/link' ] }
				/>
			</div>
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: ( { attributes } ) => (
		<>
			<InnerBlocks.Content />
			{ ! RichText.isEmpty( attributes.note ) && (
				<RichText.Content tagName="p" className="wp-block-couturier-pickup-map__note" value={ attributes.note } />
			) }
		</>
	),
} );

// Titre ou liste sélectionnés : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name, LOCKED_BLOCKS );

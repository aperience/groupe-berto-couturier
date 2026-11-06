/**
 * Carte du bloc « Cartes à pictogramme » (`couturier/icon-card`) : pictogramme,
 * titre et texte.
 *
 * - le pictogramme (`iconId`) est un SVG (ou PNG) de la médiathèque, utilisé en
 *   **masque CSS** dans une pastille : il est peint en pétrole quelles que soient
 *   les couleurs du fichier, et reste décoratif ;
 * - le titre est un `core/heading` imbriqué, toujours un `<h3>` : seul bloc que
 *   lit le panneau Structure. Verrouillé, sans format ;
 * - le texte est un attribut (`text`), écrit après le titre dans le HTML
 *   enregistré : le compteur de mots le lit. Gras, italique et lien permis.
 *
 * Aperçu de l'inserteur : `iconId` négatif, cf. `example-icons.js`.
 *
 * Sans titre, la carte n'est pas rendue sur le site (`is-incomplete`). Sans
 * pictogramme ou sans texte, elle est rendue sans eux.
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
	RichText,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { Button, Notice, PanelBody } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { HEADING_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import { plus, replace, trash } from '../_shared/icons.js';
import {
	hideLockedControls,
	nonBreaking,
	textOf,
	useLockedContent,
	useNonBreakingPunctuation,
} from '../_shared/locked-content.js';
import metadata from './block.json';
import { exampleIconUrl } from './example-icons.js';
import { LEVEL, TITLE } from './title.js';

const TEMPLATE = [ TITLE ];

/** Pictogrammes acceptés : SVG de préférence, PNG à fond transparent sinon. */
const ICON_TYPES = [ 'image/svg+xml', 'image/png' ];

/** Formats du texte. */
const TEXT_FORMATS = [ 'core/bold', 'core/italic', 'core/link' ];

const TITLE_BLOCKS = [ 'core/heading' ];

const ROOT = 'couturier/icon-cards';

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { iconId, text } = attributes;

	const { blocks, isEditing, isCardEditing, iconUrl } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const [ rootId ] = editor.getBlockParentsByBlockName( clientId, ROOT, true );

			return {
				blocks: editor.getBlocks( clientId ),
				// La carte, son titre ou son texte sélectionné : contrôles du pictogramme.
				isCardEditing: isSelected || editor.hasSelectedInnerBlock( clientId, true ),
				// Liste ou l'une de ses cartes en cours d'édition : les emplacements
				// vides ne s'affichent qu'alors (bloc désélectionné = rendu du site).
				isEditing:
					isSelected ||
					editor.hasSelectedInnerBlock( clientId, true ) ||
					( !! rootId && ( editor.isBlockSelected( rootId ) || editor.hasSelectedInnerBlock( rootId, true ) ) ),
				// `iconId` négatif : pictogramme de l'aperçu de l'inserteur (`example-icons.js`).
				iconUrl:
					exampleIconUrl( iconId ) ??
					( iconId > 0 ? select( coreStore ).getMedia( iconId, { context: 'view' } )?.source_url : undefined ),
			};
		},
		[ clientId, isSelected, iconId ]
	);

	const isIncomplete = blocks.length > 0 && ! textOf( blocks[ 0 ] );

	// Titre toujours verrouillé, toujours en H3 ; espace insécable avant « ? ! : ; ».
	useLockedContent( blocks, { level: LEVEL, names: TITLE_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		useBlockProps( { className: isIncomplete ? 'is-incomplete' : undefined } ),
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	const picker = ( content ) => (
		<MediaUploadCheck>
			<MediaUpload
				value={ iconId }
				allowedTypes={ ICON_TYPES }
				onSelect={ ( media ) => setAttributes( { iconId: media?.id } ) }
				render={ ( { open } ) => content( open ) }
			/>
		</MediaUploadCheck>
	);

	const icon = iconUrl ? (
		<span className="wp-block-couturier-icon-card__icon" aria-hidden="true" style={ { '--icon': `url("${ iconUrl }")` } } />
	) : null;

	// Pastille : pictogramme, emplacement « + » en cours d'édition, rien sinon.
	// Carte en cours d'édition (elle, son titre ou son texte) : boutons
	// « Remplacer » et « Supprimer » dans le coin de la carte, et pastille
	// cliquable pour remplacer. Aucun contrôle hors édition : rendu du site.
	let badge = null;

	if ( icon && isCardEditing ) {
		badge = picker( ( open ) => (
			<>
				<span className="wp-block-couturier-icon-card__badge">
					<Button className="wp-block-couturier-icon-card__replace" onClick={ open } label={ __( 'Remplacer le pictogramme', 'couturier' ) } showTooltip>
						{ icon }
					</Button>
				</span>
				{ /* Coin supérieur droit : hors de la barre d'outils du titre, posée au-dessus de la pastille. */ }
				<span className="wp-block-couturier-icon-card__icon-actions">
					<Button size="compact" icon={ replace } onClick={ open } label={ __( 'Remplacer le pictogramme', 'couturier' ) } showTooltip />
					<Button
						size="compact"
						icon={ trash }
						isDestructive
						onClick={ () => setAttributes( { iconId: undefined } ) }
						label={ __( 'Supprimer le pictogramme', 'couturier' ) }
						showTooltip
					/>
				</span>
			</>
		) );
	} else if ( icon ) {
		badge = <span className="wp-block-couturier-icon-card__badge">{ icon }</span>;
	} else if ( isEditing ) {
		badge = (
			<span className="wp-block-couturier-icon-card__badge">
				{ picker( ( open ) => (
					<Button
						className="wp-block-couturier-icon-card__choose"
						icon={ plus }
						onClick={ open }
						label={ __( 'Choisir un pictogramme (SVG de préférence)', 'couturier' ) }
						showTooltip
					/>
				) ) }
			</span>
		);
	}

	return (
		<li { ...innerBlocksProps }>
			<InspectorControls>
				<PanelBody title={ __( 'Pictogramme', 'couturier' ) }>
					<p>
						{ __( 'Le pictogramme est peint en pétrole quelles que soient ses couleurs d\'origine. Il est décoratif : son texte alternatif n\'est pas utilisé.', 'couturier' ) }
					</p>
				</PanelBody>
			</InspectorControls>
			{ badge }
			{ children }
			<RichText
				tagName="p"
				className="wp-block-couturier-icon-card__text"
				aria-label={ __( 'Texte de la carte', 'couturier' ) }
				placeholder={ __( 'Texte', 'couturier' ) }
				value={ text }
				onChange={ ( value ) => setAttributes( { text: nonBreaking( value ) } ) }
				allowedFormats={ TEXT_FORMATS }
			/>
			{ isEditing && isIncomplete && (
				<Notice status="warning" isDismissible={ false } className="wp-block-couturier-icon-card__notice">
					{ __( 'Titre obligatoire : sans lui, cette carte n\'est pas affichée sur le site.', 'couturier' ) }
				</Notice>
			) }
		</li>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: ( { attributes } ) => (
		<>
			<InnerBlocks.Content />
			{ ! RichText.isEmpty( attributes.text ) && (
				<RichText.Content tagName="p" className="wp-block-couturier-icon-card__text" value={ attributes.text } />
			) }
		</>
	),
} );

// Aucun format dans le titre.
restrictFormats( metadata.name, {
	'core/heading': [ ...HEADING_FORMATS_OFF, 'core/strikethrough', 'core/superscript', 'core/subscript' ],
} );

// Titre sélectionné : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name, TITLE_BLOCKS );

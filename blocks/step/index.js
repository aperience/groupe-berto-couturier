/**
 * Étape du bloc « Étapes » (`couturier/step`) : pastille numérotée, titre et
 * texte.
 *
 * - la pastille et son numéro sont du CSS (`::before`, compteur de la liste) :
 *   rien à saisir ni à enregistrer ;
 * - le titre est un `core/heading` imbriqué, toujours un `<h3>` : seul bloc que
 *   lit le panneau Structure. Verrouillé, sans format ;
 * - le texte est un attribut (`text`), écrit après le titre dans le HTML
 *   enregistré : le compteur de mots le lit. Gras, italique et lien permis.
 *
 * Sans titre, l'étape n'est pas rendue sur le site (`is-incomplete`).
 */
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, RichText, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
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
import { LEVEL, TITLE } from './title.js';

const TEMPLATE = [ TITLE ];

/** Formats du texte. */
const TEXT_FORMATS = [ 'core/bold', 'core/italic', 'core/link' ];

const TITLE_BLOCKS = [ 'core/heading' ];

const ROOT = 'couturier/steps';

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { text } = attributes;

	const { blocks, isEditing } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const [ rootId ] = editor.getBlockParentsByBlockName( clientId, ROOT, true );

			return {
				blocks: editor.getBlocks( clientId ),
				// Liste ou l'une de ses étapes en cours d'édition : avertissements
				// seulement alors (bloc désélectionné = rendu du site).
				isEditing:
					isSelected ||
					editor.hasSelectedInnerBlock( clientId, true ) ||
					( !! rootId && ( editor.isBlockSelected( rootId ) || editor.hasSelectedInnerBlock( rootId, true ) ) ),
			};
		},
		[ clientId, isSelected ]
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

	return (
		<li { ...innerBlocksProps }>
			{ children }
			<RichText
				tagName="p"
				className="wp-block-couturier-step__text"
				aria-label={ __( 'Texte de l\'étape', 'couturier' ) }
				placeholder={ __( 'Texte', 'couturier' ) }
				value={ text }
				onChange={ ( value ) => setAttributes( { text: nonBreaking( value ) } ) }
				allowedFormats={ TEXT_FORMATS }
			/>
			{ isEditing && isIncomplete && (
				<Notice status="warning" isDismissible={ false } className="wp-block-couturier-step__notice">
					{ __( 'Titre obligatoire : sans lui, cette étape n\'est pas affichée sur le site.', 'couturier' ) }
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
				<RichText.Content tagName="p" className="wp-block-couturier-step__text" value={ attributes.text } />
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

/**
 * Question du bloc « Questions fréquentes » (`couturier/faq-item`).
 *
 * - La question est un `core/heading` imbriqué, toujours un `<h3>` : seul bloc que
 *   lit le panneau Structure. Verrouillé (`templateLock: 'all'` et verrou propre),
 *   sans aucun format : `render.php` le place dans un `<button>`, où un lien
 *   serait invalide.
 * - La réponse est un attribut (`answer`), écrit après le titre dans le HTML
 *   enregistré : le compteur de mots la lit.
 *
 * Dans le canvas, comme sur le front au chargement, seule une réponse est
 * affichée : celle de la question en cours d'édition, à défaut la première.
 * Une question sans titre ou sans réponse n'est pas rendue sur le site.
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	RichText,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
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
import { LEVEL, QUESTION } from './question.js';

const TEMPLATE = [ QUESTION ];

/** Formats de la réponse. */
const ANSWER_FORMATS = [ 'core/bold', 'core/italic', 'core/link', 'core/strikethrough', 'core/superscript', 'core/subscript' ];

const QUESTION_BLOCKS = [ 'core/heading' ];

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { answer } = attributes;
	const { blocks, isEditing, isOpen } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const isEdited = ( id ) => editor.isBlockSelected( id ) || editor.hasSelectedInnerBlock( id, true );
			const items = editor.getBlockOrder( editor.getBlockRootClientId( clientId ) );
			const edited = items.find( isEdited );

			return {
				blocks: editor.getBlocks( clientId ),
				isEditing: isSelected || editor.hasSelectedInnerBlock( clientId, true ),
				isOpen: edited ? edited === clientId : items[ 0 ] === clientId,
			};
		},
		[ clientId, isSelected ]
	);

	const isIncomplete = blocks.length > 0 && ( ! textOf( blocks[ 0 ] ) || ! textOf( answer ) );

	// Question toujours verrouillée, toujours en H3 ; espace insécable avant « ? ! : ; ».
	useLockedContent( blocks, { level: LEVEL, names: QUESTION_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		{ className: 'wp-block-couturier-faq-item__header' },
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	return (
		// `is-incomplete` : question non rendue sur le front, masquée dans le canvas
		// tant que la FAQ n'est pas en cours d'édition (`editor/_front-preview.scss`).
		<div { ...useBlockProps( {
			className: [ isOpen && 'is-open', isIncomplete && 'is-incomplete' ].filter( Boolean ).join( ' ' ) || undefined,
		} ) }>
			<div { ...innerBlocksProps }>
				{ children }
				<span className="wp-block-couturier-faq-item__icon" aria-hidden="true" />
			</div>
			{ isOpen && (
				<div className="wp-block-couturier-faq-item__body">
					<RichText
						tagName="p"
						className="wp-block-couturier-faq-item__answer"
						aria-label={ __( 'Réponse', 'couturier' ) }
						placeholder={ __( 'Réponse', 'couturier' ) }
						value={ answer }
						onChange={ ( value ) => setAttributes( { answer: nonBreaking( value ) } ) }
						allowedFormats={ ANSWER_FORMATS }
					/>
				</div>
			) }
			{ isEditing && isIncomplete && (
				<Notice status="warning" isDismissible={ false } className="wp-block-couturier-faq-item__notice">
					{ __( 'Question et réponse obligatoires : sans elles, cette question n\'est pas affichée sur le site.', 'couturier' ) }
				</Notice>
			) }
		</div>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: ( { attributes } ) => (
		<>
			<InnerBlocks.Content />
			{ ! RichText.isEmpty( attributes.answer ) && (
				<RichText.Content tagName="p" className="wp-block-couturier-faq-item__answer" value={ attributes.answer } />
			) }
		</>
	),
} );

// Aucun format dans la question : elle est rendue dans un `<button>`.
restrictFormats( metadata.name, {
	'core/heading': [ ...HEADING_FORMATS_OFF, 'core/strikethrough', 'core/superscript', 'core/subscript' ],
} );

// Question sélectionnée : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name, QUESTION_BLOCKS );

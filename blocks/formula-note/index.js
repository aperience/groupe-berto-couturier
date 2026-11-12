/**
 * Encart du bloc « Formules » (`couturier/formula-note`) : titre H3, puis
 * listes à puces et paragraphes libres (« Inclus dans la formule »…).
 *
 * - titre : `core/heading` verrouillé, toujours un `<h3>`, sans format ;
 *   facultatif (vide, il n'est pas rendu) ;
 * - contenu : `core/list` et `core/paragraph` ajoutés, retirés et déplacés
 *   librement (`templateLock: false` ; un verrou `all` serait hérité par la
 *   liste, qui n'accepterait plus d'éléments). Inséré avec un paragraphe,
 *   transformable en liste (« - » en début de ligne, « Transformer en ») ;
 * - fond (`background`) : pétrole clair (défaut) ou pêche, `_shared/backgrounds.js`.
 *
 * Encart rendu s'il a un titre ou du texte ; vide, il n'est pas rendu.
 */
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { BackgroundPanel, useBackground } from '../_shared/backgrounds.js';
import { HEADING_FORMATS_OFF, TEXT_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import { hideLockedControls, textOf, useLockedContent, useNonBreakingPunctuation } from '../_shared/locked-content.js';
import metadata from './block.json';
import { LEVEL, TEMPLATE } from './template.js';

const ROOT = 'couturier/formulas';

/** Blocs imbriqués verrouillés. */
const LOCKED_BLOCKS = [ 'core/heading' ];

/** Bloc contenant du texte saisi (titre, paragraphe, liste et ses éléments). */
const hasText = ( block ) => !! textOf( block ) || block.innerBlocks.some( hasText );

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const background = useBackground( metadata, attributes.background );

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

	const isIncomplete = blocks.length > 0 && ! blocks.some( hasText );

	// Titre toujours verrouillé, toujours en H3.
	useLockedContent( blocks, { level: LEVEL, names: LOCKED_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		useBlockProps( {
			className: [ background.className, isIncomplete && 'is-incomplete' ].filter( Boolean ).join( ' ' ) || undefined,
		} ),
		{
			allowedBlocks: [ 'core/list', 'core/paragraph' ],
			template: blocks.length ? undefined : TEMPLATE,
			templateLock: false,
			// Bouton « + » d'ajout d'un paragraphe ou d'une liste, en cours d'édition.
			renderAppender: isEditing ? InnerBlocks.ButtonBlockAppender : false,
		}
	);

	return (
		<div { ...innerBlocksProps }>
			<BackgroundPanel
				{ ...background }
				title={ __( 'Fond de l\'encart', 'couturier' ) }
				onChange={ ( slug ) => setAttributes( { background: slug } ) }
			/>
			{ children }
			{ isEditing && isIncomplete && (
				<Notice status="warning" isDismissible={ false } className="wp-block-couturier-formula-note__notice">
					{ __( 'Encart vide : sans titre ni texte, il n\'est pas affiché sur le site.', 'couturier' ) }
				</Notice>
			) }
		</div>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );

// Titre sans format ; paragraphes : formats du texte.
restrictFormats( metadata.name, {
	'core/heading': [ ...HEADING_FORMATS_OFF, 'core/strikethrough', 'core/superscript', 'core/subscript' ],
	'core/paragraph': TEXT_FORMATS_OFF,
} );

// Titre sélectionné : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name, LOCKED_BLOCKS );

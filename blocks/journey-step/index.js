/**
 * Étape du bloc « Parcours en étapes » (`couturier/journey-step`).
 *
 * - le titre est un `core/heading` imbriqué, toujours un `<h3>`, verrouillé ; seul
 *   format : la mise en avant (`render.php` le place dans un `<button>`, où un
 *   lien serait invalide) ;
 * - le texte (paragraphes, listes) est dans `couturier/journey-step-body` ;
 * - la couleur de la pastille (`background`) se choisit dans une liste fermée
 *   (`_shared/backgrounds.js`), en desktop seulement : en mobile, la pastille est
 *   toujours orange (maquette).
 *
 * Numéro, « Étape N » et « Étape N sur M » : au rendu, par la liste
 * (`journey-list/render.php`) ; dans le canvas, d'après la position de l'étape.
 *
 * Dans le canvas, comme sur le front au chargement, seule une étape est dépliée :
 * celle en cours d'édition, à défaut la première. Une étape sans titre ou sans
 * texte n'est pas rendue sur le site.
 */
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

import { BackgroundPanel, useBackground } from '../_shared/backgrounds.js';
import { HEADING_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import { hideLockedControls, textOf, useLockedContent, useNonBreakingPunctuation } from '../_shared/locked-content.js';
import { hasContent } from '../collapsible-text-column/content.js';
import metadata from './block.json';
import { BODY, LEVEL, TEMPLATE } from './template.js';

const LOCKED_BLOCKS = [ 'core/heading', BODY ];

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const background = useBackground( metadata, attributes.background );

	const { blocks, isEditing, isOpen, position, total } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const isEdited = ( id ) => editor.isBlockSelected( id ) || editor.hasSelectedInnerBlock( id, true );
			const listId = editor.getBlockRootClientId( clientId );
			const steps = editor.getBlockOrder( listId );
			const edited = steps.find( isEdited );
			const journeyId = editor.getBlockRootClientId( listId );

			return {
				blocks: editor.getBlocks( clientId ),
				// Parcours ou l'un de ses blocs imbriqués en cours d'édition :
				// avertissements seulement alors (bloc désélectionné = rendu du site).
				isEditing: isSelected || isEdited( clientId ) || ( !! journeyId && isEdited( journeyId ) ),
				isOpen: edited ? edited === clientId : steps[ 0 ] === clientId,
				position: steps.indexOf( clientId ) + 1,
				total: steps.length,
			};
		},
		[ clientId, isSelected ]
	);

	const heading = blocks.find( ( block ) => block.name === 'core/heading' );
	const body = blocks.find( ( block ) => block.name === BODY );
	const isIncomplete = blocks.length > 0 && ( ! textOf( heading ) || ! ( body?.innerBlocks ?? [] ).some( hasContent ) );

	// Titre et texte toujours verrouillés, titre toujours en H3 ; espace insécable
	// avant « ? ! : ; ».
	useLockedContent( blocks, { level: LEVEL, names: LOCKED_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
	// `is-incomplete` : étape non rendue sur le front, masquée dans le canvas hors
	// édition (`editor/_front-preview.scss`).
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		useBlockProps( {
			className: [ background.className, isOpen && 'is-open', isIncomplete && 'is-incomplete' ].filter( Boolean ).join( ' ' ) || undefined,
		} ),
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	return (
		<>
			<BackgroundPanel
				{ ...background }
				title={ __( 'Couleur de la pastille', 'couturier' ) }
				onChange={ ( slug ) => setAttributes( { background: slug } ) }
			/>
			<div { ...innerBlocksProps }>
				<span className="wp-block-couturier-journey-step__card" aria-hidden="true" />
				<span className="wp-block-couturier-journey-step__badge" aria-hidden="true">{ position }</span>
				<span className="wp-block-couturier-journey-step__label">
					{ /* translators: %d : numéro de l'étape. */ }
					{ sprintf( __( 'Étape %d', 'couturier' ), position ) }
				</span>
				{ children }
				<span className="wp-block-couturier-journey-step__count">
					{ /* translators: 1 : numéro de l'étape, 2 : nombre d'étapes. */ }
					{ sprintf( __( 'Étape %1$d sur %2$d', 'couturier' ), position, total ) }
				</span>
				{ isEditing && isIncomplete && (
					<Notice status="warning" isDismissible={ false } className="wp-block-couturier-journey-step__notice">
						{ __( 'Titre et texte obligatoires : sans eux, cette étape n\'est pas affichée sur le site.', 'couturier' ) }
					</Notice>
				) }
			</div>
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );

// Titre : mise en avant seulement (rendu dans un `<button>`).
restrictFormats( metadata.name, {
	'core/heading': [ ...HEADING_FORMATS_OFF, 'core/strikethrough', 'core/superscript', 'core/subscript' ],
} );

// Titre ou texte sélectionné : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name, LOCKED_BLOCKS );

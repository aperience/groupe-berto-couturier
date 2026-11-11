/**
 * Bloc « Logos partenaires » (`couturier/logo-strip`, Figma 301:6827 / 605:1480) :
 * section arrondie, titre H2, texte libre et encart blanc de logos légendés.
 *
 * - le titre est un `core/heading` imbriqué (panneau Structure, cf.
 *   `blocks/CLAUDE.md`), toujours un `<h2>`, verrouillé, mots mis en avant
 *   possibles (format `couturier/highlight`) ;
 * - le texte est un `couturier/logo-strip-body` verrouillé, dont le propre
 *   `templateLock: false` accueille paragraphes et listes ;
 * - les logos vivent dans un `couturier/logo-strip-items` verrouillé, dont le
 *   propre `templateLock: false` permet d'en ajouter, retirer et déplacer ;
 * - fond (`background`) dans une liste fermée (`_shared/backgrounds.js`),
 *   pêche/100 par défaut → classe `is-bg-{fond}`.
 *
 * Titre, texte et logos sont facultatifs ; sans aucun des trois, `render.php`
 * n'affiche rien. `save()` n'enregistre que les blocs imbriqués.
 */
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { BackgroundPanel, useBackground } from '../_shared/backgrounds.js';
import { LOCKED, hideLockedControls, textOf, useLockedContent, useNonBreakingPunctuation } from '../_shared/locked-content.js';
import { hasContent } from '../image-text-body/content.js';
import { isComplete } from '../logo-strip-item/content.js';
import metadata from './block.json';

const BODY = 'couturier/logo-strip-body';
const ITEMS = 'couturier/logo-strip-items';
const ITEM = 'couturier/logo-strip-item';

/** Blocs imbriqués verrouillés : le titre, le texte et l'encart des logos. */
const LOCKED_BLOCKS = [ 'core/heading', BODY, ITEMS ];

/** Le titre est toujours un `<h2>`. */
const LEVEL = 2;

const TEMPLATE = [
	[ 'core/heading', { level: LEVEL, lock: LOCKED, placeholder: __( 'Titre (facultatif)', 'couturier' ) } ],
	[ BODY, { lock: LOCKED }, [ [ 'core/paragraph', { placeholder: __( 'Texte (facultatif)', 'couturier' ) } ] ] ],
	[ ITEMS, { lock: LOCKED }, [ [ ITEM ], [ ITEM ], [ ITEM ], [ ITEM ], [ ITEM ] ] ],
];

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const blocks = useSelect( ( select ) => select( blockEditorStore ).getBlocks( clientId ), [ clientId ] );
	const isEditing = useSelect(
		( select ) => isSelected || select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId, isSelected ]
	);

	const heading = blocks.find( ( block ) => block.name === 'core/heading' );
	const body = blocks.find( ( block ) => block.name === BODY );
	const items = blocks.find( ( block ) => block.name === ITEMS );
	const isEmpty =
		blocks.length > 0 &&
		! textOf( heading ) &&
		! ( body?.innerBlocks ?? [] ).some( hasContent ) &&
		! ( items?.innerBlocks ?? [] ).some( isComplete );
	const background = useBackground( metadata, attributes.background );

	useLockedContent( blocks, { level: LEVEL, names: LOCKED_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (cf. `blocks/CLAUDE.md`).
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		useBlockProps( { className: background.className } ),
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	return (
		<>
			<BackgroundPanel
				{ ...background }
				title={ __( 'Fond de la section', 'couturier' ) }
				onChange={ ( slug ) => setAttributes( { background: slug } ) }
			/>
			<section { ...innerBlocksProps }>
				{ isEditing && isEmpty && (
					<Notice status="warning" isDismissible={ false } className="wp-block-couturier-logo-strip__notice">
						{ __( 'Saisissez au moins un titre, un texte ou la légende d\'un logo : sans eux, ce bloc n\'est pas affiché sur le site.', 'couturier' ) }
					</Notice>
				) }
				{ children }
			</section>
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );

// Titre, texte ou encart sélectionné : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name, LOCKED_BLOCKS );

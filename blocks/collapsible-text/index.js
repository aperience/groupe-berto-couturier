/**
 * Bloc « Texte repliable » (`couturier/collapsible-text`) : titre, puis texte
 * sur deux colonnes, repliable en desktop (bouton « Réduire » /
 * « Lire la suite »).
 *
 * Modèle figé par `templateLock: 'all'` :
 * - le titre est un `core/heading` imbriqué (panneau Structure, cf.
 *   `blocks/CLAUDE.md`), toujours un `<h3>`, verrouillé ;
 * - deux colonnes `couturier/collapsible-text-column`, verrouillées, dont le
 *   propre `templateLock: false` permet d'y ajouter, retirer et déplacer
 *   paragraphes et listes. Le rédacteur répartit le texte : la colonne de
 *   gauche se lit avant celle de droite (mobile, lecteur d'écran). Une colonne
 *   vide n'est pas rendue : l'autre prend toute la largeur.
 *
 * `save()` n'enregistre que les blocs imbriqués : l'en-tête (titre et bouton) et
 * le corps sont produits par `render.php`, qui n'affiche rien sans titre ni texte.
 */
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import {
	LOCKED,
	hideLockedControls,
	textOf,
	useLockedContent,
	useNonBreakingPunctuation,
} from '../_shared/locked-content.js';
import { hasContent } from '../collapsible-text-column/content.js';
import metadata from './block.json';

const COLUMN = 'couturier/collapsible-text-column';

/** Le titre de ce bloc est toujours un `<h3>`. */
const LEVEL = 3;

const TEMPLATE = [
	[ 'core/heading', { level: LEVEL, lock: LOCKED, placeholder: __( 'Titre', 'couturier' ) } ],
	[ COLUMN, { lock: LOCKED }, [ [ 'core/paragraph', { placeholder: __( 'Colonne de gauche', 'couturier' ) } ] ] ],
	[ COLUMN, { lock: LOCKED }, [ [ 'core/paragraph', { placeholder: __( 'Colonne de droite (facultative)', 'couturier' ) } ] ] ],
];

/** Blocs imbriqués verrouillés : le titre et les deux colonnes. */
const LOCKED_BLOCKS = [ 'core/heading', COLUMN ];

function Edit( { clientId, isSelected } ) {
	const blocks = useSelect( ( select ) => select( blockEditorStore ).getBlocks( clientId ), [ clientId ] );
	// Bloc ou l'un de ses blocs imbriqués sélectionné. Sinon, le canvas montre le
	// rendu du site.
	const isEditing = useSelect(
		( select ) => isSelected || select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId, isSelected ]
	);

	const heading = blocks.find( ( block ) => block.name === 'core/heading' );
	const hasText = blocks.some( ( block ) => block.name === COLUMN && block.innerBlocks.some( hasContent ) );

	// Titre et colonnes verrouillés, titre toujours en `<h3>` ; espace insécable
	// avant « ? ! : ; » dans le titre.
	useLockedContent( blocks, { level: LEVEL, names: LOCKED_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
	const { children, ...innerBlocksProps } = useInnerBlocksProps( useBlockProps(), {
		template: blocks.length ? undefined : TEMPLATE,
		templateLock: 'all',
	} );

	return (
		<div { ...innerBlocksProps }>
			{ isEditing && blocks.length > 0 && ( ! textOf( heading ) || ! hasText ) && (
				<Notice status="warning" isDismissible={ false } className="wp-block-couturier-collapsible-text__notice">
					{ __( 'Le titre et le texte sont obligatoires : sans eux, ce bloc n\'est pas affiché sur le site.', 'couturier' ) }
				</Notice>
			) }
			{ /* Bouton du front, sans action dans l'éditeur. */ }
			<span className="wp-block-couturier-collapsible-text__toggle" aria-hidden="true">
				{ __( 'Réduire', 'couturier' ) }
			</span>
			{ children }
		</div>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );

// Titre ou colonne sélectionné : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name, LOCKED_BLOCKS );

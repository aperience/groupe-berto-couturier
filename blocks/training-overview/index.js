/**
 * Bloc « Objectifs et programme » (`couturier/training-overview`) : panneaux de
 * contenu (titre, texte, listes, bouton), puis quatre cartes d'informations.
 *
 * - les panneaux vivent dans `couturier/training-overview-panels`, verrouillé,
 *   dont le propre `templateLock: false` permet d'en ajouter, retirer et
 *   déplacer (deux à l'insertion : orange clair, blanc cassé) ;
 * - les cartes sont `couturier/training-overview-facts`, verrouillé (quatre
 *   cartes fixes, libellé et valeur en attribut tableau).
 *
 * Le titre de section (« Objectifs et programme ») n'en fait pas partie : c'est
 * un `couturier/section-title` placé au-dessus.
 *
 * `save()` n'enregistre que les blocs imbriqués : l'enveloppe est produite par
 * `render.php`.
 */
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

import { LOCKED, hideLockedControls, useLockedContent } from '../_shared/locked-content.js';
import { panel } from '../training-overview-panel/template.js';
import metadata from './block.json';

const PANELS = 'couturier/training-overview-panels';
const FACTS = 'couturier/training-overview-facts';

/** Blocs imbriqués verrouillés : les panneaux et les cartes. */
const LOCKED_BLOCKS = [ PANELS, FACTS ];

const TEMPLATE = [
	[ PANELS, { lock: LOCKED }, [ panel(), panel( 'neutral-50' ) ] ],
	[ FACTS, { lock: LOCKED } ],
];

function Edit( { clientId } ) {
	const blocks = useSelect( ( select ) => select( blockEditorStore ).getBlocks( clientId ), [ clientId ] );

	useLockedContent( blocks, { names: LOCKED_BLOCKS } );

	// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
	const innerBlocksProps = useInnerBlocksProps( useBlockProps(), {
		template: blocks.length ? undefined : TEMPLATE,
		templateLock: 'all',
	} );

	return <div { ...innerBlocksProps } />;
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );

// Panneaux ou cartes sélectionnés : pas de cadenas.
hideLockedControls( metadata.name, LOCKED_BLOCKS );

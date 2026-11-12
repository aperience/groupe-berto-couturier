/**
 * Sessions de formation (`couturier/sessions`) : filtre par secteur et liste de
 * sessions (`couturier/session`), ajoutées, retirées et déplacées librement.
 *
 * Le canvas montre le filtre tel qu'il sera rendu (secteurs des sessions, ordre
 * alphabétique, au moins deux secteurs), inerte. Les sessions sont triées par
 * date de début dans le contenu même, à chaque changement de date (sessions sans
 * date à la fin) : même ordre que le tri de `render.php`, qui reste le garde-fou.
 * Sur le site, les sessions passées sont retirées ; dans le canvas, grisées.
 */
import { createBlock, registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { plus } from '../_shared/icons.js';
import { sectors } from '../_shared/sectors.js';
import metadata from './block.json';

const ITEM = 'couturier/session';

const TEMPLATE = [ [ ITEM ] ];

/** Clé de tri : date de début, sessions sans date à la fin. */
const sortKey = ( block ) => block.attributes.startDate || '9999-99-99';

/** Sessions triées par date de début (tri stable : ordre de saisie à égalité). */
const sortByDate = ( blocks ) => [ ...blocks ].sort( ( a, b ) => sortKey( a ).localeCompare( sortKey( b ) ) );

function Edit( { clientId, isSelected } ) {
	const { insertBlock, selectBlock, replaceInnerBlocks, __unstableMarkNextChangeAsNotPersistent } = useDispatch( blockEditorStore );
	const { items, isEditing } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );

			return {
				items: editor.getBlocks( clientId ),
				isEditing: isSelected || editor.hasSelectedInnerBlock( clientId, true ),
			};
		},
		[ clientId, isSelected ]
	);

	// Tri par date : les blocs eux-mêmes sont réordonnés (mêmes `clientId`,
	// sélection conservée), dans la même étape d'annulation que la date saisie.
	const order = items.map( ( item ) => item.clientId + sortKey( item ) ).join();
	useEffect( () => {
		const sorted = sortByDate( items );
		if ( sorted.some( ( item, index ) => item !== items[ index ] ) ) {
			// Non persistant : fusionné avec la saisie de la date (une seule annulation).
			__unstableMarkNextChangeAsNotPersistent();
			replaceInnerBlocks( clientId, sorted, false );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ order ] );

	const used = new Set( items.map( ( item ) => item.attributes.sectorId ) );
	const filters = sectors().filter( ( sector ) => used.has( sector.id ) );
	const hasFilter = filters.length >= 2;

	const addItem = () => {
		const item = createBlock( ITEM );
		insertBlock( item, items.length, clientId, false );
		selectBlock( item.clientId );
	};

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'wp-block-couturier-sessions__list', role: 'list' },
		{
			allowedBlocks: [ ITEM ],
			template: items.length ? undefined : TEMPLATE,
			templateLock: false,
			renderAppender: () =>
				isEditing && (
					<li className="wp-block-couturier-sessions__add">
						<Button __next40pxDefaultSize variant="secondary" icon={ plus } onClick={ addItem }>
							{ __( 'Ajouter une session', 'couturier' ) }
						</Button>
					</li>
				),
		}
	);

	return (
		<div { ...blockProps }>
			{ hasFilter && (
				<div className="wp-block-couturier-sessions__filters" aria-hidden="true">
					<span className="wp-block-couturier-sessions__filter" aria-pressed="true">
						{ __( 'Toutes les villes', 'couturier' ) }
					</span>
					{ filters.map( ( sector ) => (
						<span key={ sector.id } className="wp-block-couturier-sessions__filter" aria-pressed="false">
							{ sector.name }
						</span>
					) ) }
				</div>
			) }
			<ul { ...innerBlocksProps } />
		</div>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );

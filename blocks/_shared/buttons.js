/**
 * Boutons facultatifs d'un bloc custom : un `core/buttons` imbriqué, supprimable
 * malgré `templateLock: 'all'` (cf. « Blocs imbriqués facultatifs » dans
 * `blocks/CLAUDE.md`).
 *
 * Le verrou du modèle interdisant tout ajout, le nombre de boutons se change par
 * `replaceInnerBlocks`, qu'il ne filtre pas : panneau `ButtonsControl` de la barre
 * latérale, et bouton d'ajout du canvas propre à chaque bloc, tous deux branchés
 * sur `useButtonCount()`.
 *
 * Hors de `blocks/{nom}/` : ce dossier n'a pas de `block.json`, wp-scripts ne le
 * compile pas seul ; il est inclus dans le script de chaque bloc qui l'importe.
 */
import { createBlocksFromInnerBlocksTemplate } from '@wordpress/blocks';
import { InspectorControls, store as blockEditorStore } from '@wordpress/block-editor';
import {
	PanelBody,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { REMOVABLE, TEXT_BLOCKS } from './locked-content.js';

/** Style de bloc d'un bouton (`is-style-…`), chaîne vide pour le style par défaut. */
const styleOf = ( className ) => ( className ?? '' ).split( ' ' ).find( ( name ) => name.startsWith( 'is-style-' ) ) ?? '';

/**
 * Nombre de boutons et son réglage. Les boutons existants sont conservés ; un
 * bouton ajouté reprend un style du modèle encore absent, à sa place dans le
 * modèle. Retire aussi le groupe vidé bouton par bouton, dans la même étape
 * d'annulation.
 *
 * @param {string}   clientId Bloc custom.
 * @param {Object[]} blocks   Ses blocs imbriqués (`getBlocks( clientId )`).
 * @param {Array[]}  buttons  Modèle des boutons, dans l'ordre (`[ 'core/button', { … } ]`).
 * @param {Object}   options
 * @param {string[]} [options.after] Blocs imbriqués après le dernier desquels un groupe recréé est placé.
 * @return {[number, Function]} Nombre actuel, fonction qui le change.
 */
export function useButtonCount( clientId, blocks, buttons, { after = TEXT_BLOCKS } = {} ) {
	const { replaceInnerBlocks, __unstableMarkNextChangeAsNotPersistent } = useDispatch( blockEditorStore );
	const group = blocks.find( ( block ) => block.name === 'core/buttons' );
	const count = group?.innerBlocks.length ?? 0;

	useEffect( () => {
		if ( group && 0 === group.innerBlocks.length ) {
			__unstableMarkNextChangeAsNotPersistent();
			replaceInnerBlocks( clientId, blocks.filter( ( block ) => block !== group ), false );
		}
	}, [ group, blocks, clientId, replaceInnerBlocks, __unstableMarkNextChangeAsNotPersistent ] );

	const setCount = ( value ) => {
		const target = Number( value );
		const others = blocks.filter( ( block ) => block !== group );

		if ( 0 === target ) {
			replaceInnerBlocks( clientId, others, false );
			return;
		}

		const kept = ( group?.innerBlocks ?? [] ).slice( 0, target );
		const styles = kept.map( ( button ) => styleOf( button.attributes.className ) );
		const result = [ ...kept ];

		buttons.forEach( ( entry, index ) => {
			if ( result.length < target && ! styles.includes( styleOf( entry[ 1 ]?.className ) ) ) {
				result.splice( Math.min( index, result.length ), 0, ...createBlocksFromInnerBlocksTemplate( [ entry ] ) );
			}
		} );

		if ( group ) {
			replaceInnerBlocks( group.clientId, result, false );
			return;
		}

		// Groupe recréé juste après le dernier titre ou texte (`after`), avant le
		// reste (liste des questions de la FAQ).
		const [ newGroup ] = createBlocksFromInnerBlocksTemplate( [ [ 'core/buttons', { lock: REMOVABLE } ] ] );
		const at = others.reduce( ( last, block, index ) => ( after.includes( block.name ) ? index + 1 : last ), 0 );
		newGroup.innerBlocks = result;
		replaceInnerBlocks( clientId, [ ...others.slice( 0, at ), newGroup, ...others.slice( at ) ], false );
	};

	return [ count, setCount ];
}

/**
 * Panneau « Boutons » de la barre latérale.
 *
 * @param {Object}   props
 * @param {number}   props.count    Nombre actuel.
 * @param {Function} props.setCount Change le nombre.
 * @param {number}   props.max      Nombre maximal de boutons.
 * @param {string}   props.help     Aide sous le réglage.
 */
export function ButtonsControl( { count, setCount, max, help } ) {
	return (
		<InspectorControls>
			<PanelBody title={ 1 === max ? __( 'Bouton', 'couturier' ) : __( 'Boutons', 'couturier' ) }>
				<ToggleGroupControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					isBlock
					label={ __( 'Nombre de boutons', 'couturier' ) }
					help={ help }
					value={ String( count ) }
					onChange={ setCount }
				>
					<ToggleGroupControlOption value="0" label={ __( 'Aucun', 'couturier' ) } />
					{ Array.from( { length: max }, ( _, index ) => (
						<ToggleGroupControlOption key={ index } value={ String( index + 1 ) } label={ String( index + 1 ) } />
					) ) }
				</ToggleGroupControl>
			</PanelBody>
		</InspectorControls>
	);
}

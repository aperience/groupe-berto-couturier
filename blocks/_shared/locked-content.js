/**
 * Blocs imbriqués verrouillés d'un bloc custom (titre, texte…) : cf. « Titres
 * imbriqués » dans `blocks/CLAUDE.md`.
 *
 * - `useLockedContent()` rétablit aussitôt le verrou d'un bloc imbriqué levé
 *   (cadenas, menu « Options ») et le niveau fixe d'un titre (collage, éditeur de
 *   code) ;
 * - `useNonBreakingPunctuation()` rend insécable l'espace avant « ? ! : ; » ;
 * - `hideLockedControls()` masque le cadenas et les variations de niveau quand un
 *   de ces blocs imbriqués est sélectionné.
 *
 * Hors de `blocks/{nom}/` : ce dossier n'a pas de `block.json`, wp-scripts ne le
 * compile pas seul ; il est inclus dans le script de chaque bloc qui l'importe.
 */
import { InspectorControls, store as blockEditorStore } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';

/** Verrou propre au bloc : supprimable malgré `templateLock: 'all'`, non déplaçable. */
export const REMOVABLE = { remove: false, move: true };

/** Verrou d'un bloc imbriqué obligatoire : ni supprimable ni déplaçable, rétabli s'il est levé. */
export const LOCKED = { remove: true, move: true };

/** Blocs imbriqués verrouillés par défaut : le titre et le texte. */
const TEXT_BLOCKS = [ 'core/heading', 'core/paragraph' ];

/**
 * Espace avant une ponctuation haute, balises intercalées comprises : même motif que
 * les `render.php`, qui la rendent insécable sur le front.
 */
const SPACE_BEFORE_PUNCTUATION = / +((?:<[^>]*>)*)(?=[?!:;»])/gu;

/** Texte d'un champ RichText (bloc ou chaîne), balises retirées. */
export const textOf = ( value ) =>
	String( ( 'object' === typeof value ? value?.attributes?.content : value ) ?? '' )
		.replace( /<[^>]*>/g, '' )
		.trim();

/**
 * Verrou des blocs imbriqués `names` et niveau du titre, rétablis s'ils changent.
 *
 * @param {Object[]} blocks          Blocs imbriqués (`getBlocks( clientId )`).
 * @param {Object}   options
 * @param {number}   options.level   Niveau fixe des `core/heading`.
 * @param {string[]} [options.names] Blocs imbriqués à verrouiller.
 */
export function useLockedContent( blocks, { level, names = TEXT_BLOCKS } ) {
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } = useDispatch( blockEditorStore );

	useEffect( () => {
		blocks
			.filter( ( block ) => names.includes( block.name ) )
			.forEach( ( block ) => {
				const changes = {};

				if ( ! block.attributes.lock?.remove || ! block.attributes.lock?.move ) {
					changes.lock = LOCKED;
				}

				if ( 'core/heading' === block.name && level !== block.attributes.level ) {
					changes.level = level;
				}

				if ( Object.keys( changes ).length ) {
					__unstableMarkNextChangeAsNotPersistent();
					updateBlockAttributes( block.clientId, changes );
				}
			} );
	}, [ blocks, level, names, updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent ] );
}

/**
 * Espace avant « ? ! : ; » rendue insécable dans le titre et le texte, comme le
 * font les `render.php` sur le front : sans cela, le canvas peut renvoyer le signe
 * seul à la ligne. Le remplacement est enregistré avec le contenu (même longueur :
 * le curseur ne bouge pas) ; les `render.php` le gardent pour les contenus saisis
 * avant.
 *
 * @param {Object[]} blocks Blocs imbriqués (`getBlocks( clientId )`).
 */
export function useNonBreakingPunctuation( blocks ) {
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } = useDispatch( blockEditorStore );

	useEffect( () => {
		blocks
			.filter( ( block ) => TEXT_BLOCKS.includes( block.name ) )
			.forEach( ( block ) => {
				const content = String( block.attributes.content ?? '' );
				const fixed = content.replace( SPACE_BEFORE_PUNCTUATION, ' $1' );

				if ( fixed !== content ) {
					__unstableMarkNextChangeAsNotPersistent();
					updateBlockAttributes( block.clientId, { content: fixed } );
				}
			} );
	}, [ blocks, updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent ] );
}

// Cadenas de la barre d'outils (`block-editor-block-lock-toolbar`) et variations
// H1…H6 de la barre latérale (`block-editor-block-variation-transforms`). L'entrée
// « Déverrouiller » du menu « Options », sans classe, reste affichée : son effet
// est annulé par `useLockedContent()`.
const HIDDEN_CONTROLS = [
	'.block-editor-block-toolbar .block-editor-block-lock-toolbar',
	'.block-editor-block-inspector .block-editor-block-variation-transforms',
].join( ',' );

/**
 * Masque cadenas et variations quand un bloc `names`, enfant direct de
 * `parentName`, est sélectionné. Les règles ne sont montées que le temps de la
 * sélection, et ne touchent donc aucun autre bloc.
 *
 * @param {string}   parentName Bloc custom, ex. `couturier/cta`.
 * @param {string[]} [names]    Blocs imbriqués concernés.
 */
export function hideLockedControls( parentName, names = TEXT_BLOCKS ) {
	addFilter(
		'editor.BlockEdit',
		`${ parentName }/locked-content`,
		createHigherOrderComponent(
			( BlockEdit ) => ( props ) => {
				const isInBlock = useSelect(
					( select ) => {
						const editor = select( blockEditorStore );

						return (
							names.includes( props.name ) &&
							parentName === editor.getBlockName( editor.getBlockRootClientId( props.clientId ) )
						);
					},
					[ props.name, props.clientId ]
				);

				return (
					<>
						{ isInBlock && props.isSelected && (
							<InspectorControls>
								<style>{ `${ HIDDEN_CONTROLS } { display: none; }` }</style>
							</InspectorControls>
						) }
						<BlockEdit { ...props } />
					</>
				);
			},
			'withLockedContent'
		)
	);
}

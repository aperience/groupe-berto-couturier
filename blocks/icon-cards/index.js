/**
 * Bloc « Cartes à pictogramme » (`couturier/icon-cards`) : liste (`<ul>`) de
 * cartes (`couturier/icon-card`) — pictogramme, titre H3, texte.
 *
 * Inséré avec trois cartes ; les cartes s'ajoutent (bouton « Ajouter une
 * carte »), se retirent et se déplacent librement, sans limite de nombre.
 * Trois par ligne en desktop, ou quatre (réglage « Cartes par ligne », `columns`
 * → classe `has-4-columns`, à partir de `xl`) ; une ligne incomplète répartit ses cartes
 * (`block/_icon-cards.scss`).
 *
 * Sans carte titrée, le bloc n'est pas rendu (`render.php`) : il reçoit
 * `is-incomplete` dans le canvas.
 */
import { createBlocksFromInnerBlocksTemplate, registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	InspectorControls,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { plus } from '../_shared/icons.js';
import { textOf } from '../_shared/locked-content.js';
import { TITLE } from '../icon-card/title.js';
import metadata from './block.json';

const ITEM = 'couturier/icon-card';

const CARD = [ ITEM, {}, [ TITLE ] ];

const TEMPLATE = [ CARD, CARD, CARD ];

/** Carte affichée sur le site : titre saisi. */
const hasTitle = ( block ) => !! textOf( block.innerBlocks[ 0 ] );

function Edit( { attributes, clientId, isSelected, setAttributes } ) {
	const columns = 4 === attributes.columns ? 4 : 3;
	const { insertBlock, selectBlock } = useDispatch( blockEditorStore );
	// Bloc ou l'une de ses cartes sélectionné. Sinon, le canvas montre le rendu du
	// site : pas de bouton d'ajout.
	const { isEditing, items } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );

			return {
				isEditing: isSelected || editor.hasSelectedInnerBlock( clientId, true ),
				items: editor.getBlocks( clientId ),
			};
		},
		[ clientId, isSelected ]
	);

	// Carte créée avec son titre, curseur placé dans le titre : sans titre, il
	// n'arriverait qu'ensuite, par le modèle de la carte, et le curseur irait
	// dans le texte.
	const addItem = () => {
		const [ item ] = createBlocksFromInnerBlocksTemplate( [ CARD ] );
		insertBlock( item, items.length, clientId, false );
		selectBlock( item.innerBlocks[ 0 ].clientId, 0 );
	};

	const innerBlocksProps = useInnerBlocksProps(
		useBlockProps( {
			className:
				[
					4 === columns && 'has-4-columns',
					items.length && ! items.some( hasTitle ) && 'is-incomplete',
				]
					.filter( Boolean )
					.join( ' ' ) || undefined,
		} ),
		{
			allowedBlocks: [ ITEM ],
			// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
			template: items.length ? undefined : TEMPLATE,
			templateLock: false,
			orientation: 'horizontal',
			renderAppender: () =>
				isEditing && (
					<li className="wp-block-couturier-icon-cards__add">
						<Button __next40pxDefaultSize variant="secondary" icon={ plus } onClick={ addItem }>
							{ __( 'Ajouter une carte', 'couturier' ) }
						</Button>
					</li>
				),
		}
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Cartes', 'couturier' ) }>
					<ToggleGroupControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						isBlock
						label={ __( 'Cartes par ligne (desktop)', 'couturier' ) }
						help={
							4 === columns
								? __( 'Quatre cartes par ligne sur grand écran, trois sur écran moyen.', 'couturier' )
								: __( 'Trois cartes par ligne sur grand écran.', 'couturier' )
						}
						value={ columns }
						onChange={ ( value ) => setAttributes( { columns: Number( value ) } ) }
					>
						<ToggleGroupControlOption value={ 3 } label="3" />
						<ToggleGroupControlOption value={ 4 } label="4" />
					</ToggleGroupControl>
				</PanelBody>
			</InspectorControls>
			<ul { ...innerBlocksProps } />
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );

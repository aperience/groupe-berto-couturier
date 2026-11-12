/**
 * Bloc « Formules » (`couturier/formulas`) : panneau pêche avec titre, sous-titre
 * et cartes de formules (Figma 301:7250, mobile 608:1400).
 *
 * Tout le contenu est en blocs imbriqués (cf. `blocks/CLAUDE.md`), dans un modèle
 * figé par `templateLock: 'all'` :
 * - le titre est un `core/heading`, toujours un `<h2>`, avec mise en avant ;
 * - le sous-titre est un `core/paragraph` (`__intro`), facultatif : vide, il n'est
 *   pas rendu ;
 * - les cartes sont dans un `couturier/formula-cards`, dont le propre
 *   `templateLock: false` permet d'ajouter, de retirer et de déplacer les cartes
 *   (`couturier/formula-card`) ;
 * - les encarts récapitulatifs sont dans un `couturier/formula-notes`, même
 *   principe (`couturier/formula-note`) ; un bloc créé avant eux reçoit, à
 *   l'ouverture dans l'éditeur, le conteneur et deux encarts vides.
 *
 * Réglage « Formules par ligne » (`columns`, 1 à 4, 3 par défaut) : en desktop,
 * les cartes d'une ligne se partagent sa largeur (variable `--formulas-columns`).
 *
 * `save()` n'enregistre que les blocs imbriqués : l'enveloppe est produite par
 * `render.php`, qui n'affiche rien sans titre ni carte titrée.
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
	Notice,
	PanelBody,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { HEADING_FORMATS_OFF, TEXT_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import {
	LOCKED,
	hideLockedControls,
	textOf,
	useLockedContent,
	useNonBreakingPunctuation,
} from '../_shared/locked-content.js';
import { CARD } from '../formula-card/template.js';
import { note } from '../formula-note/template.js';
import metadata from './block.json';

const LIST = 'couturier/formula-cards';

const NOTES_LIST = 'couturier/formula-notes';

/** Conteneur des encarts, avec deux encarts : pétrole clair puis pêche. */
const NOTES = [ NOTES_LIST, { lock: LOCKED }, [ note(), note( 'peach-300' ) ] ];

const TEMPLATE = [
	[ 'core/heading', { level: 2, lock: LOCKED, placeholder: __( 'Titre', 'couturier' ) } ],
	[
		'core/paragraph',
		{ lock: LOCKED, className: 'wp-block-couturier-formulas__intro', placeholder: __( 'Sous-titre (facultatif)', 'couturier' ) },
	],
	[ LIST, { lock: LOCKED }, [ CARD, CARD, CARD ] ],
	NOTES,
];

/** Blocs imbriqués verrouillés. */
const LOCKED_BLOCKS = [ 'core/heading', 'core/paragraph', LIST, NOTES_LIST ];

/** Le titre du bloc est toujours un `<h2>`. */
const LEVEL = 2;

/** Carte affichée sur le site : titre saisi. */
const hasTitle = ( card ) => !! textOf( card.innerBlocks.find( ( block ) => block.name === 'core/heading' ) );

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { columns } = attributes;
	const blocks = useSelect( ( select ) => select( blockEditorStore ).getBlocks( clientId ), [ clientId ] );
	// Bloc ou l'un de ses blocs imbriqués sélectionné. Sinon, le canvas montre le
	// rendu du site : ni avertissement, ni bouton d'ajout.
	const isEditing = useSelect(
		( select ) => isSelected || select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId, isSelected ]
	);

	const heading = blocks.find( ( block ) => block.name === 'core/heading' );
	const list = blocks.find( ( block ) => block.name === LIST );
	const isIncomplete = blocks.length > 0 && ( ! textOf( heading ) || ! list?.innerBlocks.some( hasTitle ) );

	// Bloc créé avant les encarts : conteneur et deux encarts ajoutés à la fin
	// (une seule fois ; `replaceInnerBlocks` passe outre le verrou du modèle).
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const hasNotes = blocks.some( ( block ) => NOTES_LIST === block.name );

	useEffect( () => {
		if ( ! blocks.length || hasNotes ) {
			return;
		}
		replaceInnerBlocks( clientId, [ ...blocks, ...createBlocksFromInnerBlocksTemplate( [ NOTES ] ) ], false );
	}, [ blocks.length, hasNotes ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Titre, sous-titre et listes toujours verrouillés, titre toujours en H2 ;
	// espace insécable avant « ? ! : ; ».
	useLockedContent( blocks, { level: LEVEL, names: LOCKED_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		useBlockProps( {
			className: isIncomplete ? 'is-incomplete' : undefined,
			style: { '--formulas-columns': columns },
		} ),
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	return (
		<section { ...innerBlocksProps }>
			<InspectorControls>
				<PanelBody title={ __( 'Mise en page', 'couturier' ) }>
					<ToggleGroupControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						isBlock
						label={ __( 'Formules par ligne', 'couturier' ) }
						help={ __( 'En ordinateur, les formules d\'une ligne se partagent sa largeur. Toujours empilées sur mobile.', 'couturier' ) }
						value={ columns }
						onChange={ ( value ) => setAttributes( { columns: Number( value ) } ) }
					>
						{ [ 1, 2, 3, 4 ].map( ( count ) => (
							<ToggleGroupControlOption key={ count } value={ count } label={ String( count ) } />
						) ) }
					</ToggleGroupControl>
				</PanelBody>
			</InspectorControls>
			{ isEditing && isIncomplete && (
				<Notice status="warning" isDismissible={ false } className="wp-block-couturier-formulas__notice">
					{ __( 'Le titre et au moins une carte titrée sont obligatoires : sans eux, ce bloc n\'est pas affiché sur le site.', 'couturier' ) }
				</Notice>
			) }
			{ children }
		</section>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );

// Titre : mise en avant, sans gras / italique / lien ; sous-titre : formats du texte.
restrictFormats( metadata.name, {
	'core/heading': HEADING_FORMATS_OFF,
	'core/paragraph': TEXT_FORMATS_OFF,
} );

// Titre, sous-titre ou liste sélectionné : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name, LOCKED_BLOCKS );

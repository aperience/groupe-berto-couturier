/**
 * Carte du bloc « Formules » (`couturier/formula-card`).
 *
 * Contenu en blocs imbriqués, figé par `templateLock: 'all'` (`template.js`) :
 * - titre : `core/heading`, toujours un `<h3>`, sans format ;
 * - prix : `core/paragraph` (`__price`), facultatif, en gros (Figma 301:7023) ;
 *   ajouté sous le titre, à l'ouverture dans l'éditeur, aux cartes créées avant lui ;
 * - public visé : `core/paragraph` (`__subtitle`), facultatif ;
 * - détails (conduite, tarif…) : `core/paragraph` (`__details`), texte libre ;
 *   gras, italique, lien et saut de ligne ;
 * - bouton : `core/button` orange avec flèche, libellé et lien modifiables ;
 * - texte après le bouton : `core/paragraph` (`__note`), facultatif (Figma
 *   301:7031, « Ou par téléphone… ») ; ajouté en fin de carte, à l'ouverture dans
 *   l'éditeur, aux cartes créées avant lui.
 *
 * Réglages de la barre latérale, indépendants :
 * - « Afficher un libellé » (`hasBadge`) : pastille (`badge`, préremplie
 *   « Le + choisi ») à cheval sur le bord haut, sur toute carte ;
 * - « Mettre en avant » (`featured`) : fond pétrole, texte blanc. Une seule
 *   carte mise en avant : l'activer sur une carte la retire des autres ;
 * - « Style du bouton » : orange (défaut) ou pétrole foncé (`deep`), posé en
 *   classe `is-style-*` sur le `core/button` lui-même (rien sur la carte).
 *
 * Avant `hasBadge`, la pastille n'existait que sur la carte mise en avant :
 * entrée `deprecated`, qui pose `hasBadge` sur ces cartes.
 *
 * Sans titre, la carte n'est pas rendue sur le site (`is-incomplete`).
 */
import { createBlocksFromInnerBlocksTemplate, registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	InspectorControls,
	RichText,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import {
	Notice,
	PanelBody,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { HEADING_FORMATS_OFF, TEXT_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import {
	hideLockedControls,
	textOf,
	useLockedContent,
	useNonBreakingPunctuation,
} from '../_shared/locked-content.js';
import metadata from './block.json';
import { LEVEL, NOTE_CLASS, PRICE_CLASS, TEMPLATE } from './template.js';

const ROOT = 'couturier/formulas';

/** Blocs imbriqués verrouillés. */
const LOCKED_BLOCKS = [ 'core/heading', 'core/paragraph', 'core/buttons' ];

/** Libellé proposé quand on met la carte en avant. */
const DEFAULT_BADGE = __( 'Le + choisi', 'couturier' );

/** Styles de bouton proposés (`ButtonStyles`) ; le premier est le défaut. */
const BUTTON_STYLES = [
	{ value: 'primary', label: __( 'Orange', 'couturier' ) },
	{ value: 'deep', label: __( 'Pétrole foncé', 'couturier' ) },
];

const STYLE_CLASS = /(^|\s)is-style-[^\s]+/g;

/** Bouton (`core/button`) de la carte, dans son groupe `core/buttons`. */
const buttonOf = ( blocks ) =>
	blocks.find( ( block ) => block.name === 'core/buttons' )?.innerBlocks.find( ( block ) => block.name === 'core/button' );

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { featured, hasBadge, badge } = attributes;
	const { updateBlockAttributes, replaceInnerBlocks, __unstableMarkNextChangeAsNotPersistent } = useDispatch( blockEditorStore );

	const { blocks, siblings, isEditing } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const [ rootId ] = editor.getBlockParentsByBlockName( clientId, ROOT, true );

			return {
				blocks: editor.getBlocks( clientId ),
				siblings: editor.getBlocks( editor.getBlockRootClientId( clientId ) ),
				// Bloc « Formules » ou l'un de ses blocs en cours d'édition : emplacements
				// vides et avertissements ne s'affichent qu'alors (cf. `blocks/CLAUDE.md`).
				isEditing:
					isSelected ||
					editor.hasSelectedInnerBlock( clientId, true ) ||
					( !! rootId && ( editor.isBlockSelected( rootId ) || editor.hasSelectedInnerBlock( rootId, true ) ) ),
			};
		},
		[ clientId, isSelected ]
	);

	// Carte créée avant le prix ou le texte après le bouton : champs ajoutés (prix
	// sous le titre, texte en fin de carte), une seule fois ; `replaceInnerBlocks`
	// passe outre le verrou du modèle.
	const hasClass = ( className ) => blocks.some( ( block ) => ( block.attributes.className ?? '' ).includes( className ) );
	const hasPrice = hasClass( PRICE_CLASS );
	const hasNote = hasClass( NOTE_CLASS );

	useEffect( () => {
		if ( ! blocks.length || ( hasPrice && hasNote ) ) {
			return;
		}
		const fieldOf = ( className ) =>
			createBlocksFromInnerBlocksTemplate( [ TEMPLATE.find( ( [ , attrs ] ) => attrs.className === className ) ] )[ 0 ];
		const next = [ ...blocks ];
		if ( ! hasPrice ) {
			next.splice( next.findIndex( ( block ) => block.name === 'core/heading' ) + 1, 0, fieldOf( PRICE_CLASS ) );
		}
		if ( ! hasNote ) {
			next.push( fieldOf( NOTE_CLASS ) );
		}
		__unstableMarkNextChangeAsNotPersistent();
		replaceInnerBlocks( clientId, next, false );
	}, [ blocks.length, hasPrice, hasNote ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const isIncomplete = blocks.length > 0 && ! textOf( blocks.find( ( block ) => block.name === 'core/heading' ) );

	// Titre, textes et bouton toujours verrouillés, titre toujours en H3 ; espace
	// insécable avant « ? ! : ; ».
	useLockedContent( blocks, { level: LEVEL, names: LOCKED_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	const button = buttonOf( blocks );
	const buttonStyle = /(?:^|\s)is-style-deep(?:\s|$)/.test( button?.attributes.className ?? '' ) ? 'deep' : 'primary';

	const setButtonStyle = ( style ) => {
		const base = ( button.attributes.className ?? '' ).replace( STYLE_CLASS, '' ).trim();
		const className = [ base, 'primary' !== style && `is-style-${ style }` ].filter( Boolean ).join( ' ' );
		updateBlockAttributes( button.clientId, { className: className || undefined } );
	};

	const setFeatured = ( checked ) => {
		if ( checked ) {
			// Une seule carte mise en avant.
			siblings
				.filter( ( card ) => card.clientId !== clientId && card.attributes.featured )
				.forEach( ( card ) => updateBlockAttributes( card.clientId, { featured: false } ) );
			setAttributes( { featured: true } );
			return;
		}
		setAttributes( { featured: false } );
	};

	// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		useBlockProps( {
			className: [ featured && 'is-featured', isIncomplete && 'is-incomplete' ].filter( Boolean ).join( ' ' ) || undefined,
		} ),
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	return (
		<li { ...innerBlocksProps }>
			<InspectorControls>
				<PanelBody title={ __( 'Mise en avant', 'couturier' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Mettre en avant', 'couturier' ) }
						help={ __( 'Fond pétrole et texte blanc. Une seule carte mise en avant par bloc.', 'couturier' ) }
						checked={ !! featured }
						onChange={ setFeatured }
					/>
				</PanelBody>
				<PanelBody title={ __( 'Libellé', 'couturier' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Afficher un libellé', 'couturier' ) }
						help={ __( 'Pastille posée en haut de la carte. Son texte se modifie sur la carte.', 'couturier' ) }
						checked={ !! hasBadge }
						onChange={ ( checked ) =>
							setAttributes( checked ? { hasBadge: true, badge: textOf( badge ) ? badge : DEFAULT_BADGE } : { hasBadge: false } )
						}
					/>
				</PanelBody>
				{ button && (
					<PanelBody title={ __( 'Bouton', 'couturier' ) }>
						<ToggleGroupControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							isBlock
							label={ __( 'Style du bouton', 'couturier' ) }
							value={ buttonStyle }
							onChange={ setButtonStyle }
						>
							{ BUTTON_STYLES.map( ( { value, label } ) => (
								<ToggleGroupControlOption key={ value } value={ value } label={ label } />
							) ) }
						</ToggleGroupControl>
					</PanelBody>
				) }
			</InspectorControls>
			{ hasBadge && (
				<RichText
					tagName="p"
					className="wp-block-couturier-formula-card__badge"
					aria-label={ __( 'Libellé de la pastille', 'couturier' ) }
					placeholder={ DEFAULT_BADGE }
					value={ badge }
					onChange={ ( value ) => setAttributes( { badge: value } ) }
					allowedFormats={ [] }
					disableLineBreaks
				/>
			) }
			{ children }
			{ isEditing && isIncomplete && (
				<Notice status="warning" isDismissible={ false } className="wp-block-couturier-formula-card__notice">
					{ __( 'Titre obligatoire : sans lui, cette carte n\'est pas affichée sur le site.', 'couturier' ) }
				</Notice>
			) }
		</li>
	);
}

/** Contenu enregistré : pastille (si affichée et saisie), puis blocs imbriqués. */
const content = ( showBadge, badge ) => (
	<>
		{ showBadge && ! RichText.isEmpty( badge ) && (
			<RichText.Content tagName="p" className="wp-block-couturier-formula-card__badge" value={ badge } />
		) }
		<InnerBlocks.Content />
	</>
);

registerBlockType( metadata.name, {
	edit: Edit,
	save: ( { attributes } ) => content( attributes.hasBadge, attributes.badge ),
	deprecated: [
		{
			// Pastille liée à la mise en avant (avant `hasBadge`).
			attributes: {
				featured: metadata.attributes.featured,
				badge: metadata.attributes.badge,
			},
			supports: metadata.supports,
			save: ( { attributes } ) => content( attributes.featured, attributes.badge ),
			migrate: ( attributes, innerBlocks ) => [
				{ ...attributes, hasBadge: !! attributes.featured && ! RichText.isEmpty( attributes.badge ) },
				innerBlocks,
			],
		},
	],
} );

// Titre sans format ; textes : gras, italique, lien.
restrictFormats( metadata.name, {
	'core/heading': [ ...HEADING_FORMATS_OFF, 'core/strikethrough', 'core/superscript', 'core/subscript' ],
	'core/paragraph': TEXT_FORMATS_OFF,
} );

// Titre, textes ou boutons sélectionnés : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name, LOCKED_BLOCKS );

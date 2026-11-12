/**
 * Carte du bloc « Formules » (`couturier/formula-card`).
 *
 * Contenu en blocs imbriqués, figé par `templateLock: 'all'` (`template.js`) :
 * - titre : `core/heading`, toujours un `<h3>`, sans format ;
 * - public visé : `core/paragraph` (`__subtitle`), facultatif ;
 * - détails (conduite, tarif…) : `core/paragraph` (`__details`), texte libre ;
 *   gras, italique, lien et saut de ligne ;
 * - bouton : `core/button` orange avec flèche, libellé et lien modifiables.
 *
 * Réglages de la barre latérale, indépendants :
 * - « Afficher un libellé » (`hasBadge`) : pastille (`badge`, préremplie
 *   « Le + choisi ») à cheval sur le bord haut, sur toute carte ;
 * - « Mettre en avant » (`featured`) : fond pétrole, texte blanc. Une seule
 *   carte mise en avant : l'activer sur une carte la retire des autres.
 *
 * Avant `hasBadge`, la pastille n'existait que sur la carte mise en avant :
 * entrée `deprecated`, qui pose `hasBadge` sur ces cartes.
 *
 * Sans titre, la carte n'est pas rendue sur le site (`is-incomplete`).
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	InspectorControls,
	RichText,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { Notice, PanelBody, ToggleControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { HEADING_FORMATS_OFF, TEXT_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import {
	hideLockedControls,
	textOf,
	useLockedContent,
	useNonBreakingPunctuation,
} from '../_shared/locked-content.js';
import metadata from './block.json';
import { LEVEL, TEMPLATE } from './template.js';

const ROOT = 'couturier/formulas';

/** Blocs imbriqués verrouillés. */
const LOCKED_BLOCKS = [ 'core/heading', 'core/paragraph', 'core/buttons' ];

/** Libellé proposé quand on met la carte en avant. */
const DEFAULT_BADGE = __( 'Le + choisi', 'couturier' );

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { featured, hasBadge, badge } = attributes;
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

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

	const isIncomplete = blocks.length > 0 && ! textOf( blocks.find( ( block ) => block.name === 'core/heading' ) );

	// Titre, textes et bouton toujours verrouillés, titre toujours en H3 ; espace
	// insécable avant « ? ! : ; ».
	useLockedContent( blocks, { level: LEVEL, names: LOCKED_BLOCKS } );
	useNonBreakingPunctuation( blocks );

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

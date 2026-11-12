/**
 * Cartes d'informations du bloc « Objectifs et programme »
 * (`couturier/training-overview-facts`) : quatre cartes fixes (« Public »,
 * « Prérequis », « Titre et validité », « Accessibilité PSH »), sans ajout ni
 * retrait. Repris de `page-hero-facts`.
 *
 * - attribut tableau (`source: query`, cf. « Liste d'éléments répétables en
 *   attribut » dans `blocks/CLAUDE.md`), écrit dans le HTML par `save()` :
 *   libellés et valeurs sont comptés par le compteur de mots ; aucun titre (le
 *   libellé est un `<dt>`, hors du plan de la page) ;
 * - libellé prérempli, modifiable ; valeur saisie ;
 * - fond par carte (`data-background` + classe `is-bg-{fond}`), réglé dans la
 *   barre latérale (un panneau par carte) ;
 * - une carte sans valeur est enregistrée avec `is-incomplete` : `render.php` la
 *   retire du front, le canvas la masque hors édition.
 *
 * `save()` n'enregistre que la liste : l'enveloppe est produite par `render.php`.
 */
import { registerBlockType } from '@wordpress/blocks';
import { RichText, store as blockEditorStore, useBlockProps } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

import { BACKGROUNDS, BackgroundPanel } from '../_shared/backgrounds.js';
import { nonBreaking, textOf } from '../_shared/locked-content.js';
import metadata from './block.json';

const BASE = 'wp-block-couturier-training-overview-facts';

/** Fonds proposés pour une carte. */
const OPTIONS = BACKGROUNDS.filter( ( item ) =>
	[ 'peach-300', 'petrol-100', 'petrol-50', 'orange-100', 'peach-100', 'neutral-50' ].includes( item.slug )
);
const FALLBACK = 'peach-300';

/** Fond d'une carte : valeur enregistrée si elle est dans la liste, sinon le défaut. */
const backgroundOf = ( item ) => ( OPTIONS.some( ( option ) => option.slug === item.background ) ? item.background : FALLBACK );

/** Carte affichée sur le site : valeur renseignée. */
const isComplete = ( item ) => '' !== textOf( item.value );

const itemClassName = ( item ) =>
	[ `${ BASE }__item`, `is-bg-${ backgroundOf( item ) }`, isComplete( item ) ? '' : 'is-incomplete' ].filter( Boolean ).join( ' ' );

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const items = attributes.items ?? [];
	const isEditing = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const rootId = editor.getBlockRootClientId( clientId );

			return isSelected || editor.isBlockSelected( rootId ) || editor.hasSelectedInnerBlock( rootId, true );
		},
		[ clientId, isSelected ]
	);

	const updateItem = ( index, changes ) =>
		setAttributes( { items: items.map( ( item, i ) => ( i === index ? { ...item, ...changes } : item ) ) } );

	return (
		<div { ...useBlockProps() }>
			{ items.map( ( item, index ) => (
				<BackgroundPanel
					key={ index }
					options={ OPTIONS }
					current={ OPTIONS.find( ( option ) => option.slug === backgroundOf( item ) ) }
					/* translators: %s: libellé de la carte, ou son numéro. */
					title={ sprintf( __( 'Fond : %s', 'couturier' ), textOf( item.label ) || index + 1 ) }
					onChange={ ( slug ) => updateItem( index, { background: slug } ) }
				/>
			) ) }
			{ isEditing && 0 === items.filter( isComplete ).length && (
				<Notice status="warning" isDismissible={ false } className={ `${ BASE }__notice` }>
					{ __( 'Seules les cartes dont la valeur est renseignée sont affichées sur le site.', 'couturier' ) }
				</Notice>
			) }
			<dl className={ `${ BASE }__list` }>
				{ items.map( ( item, index ) => (
					<div key={ index } className={ itemClassName( item ) } data-background={ backgroundOf( item ) }>
						<RichText
							tagName="dt"
							className={ `${ BASE }__label` }
							/* translators: %d: position de la carte. */
							aria-label={ sprintf( __( 'Libellé %d', 'couturier' ), index + 1 ) }
							placeholder={ __( 'Libellé', 'couturier' ) }
							value={ item.label }
							onChange={ ( label ) => updateItem( index, { label: nonBreaking( label ) } ) }
							allowedFormats={ [] }
							disableLineBreaks
						/>
						<RichText
							tagName="dd"
							className={ `${ BASE }__value` }
							/* translators: %d: position de la carte. */
							aria-label={ sprintf( __( 'Valeur %d', 'couturier' ), index + 1 ) }
							placeholder={ __( 'Valeur', 'couturier' ) }
							value={ item.value }
							onChange={ ( value ) => updateItem( index, { value: nonBreaking( value ) } ) }
							allowedFormats={ [ 'core/bold', 'core/link' ] }
						/>
					</div>
				) ) }
			</dl>
		</div>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: ( { attributes } ) => (
		<dl className={ `${ BASE }__list` }>
			{ ( attributes.items ?? [] ).map( ( item, index ) => (
				<div key={ index } className={ itemClassName( item ) } data-background={ backgroundOf( item ) }>
					<RichText.Content tagName="dt" className={ `${ BASE }__label` } value={ item.label } />
					<RichText.Content tagName="dd" className={ `${ BASE }__value` } value={ item.value } />
				</div>
			) ) }
		</dl>
	),
} );

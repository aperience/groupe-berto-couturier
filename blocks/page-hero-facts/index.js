/**
 * Chiffres clés du héros de page (`couturier/page-hero-facts`) : rangée de 1 à 5
 * cartes (« Durée » / « de 14 heures à 35 heures »…) à cheval sur le bas du héros
 * (`couturier/page-hero`), **à la place du contact**. Ajouté et retiré par le
 * panneau « Chiffres clés » du héros, jamais par l'inserteur.
 *
 * - les chiffres sont un attribut tableau (`source: query`, cf. « Liste
 *   d'éléments répétables en attribut » dans `blocks/CLAUDE.md`), écrits dans le
 *   HTML par `save()` : libellés et valeurs sont comptés par le compteur de mots ;
 *   aucun titre (le libellé est un `<dt>`, hors du plan de la page) ;
 * - un chiffre sans libellé ou sans valeur est enregistré quand même, avec la
 *   classe `is-incomplete` : `render.php` le retire du front, le canvas le masque
 *   hors édition ;
 * - bloc sélectionné : boutons pour déplacer et supprimer chaque chiffre (1 au
 *   moins), et pour en ajouter (5 au plus).
 *
 * `save()` n'enregistre que la liste : l'enveloppe est produite par `render.php`.
 */
import { registerBlockType } from '@wordpress/blocks';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { Button, Notice } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

import { chevronLeft, chevronRight, plus, trash } from '../_shared/icons.js';
import { nonBreaking, textOf } from '../_shared/locked-content.js';
import metadata from './block.json';

const MIN_ITEMS = 1;
const MAX_ITEMS = 5;

const EMPTY_ITEM = { label: '', value: '' };

/** Chiffre affiché sur le site : libellé et valeur renseignés. */
const isComplete = ( item ) => '' !== textOf( item.label ) && '' !== textOf( item.value );

/** Espace avant « % » rendue insécable : « 88 % » ne se coupe pas. */
const nonBreakingValue = ( html ) => nonBreaking( html ).replace( / +(?=%)/gu, ' ' );

const itemClassName = ( item ) =>
	'wp-block-couturier-page-hero-facts__item' + ( isComplete( item ) ? '' : ' is-incomplete' );

function Edit( { attributes, setAttributes, isSelected } ) {
	const items = attributes.items ?? [];

	const updateItem = ( index, changes ) =>
		setAttributes( { items: items.map( ( item, i ) => ( i === index ? { ...item, ...changes } : item ) ) } );

	const moveItem = ( index, offset ) => {
		const next = [ ...items ];
		[ next[ index ], next[ index + offset ] ] = [ next[ index + offset ], next[ index ] ];
		setAttributes( { items: next } );
	};

	const removeItem = ( index ) => setAttributes( { items: items.filter( ( _, i ) => i !== index ) } );

	const addItem = () => setAttributes( { items: [ ...items, { ...EMPTY_ITEM } ] } );

	return (
		<div { ...useBlockProps() }>
			{ isSelected && 0 === items.filter( isComplete ).length && (
				<Notice status="warning" isDismissible={ false } className="wp-block-couturier-page-hero-facts__notice">
					{ __( 'Seuls les chiffres renseignés (libellé et valeur) sont affichés sur le site.', 'couturier' ) }
				</Notice>
			) }
			<dl className="wp-block-couturier-page-hero-facts__list">
				{ items.map( ( item, index ) => (
					<div key={ index } className={ itemClassName( item ) }>
						<RichText
							tagName="dt"
							className="wp-block-couturier-page-hero-facts__label"
							/* translators: %d: position du chiffre clé. */
							aria-label={ sprintf( __( 'Libellé %d', 'couturier' ), index + 1 ) }
							placeholder={ __( 'Libellé', 'couturier' ) }
							value={ item.label }
							onChange={ ( label ) => updateItem( index, { label: nonBreaking( label ) } ) }
							allowedFormats={ [] }
						/>
						<RichText
							tagName="dd"
							className="wp-block-couturier-page-hero-facts__value"
							/* translators: %d: position du chiffre clé. */
							aria-label={ sprintf( __( 'Valeur %d', 'couturier' ), index + 1 ) }
							placeholder={ __( 'Valeur', 'couturier' ) }
							value={ item.value }
							onChange={ ( value ) => updateItem( index, { value: nonBreakingValue( value ) } ) }
							allowedFormats={ [] }
						/>
						{ isSelected && (
							<div className="wp-block-couturier-page-hero-facts__controls">
								<Button
									size="small"
									icon={ chevronLeft }
									label={ __( 'Déplacer avant', 'couturier' ) }
									disabled={ 0 === index }
									accessibleWhenDisabled
									onClick={ () => moveItem( index, -1 ) }
								/>
								<Button
									size="small"
									icon={ chevronRight }
									label={ __( 'Déplacer après', 'couturier' ) }
									disabled={ items.length - 1 === index }
									accessibleWhenDisabled
									onClick={ () => moveItem( index, 1 ) }
								/>
								<Button
									size="small"
									icon={ trash }
									isDestructive
									label={ __( 'Supprimer ce chiffre', 'couturier' ) }
									disabled={ items.length <= MIN_ITEMS }
									accessibleWhenDisabled
									onClick={ () => removeItem( index ) }
								/>
							</div>
						) }
					</div>
				) ) }
			</dl>
			{ isSelected && items.length < MAX_ITEMS && (
				<Button
					__next40pxDefaultSize
					variant="secondary"
					icon={ plus }
					className="wp-block-couturier-page-hero-facts__add"
					onClick={ addItem }
				>
					{ __( 'Ajouter un chiffre clé', 'couturier' ) }
				</Button>
			) }
		</div>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: ( { attributes } ) => (
		<dl className="wp-block-couturier-page-hero-facts__list">
			{ ( attributes.items ?? [] ).map( ( item, index ) => (
				<div key={ index } className={ itemClassName( item ) }>
					<RichText.Content tagName="dt" className="wp-block-couturier-page-hero-facts__label" value={ item.label } />
					<RichText.Content tagName="dd" className="wp-block-couturier-page-hero-facts__value" value={ item.value } />
				</div>
			) ) }
		</dl>
	),
} );

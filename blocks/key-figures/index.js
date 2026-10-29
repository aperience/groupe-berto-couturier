/**
 * Bloc « Chiffres clés » (`couturier/key-figures`) : carte de 2 à 4 chiffres,
 * chacun fait d'une valeur (« 1963 », « 80 % ») et d'un libellé.
 *
 * - les chiffres sont un attribut tableau (`source: query`), écrit dans le HTML
 *   par `save()` : valeurs et libellés sont comptés par le compteur de mots
 *   (cf. `blocks/CLAUDE.md`) ;
 * - un chiffre sans valeur ou sans libellé est enregistré quand même (rien de
 *   perdu au rechargement), avec la classe `is-incomplete` : `render.php` le
 *   retire du front, et le canvas le masque hors édition ;
 * - bloc sélectionné : boutons pour déplacer et supprimer chaque chiffre (2 au
 *   moins), et pour en ajouter (4 au plus).
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

const MIN_ITEMS = 2;
const MAX_ITEMS = 4;

const EMPTY_ITEM = { value: '', label: '' };

/** Chiffre affiché sur le site : valeur et libellé renseignés. */
const isComplete = ( item ) => '' !== textOf( item.value ) && '' !== textOf( item.label );

/** Espace avant « % » rendue insécable : « 80 % » ne se coupe pas. */
const nonBreakingValue = ( html ) => String( html ?? '' ).replace( / +(?=%)/gu, ' ' );

const itemClassName = ( item ) =>
	'wp-block-couturier-key-figures__item' + ( isComplete( item ) ? '' : ' is-incomplete' );

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
			{ isSelected && items.filter( isComplete ).length < MIN_ITEMS && (
				<Notice status="warning" isDismissible={ false } className="wp-block-couturier-key-figures__notice">
					{ __( 'Seuls les chiffres renseignés (valeur et libellé) sont affichés sur le site.', 'couturier' ) }
				</Notice>
			) }
			<ul className="wp-block-couturier-key-figures__list" role="list">
				{ items.map( ( item, index ) => (
					<li key={ index } className={ itemClassName( item ) }>
						<RichText
							tagName="p"
							className="wp-block-couturier-key-figures__value"
							/* translators: %d: position du chiffre clé. */
							aria-label={ sprintf( __( 'Chiffre %d', 'couturier' ), index + 1 ) }
							placeholder={ __( 'Chiffre', 'couturier' ) }
							value={ item.value }
							onChange={ ( value ) => updateItem( index, { value: nonBreakingValue( value ) } ) }
							allowedFormats={ [] }
							disableLineBreaks
						/>
						<RichText
							tagName="p"
							className="wp-block-couturier-key-figures__label"
							/* translators: %d: position du chiffre clé. */
							aria-label={ sprintf( __( 'Libellé %d', 'couturier' ), index + 1 ) }
							placeholder={ __( 'Libellé', 'couturier' ) }
							value={ item.label }
							onChange={ ( label ) => updateItem( index, { label: nonBreaking( label ) } ) }
							allowedFormats={ [] }
							disableLineBreaks
						/>
						{ isSelected && (
							<div className="wp-block-couturier-key-figures__controls">
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
					</li>
				) ) }
			</ul>
			{ isSelected && items.length < MAX_ITEMS && (
				<Button
					__next40pxDefaultSize
					variant="secondary"
					icon={ plus }
					className="wp-block-couturier-key-figures__add"
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
		<ul className="wp-block-couturier-key-figures__list" role="list">
			{ ( attributes.items ?? [] ).map( ( item, index ) => (
				<li key={ index } className={ itemClassName( item ) }>
					<RichText.Content tagName="p" className="wp-block-couturier-key-figures__value" value={ item.value } />
					<RichText.Content tagName="p" className="wp-block-couturier-key-figures__label" value={ item.label } />
				</li>
			) ) }
		</ul>
	),
} );

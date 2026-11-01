/**
 * Bloc « Avis Google » (`couturier/reviews`) : note moyenne Google, lien vers
 * tous les avis, et trois avis — le premier mis en avant, les deux autres
 * secondaires.
 *
 * Les avis sont saisis à la main (pas d'API Google) :
 * - note et avis sont des attributs relus depuis le HTML enregistré (`source:
 *   html` / `query`, cf. « Liste d'éléments répétables en attribut » dans
 *   `blocks/CLAUDE.md`) : tous les textes sont comptés par le compteur de mots ;
 * - le nombre d'étoiles de chaque avis est un attribut `data-stars` du `<li>` ;
 *   l'URL de la fiche Google, un attribut classique (commentaire du bloc) ;
 * - un avis sans texte ou sans nom est enregistré quand même, avec la classe
 *   `is-incomplete` : `render.php` le retire du front, le canvas le masque hors
 *   édition.
 *
 * Liste fixe de trois avis : ni ajout, ni suppression, ni déplacement.
 *
 * `save()` n'enregistre que la note et la liste : l'enveloppe, l'en-tête (logo,
 * étoiles de la note, lien) et les étoiles des avis sont produits par
 * `render.php`. Le canvas les reproduit à l'identique (mêmes classes).
 */
import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, RichText, store as blockEditorStore, useBlockProps } from '@wordpress/block-editor';
import { Notice, PanelBody, SelectControl, TextControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

import { nonBreaking, textOf } from '../_shared/locked-content.js';
import metadata from './block.json';

const CLASS = 'wp-block-couturier-reviews';

const COUNT = 3;
const EMPTY_REVIEW = { stars: '5', text: '', name: '', context: '', date: '' };

const STAR_OPTIONS = [ 5, 4, 3, 2, 1 ].map( ( value ) => ( { value: String( value ), label: String( value ) } ) );

/** Avis affiché sur le site : texte et nom renseignés. */
const isComplete = ( review ) => '' !== textOf( review.text ) && '' !== textOf( review.name );

/** Nombre d'étoiles d'un avis, entier de 1 à 5 (5 à défaut) — même règle que `render.php`. */
const starsOf = ( review ) => {
	const stars = parseInt( review?.stars, 10 );

	return stars >= 1 && stars <= 5 ? stars : 5;
};

/**
 * Note sur 5 extraite du texte saisi (« 4,8 / 5 » → 4.8), bornée à 0–5 ; `null`
 * si le texte n'en contient pas. Même règle que `render.php`.
 */
export const scoreOf = ( html ) => {
	const match = textOf( html ).match( /\d+(?:[.,]\d+)?/ );

	return match ? Math.min( 5, Math.max( 0, parseFloat( match[ 0 ].replace( ',', '.' ) ) ) ) : null;
};

/** Exactement trois avis : ceux du HTML enregistré, complétés si besoin. */
const normalize = ( reviews ) =>
	Array.from( { length: COUNT }, ( _, index ) => ( { ...EMPTY_REVIEW, ...( reviews?.[ index ] ?? {} ) } ) );

const itemClassName = ( review ) => `${ CLASS }__item` + ( isComplete( review ) ? '' : ' is-incomplete' );

/** Libellé d'un avis dans l'éditeur (champs, barre latérale). */
const reviewLabel = ( index ) =>
	0 === index
		? __( 'Avis mis en avant', 'couturier' )
		: /* translators: %d: position de l'avis secondaire (1 ou 2). */
		  sprintf( __( 'Avis secondaire %d', 'couturier' ), index );

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const reviews = normalize( attributes.reviews );
	const score = scoreOf( attributes.score );

	const isEditing = useSelect(
		( select ) => isSelected || select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId, isSelected ]
	);

	const updateReview = ( index, changes ) =>
		setAttributes( { reviews: reviews.map( ( review, i ) => ( i === index ? { ...review, ...changes } : review ) ) } );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Avis Google', 'couturier' ) }>
					<TextControl
						__next40pxDefaultSize
						type="url"
						label={ __( 'Lien « Lire tous les avis »', 'couturier' ) }
						help={ __( 'Adresse de la fiche Google de l’auto-école. Sans adresse, le lien n’est pas affiché.', 'couturier' ) }
						value={ attributes.url ?? '' }
						onChange={ ( url ) => setAttributes( { url: url.trim() } ) }
					/>
					{ reviews.map( ( review, index ) => (
						<SelectControl
							key={ index }
							__next40pxDefaultSize
							/* translators: %s: libellé de l'avis (« Avis mis en avant », « Avis secondaire 1 »…). */
							label={ sprintf( __( 'Étoiles — %s', 'couturier' ), reviewLabel( index ) ) }
							value={ String( starsOf( review ) ) }
							options={ STAR_OPTIONS }
							onChange={ ( stars ) => updateReview( index, { stars } ) }
						/>
					) ) }
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps() }>
				{ isEditing && reviews.some( ( review ) => ! isComplete( review ) ) && (
					<Notice status="warning" isDismissible={ false } className={ `${ CLASS }__notice` }>
						{ __( 'Seuls les avis renseignés (texte et nom) sont affichés sur le site.', 'couturier' ) }
					</Notice>
				) }
				<div className={ `${ CLASS }__summary` }>
					<div className={ `${ CLASS }__rating` }>
						<RichText
							tagName="p"
							className={ `${ CLASS }__score` }
							aria-label={ __( 'Note moyenne', 'couturier' ) }
							placeholder={ __( '4,8 / 5', 'couturier' ) }
							value={ attributes.score }
							onChange={ ( value ) => setAttributes( { score: value } ) }
							allowedFormats={ [] }
							disableLineBreaks
						/>
						<div className={ `${ CLASS }__google` } aria-hidden="true">
							<span className={ `${ CLASS }__logo` } />
							{ null !== score && (
								<span className={ `${ CLASS }__score-stars` } style={ { '--reviews-score': score } } />
							) }
						</div>
					</div>
					{ attributes.url && (
						<p className={ `${ CLASS }__all` }>
							<span className={ `${ CLASS }__all-link` }>
								{ __( 'Lire tous les avis', 'couturier' ) }
								<span className={ `${ CLASS }__all-arrow` } aria-hidden="true" />
							</span>
						</p>
					) }
				</div>
				<ul className={ `${ CLASS }__list` } role="list">
					{ reviews.map( ( review, index ) => (
						<li key={ index } className={ itemClassName( review ) } data-stars={ starsOf( review ) }>
							<p className={ `${ CLASS }__stars` } style={ { '--stars': starsOf( review ) } } />
							<RichText
								tagName="blockquote"
								className={ `${ CLASS }__text` }
								/* translators: %s: libellé de l'avis. */
								aria-label={ sprintf( __( 'Texte — %s', 'couturier' ), reviewLabel( index ) ) }
								placeholder={ __( 'Texte de l’avis, copié de Google', 'couturier' ) }
								value={ review.text }
								onChange={ ( text ) => updateReview( index, { text: nonBreaking( text ) } ) }
								allowedFormats={ [] }
							/>
							<RichText
								tagName="p"
								className={ `${ CLASS }__name` }
								/* translators: %s: libellé de l'avis. */
								aria-label={ sprintf( __( 'Nom — %s', 'couturier' ), reviewLabel( index ) ) }
								placeholder={ __( 'Prénom Nom', 'couturier' ) }
								value={ review.name }
								onChange={ ( name ) => updateReview( index, { name } ) }
								allowedFormats={ [] }
								disableLineBreaks
							/>
							<p className={ `${ CLASS }__meta` + ( RichText.isEmpty( review.date ) ? ' is-date-empty' : '' ) }>
								<RichText
									tagName="span"
									className={ `${ CLASS }__context` }
									/* translators: %s: libellé de l'avis. */
									aria-label={ sprintf( __( 'Formation — %s', 'couturier' ), reviewLabel( index ) ) }
									placeholder={ __( 'Formation (ex. Permis B)', 'couturier' ) }
									value={ review.context }
									onChange={ ( context ) => updateReview( index, { context } ) }
									allowedFormats={ [] }
									disableLineBreaks
								/>
								<RichText
									tagName="span"
									className={ `${ CLASS }__date` }
									/* translators: %s: libellé de l'avis. */
									aria-label={ sprintf( __( 'Date — %s', 'couturier' ), reviewLabel( index ) ) }
									placeholder={ __( 'Date (facultative)', 'couturier' ) }
									value={ review.date }
									onChange={ ( date ) => updateReview( index, { date } ) }
									allowedFormats={ [] }
									disableLineBreaks
								/>
							</p>
						</li>
					) ) }
				</ul>
			</div>
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: ( { attributes } ) => (
		<>
			{ ! RichText.isEmpty( attributes.score ?? '' ) && (
				<RichText.Content tagName="p" className={ `${ CLASS }__score` } value={ attributes.score } />
			) }
			<ul className={ `${ CLASS }__list` } role="list">
				{ normalize( attributes.reviews ).map( ( review, index ) => (
					<li key={ index } className={ itemClassName( review ) } data-stars={ starsOf( review ) }>
						<RichText.Content tagName="blockquote" className={ `${ CLASS }__text` } value={ review.text } />
						<RichText.Content tagName="p" className={ `${ CLASS }__name` } value={ review.name } />
						{ ( ! RichText.isEmpty( review.context ) || ! RichText.isEmpty( review.date ) ) && (
							<p className={ `${ CLASS }__meta` }>
								{ ! RichText.isEmpty( review.context ) && (
									<RichText.Content tagName="span" className={ `${ CLASS }__context` } value={ review.context } />
								) }
								{ ! RichText.isEmpty( review.date ) && (
									<RichText.Content tagName="span" className={ `${ CLASS }__date` } value={ review.date } />
								) }
							</p>
						) }
					</li>
				) ) }
			</ul>
		</>
	),
} );

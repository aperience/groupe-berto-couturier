/**
 * Bloc « Avis Google » (`couturier/reviews`) : repli « … Plus » / « Moins » du
 * texte de chaque avis (`read-more.js`), en `--reviews-lines` lignes
 * (`block/_reviews.scss`), sur tous les écrans.
 *
 * Le texte, un seul paragraphe, passe en `inline` (`is-clamped`) : le bouton, qui
 * le suit, reste sur la ligne du dernier mot. Le bouton est rendu `hidden` par
 * `render.php` : sans ce script, le texte est entier.
 */
import { readMore } from './read-more.js';

document.querySelectorAll( '.wp-block-couturier-reviews__body' ).forEach( ( body ) => {
	const text = body.querySelector( '.wp-block-couturier-reviews__text' );
	const toggle = body.querySelector( '.wp-block-couturier-reviews__more' );

	if ( text && toggle ) {
		readMore( body, {
			text,
			toggle,
			lines: () => parseInt( getComputedStyle( body ).getPropertyValue( '--reviews-lines' ), 10 ),
		} );
	}
} );

/**
 * Bloc « Image et texte » (`couturier/image-text`) : repli « … Plus » / « Moins »
 * du texte (`read-more.js`), en `--image-text-lines` lignes
 * (`block/_image-text.scss`), **desktop seulement** (à partir de `lg`) : en
 * dessous, le texte reste entier.
 *
 * Le texte compte plusieurs paragraphes et listes : le bouton est posé à la fin
 * du dernier paragraphe ou élément de liste affiché (`insideText`). Il est rendu
 * `hidden` par `image-text-body/render.php` : sans ce script, le texte est entier.
 */
import { readMore } from './read-more.js';

/** Point de rupture `lg` de Bootstrap (`--bs-breakpoint-lg`, émis par son module `root`). */
const lg = getComputedStyle( document.documentElement ).getPropertyValue( '--bs-breakpoint-lg' ).trim() || '992px';
const desktop = window.matchMedia( `(min-width: ${ lg })` );

document.querySelectorAll( '.wp-block-couturier-image-text-body' ).forEach( ( body ) => {
	const text = body.querySelector( '.wp-block-couturier-image-text-body__text' );
	const toggle = body.querySelector( '.wp-block-couturier-image-text-body__more' );

	if ( text && toggle ) {
		readMore( body, {
			text,
			toggle,
			lines: () => parseInt( getComputedStyle( body ).getPropertyValue( '--image-text-lines' ), 10 ),
			isEnabled: () => desktop.matches,
			media: desktop,
			insideText: true,
		} );
	}
} );

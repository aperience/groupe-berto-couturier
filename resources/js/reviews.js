/**
 * Bloc « Avis Google » (`couturier/reviews`) : repli « Plus » / « Moins » du
 * texte de chaque avis, modèle WAI-ARIA « Disclosure ».
 *
 * - replié : le texte est coupé **entre deux mots**, au plus long début qui tient
 *   en `--reviews-lines` lignes (`block/_reviews.scss`) avec « … Plus » collé
 *   derrière, sur la même ligne (texte et bouton `inline`, `is-clamped`). La
 *   coupe est cherchée par dichotomie sur les fins de mots, en mesurant la
 *   hauteur rendue ; elle est refaite quand la largeur change et une fois les
 *   polices chargées. Un texte qui tient en entier n'a pas de bouton ;
 * - déplié : texte entier, « Moins » à sa suite ;
 * - le texte replié est vraiment retiré du DOM (et non masqué) : un lecteur
 *   d'écran lit ce qui est affiché, et `aria-expanded` annonce la suite ;
 * - dépli et repli animés sur la hauteur de l'enveloppe (`max-height`, comme le
 *   texte repliable) : `is-animating` le temps de la transition, coupée sous
 *   `prefers-reduced-motion`. Au repli, le texte n'est coupé qu'à la fin de
 *   l'animation, à la hauteur visée : rien ne saute ; « … Plus » réapparaît
 *   alors en fondu (`is-appearing`).
 *
 * Le bouton est rendu `hidden` par `render.php` : sans ce script, le texte est
 * entier.
 */

const BODY = '.wp-block-couturier-reviews__body';
const CLAMPED = 'is-clamped';
const ANIMATING = 'is-animating';
const APPEARING = 'is-appearing';

/** Fin du texte coupé : espaces et ponctuation de fin retirés (« … » suit). */
const TRAILING = /[\s.,;:…-]+$/u;

/**
 * Remplit `container` avec `html`, coupé après `limit` caractères de texte
 * (`null` : entier). Les nœuds qui suivent la coupe (`<br>` compris) sont
 * retirés.
 */
function fill( container, html, limit ) {
	container.innerHTML = html;

	if ( null === limit ) {
		return;
	}

	const walker = document.createTreeWalker( container, NodeFilter.SHOW_TEXT );
	let remaining = limit;
	let cut = null;

	while ( walker.nextNode() ) {
		const node = walker.currentNode;

		if ( node.length >= remaining ) {
			node.data = node.data.slice( 0, remaining ).replace( TRAILING, '' );
			cut = node;
			break;
		}

		remaining -= node.length;
	}

	// Tout ce qui suit la coupe, à chaque niveau jusqu'au conteneur.
	for ( let node = cut; node && node !== container; node = node.parentNode ) {
		while ( node.nextSibling ) {
			node.nextSibling.remove();
		}
	}

	// `<br>` laissés en fin de texte (coupe juste après un saut de ligne).
	while ( container.lastChild && ( 'BR' === container.lastChild.nodeName || '' === container.lastChild.textContent.trim() ) ) {
		container.lastChild.remove();
	}
}

/** Positions de coupe possibles : avant chaque espace et à la fin de chaque nœud de texte. */
function breakpoints( container ) {
	const points = new Set();
	const walker = document.createTreeWalker( container, NodeFilter.SHOW_TEXT );
	let offset = 0;

	while ( walker.nextNode() ) {
		const data = walker.currentNode.data;

		for ( let i = 0; i < data.length; i++ ) {
			if ( /\s/u.test( data[ i ] ) ) {
				points.add( offset + i );
			}
		}

		offset += data.length;
		points.add( offset );
	}

	return [ ...points ].filter( ( point ) => point > 0 ).sort( ( a, b ) => a - b );
}

function init( body ) {
	const text = body.querySelector( '.wp-block-couturier-reviews__text' );
	const toggle = body.querySelector( '.wp-block-couturier-reviews__more' );

	if ( ! text || ! toggle ) {
		return;
	}

	const html = text.innerHTML;
	const points = breakpoints( text );
	let width = 0;

	const isExpanded = () => 'true' === toggle.getAttribute( 'aria-expanded' );

	/** Hauteur maximale du texte replié : `--reviews-lines` lignes. */
	const maxHeight = () => {
		const styles = getComputedStyle( body );

		return parseInt( styles.getPropertyValue( '--reviews-lines' ), 10 ) * parseFloat( styles.lineHeight ) + 1;
	};

	/**
	 * Coupe le texte (replié). Texte entier sans bouton s'il tient ; sinon, plus
	 * long début qui tient avec « … Plus ».
	 */
	const clamp = () => {
		const limit = maxHeight();
		const fits = () => body.getBoundingClientRect().height <= limit;

		toggle.hidden = true;
		fill( text, html, null );

		if ( fits() ) {
			return;
		}

		toggle.hidden = false;

		let low = 0; // Indice dans `points` du plus long début qui tient (au moins le premier mot).
		let high = points.length - 1;

		while ( low < high ) {
			const middle = Math.ceil( ( low + high ) / 2 );

			fill( text, html, points[ middle ] );

			if ( fits() ) {
				low = middle;
			} else {
				high = middle - 1;
			}
		}

		fill( text, html, points[ low ] );
	};

	// Fin de l'animation : la hauteur revient à la feuille de style, et le texte
	// est coupé s'il est replié — « … Plus » réapparaissant alors en fondu
	// (`is-appearing`, animation CSS relancée à chaque repli).
	const settle = () => {
		body.classList.remove( ANIMATING );
		body.style.maxHeight = '';

		if ( ! isExpanded() ) {
			clamp();
			toggle.classList.remove( APPEARING );
			void toggle.offsetWidth; // Relance l'animation.
			toggle.classList.add( APPEARING );
		}
	};

	toggle.addEventListener( 'animationend', () => toggle.classList.remove( APPEARING ) );

	toggle.addEventListener( 'click', () => {
		const expanded = ! isExpanded();
		const from = body.offsetHeight;

		// Destination : hauteur du texte entier (dépli) ou coupé (repli), mesurée
		// avant l'animation. Au repli, le texte reste entier jusqu'à la fin.
		toggle.setAttribute( 'aria-expanded', String( expanded ) );

		if ( expanded ) {
			fill( text, html, null );
		} else {
			clamp();
		}

		const to = body.offsetHeight;

		fill( text, html, null );

		body.classList.add( ANIMATING );
		body.style.maxHeight = `${ from }px`;
		void body.offsetHeight; // Force le calcul du point de départ.
		body.style.maxHeight = `${ to }px`;

		// Pas de transition (mouvement réduit) : pas de `transitionend`.
		if ( 0 === parseFloat( getComputedStyle( body ).transitionDuration ) || from === to ) {
			settle();
		}
	} );

	body.addEventListener( 'transitionend', ( event ) => {
		if ( event.target === body && 'max-height' === event.propertyName ) {
			settle();
		}
	} );

	// Coupe refaite quand la largeur change (pas la hauteur : c'est la coupe qui la fixe).
	const update = () => {
		if ( body.offsetWidth !== width ) {
			width = body.offsetWidth;

			if ( ! isExpanded() && ! body.classList.contains( ANIMATING ) ) {
				clamp();
			}
		}
	};

	body.classList.add( CLAMPED );
	update();

	new ResizeObserver( update ).observe( body );
	document.fonts?.ready.then( () => {
		width = 0;
		update();
	} );
}

document.querySelectorAll( BODY ).forEach( init );

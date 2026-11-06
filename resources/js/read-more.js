/**
 * Repli « … Plus » / « Moins » d'un texte, modèle WAI-ARIA « Disclosure » :
 * partagé par les blocs « Avis Google » (`reviews.js`) et « Image et texte »
 * (`image-text.js`).
 *
 * - replié : le texte est coupé **entre deux mots**, au plus long début qui tient
 *   en `lines()` lignes avec « … Plus » collé derrière, sur la même ligne. La
 *   coupe est cherchée par dichotomie sur les fins de mots, en mesurant la
 *   hauteur rendue de l'enveloppe ; elle est refaite quand la largeur change et
 *   une fois les polices chargées. Un texte qui tient en entier n'a pas de bouton ;
 * - déplié : texte entier, « Moins » à sa suite ;
 * - le texte replié est vraiment retiré du DOM (et non masqué) : un lecteur
 *   d'écran lit ce qui est affiché, et `aria-expanded` annonce la suite ;
 * - dépli et repli animés sur la hauteur de l'enveloppe (`max-height`, comme le
 *   texte repliable) : `is-animating` le temps de la transition, coupée sous
 *   `prefers-reduced-motion`. Au repli, le texte n'est coupé qu'à la fin de
 *   l'animation, à la hauteur visée : rien ne saute ; « … Plus » réapparaît
 *   alors en fondu (`is-appearing`).
 *
 * Deux façons de garder le bouton sur la ligne du dernier mot :
 * - `insideText: false` (avis : un seul paragraphe) : le bouton suit le texte,
 *   que la feuille de style passe en `inline` (`is-clamped` sur l'enveloppe) ;
 * - `insideText: true` (paragraphes et listes) : le bouton est déplacé à la fin
 *   du dernier paragraphe ou élément de liste du texte, après chaque coupe.
 *
 * `isEnabled()` (avec `media`, la requête dont il dépend) limite le repli à
 * certains écrans : ailleurs, texte entier et bouton masqué.
 *
 * Le bouton est rendu `hidden` par le serveur : sans script, le texte est entier.
 */

const CLAMPED = 'is-clamped';
const ANIMATING = 'is-animating';
const APPEARING = 'is-appearing';

/** Fin du texte coupé : espaces et ponctuation de fin retirés (« … » suit). */
const TRAILING = /[\s.,;:…-]+$/u;

/** Blocs dans lesquels descendre pour trouver où poser le bouton (`insideText`). */
const LEAF_PARENTS = /^(P|UL|OL|LI)$/;

/** Dernier élément vide (ou saut de ligne) : à retirer après une coupe. */
const isEmptyTail = ( node ) => 'BR' === node.nodeName || '' === node.textContent.trim();

/**
 * Remplit `container` avec `html`, coupé après `limit` caractères de texte
 * (`null` : entier). Les nœuds qui suivent la coupe (`<br>` compris) sont
 * retirés, à chaque niveau, puis les éléments laissés vides en fin (liste dont
 * il ne reste rien…).
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

	// Éléments vides et `<br>` laissés en fin de texte, à chaque niveau.
	for ( let parent = container; parent; parent = parent.lastElementChild ) {
		while ( parent.lastChild && isEmptyTail( parent.lastChild ) ) {
			parent.lastChild.remove();
		}
	}

	// Ponctuation de fin du dernier texte affiché : la coupe peut tomber dans le
	// blanc qui sépare deux paragraphes, laissant intact le point du précédent.
	const last = document.createTreeWalker( container, NodeFilter.SHOW_TEXT );
	let tail = null;

	while ( last.nextNode() ) {
		if ( '' !== last.currentNode.data.trim() ) {
			tail = last.currentNode;
		}
	}

	if ( tail ) {
		tail.data = tail.data.replace( TRAILING, '' );
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

/** Dernier paragraphe ou élément de liste du texte (le texte lui-même à défaut). */
function lastLeaf( container ) {
	let leaf = container;

	while ( leaf.lastElementChild && LEAF_PARENTS.test( leaf.lastElementChild.nodeName ) ) {
		leaf = leaf.lastElementChild;
	}

	return leaf;
}

/**
 * Active le repli d'un texte.
 *
 * @param {HTMLElement}    body                 Enveloppe : texte et bouton, hauteur animée.
 * @param {Object}         options
 * @param {HTMLElement}    options.text         Texte (contrôlé par le bouton).
 * @param {HTMLElement}    options.toggle       Bouton « Plus » / « Moins » (`aria-expanded`).
 * @param {Function}       options.lines        Nombre de lignes du texte replié.
 * @param {Function}       [options.isEnabled]  Repli actif (écran) ; sinon texte entier.
 * @param {MediaQueryList} [options.media]      Requête dont dépend `isEnabled()`.
 * @param {boolean}        [options.insideText] Bouton posé dans le dernier paragraphe.
 */
export function readMore( body, { text, toggle, lines, isEnabled = () => true, media, insideText = false } ) {
	const html = text.innerHTML;
	const points = breakpoints( text );
	const home = toggle.parentNode;
	let width = 0;

	const isExpanded = () => 'true' === toggle.getAttribute( 'aria-expanded' );

	/** Hauteur maximale du texte replié : `lines()` lignes. */
	const maxHeight = () => lines() * parseFloat( getComputedStyle( body ).lineHeight ) + 1;

	/** Texte coupé après `limit` caractères (`null` : entier), bouton à sa place. */
	const show = ( limit ) => {
		fill( text, html, limit );

		if ( insideText ) {
			lastLeaf( text ).append( toggle );
		}
	};

	/**
	 * Exécute `update` en rendant le focus au bouton s'il l'avait : un bouton
	 * déplacé, ou masqué le temps d'une mesure, le perd.
	 */
	const keepingFocus = ( update ) => {
		const hadFocus = toggle === document.activeElement;

		update();

		if ( hadFocus && ! toggle.hidden && toggle !== document.activeElement ) {
			toggle.focus( { preventScroll: true } );
		}
	};

	/**
	 * Coupe le texte (replié). Texte entier sans bouton s'il tient ; sinon, plus
	 * long début qui tient avec « … Plus ».
	 */
	const clamp = () => {
		const limit = maxHeight();
		const fits = () => body.getBoundingClientRect().height <= limit;

		toggle.hidden = true;
		show( null );

		if ( fits() ) {
			return;
		}

		toggle.hidden = false;

		let low = 0; // Indice dans `points` du plus long début qui tient (au moins le premier mot).
		let high = points.length - 1;

		while ( low < high ) {
			const middle = Math.ceil( ( low + high ) / 2 );

			show( points[ middle ] );

			if ( fits() ) {
				low = middle;
			} else {
				high = middle - 1;
			}
		}

		show( points[ low ] );
	};

	/** Repli désactivé (écran) : texte entier, bouton masqué à sa place d'origine. */
	const release = () => {
		body.classList.remove( CLAMPED, ANIMATING );
		body.style.maxHeight = '';
		toggle.setAttribute( 'aria-expanded', 'false' );
		toggle.hidden = true;
		fill( text, html, null );
		home.append( toggle );
	};

	// Fin de l'animation : la hauteur revient à la feuille de style, et le texte
	// est coupé s'il est replié — « … Plus » réapparaissant alors en fondu
	// (`is-appearing`, animation CSS relancée à chaque repli).
	const settle = () => {
		body.classList.remove( ANIMATING );
		body.style.maxHeight = '';

		if ( ! isExpanded() ) {
			keepingFocus( clamp );
			toggle.classList.remove( APPEARING );
			void toggle.offsetWidth; // Relance l'animation.
			toggle.classList.add( APPEARING );
		}
	};

	toggle.addEventListener( 'animationend', () => toggle.classList.remove( APPEARING ) );

	toggle.addEventListener( 'click', () => keepingFocus( () => {
		const expanded = ! isExpanded();
		const from = body.offsetHeight;

		// Destination : hauteur du texte entier (dépli) ou coupé (repli), mesurée
		// avant l'animation. Au repli, le texte reste entier jusqu'à la fin.
		toggle.setAttribute( 'aria-expanded', String( expanded ) );

		if ( expanded ) {
			show( null );
		} else {
			clamp();
		}

		const to = body.offsetHeight;

		show( null );

		body.classList.add( ANIMATING );
		body.style.maxHeight = `${ from }px`;
		void body.offsetHeight; // Force le calcul du point de départ.
		body.style.maxHeight = `${ to }px`;

		// Pas de transition (mouvement réduit) : pas de `transitionend`.
		if ( 0 === parseFloat( getComputedStyle( body ).transitionDuration ) || from === to ) {
			settle();
		}
	} ) );

	body.addEventListener( 'transitionend', ( event ) => {
		if ( event.target === body && 'max-height' === event.propertyName ) {
			settle();
		}
	} );

	// Coupe refaite quand la largeur change (pas la hauteur : c'est la coupe qui la fixe).
	const update = () => {
		if ( ! isEnabled() ) {
			return;
		}

		if ( body.offsetWidth !== width ) {
			width = body.offsetWidth;

			if ( ! isExpanded() && ! body.classList.contains( ANIMATING ) ) {
				keepingFocus( clamp );
			}
		}
	};

	// Entrée dans les écrans concernés : repli activé ; sortie : texte entier.
	const enable = () => {
		if ( isEnabled() ) {
			body.classList.add( CLAMPED );
			width = 0;
			update();
		} else {
			release();
		}
	};

	enable();

	media?.addEventListener( 'change', enable );
	new ResizeObserver( update ).observe( body );
	document.fonts?.ready.then( () => {
		width = 0;
		update();
	} );
}

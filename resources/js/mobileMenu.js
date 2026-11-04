/**
 * Menu mobile et tablette (sous `xl`) : panneau plein écran ouvert par le bouton
 * burger de la barre, navigation par écrans successifs. Balisage rendu par
 * `partials/header/mobile-menu.twig`, plan dans docs/mega-menu.md.
 *
 * - Le burger (`aria-expanded`, `aria-controls`) ouvre et ferme le panneau ;
 *   l'ouverture affiche toujours l'écran de niveau 1. Panneau ouvert : le reste de
 *   la page est `inert` (focus contenu dans le header, ignoré des lecteurs
 *   d'écran) et ne défile plus.
 * - Une rubrique ouvre son écran en glissant de droite à gauche ; « Menu » revient
 *   au niveau 1 en sens inverse, focus rendu au bouton de la rubrique. À l'arrivée
 *   sur un écran de rubrique, le focus est placé sur son titre (changement annoncé).
 * - Échap ferme le panneau et rend le focus au burger ; il se ferme aussi au
 *   passage en desktop.
 *
 * Glissements en CSS (`partials/_header.scss`), coupés sous
 * `prefers-reduced-motion` : le changement d'écran est alors immédiat. Les
 * accordéons des rubriques sont ceux de Bootstrap (Collapse, data-api).
 *
 * Sans ce script, le burger et le panneau restent masqués (`hidden`).
 */

const MENU = '#mobile-menu';
const OPEN_CLASS = 'has-mobile-menu';

/** Point de rupture `xl` de Bootstrap (`--bs-breakpoint-xl`, émis par son module `root`). */
const xl = getComputedStyle( document.documentElement ).getPropertyValue( '--bs-breakpoint-xl' ).trim() || '1200px';
const desktop = window.matchMedia( `(min-width: ${ xl })` );
const reducedMotion = window.matchMedia( '(prefers-reduced-motion: reduce)' );

function init( menu ) {
	const header = menu.closest( '.site-header' );
	const burger = header?.querySelector( `.site-header__burger[aria-controls="${ menu.id }"]` );
	const root = menu.querySelector( '[data-mobile-screen="root"]' );

	if ( ! header || ! burger || ! root ) {
		return;
	}

	let current = root;
	let inerted = [];

	const isOpen = () => 'true' === burger.getAttribute( 'aria-expanded' );

	const setBurger = ( open ) => {
		burger.setAttribute( 'aria-expanded', String( open ) );
		burger.querySelector( '[data-label-open]' ).hidden = open;
		burger.querySelector( '[data-label-close]' ).hidden = ! open;
	};

	/**
	 * Affiche un écran sans animation, en masquant tous les autres.
	 *
	 * @param {HTMLElement} screen Écran à afficher.
	 */
	const show = ( screen ) => {
		menu.querySelectorAll( '.mobile-menu__screen' ).forEach( ( other ) => {
			other.hidden = other !== screen;
			other.classList.remove( 'is-entering', 'is-leaving', 'is-back' );
		} );
		current = screen;
	};

	const open = () => {
		show( root );
		menu.hidden = false;
		setBurger( true );
		document.documentElement.classList.add( OPEN_CLASS );

		// Tout ce qui n'est pas le header devient inerte : focus contenu, page
		// ignorée des lecteurs d'écran.
		inerted = [ ...document.body.children ].filter( ( element ) => element !== header && ! element.inert );
		inerted.forEach( ( element ) => {
			element.inert = true;
		} );
	};

	/**
	 * Ferme le panneau.
	 *
	 * @param {boolean} restoreFocus Rendre le focus au burger.
	 */
	const close = ( restoreFocus = false ) => {
		if ( ! isOpen() ) {
			return;
		}

		menu.hidden = true;
		setBurger( false );
		document.documentElement.classList.remove( OPEN_CLASS );
		inerted.forEach( ( element ) => {
			element.inert = false;
		} );
		inerted = [];

		if ( restoreFocus ) {
			burger.focus();
		}
	};

	/**
	 * Passe d'un écran à un autre en glissant.
	 *
	 * @param {HTMLElement} target Écran d'arrivée.
	 * @param {boolean}     back   Retour au niveau 1 (glissement de gauche à droite).
	 * @param {HTMLElement} focus  Élément qui reçoit le focus à l'arrivée.
	 */
	const go = ( target, back, focus ) => {
		const from = current;

		if ( target === from ) {
			return;
		}

		let settled = false;
		const settle = () => {
			if ( settled ) {
				return;
			}

			settled = true;
			show( target );
			focus?.focus();
		};

		if ( reducedMotion.matches ) {
			settle();
			return;
		}

		from.classList.add( 'is-leaving' );
		target.classList.add( 'is-entering' );
		[ from, target ].forEach( ( screen ) => screen.classList.toggle( 'is-back', back ) );
		target.hidden = false;
		current = target;

		// Filet de sécurité si `animationend` ne vient pas (onglet en arrière-plan…).
		target.addEventListener( 'animationend', settle, { once: true } );
		window.setTimeout( settle, 600 );
	};

	// Écran d'une rubrique, et retour.
	menu.addEventListener( 'click', ( event ) => {
		const opener = event.target.closest( '[data-mobile-open]' );
		const backButton = event.target.closest( '[data-mobile-back]' );

		if ( opener ) {
			const screen = document.getElementById( opener.dataset.mobileOpen );

			go( screen, false, screen.querySelector( '.mobile-menu__title' ) );
		} else if ( backButton ) {
			const screen = backButton.closest( '.mobile-menu__screen' );

			go( root, true, root.querySelector( `[data-mobile-open="${ screen.id }"]` ) );
		}
	} );

	burger.addEventListener( 'click', () => ( isOpen() ? close() : open() ) );

	header.addEventListener( 'keydown', ( event ) => {
		if ( 'Escape' === event.key && isOpen() ) {
			close( true );
			event.preventDefault();
		}
	} );

	desktop.addEventListener( 'change', () => {
		if ( desktop.matches ) {
			close();
		}
	} );

	burger.hidden = false;
}

document.querySelectorAll( MENU ).forEach( init );

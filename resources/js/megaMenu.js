/**
 * Méga menu du header, desktop (à partir de `xl`) : ouverture et fermeture des
 * panneaux de niveau 1, choix du panneau de niveau 3, voile. Modèle WAI-ARIA
 * « Disclosure navigation » (pas de `role="menu"`) ; balisage rendu par
 * `partials/header/nav.twig` et `mega-panel.twig` ; cf. CLAUDE.md du thème, « Header et méga menu ».
 *
 * Niveau 1 :
 * - ouverture au clic (Entrée / Espace : bouton natif) et au survol après
 *   `OPEN_DELAY` ; un seul méga menu ouvert à la fois ;
 * - menu ouvert au survol : fermeture différée au départ de la souris
 *   (`CLOSE_DELAY`), pour traverser l'écart entre la barre et le panneau ; un clic
 *   le garde ouvert au lieu de le refermer ;
 * - menu ouvert au clic : il reste ouvert jusqu'au clic suivant ;
 * - fermeture par Échap (focus rendu au bouton de niveau 1), clic hors du header
 *   ou sur le voile, focus sorti du méga menu (vers un autre élément du header
 *   ou hors de lui).
 *
 * Niveau 2 (boutons des rubriques qui ont des enfants) : clic, Entrée / Espace ou
 * survol (après `SELECT_DELAY`, pour ne pas changer de panneau en traversant la
 * colonne en diagonale) affichent le panneau de la rubrique ; flèche droite
 * l'affiche et y place le focus, flèche gauche y revient ; flèches haut / bas
 * passent d'une entrée de la colonne à l'autre.
 *
 * Sans ce script, les panneaux restent masqués (`hidden`) et le voile aussi.
 * Animations en CSS (`partials/_header.scss`), coupées sous
 * `prefers-reduced-motion`.
 */

const NAV = '.site-nav';
const OPEN_DELAY = 150;
const CLOSE_DELAY = 300;
const SELECT_DELAY = 100;

/** Point de rupture `xl` de Bootstrap (`--bs-breakpoint-xl`, émis par son module `root`). */
const xl = getComputedStyle( document.documentElement ).getPropertyValue( '--bs-breakpoint-xl' ).trim() || '1200px';
const desktop = window.matchMedia( `(min-width: ${ xl })` );

function init( nav ) {
	const header = nav.closest( '.site-header' );
	const backdrop = header?.querySelector( '.mega-backdrop' );
	const toggles = [ ...nav.querySelectorAll( '.site-nav__link[aria-controls]' ) ];

	if ( ! header || 0 === toggles.length ) {
		return;
	}

	let current = null; // Bouton de niveau 1 du méga menu ouvert.
	let openedByHover = false;
	let openTimer = 0;
	let closeTimer = 0;
	let selectTimer = 0;

	const panelOf = ( toggle ) => document.getElementById( toggle.getAttribute( 'aria-controls' ) );

	const clearTimers = () => {
		window.clearTimeout( openTimer );
		window.clearTimeout( closeTimer );
		window.clearTimeout( selectTimer );
	};

	/**
	 * Ouvre le méga menu d'un bouton de niveau 1, en refermant l'éventuel autre.
	 *
	 * @param {HTMLElement} toggle  Bouton de niveau 1.
	 * @param {boolean}     byHover Ouvert par le survol.
	 */
	const open = ( toggle, byHover = false ) => {
		clearTimers();
		openedByHover = byHover;

		if ( current === toggle ) {
			return;
		}

		if ( current ) {
			hide( current );
		}

		current = toggle;
		toggle.setAttribute( 'aria-expanded', 'true' );
		panelOf( toggle ).hidden = false;

		if ( backdrop ) {
			backdrop.hidden = false;
		}
	};

	const hide = ( toggle ) => {
		toggle.setAttribute( 'aria-expanded', 'false' );
		panelOf( toggle ).hidden = true;
	};

	/**
	 * Referme le méga menu ouvert.
	 *
	 * @param {boolean} restoreFocus Rendre le focus au bouton de niveau 1.
	 */
	const close = ( restoreFocus = false ) => {
		clearTimers();

		if ( ! current ) {
			return;
		}

		const toggle = current;

		hide( toggle );
		current = null;

		if ( backdrop ) {
			backdrop.hidden = true;
		}

		if ( restoreFocus ) {
			toggle.focus();
		}
	};

	/**
	 * Affiche le panneau de niveau 3 d'une rubrique.
	 *
	 * @param {HTMLElement} rubric Bouton de la rubrique (niveau 2).
	 */
	const select = ( rubric ) => {
		window.clearTimeout( selectTimer );

		if ( 'true' === rubric.getAttribute( 'aria-expanded' ) ) {
			return;
		}

		const mega = rubric.closest( '.mega' );

		mega.querySelectorAll( '.mega__rubric[aria-controls]' ).forEach( ( button ) => {
			const selected = button === rubric;

			button.setAttribute( 'aria-expanded', String( selected ) );
			button.classList.toggle( 'is-open', selected );
			document.getElementById( button.getAttribute( 'aria-controls' ) ).hidden = ! selected;
		} );
	};

	// ─── Niveau 1 ────────────────────────────────────────────────────────────────
	toggles.forEach( ( toggle ) => {
		const item = toggle.closest( '.site-nav__item' );

		toggle.addEventListener( 'click', () => {
			if ( current === toggle && ! openedByHover ) {
				close();
				return;
			}

			open( toggle );
		} );

		item.addEventListener( 'pointerenter', ( event ) => {
			if ( 'mouse' !== event.pointerType || ! desktop.matches ) {
				return;
			}

			window.clearTimeout( closeTimer );

			if ( current !== toggle ) {
				window.clearTimeout( openTimer );
				openTimer = window.setTimeout( () => open( toggle, true ), OPEN_DELAY );
			}
		} );

		item.addEventListener( 'pointerleave', ( event ) => {
			if ( 'mouse' !== event.pointerType ) {
				return;
			}

			window.clearTimeout( openTimer );

			// Un menu ouvert par un clic reste ouvert jusqu'au prochain clic ou à Échap.
			if ( current === toggle && openedByHover ) {
				closeTimer = window.setTimeout( () => close(), CLOSE_DELAY );
			}
		} );
	} );

	// ─── Niveau 2 ────────────────────────────────────────────────────────────────
	nav.querySelectorAll( '.mega' ).forEach( ( mega ) => {
		const rail = mega.querySelector( '.mega__rail' );
		const entries = () => [ ...rail.querySelectorAll( '.mega__rubric' ) ];

		mega.querySelectorAll( '.mega__rubric[aria-controls]' ).forEach( ( rubric ) => {
			rubric.addEventListener( 'click', () => select( rubric ) );

			rubric.addEventListener( 'pointerenter', ( event ) => {
				if ( 'mouse' !== event.pointerType ) {
					return;
				}

				window.clearTimeout( selectTimer );
				selectTimer = window.setTimeout( () => select( rubric ), SELECT_DELAY );
			} );

			rubric.addEventListener( 'pointerleave', () => window.clearTimeout( selectTimer ) );
		} );

		rail.addEventListener( 'keydown', ( event ) => {
			const entry = event.target.closest( '.mega__rubric' );

			if ( ! entry ) {
				return;
			}

			const list = entries();
			const index = list.indexOf( entry );

			switch ( event.key ) {
				case 'ArrowDown':
					list[ ( index + 1 ) % list.length ].focus();
					break;
				case 'ArrowUp':
					list[ ( index - 1 + list.length ) % list.length ].focus();
					break;
				case 'Home':
					list[ 0 ].focus();
					break;
				case 'End':
					list[ list.length - 1 ].focus();
					break;
				case 'ArrowRight': {
					if ( ! entry.hasAttribute( 'aria-controls' ) ) {
						return;
					}

					select( entry );
					document.getElementById( entry.getAttribute( 'aria-controls' ) ).querySelector( 'a' )?.focus();
					break;
				}
				default:
					return;
			}

			event.preventDefault();
		} );

		// Flèche gauche dans un panneau de niveau 3 : retour à sa rubrique.
		mega.querySelector( '.mega__panels' )?.addEventListener( 'keydown', ( event ) => {
			if ( 'ArrowLeft' !== event.key ) {
				return;
			}

			const panel = event.target.closest( '.mega__panel' );

			mega.querySelector( `.mega__rubric[aria-controls="${ panel.id }"]` )?.focus();
			event.preventDefault();
		} );
	} );

	// ─── Fermeture ───────────────────────────────────────────────────────────────
	header.addEventListener( 'keydown', ( event ) => {
		if ( 'Escape' === event.key && current ) {
			close( true );
			event.preventDefault();
		}
	} );

	// Focus parti sur un autre élément du header (élément de niveau 1 suivant au
	// clavier, logo…) : le menu ouvert se referme.
	header.addEventListener( 'focusin', ( event ) => {
		if ( current && ! current.closest( '.site-nav__item' ).contains( event.target ) ) {
			close();
		}
	} );

	// Sans `relatedTarget` (clic sur une zone non focalisable, y compris dans le
	// panneau), on laisse faire le `pointerdown` ci-dessous.
	header.addEventListener( 'focusout', ( event ) => {
		if ( current && event.relatedTarget && ! header.contains( event.relatedTarget ) ) {
			close();
		}
	} );

	document.addEventListener( 'pointerdown', ( event ) => {
		if ( current && ( ! header.contains( event.target ) || event.target === backdrop ) ) {
			close();
		}
	} );

	// Passage sous `xl` : la navigation desktop est masquée, le menu se referme.
	desktop.addEventListener( 'change', () => {
		if ( ! desktop.matches ) {
			close();
		}
	} );
}

document.querySelectorAll( NAV ).forEach( init );

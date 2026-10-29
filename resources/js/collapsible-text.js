/**
 * Bloc « Texte repliable » (`couturier/collapsible-text`) : bouton « Réduire » /
 * « Lire la suite » du front, modèle WAI-ARIA « Disclosure ».
 *
 * - desktop (à partir de `lg`) seulement : en dessous, le texte reste entier et le
 *   bouton masqué ;
 * - texte déplié au chargement ; replié, seul le titre reste visible.
 *   `is-collapsed` sur le bloc et `aria-expanded` sur le bouton portent l'état,
 *   les libellés suivent en CSS ;
 * - repli et dépli animés sur la hauteur du corps (`max-height`, comme
 *   l'accordéon de Bootstrap) : `is-animating` le temps de la transition, coupée
 *   sous `prefers-reduced-motion`. Une fois replié, le texte est retiré du
 *   parcours clavier et des lecteurs d'écran (`visibility`, cf.
 *   `block/_collapsible-text.scss`).
 *
 * Le bouton est rendu `hidden` par `render.php` : sans ce script, le texte est
 * entier.
 */

const BLOCK = '.wp-block-couturier-collapsible-text';
const COLLAPSED = 'is-collapsed';
const ANIMATING = 'is-animating';

/** Point de rupture `lg` de Bootstrap (`--bs-breakpoint-lg`, émis par son module `root`). */
const lg = getComputedStyle( document.documentElement ).getPropertyValue( '--bs-breakpoint-lg' ).trim() || '992px';
const desktop = window.matchMedia( `(min-width: ${ lg })` );

function init( block ) {
	const toggle = block.querySelector( '.wp-block-couturier-collapsible-text__toggle' );
	const body = block.querySelector( '.wp-block-couturier-collapsible-text__body' );
	const content = block.querySelector( '.wp-block-couturier-collapsible-text__content' );

	if ( ! toggle || ! body || ! content ) {
		return;
	}

	const isCollapsed = () => block.classList.contains( COLLAPSED );

	// Fin de l'animation : la hauteur revient à celle de la feuille de style.
	const settle = () => {
		block.classList.remove( ANIMATING );
		body.style.maxHeight = '';
	};

	/**
	 * Replie ou déplie le texte, en animant la hauteur du corps de sa valeur
	 * actuelle à la valeur d'arrivée.
	 *
	 * @param {boolean} expanded Texte déplié.
	 * @param {boolean} animate  Animer (sinon, changement immédiat).
	 */
	const setExpanded = ( expanded, animate = true ) => {
		toggle.setAttribute( 'aria-expanded', String( expanded ) );

		if ( expanded === ! isCollapsed() && ! block.classList.contains( ANIMATING ) ) {
			return;
		}

		if ( ! animate ) {
			block.classList.toggle( COLLAPSED, ! expanded );
			settle();
			return;
		}

		// Point de départ figé en ligne, puis destination : la hauteur du contenu
		// (dépli) ou celle de l'état replié (repli, valeur de la feuille de style).
		body.style.maxHeight = `${ body.offsetHeight }px`;
		block.classList.add( ANIMATING );
		block.classList.toggle( COLLAPSED, ! expanded );
		void body.offsetHeight; // Force le calcul du point de départ.
		body.style.maxHeight = expanded ? `${ content.offsetHeight }px` : '';

		// Pas de transition (mouvement réduit) : pas de `transitionend`.
		if ( 0 === parseFloat( getComputedStyle( body ).transitionDuration ) ) {
			settle();
		}
	};

	body.addEventListener( 'transitionend', ( event ) => {
		if ( event.target === body && 'max-height' === event.propertyName ) {
			settle();
		}
	} );

	// Bouton en desktop seulement ; en dessous, texte entier.
	const update = () => {
		toggle.hidden = ! desktop.matches;

		if ( ! desktop.matches ) {
			setExpanded( true, false );
		}
	};

	toggle.addEventListener( 'click', () => setExpanded( isCollapsed() ) );

	desktop.addEventListener( 'change', update );
	update();
}

document.querySelectorAll( BLOCK ).forEach( init );

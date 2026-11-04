/**
 * Header au défilement : masqué quand on descend, réaffiché dès qu'on remonte.
 *
 * Le header est collant (`position: sticky`, cf. `partials/_header.scss`), avec un
 * `top` négatif égal à ce qui précède la barre (bandeau « Offre du moment ») : le
 * bandeau part avec la page et seule la barre reste collée — il ne réapparaît
 * qu'une fois revenu tout en haut. Ce décalage (`--header-stick`) est recalculé
 * quand la taille du header change. Barre collée : `is-stuck` masque le bas du
 * bandeau, qui dépasserait au-dessus d'elle (sans changer la hauteur du header).
 *
 * Pas de masquage tant qu'un méga menu ou le menu mobile est ouvert, ni tant que
 * le focus clavier est dans le header (il y revient en se réaffichant).
 * Transition coupée sous `prefers-reduced-motion` (CSS).
 */

const HIDDEN = 'is-hidden';
const STUCK = 'is-stuck';
const THRESHOLD = 6; // Écart de défilement (px) en dessous duquel on ne change rien.

function init( header ) {
	const bar = header.querySelector( '.site-header__bar' );

	if ( ! bar ) {
		return;
	}

	let lastY = window.scrollY;
	let ticking = false;
	let stick = 0; // Hauteur qui précède la barre collée (px, positive).

	// Distance entre le haut du header et celui de la barre, moins la marge haute
	// du header (gardée au-dessus de la barre collée).
	const updateStick = () => {
		const gap = parseFloat( getComputedStyle( header ).paddingTop ) || 0;

		stick = Math.max( 0, bar.offsetTop - gap );
		header.style.setProperty( '--header-stick', `${ -stick }px` );
		header.classList.toggle( STUCK, stick > 0 && window.scrollY >= stick );
	};

	// Focus clavier seulement (`:focus-visible`) : après un clic, le focus reste sur
	// le lien ou le bouton cliqué et bloquerait le masquage jusqu'au clic suivant.
	const isLocked = () =>
		null !== header.querySelector( ':focus-visible' ) ||
		null !== header.querySelector( '.site-nav__link[aria-expanded="true"], .site-header__burger[aria-expanded="true"]' );

	const update = () => {
		ticking = false;

		const y = Math.max( 0, window.scrollY );
		const delta = y - lastY;

		header.classList.toggle( STUCK, stick > 0 && y >= stick );

		if ( Math.abs( delta ) < THRESHOLD ) {
			return;
		}

		lastY = y;

		// En haut de page, ou en remontant : header affiché.
		if ( y <= header.offsetHeight || delta < 0 ) {
			header.classList.remove( HIDDEN );
		} else if ( ! isLocked() ) {
			header.classList.add( HIDDEN );
		}
	};

	window.addEventListener( 'scroll', () => {
		if ( ! ticking ) {
			ticking = true;
			window.requestAnimationFrame( update );
		}
	}, { passive: true } );

	// Focus clavier arrivé dans le header masqué : il se réaffiche.
	header.addEventListener( 'focusin', () => header.classList.remove( HIDDEN ) );

	new ResizeObserver( updateStick ).observe( header );
	updateStick();
}

document.querySelectorAll( '.site-header' ).forEach( init );

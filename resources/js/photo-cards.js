/**
 * Bloc « Cartes photo » (`couturier/photo-cards`) : flèches « Cartes
 * précédentes » / « Cartes suivantes » de la piste, en desktop (`lg`).
 *
 * - les flèches, rendues `hidden` par `render.php`, ne s'affichent que si les
 *   cartes dépassent la piste (plus de 5 petites, 4 moyennes ou 3 grandes) ; le bloc reçoit
 *   alors `has-nav`, qui masque la barre de défilement native ;
 * - un clic fait défiler d'une page (largeur utile de la piste + un écart),
 *   l'aimantation (`scroll-snap`) aligne sur une carte ;
 * - en début et en fin de piste, la flèche est grisée par `aria-disabled` et
 *   son clic ignoré : un vrai `disabled` lui ferait perdre le focus clavier, qui
 *   retomberait sur `<body>` (WCAG 2.4.3).
 *
 * Sous `lg`, le ruban défile au doigt : pas de flèches. Sans ce script, la piste
 * garde sa barre de défilement.
 */

/** Point de rupture `lg` de Bootstrap (`--bs-breakpoint-lg`, émis par son module `root`). */
const lg = getComputedStyle( document.documentElement ).getPropertyValue( '--bs-breakpoint-lg' ).trim() || '992px';
const desktop = window.matchMedia( `(min-width: ${ lg })` );
const reducedMotion = window.matchMedia( '(prefers-reduced-motion: reduce)' );

/** Marge d'arrondi des positions de défilement (zoom, pixels fractionnaires). */
const EPSILON = 2;

document.querySelectorAll( '.wp-block-couturier-photo-cards' ).forEach( ( block ) => {
	const track = block.querySelector( '.wp-block-couturier-photo-cards__track' );
	const prev = block.querySelector( '.wp-block-couturier-photo-cards__arrow.is-prev' );
	const next = block.querySelector( '.wp-block-couturier-photo-cards__arrow.is-next' );

	if ( ! track || ! prev || ! next ) {
		return;
	}

	/** Largeur d'une page : zone utile de la piste (sans ses marges intérieures) + un écart. */
	const pageWidth = () => {
		const style = getComputedStyle( track );

		return (
			track.clientWidth -
			parseFloat( style.paddingLeft ) -
			parseFloat( style.paddingRight ) +
			( parseFloat( style.columnGap ) || 0 )
		);
	};

	const update = () => {
		const max = track.scrollWidth - track.clientWidth;
		const hasNav = desktop.matches && max > EPSILON;

		block.classList.toggle( 'has-nav', hasNav );
		prev.hidden = ! hasNav;
		next.hidden = ! hasNav;
		prev.setAttribute( 'aria-disabled', String( track.scrollLeft <= EPSILON ) );
		next.setAttribute( 'aria-disabled', String( track.scrollLeft >= max - EPSILON ) );
	};

	const scroll = ( button, direction ) => {
		button.addEventListener( 'click', () => {
			if ( 'true' === button.getAttribute( 'aria-disabled' ) ) {
				return;
			}

			track.scrollBy( {
				left: direction * pageWidth(),
				behavior: reducedMotion.matches ? 'auto' : 'smooth',
			} );
		} );
	};

	scroll( prev, -1 );
	scroll( next, 1 );

	track.addEventListener( 'scroll', update, { passive: true } );
	desktop.addEventListener( 'change', update );
	new ResizeObserver( update ).observe( track );
	update();
} );

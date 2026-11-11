/**
 * Bloc « Centre et points de ramassage » (`couturier/pickup-map`) : onglets et
 * choix du point affiché sur la carte.
 *
 * - modèle WAI-ARIA « Tabs » (activation automatique) : clic, flèches gauche /
 *   droite, Début / Fin ; un seul onglet dans l'ordre de tabulation ;
 * - « Le centre » affiche l'adresse du centre ; « Points de ramassage » le point
 *   choisi, à défaut le premier qui a une adresse ;
 * - un point de la liste (`aria-pressed`) affiche son lieu et passe sur l'onglet
 *   « Points de ramassage ».
 *
 * La carte est une iframe Google Maps : seule son URL change. L'adresse écrite
 * sous la carte et le titre de l'iframe suivent. Sans JS (ou sans points), la
 * carte du centre reste affichée.
 */
document.querySelectorAll( '.wp-block-couturier-pickup-map.has-points' ).forEach( ( block ) => {
	const tabs = [ ...block.querySelectorAll( '.wp-block-couturier-pickup-map__tab[role="tab"]' ) ];
	const panel = block.querySelector( '.wp-block-couturier-pickup-map__map' );
	const frame = block.querySelector( '.wp-block-couturier-pickup-map__frame' );
	const address = block.querySelector( '.wp-block-couturier-pickup-map__address-text' );
	const points = [ ...block.querySelectorAll( '.wp-block-couturier-pickup-point__button' ) ];

	if ( 2 !== tabs.length || ! panel || ! frame ) {
		return;
	}

	const [ centerTab, pointsTab ] = tabs;
	// Modèle du titre de l'iframe (« Carte Google Maps : Le centre »).
	const titlePrefix = frame.title.slice( 0, frame.title.lastIndexOf( centerTab.dataset.mapLabel ) );
	let current = null;

	/** Affiche un lieu (élément porteur des `data-map-*`). */
	const show = ( place ) => {
		if ( frame.getAttribute( 'src' ) !== place.dataset.mapSrc ) {
			frame.src = place.dataset.mapSrc;
		}

		frame.title = titlePrefix + place.dataset.mapLabel;

		if ( address ) {
			address.textContent = place.dataset.mapAddress;
		}
	};

	const press = ( point ) => {
		points.forEach( ( button ) => button.setAttribute( 'aria-pressed', String( button === point ) ) );
	};

	const select = ( tab, point = null ) => {
		tabs.forEach( ( item ) => {
			const isSelected = item === tab;
			item.setAttribute( 'aria-selected', String( isSelected ) );
			item.tabIndex = isSelected ? 0 : -1;
		} );
		panel.setAttribute( 'aria-labelledby', tab.id );

		if ( tab === centerTab ) {
			press( null );
			show( centerTab );

			return;
		}

		current = point ?? current ?? points[ 0 ] ?? null;

		if ( current ) {
			press( current );
			show( current );
		}
	};

	tabs.forEach( ( tab, index ) => {
		tab.addEventListener( 'click', () => select( tab ) );
		tab.addEventListener( 'keydown', ( event ) => {
			const target = {
				ArrowLeft: tabs[ ( index - 1 + tabs.length ) % tabs.length ],
				ArrowRight: tabs[ ( index + 1 ) % tabs.length ],
				Home: tabs[ 0 ],
				End: tabs[ tabs.length - 1 ],
			}[ event.key ];

			if ( target ) {
				event.preventDefault();
				target.focus();
				select( target );
			}
		} );
	} );

	points.forEach( ( point ) => point.addEventListener( 'click', () => select( pointsTab, point ) ) );
} );

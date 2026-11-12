/**
 * Bloc « Sessions de formation » (`couturier/sessions`) : filtre par secteur.
 *
 * Boutons bascule (`aria-pressed`), un seul enfoncé : « Toutes les villes »
 * (`data-sector` vide) ou un secteur. Les sessions des autres secteurs passent
 * en `hidden` ; le nombre de sessions affichées est annoncé dans la région
 * `role="status"`, sans déplacer le focus.
 *
 * Le filtre est rendu `hidden` : sans JS, il reste masqué et toutes les
 * sessions sont affichées.
 */
document.querySelectorAll( '.wp-block-couturier-sessions' ).forEach( ( block ) => {
	const group = block.querySelector( '.wp-block-couturier-sessions__filters' );
	const status = block.querySelector( '.wp-block-couturier-sessions__status' );
	const sessions = [ ...block.querySelectorAll( '.wp-block-couturier-session' ) ];

	if ( ! group ) {
		return;
	}

	const buttons = [ ...group.querySelectorAll( '.wp-block-couturier-sessions__filter' ) ];

	const select = ( button ) => {
		const sector = button.dataset.sector;
		let count = 0;

		buttons.forEach( ( item ) => item.setAttribute( 'aria-pressed', String( item === button ) ) );
		sessions.forEach( ( session ) => {
			const isShown = ! sector || session.dataset.sector === sector;
			session.hidden = ! isShown;
			count += isShown ? 1 : 0;
		} );

		if ( status ) {
			// Textes traduits posés par `render.php` (`data-one`, `data-many`).
			status.textContent = 1 === count ? status.dataset.one : status.dataset.many.replace( '%d', count );
		}
	};

	buttons.forEach( ( button ) => button.addEventListener( 'click', () => select( button ) ) );
	group.hidden = false;
} );

/**
 * Bouton de retour de l'éditeur vers la liste des pages de Nested Pages.
 *
 * Injecté en inline par `Theme\Features\Admin\NestedPagesLinks`, sans build :
 * écrit sans imports ni JSX, sur les globales `wp.*`. La feature ne le charge que
 * dans l'éditeur d'une page, et seulement si l'écran de Nested Pages est disponible ;
 * elle lui transmet son URL par `window.couturierNestedPagesBackLink`.
 *
 * Remplir l'emplacement `MainDashboardButton` masque le bouton natif, qui pointe vers
 * `edit.php?post_type=page`. Il est remplacé par le même composant du core
 * (`FullscreenModeClose`), avec l'URL de Nested Pages : icône, libellé et info-bulle
 * inchangés. Ces deux API sont expérimentales : si elles disparaissent, le script ne
 * fait rien et le bouton natif reste en place.
 */
( function ( wp, settings ) {
	'use strict';

	if ( ! wp || ! wp.plugins || ! wp.editPost || ! wp.element || ! settings || ! settings.href ) {
		return;
	}

	var MainDashboardButton = wp.editPost.__experimentalMainDashboardButton;
	var FullscreenModeClose = wp.editPost.__experimentalFullscreenModeClose;

	if ( ! MainDashboardButton || ! FullscreenModeClose ) {
		return;
	}

	var el = wp.element.createElement;

	wp.plugins.registerPlugin( 'couturier-nested-pages-back-link', {
		render: function () {
			return el(
				MainDashboardButton,
				null,
				el( FullscreenModeClose, { href: settings.href, showTooltip: true } )
			);
		},
	} );
} )( window.wp, window.couturierNestedPagesBackLink );

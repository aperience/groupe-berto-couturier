/**
 * Écran « En-tête » : recherche de la page du formulaire de rappel.
 *
 * Injecté en inline par `Theme\Features\Navigation\HeaderSettings`, sans build :
 * écrit sans imports, sur les globales `jQuery` (jQuery UI Autocomplete) et `wp`
 * (`apiFetch`, `url`, `a11y`). La feature ne le charge que sur son écran, et lui
 * transmet ses libellés par `window.couturierHeaderSettings`.
 *
 * Le champ de recherche n'est pas posté : seul le champ caché
 * `couturier-header-callback_page_id` l'est, avec l'ID de la page choisie. Les
 * suggestions viennent de l'API REST (`/wp/v2/pages`, pages publiées, recherche
 * dans le titre seulement), avec l'adresse de chaque page pour distinguer deux
 * titres identiques.
 *
 * Quitter le champ sans choisir de suggestion rétablit le titre de la page choisie ;
 * le vider retire la page (ID 0 : le bouton n'est plus affiché).
 */
( function ( wp, $, settings ) {
	'use strict';

	var $search = $( '#couturier-header-callback_page_search' );
	var hidden  = document.getElementById( 'couturier-header-callback_page_id' );
	var info    = document.getElementById( 'couturier-header-callback_page_link' );

	if ( ! settings || ! $search.length || ! hidden || ! info ) {
		return;
	}

	var link   = info.querySelector( 'a' );
	var chosen = $search.val(); // Titre de la page enregistrée.
	var request;

	/** Titre REST (HTML rendu) en texte brut. */
	function plain( html ) {
		var el = document.createElement( 'div' );
		el.innerHTML = html;
		return el.textContent || '';
	}

	/** Adresse relative au site, pour l'affichage. */
	function path( url ) {
		try {
			return new URL( url ).pathname;
		} catch ( e ) {
			return url;
		}
	}

	/** Retient une page (ou aucune, `page` à null) et met à jour l'information sous le champ. */
	function choose( page ) {
		hidden.value = page ? String( page.id ) : '0';
		chosen       = page ? page.label : '';
		$search.val( chosen );

		if ( page ) {
			link.href        = page.link;
			link.textContent = path( page.link );
			info.hidden      = false;
			wp.a11y.speak( settings.chosen + ' ' + page.label );
		} else {
			info.hidden = true;
			wp.a11y.speak( settings.cleared );
		}
	}

	$search.autocomplete( {
		minLength: 2,
		delay: 250,
		classes: { 'ui-autocomplete': 'couturier-page-search' },

		source: function ( req, respond ) {
			if ( request && request.abort ) {
				request.abort();
			}

			var controller = typeof AbortController === 'function' ? new AbortController() : null;
			request = controller;

			wp.apiFetch( {
				path: wp.url.addQueryArgs( '/wp/v2/pages', {
					search: req.term,
					search_columns: [ 'post_title' ],
					status: 'publish',
					per_page: 20,
					orderby: 'relevance',
					_fields: 'id,title,link',
				} ),
				signal: controller ? controller.signal : undefined,
			} ).then( function ( pages ) {
				var items = pages.map( function ( page ) {
					return {
						id: page.id,
						link: page.link,
						label: plain( page.title.rendered ) || '#' + page.id,
						value: plain( page.title.rendered ) || '#' + page.id,
					};
				} );

				if ( ! items.length ) {
					wp.a11y.speak( settings.noResult );
				}

				respond( items );
			} ).catch( function ( error ) {
				if ( ! error || 'AbortError' !== error.name ) {
					respond( [] );
				}
			} );
		},

		select: function ( event, ui ) {
			event.preventDefault();
			choose( ui.item );
		},

		// Liste fermée sans choix : vide → aucune page, sinon retour au titre retenu.
		change: function ( event, ui ) {
			if ( ui.item ) {
				return;
			}

			if ( '' === $search.val().trim() ) {
				if ( '0' !== hidden.value ) {
					choose( null );
				}
			} else {
				$search.val( chosen );
			}
		},
	} );

	// Titre + adresse dans chaque suggestion (texte inséré en `text()`, jamais en HTML).
	$search.autocomplete( 'instance' )._renderItem = function ( ul, item ) {
		var $wrapper = $( '<div>' ).text( item.label + ' ' );
		$wrapper.append( $( '<small>' ).text( path( item.link ) ) );

		return $( '<li>' ).append( $wrapper ).appendTo( ul );
	};

	// Le champ vidé par la croix du `type="search"` : pas d'événement `change` de jQuery UI.
	$search.on( 'search', function () {
		if ( '' === $search.val() && '0' !== hidden.value ) {
			choose( null );
		}
	} );

	// Entrée dans le champ : ne pas soumettre le formulaire pendant une recherche.
	$search.on( 'keydown', function ( event ) {
		if ( 'Enter' === event.key && $search.autocomplete( 'widget' ).is( ':visible' ) ) {
			event.preventDefault();
		}
	} );
}( window.wp, window.jQuery, window.couturierHeaderSettings ) );

/**
 * Écran Apparence › Menus : listes « Parent » et « Ordre » remplies pour les seuls
 * éléments dépliés.
 *
 * Injecté en inline par `Theme\Features\Admin\NavMenuDropdowns`, sans build, après
 * `wp-admin/js/nav-menu.js` et avant le `ready` qui lance `wpNavMenu.init()`.
 *
 * Depuis WordPress 6.7, chaque élément a deux `<select>` de déplacement, que le core
 * remplit tous, pour tous les éléments (`updateParentDropdown` / `updateOrderDropdown`) :
 * 120 éléments donnent 15 000 `<option>`. Au premier focus dans un champ, Chrome analyse
 * alors le formulaire pendant environ 6 s, page figée.
 *
 * Les deux méthodes jQuery du core (créées par `wpNavMenu.jQueryExtensions()`) sont
 * enveloppées : les listes des éléments repliés sont
 * vidées et retirées de leur sélecteur le temps de l'appel, que le core ne traite donc
 * que pour les éléments dépliés. Un élément déplié reconstruit les siennes, un élément
 * replié vide les siennes. Le core garde toute sa logique : déplacements, glisser-déposer,
 * ajout et suppression repassent par ces méthodes. Ces listes ne sont lues que sur
 * l'élément modifié, et jamais par l'enregistrement, qui s'appuie sur les champs cachés
 * `menu-item-parent-id` / `menu-item-position`.
 */
( function ( $, api ) {
	'use strict';

	if ( ! $ || ! api || 'function' !== typeof api.jQueryExtensions ) {
		return;
	}

	var LISTS = { updateParentDropdown: 'edit-menu-item-parent', updateOrderDropdown: 'edit-menu-item-order' };

	function wrap( method, className ) {
		var original = $.fn[ method ];

		if ( 'function' !== typeof original ) {
			return;
		}

		$.fn[ method ] = function () {
			var folded = $( '#menu-to-edit li.menu-item-edit-inactive select.' + className );

			folded.empty().removeClass( className );

			try {
				return original.apply( this, arguments );
			} finally {
				folded.addClass( className );
			}
		};
	}

	// Les méthodes n'existent qu'après `api.jQueryExtensions()`, appelée par `api.init()`
	// au `ready`, avant le premier remplissage (`initAccessibility`) : on s'intercale là.
	var extend = api.jQueryExtensions;

	api.jQueryExtensions = function () {
		var result = extend.apply( this, arguments );

		$.each( LISTS, wrap );

		return result;
	};

	// Sur le formulaire, après le gestionnaire du core (lié plus tôt au même élément, dans
	// `attachMenuEditListeners`), qui bascule `menu-item-edit-active` / `-inactive` au clic
	// sur « Modifier » : son `return false` arrête la propagation, pas les autres
	// gestionnaires de l'élément.
	$( function () {
		$( '#update-nav-menu' ).on( 'click', function ( event ) {
			var item = $( event.target ).closest( 'a.item-edit' ).closest( 'li.menu-item' );

			if ( ! item.length ) {
				return;
			}

			if ( item.hasClass( 'menu-item-edit-active' ) ) {
				item.updateParentDropdown().updateOrderDropdown();
			} else {
				item.find( 'select.edit-menu-item-parent, select.edit-menu-item-order' ).empty();
			}
		} );
	} );
}( window.jQuery, window.wpNavMenu ) );

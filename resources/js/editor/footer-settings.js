/**
 * Tableaux réordonnables de l'écran « Pied de page » : certifications, réseaux sociaux.
 *
 * Injecté en inline par `Theme\Features\Footer\FooterSettings`, sans build : écrit
 * sans imports, sur les globales `wp.media` et `jQuery` (jQuery UI Sortable). La
 * feature ne le charge que sur son écran, et lui transmet ses libellés par
 * `window.couturierFooterSettings`.
 *
 * Chaque tableau (`<tbody class="couturier-sortable__body">`) a une ligne par
 * élément, avec une poignée « ≡ » qui sert trois usages :
 * - glisser-déposer la ligne à la souris (comme dans Nested Pages) ;
 * - au clavier, flèches ↑ ↓ pour la déplacer d'un cran ;
 * - clic pour un menu « Monter / Descendre / Mettre en premier / Mettre en dernier ».
 * Les certifications se retirent en plus par un bouton, choisissent leur image dans
 * la médiathèque et s'ajoutent depuis un gabarit `<template>`.
 *
 * Les champs étant postés en tableaux parallèles, l'ordre du DOM fait l'ordre
 * d'enregistrement : aucun nom à renuméroter. Les annonces propres à chaque tableau
 * sont dans ses attributs `data-moved` et `data-removed`, lues dans une région
 * `role="status"` commune.
 */
( function ( wp, $, settings ) {
	'use strict';

	var status = document.getElementById( 'couturier-footer-status' );
	var bodies = document.querySelectorAll( '.couturier-sortable__body' );

	if ( ! settings || ! status || ! bodies.length ) {
		return;
	}

	/** Annonce un message aux lecteurs d'écran. */
	function announce( message ) {
		// Vider puis remplir : un message identique au précédent est relu.
		status.textContent = '';
		window.setTimeout( function () {
			status.textContent = message;
		}, 100 );
	}

	/** Renumérote les lignes d'un tableau et grise les déplacements impossibles du menu. */
	function refresh( body ) {
		var rows = body.children;

		for ( var i = 0; i < rows.length; i++ ) {
			var first = 0 === i;
			var last = rows.length - 1 === i;

			rows[ i ].querySelector( '.couturier-sortable__number' ).textContent = String( i + 1 );
			rows[ i ].querySelector( '[data-move="up"]' ).disabled = first;
			rows[ i ].querySelector( '[data-move="first"]' ).disabled = first;
			rows[ i ].querySelector( '[data-move="down"]' ).disabled = last;
			rows[ i ].querySelector( '[data-move="last"]' ).disabled = last;
		}
	}

	/** Position (à partir de 0) d'une ligne dans son tableau. */
	function indexOf( body, row ) {
		return Array.prototype.indexOf.call( body.children, row );
	}

	/** Place une ligne à une position, renumérote et annonce. */
	function moveTo( body, row, index ) {
		var rows = body.children;

		index = Math.max( 0, Math.min( rows.length - 1, index ) );

		if ( index === indexOf( body, row ) ) {
			return;
		}

		row.remove();
		body.insertBefore( row, body.children[ index ] || null );
		refresh( body );
		announce( body.dataset.moved.replace( '%d', String( index + 1 ) ) );
	}

	/** Cible d'un déplacement du menu : `up`, `down`, `first` ou `last`. */
	function targetIndex( body, row, move ) {
		var current = indexOf( body, row );

		return { up: current - 1, down: current + 1, first: 0, last: body.children.length - 1 }[ move ];
	}

	/** Retire une ligne ; le focus passe à la suivante, ou au bouton d'ajout. */
	function remove( body, row ) {
		var next = row.nextElementSibling || row.previousElementSibling;

		row.remove();
		refresh( body );

		( next ? next.querySelector( '.couturier-sortable__handle' ) : document.getElementById( 'couturier-certification-add' ) ).focus();
		announce( body.dataset.removed );
	}

	// ─── Menu de la poignée ───────────────────────────────────────────────────

	/** Ferme le menu ouvert, s'il y en a un ; rend le focus à sa poignée si demandé. */
	function closeMenu( restoreFocus ) {
		var menu = document.querySelector( '.couturier-sortable__menu:not([hidden])' );

		if ( ! menu ) {
			return;
		}

		var handle = menu.parentElement.querySelector( '.couturier-sortable__handle' );

		menu.hidden = true;
		handle.setAttribute( 'aria-expanded', 'false' );

		if ( restoreFocus ) {
			handle.focus();
		}
	}

	/** Ouvre le menu d'une poignée, focus sur le premier déplacement possible. */
	function openMenu( handle ) {
		var menu = handle.parentElement.querySelector( '.couturier-sortable__menu' );

		closeMenu( false );
		menu.hidden = false;
		handle.setAttribute( 'aria-expanded', 'true' );
		( menu.querySelector( 'button:not(:disabled)' ) || handle ).focus();
	}

	/** Navigation au clavier dans le menu ouvert. */
	function menuKeydown( event ) {
		var menu = event.target.closest( '.couturier-sortable__menu' );
		var items = Array.prototype.filter.call( menu.querySelectorAll( 'button' ), function ( item ) {
			return ! item.disabled;
		} );
		var current = items.indexOf( event.target );

		if ( 'Escape' === event.key ) {
			event.preventDefault();
			closeMenu( true );
		} else if ( 'ArrowDown' === event.key || 'ArrowUp' === event.key ) {
			event.preventDefault();
			items[ ( current + ( 'ArrowDown' === event.key ? 1 : -1 ) + items.length ) % items.length ].focus();
		} else if ( 'Tab' === event.key ) {
			closeMenu( false );
		}
	}

	document.addEventListener( 'click', function ( event ) {
		if ( ! event.target.closest( '.couturier-sortable__menu, .couturier-sortable__handle' ) ) {
			closeMenu( false );
		}
	} );

	// ─── Glisser-déposer ──────────────────────────────────────────────────────

	/**
	 * Glisser-déposer par la poignée (jQuery UI Sortable, livré par WordPress). Un
	 * glissement ne déclenche pas de clic : le menu ne s'ouvre qu'au clic simple.
	 */
	function makeDraggable( body ) {
		if ( ! $ || ! $.fn.sortable ) {
			return;
		}

		$( body ).sortable( {
			items: '> tr',
			axis: 'y',
			handle: '.couturier-sortable__handle',
			// Par défaut, un bouton ne peut pas servir à saisir : la poignée en est un.
			cancel: 'input, textarea, select, option, a, label, button:not(.couturier-sortable__handle)',
			placeholder: 'couturier-sortable__placeholder',
			// Une ligne de tableau perd la largeur de ses cellules en se détachant :
			// elles sont figées le temps du déplacement.
			helper: function ( event, row ) {
				row.children().each( function () {
					$( this ).width( $( this ).width() );
				} );

				return row;
			},
			start: function ( event, ui ) {
				closeMenu( false );
				ui.placeholder.html( '<td colspan="' + ui.item.children().length + '"></td>' );
			},
			stop: function ( event, ui ) {
				ui.item.children().css( 'width', '' );
			},
			update: function ( event, ui ) {
				refresh( body );
				announce( body.dataset.moved.replace( '%d', String( ui.item.index() + 1 ) ) );
			},
		} );
	}

	// ─── Médiathèque ──────────────────────────────────────────────────────────

	/** Ouvre la médiathèque et place l'image choisie dans la ligne. */
	function chooseImage( row ) {
		var frame = wp.media( {
			title: settings.mediaTitle,
			button: { text: settings.mediaButton },
			library: { type: 'image' },
			multiple: false,
		} );

		frame.on( 'select', function () {
			var image = frame.state().get( 'selection' ).first().toJSON();
			var size = image.sizes && image.sizes.medium ? image.sizes.medium : image;
			var preview = row.querySelector( '.couturier-certification__preview' );
			var img = document.createElement( 'img' );
			var warning = row.querySelector( '.couturier-certification__alt-warning' );

			img.src = size.url;
			img.alt = '';
			preview.replaceChildren( img );

			row.querySelector( '.couturier-certification__image-id' ).value = String( image.id );
			row.querySelector( '.couturier-certification__choose' ).textContent = settings.changeImage;

			warning.hidden = '' !== ( image.alt || '' ).trim();
			warning.querySelector( 'a' ).href = image.editLink || '';

			announce( settings.imageChosen );
		} );

		// La modale rend le focus au <body> en se fermant : il revient au bouton qui l'a ouverte.
		frame.on( 'close', function () {
			row.querySelector( '.couturier-certification__choose' ).focus();
		} );

		frame.open();
	}

	// ─── Branchement des tableaux ─────────────────────────────────────────────

	Array.prototype.forEach.call( bodies, function ( body ) {
		body.addEventListener( 'click', function ( event ) {
			var button = event.target.closest( 'button' );
			var row = button ? button.closest( '.couturier-sortable__row' ) : null;

			if ( ! row ) {
				return;
			}

			if ( button.classList.contains( 'couturier-sortable__handle' ) ) {
				if ( 'true' === button.getAttribute( 'aria-expanded' ) ) {
					closeMenu( true );
				} else {
					openMenu( button );
				}
			} else if ( button.dataset.move ) {
				var handle = row.querySelector( '.couturier-sortable__handle' );

				closeMenu( false );
				moveTo( body, row, targetIndex( body, row, button.dataset.move ) );
				handle.focus();
			} else if ( button.classList.contains( 'couturier-sortable__remove' ) ) {
				remove( body, row );
			} else if ( button.classList.contains( 'couturier-certification__choose' ) && wp && wp.media ) {
				chooseImage( row );
			}
		} );

		body.addEventListener( 'keydown', function ( event ) {
			if ( event.target.closest( '.couturier-sortable__menu' ) ) {
				menuKeydown( event );
				return;
			}

			// Flèches ↑ ↓ sur la poignée : déplacement d'un cran, le focus suit la ligne.
			if ( event.target.classList.contains( 'couturier-sortable__handle' ) && ( 'ArrowUp' === event.key || 'ArrowDown' === event.key ) ) {
				var row = event.target.closest( '.couturier-sortable__row' );

				event.preventDefault();
				closeMenu( false );
				moveTo( body, row, targetIndex( body, row, 'ArrowUp' === event.key ? 'up' : 'down' ) );
				event.target.focus();
			}
		} );

		// Interrupteur « Activer » : la case n'est pas postée, son état l'est par le champ caché.
		body.addEventListener( 'change', function ( event ) {
			var toggle = event.target.closest( '.couturier-sortable__toggle' );

			if ( toggle ) {
				var row = toggle.closest( '.couturier-sortable__row' );

				row.querySelector( '.couturier-sortable__enabled' ).value = toggle.checked ? '1' : '0';
				row.querySelector( '.couturier-sortable__state' ).textContent = toggle.checked ? settings.yes : settings.no;
			}
		} );

		makeDraggable( body );
		refresh( body );
	} );

	// ─── Ajout d'une certification ────────────────────────────────────────────

	var certifications = document.getElementById( 'couturier-certifications' );
	var template = document.getElementById( 'couturier-certification-template' );
	var addButton = document.getElementById( 'couturier-certification-add' );
	var newRows = 0;

	if ( certifications && template && addButton ) {
		addButton.addEventListener( 'click', function () {
			// Un <tr> n'est analysé qu'à l'intérieur d'un <tbody> : dans un <div>, il serait ignoré.
			var holder = document.createElement( 'tbody' );

			newRows++;
			holder.innerHTML = template.innerHTML.split( settings.rowKey ).join( 'new-' + newRows );

			var row = holder.firstElementChild;

			certifications.appendChild( row );
			refresh( certifications );
			row.querySelector( '.couturier-certification__choose' ).focus();
			announce( settings.added );
		} );
	}
} )( window.wp, window.jQuery, window.couturierFooterSettings );

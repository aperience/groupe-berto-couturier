/**
 * Tableaux réordonnables de l'écran « Pied de page » : certifications, réseaux sociaux.
 *
 * Injecté en inline par `Theme\Features\Footer\FooterSettings`, sans build : écrit
 * sans imports, sur la globale `wp.media`. La feature ne le charge que sur son
 * écran, et lui transmet ses libellés par `window.couturierFooterSettings`.
 *
 * Chaque tableau (`<tbody class="couturier-sortable__body">`) a une ligne par
 * élément, qui se déplace (et, pour les certifications, se retire) par des boutons,
 * et un interrupteur « Activer ». Les champs étant postés en tableaux parallèles,
 * l'ordre du DOM fait l'ordre d'enregistrement : aucun nom à renuméroter. Les
 * annonces propres à chaque tableau sont dans ses attributs `data-moved` et
 * `data-removed`. Chaque action est annoncée dans une région `role="status"`, et le
 * focus reste sur un élément du tableau (WCAG 2.4.3, 4.1.3).
 *
 * Les certifications choisissent en plus leur image dans la médiathèque, et
 * s'ajoutent depuis un gabarit `<template>`.
 */
( function ( wp, settings ) {
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

	/** Renumérote les lignes d'un tableau et désactive les déplacements impossibles. */
	function refresh( body ) {
		var rows = body.children;

		for ( var i = 0; i < rows.length; i++ ) {
			rows[ i ].querySelector( '.couturier-sortable__number' ).textContent = String( i + 1 );
			rows[ i ].querySelector( '.couturier-sortable__up' ).disabled = 0 === i;
			rows[ i ].querySelector( '.couturier-sortable__down' ).disabled = rows.length - 1 === i;
		}
	}

	/** Déplace une ligne d'un cran, en gardant le focus sur le bouton utilisé. */
	function move( body, row, button, direction ) {
		var sibling = direction < 0 ? row.previousElementSibling : row.nextElementSibling;

		if ( ! sibling ) {
			return;
		}

		body.insertBefore( row, direction < 0 ? sibling : sibling.nextElementSibling );
		refresh( body );

		// Arrivé en bout de liste, le bouton est désactivé : le focus passe à l'autre.
		( button.disabled
			? row.querySelector( direction < 0 ? '.couturier-sortable__down' : '.couturier-sortable__up' )
			: button
		).focus();

		announce( body.dataset.moved.replace( '%d', String( Array.prototype.indexOf.call( body.children, row ) + 1 ) ) );
	}

	/** Retire une ligne ; le focus passe à la suivante, ou au tableau d'origine. */
	function remove( body, row ) {
		var next = row.nextElementSibling || row.previousElementSibling;

		row.remove();
		refresh( body );

		// Sans ligne restante, le focus va au bouton d'ajout qui suit le tableau.
		( next ? next.querySelector( 'button' ) : document.getElementById( 'couturier-certification-add' ) ).focus();
		announce( body.dataset.removed );
	}

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

		// La modale rend le focus au <body> en se fermant (choix fait ou annulé) :
		// il revient au bouton qui l'a ouverte (WCAG 2.4.3).
		frame.on( 'close', function () {
			row.querySelector( '.couturier-certification__choose' ).focus();
		} );

		frame.open();
	}

	Array.prototype.forEach.call( bodies, function ( body ) {
		body.addEventListener( 'click', function ( event ) {
			var button = event.target.closest( 'button' );
			var row = button ? button.closest( '.couturier-sortable__row' ) : null;

			if ( ! row ) {
				return;
			}

			if ( button.classList.contains( 'couturier-sortable__up' ) ) {
				move( body, row, button, -1 );
			} else if ( button.classList.contains( 'couturier-sortable__down' ) ) {
				move( body, row, button, 1 );
			} else if ( button.classList.contains( 'couturier-sortable__remove' ) ) {
				remove( body, row );
			} else if ( button.classList.contains( 'couturier-certification__choose' ) && wp && wp.media ) {
				chooseImage( row );
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

		refresh( body );
	} );

	// Ajout d'une certification, depuis le gabarit d'une ligne vierge.
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
} )( window.wp, window.couturierFooterSettings );

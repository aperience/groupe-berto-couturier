/**
 * Liste des certifications de l'écran « Pied de page ».
 *
 * Injecté en inline par `Theme\Features\Footer\FooterSettings`, sans build : écrit
 * sans imports, sur la globale `wp.media`. La feature ne le charge que sur son
 * écran, et lui transmet ses libellés par `window.couturierFooterSettings`.
 *
 * Une ligne de tableau par certification (`<tr>` dans `<tbody id="couturier-certifications">`).
 * Chaque ligne choisit son image dans la médiathèque, et se déplace ou se retire
 * par des boutons. Les champs étant postés en tableaux parallèles (`image_id[]`,
 * `url[]`), l'ordre du DOM fait l'ordre d'enregistrement : aucun nom à renuméroter.
 * Chaque action est annoncée dans une région `role="status"`, et le focus reste
 * sur un élément de la liste (WCAG 2.4.3, 4.1.3).
 */
( function ( wp, settings ) {
	'use strict';

	var list = document.getElementById( 'couturier-certifications' );
	var template = document.getElementById( 'couturier-certification-template' );
	var addButton = document.getElementById( 'couturier-certification-add' );
	var status = document.getElementById( 'couturier-certifications-status' );

	if ( ! wp || ! wp.media || ! settings || ! list || ! template || ! addButton || ! status ) {
		return;
	}

	var newRows = 0;

	/** Annonce un message aux lecteurs d'écran. */
	function announce( message ) {
		// Vider puis remplir : un message identique au précédent est relu.
		status.textContent = '';
		window.setTimeout( function () {
			status.textContent = message;
		}, 100 );
	}

	/** Renumérote les en-têtes de ligne et désactive les déplacements impossibles. */
	function refresh() {
		var rows = list.children;

		for ( var i = 0; i < rows.length; i++ ) {
			rows[ i ].querySelector( '.couturier-certification__number' ).textContent = String( i + 1 );
			rows[ i ].querySelector( '.couturier-certification__up' ).disabled = 0 === i;
			rows[ i ].querySelector( '.couturier-certification__down' ).disabled = rows.length - 1 === i;
		}
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

	/** Déplace une ligne d'un cran, en gardant le focus sur le bouton utilisé. */
	function move( row, button, direction ) {
		var sibling = direction < 0 ? row.previousElementSibling : row.nextElementSibling;

		if ( ! sibling ) {
			return;
		}

		list.insertBefore( row, direction < 0 ? sibling : sibling.nextElementSibling );
		refresh();

		// Arrivé en bout de liste, le bouton est désactivé : le focus passe à l'autre.
		( button.disabled
			? row.querySelector( direction < 0 ? '.couturier-certification__down' : '.couturier-certification__up' )
			: button
		).focus();

		announce( settings.moved.replace( '%d', String( Array.prototype.indexOf.call( list.children, row ) + 1 ) ) );
	}

	/** Retire une ligne ; le focus passe à la suivante, ou au bouton d'ajout. */
	function remove( row ) {
		var next = row.nextElementSibling || row.previousElementSibling;

		row.remove();
		refresh();

		( next ? next.querySelector( '.couturier-certification__choose' ) : addButton ).focus();
		announce( settings.removed );
	}

	list.addEventListener( 'click', function ( event ) {
		var button = event.target.closest( 'button' );
		var row = button ? button.closest( '.couturier-certification' ) : null;

		if ( ! row ) {
			return;
		}

		if ( button.classList.contains( 'couturier-certification__choose' ) ) {
			chooseImage( row );
		} else if ( button.classList.contains( 'couturier-certification__up' ) ) {
			move( row, button, -1 );
		} else if ( button.classList.contains( 'couturier-certification__down' ) ) {
			move( row, button, 1 );
		} else if ( button.classList.contains( 'couturier-certification__remove' ) ) {
			remove( row );
		}
	} );

	addButton.addEventListener( 'click', function () {
		// Un <tr> n'est analysé qu'à l'intérieur d'un <tbody> : dans un <div>, il serait ignoré.
		var holder = document.createElement( 'tbody' );

		newRows++;
		holder.innerHTML = template.innerHTML.split( settings.rowKey ).join( 'new-' + newRows );

		var row = holder.firstElementChild;

		list.appendChild( row );
		refresh();
		row.querySelector( '.couturier-certification__choose' ).focus();
		announce( settings.added );
	} );

	refresh();
} )( window.wp, window.couturierFooterSettings );

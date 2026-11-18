/**
 * Image du héros des catégories (feature `Blog\CategoryImage`) : choix dans la
 * médiathèque, aperçu, retrait. Injecté en ligne, sans build, sur les écrans des
 * catégories ; libellés passés par `window.couturierCategoryImage`.
 */
( function () {
	var settings = window.couturierCategoryImage || {};

	function reset( box ) {
		box.querySelector( '.couturier-category-image__preview' ).replaceChildren();
		box.querySelector( '.couturier-category-image__id' ).value = '';
		box.querySelector( '.couturier-category-image__choose' ).textContent = settings.choose;
		box.querySelector( '.couturier-category-image__remove' ).hidden = true;
	}

	document.addEventListener( 'click', function ( event ) {
		var button = event.target.closest( '.couturier-category-image button' );
		if ( ! button ) {
			return;
		}
		var box = button.closest( '.couturier-category-image' );

		if ( button.classList.contains( 'couturier-category-image__remove' ) ) {
			reset( box );
			return;
		}

		var frame = wp.media( {
			title: settings.mediaTitle,
			button: { text: settings.mediaButton },
			library: { type: 'image' },
			multiple: false,
		} );

		frame.on( 'select', function () {
			var image = frame.state().get( 'selection' ).first().toJSON();
			var size = image.sizes && image.sizes.medium ? image.sizes.medium : image;
			var img = document.createElement( 'img' );

			img.src = size.url;
			img.alt = '';
			box.querySelector( '.couturier-category-image__preview' ).replaceChildren( img );
			box.querySelector( '.couturier-category-image__id' ).value = String( image.id );
			box.querySelector( '.couturier-category-image__choose' ).textContent = settings.change;
			box.querySelector( '.couturier-category-image__remove' ).hidden = false;
		} );

		frame.open();
	} );

	// Écran « Ajouter » : le formulaire est envoyé en AJAX puis vidé ; vider l'image aussi.
	if ( window.jQuery ) {
		window.jQuery( document ).ajaxSuccess( function ( e, xhr, options ) {
			if ( options.data && String( options.data ).indexOf( 'action=add-tag' ) !== -1 ) {
				document.querySelectorAll( '#addtag .couturier-category-image' ).forEach( reset );
			}
		} );
	}
} )();

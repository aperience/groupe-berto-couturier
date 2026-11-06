/**
 * Garde-fou des niveaux de titre dans l'éditeur de blocs.
 *
 * Injecté en inline par `Theme\Features\Blocks\RestrictHeadingLevels`, sans build :
 * écrit sans imports ni JSX, sur les globales `wp.*`.
 *
 * La feature restreint côté serveur le défaut de `levelOptions`, ce qui retire les
 * niveaux interdits des variations, de l'inserteur et de la barre latérale. Mais
 * d'autres chemins créent un titre sans passer par eux : raccourci Markdown
 * (`#### `), collage de HTML, éditeur de code, transformation de bloc. Ce script
 * surveille donc l'arbre des blocs et ramène tout niveau hors de `levelOptions` au
 * niveau autorisé le plus proche — pour tout bloc qui déclare cet attribut.
 *
 * Les enfants directs des blocs `exemptParents` (configuration posée par la feature
 * dans `window.couturierHeadingGuard`) sont ignorés : le héros de l'accueil fixe
 * lui-même le niveau 1 de son titre principal.
 */
( function ( wp ) {
	'use strict';

	if ( ! wp || ! wp.data || ! wp.blocks ) {
		return;
	}

	var STORE = 'core/block-editor';
	var EXEMPT = ( window.couturierHeadingGuard && window.couturierHeadingGuard.exemptParents ) || [];
	var lastBlocks = null;

	/**
	 * Niveau autorisé le plus proche. Un titre (niveau > 0) reste un titre : le
	 * niveau 0 (un `<p>`) n'est retenu que pour un niveau 0.
	 */
	function nearest( level, allowed ) {
		var candidates = level > 0 ? allowed.filter( function ( l ) { return l > 0; } ) : allowed;

		if ( ! candidates.length ) {
			candidates = allowed;
		}

		return candidates.reduce( function ( best, l ) {
			return Math.abs( l - level ) < Math.abs( best - level ) ? l : best;
		}, candidates[ 0 ] );
	}

	function check( blocks, parentName ) {
		var isExempt = EXEMPT.indexOf( parentName ) !== -1;

		blocks.forEach( function ( block ) {
			var type = wp.blocks.getBlockType( block.name );
			var allowed = type && type.attributes && type.attributes.levelOptions && type.attributes.levelOptions.default;
			var level = block.attributes.level;

			if ( ! isExempt && Array.isArray( allowed ) && allowed.length && typeof level === 'number' && allowed.indexOf( level ) === -1 ) {
				// Pas d'étape d'historique propre : « Annuler » revient à l'état
				// d'avant le titre fautif, au lieu de rejouer le niveau interdit
				// aussitôt recorrigé.
				wp.data.dispatch( STORE ).__unstableMarkNextChangeAsNotPersistent();
				wp.data.dispatch( STORE ).updateBlockAttributes( block.clientId, { level: nearest( level, allowed ) } );
			}

			if ( block.innerBlocks && block.innerBlocks.length ) {
				check( block.innerBlocks, block.name );
			}
		} );
	}

	wp.data.subscribe( function () {
		var blocks = wp.data.select( STORE ).getBlocks();

		// L'arbre est immuable : une référence inchangée signifie aucun bloc modifié.
		if ( blocks === lastBlocks ) {
			return;
		}

		lastBlocks = blocks;
		check( blocks, null );
	} );
} )( window.wp );

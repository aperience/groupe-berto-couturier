/**
 * Alignement des titres libres (`core/heading` de premier niveau), dans l'éditeur.
 *
 * Injecté en inline par `Theme\Features\Blocks\HeadingTextAlign`, sans build :
 * écrit sans imports ni JSX, sur les globales `wp.*`.
 *
 * L'attribut `textAlignment` (`left` | `center`, défaut) est déclaré côté serveur.
 * Ce script ajoute le réglage dans la barre d'outils des seuls titres de premier
 * niveau — les titres imbriqués suivent leur bloc —, et la classe
 * `has-text-align-left` au titre dans le canvas. Rien n'est écrit dans le HTML
 * enregistré.
 */
( function ( wp ) {
	'use strict';

	if ( ! wp || ! wp.hooks || ! wp.compose || ! wp.element || ! wp.data || ! wp.blockEditor ) {
		return;
	}

	var el = wp.element.createElement;
	var __ = wp.i18n.__;
	var ATTRIBUTE = 'textAlignment';
	var CLASS_NAME = 'has-text-align-left';

	var ALIGNMENTS = [
		{ icon: 'editor-alignleft', title: __( 'Aligner le texte à gauche', 'couturier' ), align: 'left' },
		{ icon: 'editor-aligncenter', title: __( 'Centrer le texte', 'couturier' ), align: 'center' },
	];

	/** Titre posé au premier niveau du contenu ? */
	function useIsRoot( clientId ) {
		return wp.data.useSelect(
			function ( select ) {
				return ! select( wp.blockEditor.store ).getBlockRootClientId( clientId );
			},
			[ clientId ]
		);
	}

	// Réglage dans la barre d'outils.
	wp.hooks.addFilter(
		'editor.BlockEdit',
		'couturier/heading-text-align/control',
		wp.compose.createHigherOrderComponent( function ( BlockEdit ) {
			function Control( props ) {
				if ( ! useIsRoot( props.clientId ) ) {
					return null;
				}

				return el(
					wp.blockEditor.BlockControls,
					{ group: 'block' },
					el( wp.blockEditor.AlignmentControl, {
						value: props.attributes[ ATTRIBUTE ] || 'center',
						alignmentControls: ALIGNMENTS,
						onChange: function ( value ) {
							var changes = {};
							changes[ ATTRIBUTE ] = value || 'center';
							props.setAttributes( changes );
						},
					} )
				);
			}

			return function ( props ) {
				if ( 'core/heading' !== props.name || ! props.isSelected ) {
					return el( BlockEdit, props );
				}

				return el( wp.element.Fragment, null, el( Control, props ), el( BlockEdit, props ) );
			};
		}, 'withHeadingTextAlign' )
	);

	// Classe `has-text-align-left` sur le titre dans le canvas.
	wp.hooks.addFilter(
		'editor.BlockListBlock',
		'couturier/heading-text-align/class',
		wp.compose.createHigherOrderComponent( function ( BlockListBlock ) {
			return function ( props ) {
				if ( 'core/heading' !== props.name || ! props.attributes || 'left' !== props.attributes[ ATTRIBUTE ] ) {
					return el( BlockListBlock, props );
				}

				return el(
					BlockListBlock,
					Object.assign( {}, props, {
						className: [ props.className, CLASS_NAME ].filter( Boolean ).join( ' ' ),
					} )
				);
			};
		}, 'withHeadingTextAlignClass' )
	);
} )( window.wp );

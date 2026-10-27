/**
 * Bloc Bouton dans l'éditeur : flèche et formats du texte.
 *
 * Injecté en inline par `Theme\Features\Blocks\ButtonStyles`, sans build :
 * écrit sans imports ni JSX, sur les globales `wp.*`.
 *
 * 1. Flèche. L'attribut `hasArrow` est déclaré côté serveur. Ce script ajoute son
 *    interrupteur dans la barre latérale, et la classe `has-arrow` à l'enveloppe
 *    du bouton dans le canvas — sur le front, c'est le filtre `render_block` de la
 *    feature qui la pose. Rien n'est écrit dans le HTML enregistré.
 * 2. Formats. Le texte d'un bouton suit le style « Button » du design system
 *    (Space Grotesk Bold, sans italique) : les formats « Gras », « Italique » et
 *    ceux qui n'ont pas leur place dans un libellé (liste `FORMATS_OFF`) sont
 *    retirés. Le core ne permet pas de
 *    restreindre les formats d'un bloc qu'il fournit ; chaque format retiré est
 *    donc réenregistré avec une interface (bouton de barre d'outils, raccourci
 *    clavier) qui ne s'affiche pas quand un bouton est sélectionné. Il reste
 *    disponible partout ailleurs.
 */
( function ( wp ) {
	'use strict';

	if ( ! wp || ! wp.hooks || ! wp.compose || ! wp.element || ! wp.blockEditor || ! wp.components || ! wp.richText || ! wp.data ) {
		return;
	}

	var el = wp.element.createElement;
	var __ = wp.i18n.__;
	var BLOCK = 'core/button';

	// Formats sans objet dans le texte d'un bouton : graisse, style et couleur
	// fixés par le design system ; code, image, saisie clavier, formule et langue
	// n'ont pas leur place dans un libellé d'action.
	var FORMATS_OFF = [
		'core/bold',
		'core/italic',
		'core/code', // Code en ligne
		'core/image', // Image en ligne
		'core/language', // Langue
		'core/math', // Maths
		'core/text-color', // Mettre en évidence
		'core/keyboard', // Saisie au clavier
	];

	var withArrowControl = wp.compose.createHigherOrderComponent( function ( BlockEdit ) {
		return function ( props ) {
			if ( props.name !== BLOCK ) {
				return el( BlockEdit, props );
			}

			return el(
				wp.element.Fragment,
				null,
				el( BlockEdit, props ),
				el(
					wp.blockEditor.InspectorControls,
					null,
					el(
						wp.components.PanelBody,
						{ title: __( 'Flèche', 'couturier' ) },
						el( wp.components.ToggleControl, {
							__nextHasNoMarginBottom: true,
							label: __( 'Afficher la flèche', 'couturier' ),
							checked: !! props.attributes.hasArrow,
							onChange: function ( value ) {
								props.setAttributes( { hasArrow: value } );
							},
						} )
					)
				)
			);
		};
	}, 'withArrowControl' );

	var withArrowClass = wp.compose.createHigherOrderComponent( function ( BlockListBlock ) {
		return function ( props ) {
			if ( props.name !== BLOCK || ! props.attributes.hasArrow ) {
				return el( BlockListBlock, props );
			}

			return el(
				BlockListBlock,
				Object.assign( {}, props, {
					className: [ props.className, 'has-arrow' ].filter( Boolean ).join( ' ' ),
				} )
			);
		};
	}, 'withArrowClass' );

	wp.hooks.addFilter( 'editor.BlockEdit', 'couturier/button-arrow/control', withArrowControl );
	wp.hooks.addFilter( 'editor.BlockListBlock', 'couturier/button-arrow/class', withArrowClass );

	FORMATS_OFF.forEach( function ( name ) {
		if ( ! wp.data.select( 'core/rich-text' ).getFormatType( name ) ) {
			return;
		}

		var format = wp.richText.unregisterFormatType( name );
		var Edit = format.edit;

		wp.richText.registerFormatType( name, Object.assign( {}, format, {
			edit: function ( props ) {
				var inButton = wp.data.useSelect( function ( select ) {
					return select( 'core/block-editor' ).getSelectedBlock()?.name === BLOCK;
				}, [] );

				return inButton ? null : el( Edit, props );
			},
		} ) );
	} );
} )( window.wp );

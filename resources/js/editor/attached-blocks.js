/**
 * Réglage « Rapprocher du bloc précédent » des blocs du thème, dans l'éditeur.
 *
 * Injecté en inline par `Theme\Features\Blocks\AttachedBlocks`, sans build :
 * écrit sans imports ni JSX, sur les globales `wp.*`.
 *
 * L'attribut `isAttached` est déclaré côté serveur, sur les blocs du thème de
 * premier niveau et sur `core/heading` ; l'interrupteur n'est proposé qu'au premier
 * niveau du contenu, hors premier bloc. Ce script ajoute son interrupteur dans la barre latérale (panneau
 * « Espacement ») des blocs qui l'ont, et la classe `is-attached` au bloc dans le
 * canvas — sur le front, c'est le filtre `render_block` de la feature qui la pose.
 * Rien n'est écrit dans le HTML enregistré.
 */
( function ( wp ) {
	'use strict';

	if ( ! wp || ! wp.hooks || ! wp.compose || ! wp.element || ! wp.blocks || ! wp.blockEditor || ! wp.components || ! wp.data ) {
		return;
	}

	var el = wp.element.createElement;
	var __ = wp.i18n.__;
	var ATTRIBUTE = 'isAttached';
	var CLASS_NAME = 'is-attached';

	/** Le bloc porte-t-il le réglage (attribut déclaré par le serveur) ? */
	function hasSetting( name ) {
		var type = wp.blocks.getBlockType( name );

		return !! ( type && type.attributes && type.attributes[ ATTRIBUTE ] );
	}

	// Interrupteur dans la barre latérale.
	wp.hooks.addFilter(
		'editor.BlockEdit',
		'couturier/attached-blocks/control',
		wp.compose.createHigherOrderComponent( function ( BlockEdit ) {
			return function ( props ) {
				// Seulement au premier niveau du contenu (un titre peut être imbriqué),
				// et pas sur le premier bloc : pas de bloc précédent dont se rapprocher.
				var isEligible = wp.data.useSelect( function ( select ) {
					var store = select( 'core/block-editor' );

					return ! store.getBlockRootClientId( props.clientId ) && store.getBlockIndex( props.clientId ) > 0;
				}, [ props.clientId ] );

				if ( ! props.isSelected || ! isEligible || ! hasSetting( props.name ) ) {
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
							{ title: __( 'Espacement', 'couturier' ), initialOpen: true },
							el( wp.components.ToggleControl, {
								__nextHasNoMarginBottom: true,
								label: __( 'Rapprocher du bloc précédent', 'couturier' ),
								help: __( 'Écart réduit, comme au sein d\'un même ensemble, au lieu de l\'espace entre deux sections.', 'couturier' ),
								checked: !! props.attributes[ ATTRIBUTE ],
								onChange: function ( value ) {
									var changes = {};
									changes[ ATTRIBUTE ] = value;
									props.setAttributes( changes );
								},
							} )
						)
					)
				);
			};
		}, 'withAttachedControl' )
	);

	// Classe `is-attached` sur le bloc dans le canvas.
	wp.hooks.addFilter(
		'editor.BlockListBlock',
		'couturier/attached-blocks/class',
		wp.compose.createHigherOrderComponent( function ( BlockListBlock ) {
			return function ( props ) {
				if ( ! props.attributes || ! props.attributes[ ATTRIBUTE ] || ! hasSetting( props.name ) ) {
					return el( BlockListBlock, props );
				}

				return el(
					BlockListBlock,
					Object.assign( {}, props, {
						className: [ props.className, CLASS_NAME ].filter( Boolean ).join( ' ' ),
					} )
				);
			};
		}, 'withAttachedClass' )
	);
} )( window.wp );

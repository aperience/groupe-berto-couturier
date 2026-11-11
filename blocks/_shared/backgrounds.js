/**
 * Fond d'une carte choisi dans une liste fermée, partagé par les blocs de cartes
 * (`icon-card`, `photo-card`, avis mis en avant de `reviews`…).
 *
 * - chaque bloc déclare un attribut `background` dont l'`enum` (`block.json`)
 *   liste les slugs qu'il accepte, et son défaut ;
 * - rendu : classe `is-bg-{slug}`, sauf pour le fond par défaut du bloc (aucune
 *   classe) ; couleurs dans `$ds-card-backgrounds` (`_brand.scss`) ;
 * - `render.php` relit l'`enum` du `block.json` : une seule liste par bloc.
 *
 * Hexa ci-dessous pour les pastilles de l'inspecteur seulement.
 */
import { InspectorControls } from '@wordpress/block-editor';
import { ColorPalette, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const BACKGROUNDS = [
	{ slug: 'white', name: __( 'Blanc', 'couturier' ), color: '#ffffff' },
	{ slug: 'petrol-100', name: __( 'Pétrole clair', 'couturier' ), color: '#e0eaec' },
	{ slug: 'peach-300', name: __( 'Pêche', 'couturier' ), color: '#fbdfcb' },
	{ slug: 'petrol-50', name: __( 'Pétrole très clair', 'couturier' ), color: '#f0f4f6' },
	{ slug: 'orange-100', name: __( 'Orange clair', 'couturier' ), color: '#ffeae3' },
	{ slug: 'neutral-50', name: __( 'Blanc cassé', 'couturier' ), color: '#f6f6f6' },
];

/**
 * Fonds acceptés par un bloc, d'après son `block.json`, et fond retenu (défaut
 * du bloc si la valeur est absente ou hors liste).
 */
export function useBackground( metadata, value ) {
	const { enum: slugs = [], default: fallback } = metadata.attributes.background;
	const options = BACKGROUNDS.filter( ( item ) => slugs.includes( item.slug ) );
	const current = options.find( ( item ) => item.slug === value ) ?? options.find( ( item ) => item.slug === fallback );

	return {
		options,
		current,
		className: current && current.slug !== fallback ? `is-bg-${ current.slug }` : undefined,
	};
}

/** Panneau « Fond de la carte » (titre modifiable) de la barre latérale. */
export function BackgroundPanel( { options, current, onChange, title = __( 'Fond de la carte', 'couturier' ) } ) {
	return (
		<InspectorControls>
			<PanelBody title={ title }>
				<ColorPalette
					colors={ options.map( ( { name, color } ) => ( { name, color } ) ) }
					value={ current?.color }
					onChange={ ( color ) => {
						const item = options.find( ( option ) => option.color === color );
						if ( item ) {
							onChange( item.slug );
						}
					} }
					disableCustomColors
					clearable={ false }
				/>
			</PanelBody>
		</InspectorControls>
	);
}

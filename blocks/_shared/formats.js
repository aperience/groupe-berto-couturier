/**
 * Formats du texte des blocs imbriqués d'un bloc custom (titre, texte…).
 *
 * `restrictFormats()` retire des formats d'un bloc imbriqué. Même technique que
 * `resources/js/editor/button.js` : le core ne permet pas de restreindre les
 * formats d'un bloc qu'il fournit, chaque format retiré est donc réenregistré avec
 * une interface (bouton de barre d'outils, raccourci clavier) qui ne s'affiche pas
 * quand le bloc imbriqué concerné est sélectionné. Il reste disponible partout
 * ailleurs, et plusieurs scripts peuvent l'envelopper l'un après l'autre, dans
 * n'importe quel ordre.
 *
 * Les formats sont enregistrés par plusieurs scripts (`wp-format-library`, et
 * `core/footnote` par la bibliothèque de blocs, à l'initialisation de l'éditeur) :
 * chacun est enveloppé dès qu'il apparaît dans le store.
 *
 * Le format « Mise en avant » (`couturier/highlight`) est un
 * `<span class="wp-block-couturier-cta__highlight">`, dont la couleur dépend du
 * bloc (orange sur le fond sombre du CTA, orange foncé sur fond clair). Enregistré
 * partout, pour qu'un titre collé ailleurs reste valide, mais proposé dans le seul
 * titre des blocs `HIGHLIGHT_HOSTS`, et dans un titre libre (`core/heading` au
 * premier niveau du contenu). Ce module est inclus dans le script de chaque
 * bloc qui l'importe : le premier chargé enregistre le format.
 *
 * Hors de `blocks/{nom}/` : ce dossier n'a pas de `block.json`, wp-scripts ne le
 * compile pas seul ; il est inclus dans le script de chaque bloc qui l'importe.
 */
import { BlockControls, store as blockEditorStore } from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { select, subscribe, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { registerFormatType, store as richTextStore, toggleFormat, unregisterFormatType } from '@wordpress/rich-text';

import { highlighter } from './icons.js';

const HIGHLIGHT = 'couturier/highlight';

/** Blocs dont le titre (`core/heading` enfant direct) propose la mise en avant. */
const HIGHLIGHT_HOSTS = [ 'couturier/cta', 'couturier/faq', 'couturier/section-title', 'couturier/image-text', 'couturier/page-hero', 'couturier/collapsible-text', 'couturier/step', 'couturier/icon-card', 'couturier/image-card', 'couturier/compact-cta', 'couturier/logo-strip', 'couturier/pickup-map' ];

/** Formats retirés d'un texte (`core/paragraph`) de bloc custom. */
export const TEXT_FORMATS_OFF = [
	'core/code', // Code en ligne
	'core/image', // Image en ligne
	'core/language', // Langue
	'core/math', // Maths
	'core/text-color', // Mettre en évidence
	'core/keyboard', // Saisie au clavier
	'core/footnote', // Note de bas de page
];

/** Un titre perd en plus le gras, l'italique et le lien. */
export const HEADING_FORMATS_OFF = [ ...TEXT_FORMATS_OFF, 'core/bold', 'core/italic', 'core/link' ];

/**
 * Bloc sélectionné, et nom de son parent direct.
 *
 * @return {{block: ?Object, parentName: ?string}}
 */
function selection( registrySelect ) {
	const editor = registrySelect( blockEditorStore );
	const block = editor.getSelectedBlock();
	const rootClientId = block ? editor.getBlockRootClientId( block.clientId ) : null;

	return { block, parentName: rootClientId ? editor.getBlockName( rootClientId ) : null };
}

/**
 * Le bloc sélectionné est-il le titre d'un bloc qui propose la mise en avant, ou un
 * titre libre (sans parent) ?
 */
const isHighlightHeading = ( registrySelect ) => {
	const { block, parentName } = selection( registrySelect );

	return 'core/heading' === block?.name && ( null === parentName || HIGHLIGHT_HOSTS.includes( parentName ) );
};

if ( ! select( richTextStore ).getFormatType( HIGHLIGHT ) ) {
	registerFormatType( HIGHLIGHT, {
		title: __( 'Mise en avant', 'couturier' ),
		tagName: 'span',
		className: 'wp-block-couturier-cta__highlight',
		edit( { isActive, value, onChange } ) {
			const isAvailable = useSelect( isHighlightHeading, [] );

			if ( ! isAvailable ) {
				return null;
			}

			return (
				<BlockControls group="inline">
					<ToolbarGroup>
						<ToolbarButton
							icon={ highlighter }
							label={ __( 'Mise en avant', 'couturier' ) }
							isPressed={ isActive }
							onClick={ () => onChange( toggleFormat( value, { type: HIGHLIGHT } ) ) }
						/>
					</ToolbarGroup>
				</BlockControls>
			);
		},
	} );
}

/**
 * Retire des formats des blocs imbriqués (enfants directs) de `parentName`.
 *
 * @param {string}                   parentName Bloc custom, ex. `couturier/cta`.
 * @param {Object<string, string[]>} formatsOff Bloc imbriqué → formats retirés.
 */
export function restrictFormats( parentName, formatsOff ) {
	const isOff = ( registrySelect, name ) => {
		const { block, parentName: selectedParent } = selection( registrySelect );

		return !! block && parentName === selectedParent && ( formatsOff[ block.name ] ?? [] ).includes( name );
	};

	const hide = ( name, format ) => {
		const { edit: Edit } = unregisterFormatType( name );

		registerFormatType( name, {
			...format,
			edit( props ) {
				const off = useSelect( ( registrySelect ) => isOff( registrySelect, name ), [] );

				return off ? null : <Edit { ...props } />;
			},
		} );
	};

	const pending = new Set( Object.values( formatsOff ).flat() );

	const wrapRegistered = () => {
		pending.forEach( ( name ) => {
			const format = select( richTextStore ).getFormatType( name );

			if ( format ) {
				pending.delete( name );
				hide( name, format );
			}
		} );

		if ( ! pending.size ) {
			unsubscribe();
		}
	};

	const unsubscribe = subscribe( wrapRegistered, richTextStore );
	wrapRegistered();
}

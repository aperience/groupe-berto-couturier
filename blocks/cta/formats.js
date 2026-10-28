/**
 * Formats du texte proposés dans le titre et le texte du bloc « Appel à l'action ».
 *
 * Seuls restent ceux du texte des boutons (Barrer, Exposant, Indice), plus Gras,
 * Italique et Lien dans le texte. Les autres (liste `FORMATS_OFF`) sont retirés.
 *
 * Même technique que `resources/js/editor/button.js` : le core ne permet pas de
 * restreindre les formats d'un bloc qu'il fournit, chaque format retiré est donc
 * réenregistré avec une interface (bouton de barre d'outils, raccourci clavier) qui
 * ne s'affiche pas quand le titre ou le texte d'un CTA est sélectionné. Il reste
 * disponible partout ailleurs, et les deux scripts peuvent l'envelopper l'un après
 * l'autre, dans n'importe quel ordre.
 *
 * Les formats sont enregistrés par plusieurs scripts (`wp-format-library`, et
 * `core/footnote` par la bibliothèque de blocs, à l'initialisation de l'éditeur) :
 * chacun est enveloppé dès qu'il apparaît dans le store.
 *
 * Le titre reçoit en propre le format « Mise en avant » (`couturier/highlight`) : un
 * `<span class="wp-block-couturier-cta__highlight">`, en orange sur le fond sombre
 * du CTA (5,8:1). Enregistré partout, pour qu'un titre collé ailleurs reste valide,
 * mais proposé dans le seul titre du CTA : sur fond clair, l'orange ne tient que
 * 2,8:1 (sous l'AA).
 */
import { BlockControls, store as blockEditorStore } from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { select, subscribe, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { registerFormatType, store as richTextStore, toggleFormat, unregisterFormatType } from '@wordpress/rich-text';

import { highlighter } from '../_shared/icons.js';
import metadata from './block.json';

const HIGHLIGHT = 'couturier/highlight';

/** Le bloc sélectionné est-il le titre d'un CTA ? */
const isCtaHeading = ( registrySelect ) => {
	const editor = registrySelect( blockEditorStore );
	const block = editor.getSelectedBlock();

	return 'core/heading' === block?.name && editor.getBlockParentsByBlockName( block.clientId, metadata.name ).length > 0;
};

registerFormatType( HIGHLIGHT, {
	title: __( 'Mise en avant', 'couturier' ),
	tagName: 'span',
	className: 'wp-block-couturier-cta__highlight',
	edit( { isActive, value, onChange } ) {
		const inCtaHeading = useSelect( isCtaHeading, [] );

		if ( ! inCtaHeading ) {
			return null;
		}

		return (
			<BlockControls group="inline">
				<ToolbarGroup>
					<ToolbarButton
						icon={ highlighter }
						label={ __( 'Mise en avant (orange)', 'couturier' ) }
						isPressed={ isActive }
						onClick={ () => onChange( toggleFormat( value, { type: HIGHLIGHT } ) ) }
					/>
				</ToolbarGroup>
			</BlockControls>
		);
	},
} );

/** Formats retirés du texte (`core/paragraph`) du CTA. */
const TEXT_FORMATS_OFF = [
	'core/code', // Code en ligne
	'core/image', // Image en ligne
	'core/language', // Langue
	'core/math', // Maths
	'core/text-color', // Mettre en évidence
	'core/keyboard', // Saisie au clavier
	'core/footnote', // Note de bas de page
];

/** Le titre (`core/heading`) perd en plus le gras, l'italique et le lien. */
const FORMATS_OFF = {
	'core/heading': [ ...TEXT_FORMATS_OFF, 'core/bold', 'core/italic', 'core/link' ],
	'core/paragraph': TEXT_FORMATS_OFF,
};

/** Le format `name` est-il retiré du bloc sélectionné ? */
function isOff( registrySelect, name ) {
	const editor = registrySelect( blockEditorStore );
	const block = editor.getSelectedBlock();

	return (
		!! block &&
		( FORMATS_OFF[ block.name ] ?? [] ).includes( name ) &&
		editor.getBlockParentsByBlockName( block.clientId, metadata.name ).length > 0
	);
}

function hideInCta( name, format ) {
	const { edit: Edit } = unregisterFormatType( name );

	registerFormatType( name, {
		...format,
		edit( props ) {
			const off = useSelect( ( registrySelect ) => isOff( registrySelect, name ), [] );

			return off ? null : <Edit { ...props } />;
		},
	} );
}

const pending = new Set( Object.values( FORMATS_OFF ).flat() );

function wrapRegistered() {
	pending.forEach( ( name ) => {
		const format = select( richTextStore ).getFormatType( name );

		if ( format ) {
			pending.delete( name );
			hideInCta( name, format );
		}
	} );

	if ( ! pending.size ) {
		unsubscribe();
	}
}

const unsubscribe = subscribe( wrapRegistered, richTextStore );
wrapRegistered();

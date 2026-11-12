/**
 * Bloc « Équipe » (`couturier/team`) : cartes des membres, une carte = un bloc
 * enfant `couturier/team-member` (contact du CPT `couturier_contact` + fond).
 *
 * Ajout : recherche « Ajouter un membre » dans la barre latérale du bloc (crée
 * l'enfant avec son contact, fond par défaut : pétrole très clair). Ordre, suppression :
 * outils natifs des blocs enfants (flèches gauche / droite, glisser-déposer, vue
 * en liste), avec leur animation.
 *
 * Ancienne version (attribut `members`, sans blocs enfants) : migrée par
 * l'entrée `deprecated`.
 *
 * Canvas, bloc en cours d'édition : bouton « Ajouter un membre » sous les
 * cartes (hors de la grille) (carte vide, choix du contact dans la carte). Sans membre, le front ne
 * rend pas le bloc.
 */
import { createBlock, registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	InspectorControls,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { Button, ComboboxControl, ExternalLink, PanelBody } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { plus } from '../_shared/icons.js';
import { CONTACTS_URL, MEMBER, contactOptions } from './members.js';
import metadata from './block.json';

function Edit( { clientId, isSelected } ) {
	const { members, isEditing } = useSelect(
		( select ) => {
			const store = select( blockEditorStore );
			return {
				members: store.getBlocks( clientId ),
				isEditing: isSelected || store.hasSelectedInnerBlock( clientId, true ),
			};
		},
		[ clientId, isSelected ]
	);
	const { insertBlock } = useDispatch( blockEditorStore );

	const add = ( value ) => {
		if ( value ) {
			insertBlock(
				createBlock( MEMBER, { contactId: Number( value ) } ),
				members.length,
				clientId,
				false
			);
		}
	};

	// Bouton du canvas : carte vide, sélectionnée (son champ de choix s'affiche).
	const addEmpty = () =>
		insertBlock( createBlock( MEMBER ), members.length, clientId, true );

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'wp-block-couturier-team__track', role: 'list' },
		{
			allowedBlocks: [ MEMBER ],
			orientation: 'horizontal',
			renderAppender: false,
		}
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Membres de l\'équipe', 'couturier' ) }>
					<ComboboxControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Ajouter un membre', 'couturier' ) }
						value={ null }
						options={ contactOptions( members.map( ( block ) => block.attributes.contactId ) ) }
						onChange={ add }
						help={ __( 'Recherche parmi les contacts publiés qui ont un nom affiché. Pour réordonner ou retirer une carte, sélectionnez-la.', 'couturier' ) }
					/>
					<p>
						<ExternalLink href={ CONTACTS_URL }>{ __( 'Gérer les contacts', 'couturier' ) }</ExternalLink>
					</p>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<ul { ...innerBlocksProps } />
				{ isEditing && (
					<Button __next40pxDefaultSize variant="secondary" icon={ plus }
						className="wp-block-couturier-team__add" onClick={ addEmpty }>
						{ __( 'Ajouter un membre', 'couturier' ) }
					</Button>
				) }
			</div>
		</>
	);
}

/** Version 1 : membres en attribut, sans blocs enfants. */
const v1 = {
	attributes: {
		members: { type: 'array', default: [] },
	},
	supports: metadata.supports,
	isEligible: ( attributes, innerBlocks ) => !! attributes.members?.length && ! innerBlocks.length,
	migrate: ( { members } ) => [
		{},
		members.map( ( member ) => createBlock( MEMBER, { contactId: member.id, background: member.background } ) ),
	],
	save: () => null,
};

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
	deprecated: [ v1 ],
} );

// Point d'entrée JS — initialise tous les modules après chargement du DOM.
import '../scss/app.scss';
// Logo du header : émis dans dist/assets/ et résolu par le manifest
// (feature Navigation\NavigationContext).
import '../images/logo-couturier-permis.svg';
import { printCredits }    from './credits.js'
// Collapse de Bootstrap (data-api, délégué au document) : accordéon du bloc FAQ.
import 'bootstrap/js/dist/collapse';
// Bouton « Réduire » / « Lire la suite » du bloc Texte repliable.
import './collapsible-text.js';
// Repli « Plus » / « Moins » des avis du bloc Avis Google.
import './reviews.js';
// Repli « Plus » / « Moins » du texte du bloc Image et texte (desktop).
import './image-text.js';
// Flèches du bloc Cartes photo (desktop).
import './photo-cards.js';
// Onglets et points du bloc Centre et points de ramassage.
import './pickup-map.js';
// Filtre par secteur du bloc Sessions de formation.
import './sessions.js';
// Méga menu du header (desktop).
import './megaMenu.js';
// Menu mobile du header (sous xl).
import './mobileMenu.js';
// Header masqué au défilement vers le bas, réaffiché en remontant.
import './scrollHeader.js';


printCredits()
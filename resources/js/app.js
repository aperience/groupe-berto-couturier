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
// Méga menu du header (desktop).
import './megaMenu.js';
// Menu mobile du header (sous xl).
import './mobileMenu.js';


printCredits()
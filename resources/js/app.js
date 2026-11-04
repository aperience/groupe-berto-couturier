// Point d'entrée JS — initialise tous les modules après chargement du DOM.
import '../scss/app.scss';
// Logo du header : émis dans dist/assets/ et résolu par le manifest
// (feature Navigation\NavigationContext). Même fichier que le logo de connexion.
import '../images/login-logo.svg';
import { printCredits }    from './credits.js'
// Collapse de Bootstrap (data-api, délégué au document) : accordéon du bloc FAQ.
import 'bootstrap/js/dist/collapse';
// Bouton « Réduire » / « Lire la suite » du bloc Texte repliable.
import './collapsible-text.js';
// Repli « Plus » / « Moins » des avis du bloc Avis Google.
import './reviews.js';


printCredits()
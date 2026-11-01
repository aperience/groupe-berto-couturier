// Point d'entrée JS — initialise tous les modules après chargement du DOM.
import '../scss/app.scss';
import { printCredits }    from './credits.js'
// Collapse de Bootstrap (data-api, délégué au document) : accordéon du bloc FAQ.
import 'bootstrap/js/dist/collapse';
// Bouton « Réduire » / « Lire la suite » du bloc Texte repliable.
import './collapsible-text.js';
// Repli « Plus » / « Moins » des avis du bloc Avis Google.
import './reviews.js';


printCredits()
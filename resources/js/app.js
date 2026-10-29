// Point d'entrée JS — initialise tous les modules après chargement du DOM.
import '../scss/app.scss';
import { printCredits }    from './credits.js'
// Collapse de Bootstrap (data-api, délégué au document) : accordéon du bloc FAQ.
import 'bootstrap/js/dist/collapse';


printCredits()
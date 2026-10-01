// Point d'entrée des e-mails : ne sert qu'à faire émettre par Vite les images des
// gabarits d'e-mail (resources/views/emails/) dans dist/assets/, résolues ensuite par
// `Features\Mail\HtmlEmails` via le manifest. Aucun JS n'est chargé nulle part.
import '../images/email-logo.png';

# DF Artisan - Module: Plan

PLANS 2D, de masse, de maison. Avec spécialité pour électricien — module de plans de DF artisan, en version autonome
========================================================================
Pour les plus pressés de tester voici le lien pour utiliser le logiciel: https://zoliaaz.github.io/DF-Artisan-Module-Plan/

Tout d'abord, je ne suis pas développeur, j'ai fait ce logiciel avec l'IA Claude, cependant j'ai passé environ 15h dessus. 
Je suis électricien, et ce module est fait avant tout pour répondre à mes besoins, mais il doit pouvoir dépanner d'autres personnes.
Si vous faites un retour de bug ou autre, je ne pourrais pas forcément répondre rapidement et encore moins corriger ou rajouté une fonction rapidement. Car le logiciel étant complexe il faut un abonnement à l'ia pour qu'elle corrige les choses.
Si c'est lié aux symboles, ça doit pouvoir se corriger facilement, car actuellement ils ne sont pas forcément tous bien.

Le module a été pensé pour que les plans et l'implantation électrique puisse se faire sur tablette avec le doigt. Mais cela se fait très bien à la souris, il y a plein de manière de faire la même chose pour s'adapter à notre humeur du moment.

Plans d'implantation électrique en 2D :
-Murs, portes, fenêtres (le tout traçables au doigt sur tablette)
-Image de fond avec reconnaissance des murs (pas parfait mais ça peut aider)
-Quelque simple élément mobilier/sanitaire.
-Étage possible

Partie électrique: 
-Implantation d'appareillage (prise, bouton etc) 
-Liaisons entre bouton et lumières
-Plan de pieuvre (gaines avec leur conducteur) + Registre des gaines avec un calcul des longueurs (attention pas 100% précis)
-Plan de moulure (avec leur conducteur) + Registre des gaines avec un calcul des longueurs et des différents angles (attention pas 100% précis)
-Attribution des disjoncteurs aux différents appareillages

Gratuit, sans installation, sur PC comme sur tablette, même hors connexion.

Module issu de DF artisan, logiciel de devis et factures spécialisé dans le bâtiment, EN COURS DE
DÉVELOPPEMENT : il peut comporter des erreurs, vérifiez toujours vos plans.
- Alertes NF C 15-100 : désactivées au départ ; à activer dans ⚙ Options du plan > Circuits. C'est une
  aide pour électricien averti : elles peuvent être fausses ou incomplètes et ne remplacent ni la norme
  ni la vérification sur place.
- Licence : la même que DF artisan (LICENCE.txt) : gratuit, modifiable, mais vente du logiciel interdite, même modifié.

UTILISER
- En ligne : ouvrez l'adresse de la page dans Chrome, Edge ou Firefox. Sur une tablette, menu du
  navigateur > « Installer l'application » / « Ajouter à l'écran d'accueil » : elle s'ouvre
  ensuite comme une application, même sans internet.
- Sans internet ni serveur : dézippez le dossier et double-cliquez sur index.html. Tout marche, sauf un
  fond de plan en PDF (le navigateur l'interdit dans ce cas : utilisez une image, photo ou capture) et
  l'installation comme application. Gardez toujours le dossier au même endroit : les plans sont
  rattachés à l'adresse de la page dans le navigateur.

VOS PLANS
- Ils sont gardés dans le navigateur, sur cet appareil (pas sur internet, pas d'un appareil à
  l'autre). Effacer les données du site les efface aussi.
- « 💾 Enregistrer mes plans (fichier) » : tous vos plans dans un fichier .plans.json, à garder
  comme sauvegarde ou à ouvrir sur un autre appareil avec « 📂 Ouvrir un fichier de plans ».

AVEC DF ARTISAN
- Dans DF artisan, liste des plans : « 💾 Exporter pour la tablette… » crée un fichier de plans (avec vos
  options et symboles importés), à ouvrir ici avec « 📂 Ouvrir un fichier de plans ».
- Au retour : ici « 💾 Enregistrer mes plans (fichier) », puis dans DF artisan « 📂 Importer un fichier de
  plans… » : les plans venus de DF artisan sont mis à jour (en copie s'ils y ont aussi changé), ceux faits
  ici sont ajoutés.

DIFFÉRENCES AVEC DF ARTISAN
Pas de clients, devis ni factures ; pas d'accès tablette par le réseau (inutile : la page s'ouvre
directement sur la tablette). L'impression passe par celle du navigateur (« Enregistrer au format
PDF » pour un PDF).

Licence : voir LICENCE.txt (gratuit, toute vente ou exploitation commerciale du logiciel interdite).

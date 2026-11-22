/* =====================================================================
   MODULE « ÉLECTRICIEN » : plans d'implantation électrique
   (activé dans Paramètres > Général > Module électricien ; menu « Plans » à gauche)
   - murs (angles droits automatiques, aimantation aux extrémités et à la grille, longueur tapée au clavier),
     portes (largeur, sens, côté des charnières) et fenêtres posées sur les murs ;
   - appareillages (symboles français) aimantés aux murs ou alignés entre eux ; textes (noms des pièces) ;
   - liaisons interrupteur -> lumières ; circuits (disjoncteurs) en couleur, avec le nombre de départs ;
   - plan rattaché à un client, à un devis et à une adresse ; impression avec légende ;
   - souris, clavier, et tablette (doigts : pincer pour zoomer, deux doigts pour déplacer).
   Unités du dessin : centimètres. Le plan est enregistré tout seul (/api/plans).
   ===================================================================== */
const SYMBOLES = [
  // [type, libellé, catégorie, pose (mur | plafond | libre), dessin SVG centré sur 0 (carré -20..20), demi-épaisseur côté mur]
  // Symboles NF C 15-100 / NF EN 60617 redessinés par CalculPro (https://calculpro.fr/outils/electricite),
  // utilisation libre (voir web/symboles/LISEZMOI.txt) ; quelques symboles maison (TV, 32 A, spot, volet…).
  [
    "prise",
    "Prise 16 A (2P+T)",
    "Prises",
    "mur",
    '<g transform="rotate(180) scale(0.4) translate(-50 -51)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 71 83 A 21 21 0 0 0 29 83"></path><line x1="50" y1="62" x2="50" y2="19"></line><line x1="29" y1="62" x2="71" y2="62"></line></g>',
    12.8,
  ],
  [
    "prise2",
    "Prise multiple",
    "Prises",
    "mur",
    '<g transform="rotate(180) scale(0.4) translate(-58.3738 -51)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 71 83 A 21 21 0 0 0 29 83"></path><line x1="50" y1="62" x2="50" y2="19"></line><line x1="58" y1="75" x2="76" y2="57"></line><text fill="currentColor" stroke="none" font-family="Arial, sans-serif" x="84" y="48" font-size="15" text-anchor="middle" dominant-baseline="central">3</text></g>',
    12.8,
  ],
  [
    "prise_cmd",
    "Prise commandée",
    "Prises",
    "mur",
    '<g transform="rotate(180) scale(0.4) translate(-53.63 -51)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 71 83 A 21 21 0 0 0 29 83"></path><line x1="50" y1="62" x2="50" y2="19"></line><line x1="50" y1="62" x2="67" y2="32.56"></line><line x1="67" y1="32.56" x2="78.26" y2="39.06"></line><line x1="62" y1="41.22" x2="73.26" y2="47.72"></line></g>',
    12.8,
  ],
  [
    "prise_etanche",
    "Prise étanche",
    "Prises",
    "mur",
    '<g transform="rotate(180) scale(0.4) translate(-54.3738 -51)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 71 83 A 21 21 0 0 0 29 83"></path><line x1="50" y1="62" x2="50" y2="19"></line><text fill="currentColor" stroke="none" font-family="Arial, sans-serif" x="76" y="44" font-size="15" text-anchor="middle" dominant-baseline="central">h</text></g>',
    12.8,
  ],
  [
    "prise32",
    "Prise 32 A (cuisson)",
    "Prises",
    "mur",
    '<path d="M-12 6 A12 12 0 0 1 12 6" fill="none"/><line x1="-14" y1="6" x2="14" y2="6"/><text x="0" y="2" font-size="9" text-anchor="middle" stroke="none">32</text>',
    12,
  ],
  [
    "sortie",
    "Sortie de câble",
    "Prises",
    "mur",
    '<g transform="rotate(0) scale(0.4) translate(-51.5 -58.5)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 71 83 A 21 21 0 0 0 29 83"></path><line x1="50" y1="62" x2="50" y2="34"></line><line x1="50" y1="34" x2="74" y2="34"></line></g>',
    9.8,
  ],
  [
    "ligne_directe",
    "Ligne directe / sortie de câble (éclair)",
    "Prises",
    "mur",
    '<g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="miter"><polyline points="-0.3,18.6 9,-0.8 -9.2,-0.8 -1.6,-15.4"></polyline><polygon points="-3.9,-17.4 0.9,-18.9 1,-15.2" fill="currentColor"></polygon><circle cx="-0.3" cy="18.4" r="1.7" fill="currentColor"></circle></g>',
    19,
  ],
  [
    "boite",
    "Boîte de dérivation",
    "Prises",
    "libre",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="50" r="18"></circle><circle cx="50" cy="50" r="6" fill="currentColor" stroke="none"></circle></g>',
    7.2,
  ],
  [
    "rj45",
    "Prise RJ45",
    "Communication",
    "mur",
    '<g transform="rotate(180) scale(0.4) translate(-46 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="16" y1="50" x2="44" y2="50"></line><line x1="44" y1="76" x2="44" y2="24"></line><line x1="44" y1="24" x2="76" y2="24"></line><line x1="44" y1="76" x2="76" y2="76"></line></g>',
    10.4,
  ],
  [
    "tv",
    "Prise TV",
    "Communication",
    "mur",
    '<path d="M-12 6 A12 12 0 0 1 12 6" fill="none"/><line x1="-14" y1="6" x2="14" y2="6"/><text x="0" y="2" font-size="8" text-anchor="middle" stroke="none">TV</text>',
    12,
  ],
  [
    "inter",
    "Interrupteur simple",
    "Commandes",
    "mur",
    '<g transform="rotate(0) scale(0.4) translate(-48.25 -49.88)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="44" cy="62" r="13"></circle><line x1="50.5" y1="50.74" x2="65.5" y2="24.76"></line></g>',
    10.0,
  ],
  [
    "inter_va",
    "Va-et-vient",
    "Commandes",
    "mur",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="50" r="13"></circle><line x1="56.5" y1="38.74" x2="71.5" y2="12.76"></line><line x1="71.5" y1="12.76" x2="84.49" y2="20.26"></line><line x1="43.5" y1="61.26" x2="28.5" y2="87.24"></line><line x1="28.5" y1="87.24" x2="15.51" y2="79.74"></line></g>',
    14.9,
  ],
  [
    "inter_double",
    "Double allumage",
    "Commandes",
    "mur",
    '<g transform="rotate(0) scale(0.4) translate(-50 -59.88)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="72" r="13"></circle><line x1="56.5" y1="60.74" x2="71.5" y2="34.76"></line><line x1="71.5" y1="34.76" x2="84.49" y2="42.26"></line><line x1="43.5" y1="60.74" x2="28.5" y2="34.76"></line><line x1="28.5" y1="34.76" x2="15.51" y2="42.26"></line></g>',
    10.0,
  ],
  [
    "inter_temoin",
    "Interrupteur à voyant",
    "Commandes",
    "mur",
    '<g transform="rotate(0) scale(0.4) translate(-48.25 -49.88)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="44" cy="62" r="13"></circle><line x1="34.77" y1="71.23" x2="53.23" y2="52.77"></line><line x1="34.77" y1="52.77" x2="53.23" y2="71.23"></line><line x1="50.5" y1="50.74" x2="65.5" y2="24.76"></line></g>',
    10.0,
  ],
  [
    "poussoir",
    "Bouton poussoir",
    "Commandes",
    "mur",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="50" r="22"></circle><circle cx="50" cy="50" r="9"></circle></g>',
    8.8,
  ],
  [
    "poussoir_temoin",
    "Poussoir à voyant",
    "Commandes",
    "mur",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="50" r="22"></circle><circle cx="50" cy="50" r="10"></circle><line x1="43" y1="57" x2="57" y2="43"></line><line x1="43" y1="43" x2="57" y2="57"></line></g>',
    8.8,
  ],
  [
    "variateur",
    "Variateur",
    "Commandes",
    "mur",
    '<g transform="rotate(0) scale(0.4) translate(-55 -49.88)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="44" cy="62" r="13"></circle><line x1="50.5" y1="50.74" x2="65.5" y2="24.76"></line><polygon points="57,39 79,48 79,26"></polygon></g>',
    10.0,
  ],
  [
    "cmd_volet",
    "Commande de volet roulant",
    "Commandes",
    "mur",
    '<circle cx="0" cy="0" r="6" fill="none"/><path d="M-3 -1 L0 -4 L3 -1 M-3 1 L0 4 L3 1" fill="none"/>',
    12,
  ],
  [
    "detecteur",
    "Détecteur de mouvement",
    "Commandes",
    "plafond",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="30,86 70,86 70,14 30,14"></polygon><line x1="30" y1="68" x2="70" y2="68"></line><path d="M 44.28 54.26 A 16 16 0 0 0 44.28 29.74"></path><path d="M 52.28 54.26 A 16 16 0 0 0 52.28 29.74"></path><line x1="50" y1="82" x2="50" y2="72"></line><line x1="45.65" y1="79.5" x2="54.35" y2="74.5"></line><line x1="45.65" y1="74.5" x2="54.35" y2="79.5"></line></g>',
    14.4,
  ],
  [
    "thermostat",
    "Thermostat",
    "Commandes",
    "mur",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="9,63 91,63 91,37 9,37"></polygon><circle cx="50" cy="50" r="11"></circle><line x1="39" y1="50" x2="61" y2="50"></line></g>',
    5.2,
  ],
  [
    "dcl",
    "Point lumineux (DCL)",
    "Éclairage",
    "plafond",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="50" r="22"></circle><line x1="37" y1="63" x2="63" y2="37"></line><line x1="37" y1="37" x2="63" y2="63"></line></g>',
    8.8,
  ],
  [
    "point",
    "Point lumineux",
    "Éclairage",
    "plafond",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="34" y1="66" x2="66" y2="34"></line><line x1="34" y1="34" x2="66" y2="66"></line></g>',
    6.4,
  ],
  [
    "applique",
    "Applique",
    "Éclairage",
    "mur",
    '<path d="M-11 5 A11 11 0 0 1 11 5 Z" fill="none"/><line x1="-5.5" y1="-4" x2="5.5" y2="3"/><line x1="-5.5" y1="3" x2="5.5" y2="-4"/>',
    5,
  ],
  ["spot", "Spot encastré", "Éclairage", "plafond", '<circle cx="0" cy="0" r="6" fill="none"/><circle cx="0" cy="0" r="2"/>', 12],
  [
    "reglette",
    "Réglette / tube",
    "Éclairage",
    "libre",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="15" y1="50" x2="85" y2="50"></line><line x1="15" y1="62" x2="15" y2="38"></line><line x1="85" y1="62" x2="85" y2="38"></line></g>',
    4.8,
  ],
  [
    "projecteur",
    "Projecteur",
    "Éclairage",
    "mur",
    '<g transform="rotate(0) scale(0.4) translate(-41.0075 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 62.01 29.51 A 26 26 0 1 0 62.01 70.49"></path><circle cx="46" cy="50" r="14"></circle><line x1="36" y1="60" x2="56" y2="40"></line><line x1="36" y1="40" x2="56" y2="60"></line></g>',
    10.4,
  ],
  [
    "exterieur",
    "Éclairage extérieur",
    "Éclairage",
    "mur",
    '<circle cx="0" cy="0" r="8" fill="none"/><line x1="-5.6" y1="-5.6" x2="5.6" y2="5.6"/><line x1="-5.6" y1="5.6" x2="5.6" y2="-5.6"/><circle cx="0" cy="0" r="12" fill="none" stroke-dasharray="3 2"/>',
    12,
  ],
  [
    "baes",
    "Bloc de secours (BAES)",
    "Éclairage",
    "mur",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="26,74 74,74 74,26 26,26"></polygon><line x1="32" y1="68" x2="68" y2="32"></line><line x1="32" y1="32" x2="68" y2="68"></line><circle cx="50" cy="50" r="6" fill="currentColor" stroke="none"></circle></g>',
    9.6,
  ],
  [
    "radiateur",
    "Radiateur",
    "Chauffage",
    "mur",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="26,70 74,70 74,30 26,30"></polygon><line x1="32" y1="70" x2="32" y2="30"></line><line x1="38" y1="70" x2="38" y2="30"></line><line x1="44" y1="70" x2="44" y2="30"></line><line x1="50" y1="70" x2="50" y2="30"></line><line x1="56" y1="70" x2="56" y2="30"></line><line x1="62" y1="70" x2="62" y2="30"></line><line x1="68" y1="70" x2="68" y2="30"></line></g>',
    8.0,
  ],
  [
    "seche_serviettes",
    "Sèche-serviettes",
    "Chauffage",
    "mur",
    '<rect x="-10" y="-12" width="20" height="24" fill="none"/><line x1="-10" y1="-4" x2="10" y2="-4"/><line x1="-10" y1="4" x2="10" y2="4"/>',
    12,
  ],
  [
    "clim_int",
    "Climatisation : split intérieur",
    "Chauffage",
    "mur",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="8,68 92,68 92,32 8,32"></polygon><line x1="14" y1="61" x2="86" y2="61"></line><text fill="currentColor" stroke="none" font-family="Arial, sans-serif" x="50" y="47" font-size="17" font-weight="700" text-anchor="middle" dominant-baseline="central">CLIM</text></g>',
    7.2,
  ],
  [
    "clim_ext",
    "Climatisation : groupe extérieur",
    "Chauffage",
    "libre",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="18,76 82,76 82,24 18,24"></polygon><circle cx="44" cy="50" r="17"></circle><line x1="44" y1="50" x2="44" y2="36"></line><line x1="44" y1="50" x2="56" y2="57"></line><line x1="44" y1="50" x2="32" y2="57"></line><line x1="70" y1="32" x2="70" y2="68"></line><line x1="76" y1="32" x2="76" y2="68"></line></g>',
    10.4,
  ],
  [
    "chauffe_eau",
    "Chauffe-eau",
    "Chauffage",
    "libre",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="50" r="24"></circle><line x1="32" y1="65.87" x2="32" y2="34.13"></line><line x1="38" y1="70.78" x2="38" y2="29.22"></line><line x1="44" y1="73.24" x2="44" y2="26.76"></line><line x1="50" y1="74" x2="50" y2="26"></line><line x1="56" y1="73.24" x2="56" y2="26.76"></line><line x1="62" y1="70.78" x2="62" y2="29.22"></line><line x1="68" y1="65.87" x2="68" y2="34.13"></line></g>',
    9.6,
  ],
  [
    "lave_linge",
    "Lave-linge",
    "Appareils",
    "libre",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="25,75 75,75 75,25 25,25"></polygon><circle cx="50" cy="50" r="16"></circle><circle cx="50" cy="50" r="5" fill="currentColor" stroke="none"></circle></g>',
    10.0,
  ],
  [
    "seche_linge",
    "Sèche-linge",
    "Appareils",
    "libre",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="25,75 75,75 75,25 25,25"></polygon><circle cx="43" cy="40" r="7"></circle><circle cx="57" cy="40" r="7"></circle><circle cx="50" cy="60" r="5" fill="currentColor" stroke="none"></circle></g>',
    10.0,
  ],
  [
    "lave_vaisselle",
    "Lave-vaisselle",
    "Appareils",
    "libre",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="25,75 75,75 75,25 25,25"></polygon><line x1="25" y1="75" x2="75" y2="25"></line><line x1="25" y1="25" x2="75" y2="75"></line><circle cx="50" cy="50" r="10"></circle></g>',
    10.0,
  ],
  [
    "cuisiniere",
    "Plaque / cuisinière",
    "Appareils",
    "libre",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="25,75 75,75 75,25 25,25"></polygon><circle cx="38" cy="38" r="5" fill="currentColor" stroke="none"></circle><circle cx="62" cy="38" r="5" fill="currentColor" stroke="none"></circle><circle cx="62" cy="62" r="5" fill="currentColor" stroke="none"></circle></g>',
    10.0,
  ],
  [
    "four",
    "Four",
    "Appareils",
    "libre",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="25,75 75,75 75,25 25,25"></polygon><line x1="25" y1="32" x2="75" y2="32"></line><circle cx="50" cy="54" r="6" fill="currentColor" stroke="none"></circle></g>',
    10.0,
  ],
  [
    "micro_ondes",
    "Micro-ondes",
    "Appareils",
    "libre",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="25,75 75,75 75,25 25,25"></polygon><path d="M 50 38 A 5 5 0 0 0 40 38"></path><path d="M 50 38 A 5 5 0 0 0 60 38"></path><path d="M 50 50 A 5 5 0 0 0 40 50"></path><path d="M 50 50 A 5 5 0 0 0 60 50"></path><path d="M 50 62 A 5 5 0 0 0 40 62"></path><path d="M 50 62 A 5 5 0 0 0 60 62"></path></g>',
    10.0,
  ],
  [
    "refrigerateur",
    "Réfrigérateur",
    "Appareils",
    "libre",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="25,75 75,75 75,25 25,25"></polygon><line x1="50" y1="66" x2="50" y2="34"></line><line x1="36.08" y1="58" x2="63.92" y2="42"></line><line x1="36.08" y1="42" x2="63.92" y2="58"></line></g>',
    10.0,
  ],
  [
    "congelateur",
    "Congélateur",
    "Appareils",
    "libre",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="18,68 82,68 82,32 18,32"></polygon><line x1="33" y1="58" x2="33" y2="42"></line><line x1="26.04" y1="54" x2="39.96" y2="46"></line><line x1="26.04" y1="46" x2="39.96" y2="54"></line><line x1="50" y1="58" x2="50" y2="42"></line><line x1="43.04" y1="54" x2="56.96" y2="46"></line><line x1="43.04" y1="46" x2="56.96" y2="54"></line><line x1="67" y1="58" x2="67" y2="42"></line><line x1="60.04" y1="54" x2="73.96" y2="46"></line><line x1="60.04" y1="46" x2="73.96" y2="54"></line></g>',
    7.2,
  ],
  [
    "borne_ve",
    "Borne de recharge VE",
    "Appareils",
    "mur",
    '<g transform="rotate(0) scale(0.4) translate(-51.5 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="26,88 66,88 66,80 26,80"></polygon><polygon points="30,80 62,80 62,12 30,12"></polygon><polygon points="34,26 58,26 58,14 34,14"></polygon><line x1="46" y1="66" x2="46" y2="32"></line><text fill="currentColor" stroke="none" font-family="Arial, sans-serif" x="40" y="38" font-size="11" text-anchor="middle" dominant-baseline="central">V</text><text fill="currentColor" stroke="none" font-family="Arial, sans-serif" x="40" y="54" font-size="11" text-anchor="middle" dominant-baseline="central">E</text><text fill="currentColor" stroke="none" font-family="Arial, sans-serif" x="53" y="38" font-size="11" text-anchor="middle" dominant-baseline="central">E</text><text fill="currentColor" stroke="none" font-family="Arial, sans-serif" x="53" y="54" font-size="11" text-anchor="middle" dominant-baseline="central">V</text><line x1="68" y1="76" x2="68" y2="34"></line><line x1="74" y1="76" x2="74" y2="34"></line><line x1="68" y1="76" x2="74" y2="76"></line><polygon points="69,30 77,30 77,14 69,14" fill="currentColor" stroke="none"></polygon></g>',
    15.2,
  ],
  [
    "vmc",
    "VMC / extracteur",
    "Divers",
    "plafond",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="25,75 75,75 75,25 25,25"></polygon><circle cx="41" cy="50" r="10"></circle><circle cx="59" cy="50" r="10"></circle></g>',
    10.0,
  ],
  [
    "daaf",
    "Détecteur de fumée",
    "Divers",
    "plafond",
    '<circle cx="0" cy="0" r="9" fill="none"/><text x="0" y="3.5" font-size="9" text-anchor="middle" stroke="none">F</text>',
    12,
  ],
  [
    "sonnette",
    "Sonnerie",
    "Divers",
    "mur",
    '<g transform="rotate(0) scale(0.4) translate(-42 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="16" y1="50" x2="44" y2="50"></line><line x1="44" y1="74" x2="44" y2="26"></line><path d="M 44 74 A 24 24 0 0 0 44 26"></path></g>',
    9.6,
  ],
  [
    "volet",
    "Volet roulant (moteur)",
    "Divers",
    "mur",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="50" r="22"></circle><text fill="currentColor" stroke="none" font-family="Arial, sans-serif" x="50" y="50" font-size="20" text-anchor="middle" dominant-baseline="central">M</text></g>',
    8.8,
  ],
  [
    "tableau",
    "Tableau électrique",
    "Divers",
    "mur",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="10,64 90,64 90,36 10,36"></polygon><line x1="10" y1="36" x2="90" y2="64"></line><line x1="10" y1="64" x2="90" y2="36"></line></g>',
    5.6,
  ],
  [
    "traversee",
    "Traversée de plancher / arrivée des combles",
    "Divers",
    "libre",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="50" r="18"></circle><line x1="50" y1="38" x2="50" y2="62"></line><polyline points="43,45 50,38 57,45"></polyline><polyline points="43,55 50,62 57,55"></polyline></g>',
    7.2,
  ],
  [
    "compteur",
    "Compteur",
    "Divers",
    "mur",
    '<g transform="rotate(0) scale(0.4) translate(-50 -50)" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="24,68 76,68 76,32 24,32"></polygon><text fill="currentColor" stroke="none" font-family="Arial, sans-serif" x="50" y="50" font-size="15" text-anchor="middle" dominant-baseline="central">kWh</text></g>',
    7.2,
  ],
];
// repères : un cercle avec des lettres (habitude courante sur les plans : LL, LV, 32A, four, VMC, RJ45…)
const REPERES = [
  ["rep_ll", "LL", "Lave-linge", "mur"],
  ["rep_lv", "LV", "Lave-vaisselle", "mur"],
  ["rep_sl", "SL", "Sèche-linge", "mur"],
  ["rep_32a", "32A", "Cuisson 32 A", "mur"],
  ["rep_four", "four", "Four", "mur"],
  ["rep_mo", "MO", "Micro-ondes", "mur"],
  ["rep_frigo", "frigo", "Réfrigérateur", "mur"],
  ["rep_ce", "CE", "Chauffe-eau", "mur"],
  ["rep_vmc", "VMC", "VMC", "plafond"],
  ["rep_rj45", "RJ45", "Prise RJ45", "mur"],
  ["rep_tv", "TV", "Prise TV", "mur"],
  ["rep_libre", "?", "Cercle + texte libre…", "mur"],
];
function dessinRepere(texte, rect) {
  if (rect) {
    // (rectangle + texte libre : un élément qui n'est pas dans la liste — pompe, portail, spa… —, relié comme un appareil)
    const t = String(texte || "").slice(0, 12),
      fs = t.length <= 4 ? 8 : t.length <= 7 ? 6.5 : 5.2,
      w = Math.max(13, t.length * fs * 0.32 + 4);
    return `<rect x="${(-w).toFixed(1)}" y="-9" width="${(2 * w).toFixed(1)}" height="18" rx="1" fill="none"/><text x="0" y="${(fs * 0.36).toFixed(1)}" font-size="${fs}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" stroke="none" fill="currentColor">${t.replace(/[<&]/g, "")}</text>`;
  }
  const t = String(texte || "").slice(0, 6),
    fs = t.length <= 2 ? 11 : t.length <= 3 ? 9 : t.length <= 4 ? 7.5 : 6;
  return `<circle cx="0" cy="0" r="13" fill="none"/><text x="0" y="${(fs * 0.36).toFixed(1)}" font-size="${fs}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" stroke="none" fill="currentColor">${t.replace(/[<&]/g, "")}</text>`;
}
// (rangés avec les appareils qu'ils remplacent : un repère rond LL est un lave-linge comme le symbole carré)
const CAT_REPERE = { rep_ce: "Chauffage", rep_vmc: "Divers", rep_rj45: "Communication", rep_tv: "Communication", rep_libre: "Divers" };
REPERES.forEach(([t, txt, lib, pose]) =>
  SYMBOLES.push([t, (t === "rep_libre" ? "" : txt + " – ") + lib, CAT_REPERE[t] || "Appareils", pose, dessinRepere(txt), 13])
);
// (rectangle + texte libre : comme le cercle, pour un élément qui n'a pas de symbole ; se relie à une gaine)
SYMBOLES.push(["rep_rect", "Rectangle + texte libre…", "Divers", "mur", dessinRepere("?", true), 13]);
/** clé d'un appareil pour le matériel et la légende : un repère (cercle ou rectangle) compte par son texte */
const cleMateriel = o =>
  o.type === "rep_rect"
    ? "rect:" + (o.texte || "?")
    : o.type === "rep_libre" || (o.texte !== undefined && o.type.startsWith("rep_"))
      ? "rep:" + (o.texte || "?")
      : o.type;
const libMateriel = t =>
  SYMB[t] ? SYMB[t].libelle : t.startsWith("rep:") ? "Repère « " + t.slice(4) + " »" : t.startsWith("rect:") ? "« " + t.slice(5) + " »" : t;
/* sanitaires et mobilier : pour voir l'usage de la pièce et placer l'appareillage ; ne comptent nulle part (ni circuit, ni
 * matériel, ni devis, ni tableau, ni gaine). Dessinés dans un carré -20…20 (le dos contre le mur en bas), posés à leur
 * taille réelle (DECOR_TAILLE, largeur × profondeur en cm), réglable dans le panneau. */
const TRAIT_DECOR = 'fill="none" stroke-width="0.8" vector-effect="non-scaling-stroke"';
const DECOR = [
  [
    "douche",
    "Douche",
    `<g ${TRAIT_DECOR}><rect x="-20" y="-20" width="40" height="40"/><line x1="-20" y1="-20" x2="20" y2="20"/><line x1="20" y1="-20" x2="-20" y2="20"/><circle cx="0" cy="0" r="2.5"/></g>`,
  ],
  [
    "baignoire",
    "Baignoire",
    `<g ${TRAIT_DECOR}><rect x="-20" y="-20" width="40" height="40"/><rect x="-17" y="-16" width="34" height="32" rx="9"/><circle cx="-12" cy="0" r="1.6"/></g>`,
  ],
  [
    "wc",
    "WC",
    `<g ${TRAIT_DECOR}><rect x="-12" y="11" width="24" height="9" rx="1.5"/><ellipse cx="0" cy="-3" rx="10" ry="14"/><ellipse cx="0" cy="-4" rx="6.5" ry="9.5"/></g>`,
  ],
  [
    "lavabo",
    "Lavabo, vasque",
    `<g ${TRAIT_DECOR}><rect x="-20" y="-20" width="40" height="40" rx="3"/><ellipse cx="0" cy="-3" rx="14" ry="12"/><circle cx="0" cy="14" r="1.6"/></g>`,
  ],
  [
    "evier",
    "Évier",
    `<g ${TRAIT_DECOR}><rect x="-20" y="-20" width="40" height="40"/><rect x="-17" y="-15" width="15" height="26" rx="2"/><rect x="2" y="-15" width="15" height="26" rx="2"/><circle cx="0" cy="15" r="1.6"/></g>`,
  ],
  [
    "lit1",
    "Lit 1 place",
    `<g ${TRAIT_DECOR}><rect x="-20" y="-20" width="40" height="40" rx="1"/><rect x="-15" y="11" width="30" height="6" rx="2"/><line x1="-20" y1="6" x2="20" y2="6"/></g>`,
  ],
  [
    "lit2",
    "Lit 2 places",
    `<g ${TRAIT_DECOR}><rect x="-20" y="-20" width="40" height="40" rx="1"/><rect x="-17" y="11" width="15" height="6" rx="2"/><rect x="2" y="11" width="15" height="6" rx="2"/><line x1="-20" y1="6" x2="20" y2="6"/></g>`,
  ],
];
const DECOR_TAILLE = {
  douche: [90, 90],
  baignoire: [170, 70],
  wc: [38, 65],
  lavabo: [60, 45],
  evier: [120, 60],
  lit1: [90, 190],
  lit2: [140, 190],
};
const CAT_DECOR = "Sanitaires et mobilier";
DECOR.forEach(([t, lib, dessin]) => SYMBOLES.push([t, lib, CAT_DECOR, "mur", dessin, 20]));
const estDecor = o => !!(o && DECOR_TAILLE[o.type]);
// courant faible : en vert tant qu'il n'est sur aucun circuit
const COURANT_FAIBLE = ["rj45", "tv", "rep_rj45", "rep_tv", "sonnette"];
const SYMB = Object.fromEntries(
  SYMBOLES.map(([t, l, c, p, d, prof]) => [t, { type: t, libelle: l, categorie: c, pose: p, dessin: d, prof: prof || 12 }])
);
const COMMANDES = ["inter", "inter_va", "inter_double", "inter_temoin", "poussoir", "poussoir_temoin", "variateur", "detecteur"];
const LUMIERES = ["dcl", "point", "applique", "spot", "reglette", "exterieur", "projecteur", "prise_cmd"];
const PRISES = ["prise", "prise2", "prise_cmd", "prise_etanche"];
const MASQUES = ["prise_etanche", "prise_cmd"]; // (prise commandée : une prise reliée à une commande l'est déjà)
// symboles avec un texte libre à côté (ex. « 32 A », « VMC »)
const AVEC_TEXTE = ["ligne_directe"]; // retirés de la liste (encore dessinés sur les anciens plans)
// raccourcis clavier : outils, et symboles les plus posés
const TOUCHES_OUTILS = {
  w: "roue",
  v: "selection",
  m: "mur",
  e: "rectangle",
  h: "main",
  x: "gomme",
  p: "porte",
  f: "fenetre",
  l: "liaison",
  t: "texte",
  s: "piece",
  u: "gaine",
};
const TOUCHES_SYMBOLES = { c: "prise", i: "inter", d: "dcl", a: "applique" };
/* ---- gaines (plan de pieuvre) : d'une boîte (ou du tableau) à un appareil, ou d'une boîte à l'autre ----
 * À ne pas confondre avec les liaisons (quelle commande allume quoi) : la gaine suit le chemin réel des fils.
 * Fils dessinés en traits obliques de couleur sur la gaine, un lot par appareil (ou par circuit entre deux boîtes),
 * séparés par un espace ; section et repère (SA, PC…) à côté, au choix (⚙ Options). */
const FILS = {
  P: ["Phase", "#b91c1c"],
  N: ["Neutre", "#2563eb"],
  T: ["Terre", "#16a34a"],
  R: ["Retour (phase commandée)", "#ea580c"],
  V: ["Navette", "#7c3aed"],
  FP: ["Fil pilote", "#111827"],
  C: ["Câble courant faible", "#6b7280"],
  F: ["Fil", "#111827"],
};
const NOEUDS_GAINE = ["boite", "tableau", "traversee"];
/** les 9 couleurs de fil en 1,5 mm² (le blanc est dessiné en rose fuchsia pour se voir sur le papier) */
const COULEURS_FIL = {
  rouge: ["Rouge", "#dc2626"],
  bleu: ["Bleu", "#2563eb"],
  vj: ["Vert/jaune", "#16a34a"],
  violet: ["Violet", "#7c3aed"],
  orange: ["Orange", "#f97316"],
  gris: ["Gris", "#6b7280"],
  marron: ["Marron", "#7c4a1e"],
  noir: ["Noir", "#111827"],
  blanc: ["Blanc", "#ec4899"],
};
/** couleur d'origine de chaque fonction (⚙ Options > Gaines pour la changer) */
const COULEUR_FONCTION = { P: "rouge", N: "bleu", T: "vj", R: "orange", V: "violet", FP: "noir", C: "gris", F: "noir" };
/** lettres des couleurs, pour taper les fils d'une gaine par leur couleur (⚙ Options > Gaines : lettres des fils) */
const CODES_COULEUR = { rouge: "R", bleu: "B", vj: "VJ", violet: "V", orange: "O", gris: "G", marron: "M", noir: "N", blanc: "BLC" };
/** fonction donnée à un fil tapé par sa couleur (le reste : « fil ») */
const FONCTION_COULEUR = { rouge: "P", bleu: "N", vj: "T" };
/** genres de chantier (ouvrages du devis différents pour chacun) */
const TYPES_CHANTIER = { neuf: "Maison neuve", renovation: "Rénovation", moulure: "Sous moulure / apparent" };
/** hauteurs et réserves (cm) pour les longueurs de gaines et de fils (⚙ Options > Hauteurs et réserves) */
const HAUTEURS = {
  plafond: 250,
  boite: 270,
  tableau: 130,
  commande: 110,
  prise: 30,
  prise_haute: 110,
  moulure_basse: 10,
  moulure_haute: 240,
  passage_porte: 215, // (moulure qui passe par-dessus une porte : au-dessus du chambranle)
  applique: 200,
  reserve_app: 20,
  reserve_boite: 50,
};
/** circuits spécialisés créés à la pose du symbole (⚙ Options > Circuits spécialisés) : type → [nom, calibre] */
const SPECIAUX = {
  lave_linge: ["Lave-linge", 20],
  rep_ll: ["Lave-linge", 20],
  seche_linge: ["Sèche-linge", 20],
  rep_sl: ["Sèche-linge", 20],
  lave_vaisselle: ["Lave-vaisselle", 20],
  rep_lv: ["Lave-vaisselle", 20],
  four: ["Four", 20],
  rep_four: ["Four", 20],
  cuisiniere: ["Plaque de cuisson", 32],
  prise32: ["Plaque de cuisson", 32],
  rep_32a: ["Plaque de cuisson", 32],
  chauffe_eau: ["Chauffe-eau", 20],
  rep_ce: ["Chauffe-eau", 20],
  vmc: ["VMC", 2],
  rep_vmc: ["VMC", 2],
  congelateur: ["Congélateur", 20],
  borne_ve: ["Borne de recharge", 32],
  micro_ondes: ["Micro-ondes", 20],
  rep_mo: ["Micro-ondes", 20],
  refrigerateur: ["Réfrigérateur", 20],
  rep_frigo: ["Réfrigérateur", 20],
};
const SPECIAUX_AUTO = [
  "lave_linge",
  "rep_ll",
  "seche_linge",
  "rep_sl",
  "lave_vaisselle",
  "rep_lv",
  "four",
  "rep_four",
  "cuisiniere",
  "prise32",
  "rep_32a",
  "chauffe_eau",
  "rep_ce",
  "vmc",
  "rep_vmc",
  "congelateur",
  "borne_ve",
];
/** fils d'une gaine qui arrive à cet appareil (section : celle du circuit si elle n'est pas donnée) */
const FILS_APPAREIL = {
  prise: "P N T",
  prise2: "P N T",
  prise_etanche: "P N T",
  prise_cmd: "R N T",
  prise32: ["P N T", "6"],
  sortie: "P N T",
  ligne_directe: "P N T",
  rj45: "C",
  tv: "C",
  rep_rj45: "C",
  rep_tv: "C",
  inter: "P R",
  inter_va: "P V V",
  inter_double: "P R R",
  inter_temoin: "P R N",
  poussoir: "P R",
  poussoir_temoin: "P R N",
  variateur: "P R",
  cmd_volet: "P R R",
  detecteur: "P R N",
  thermostat: "P N",
  sonnette: "P R",
  dcl: "R N T",
  point: "R N T",
  applique: "R N T",
  spot: "R N T",
  reglette: "R N T",
  projecteur: "R N T",
  exterieur: "R N T",
  baes: "P N",
  radiateur: ["P N T FP", "2,5"],
  seche_serviettes: ["P N T FP", "2,5"],
  chauffe_eau: ["P N T", "2,5"],
  lave_linge: ["P N T", "2,5"],
  seche_linge: ["P N T", "2,5"],
  lave_vaisselle: ["P N T", "2,5"],
  four: ["P N T", "2,5"],
  micro_ondes: ["P N T", "2,5"],
  refrigerateur: ["P N T", "2,5"],
  congelateur: ["P N T", "2,5"],
  cuisiniere: ["P N T", "6"],
  borne_ve: ["P N T", "6"],
  rep_ll: ["P N T", "2,5"],
  rep_lv: ["P N T", "2,5"],
  rep_sl: ["P N T", "2,5"],
  rep_four: ["P N T", "2,5"],
  rep_mo: ["P N T", "2,5"],
  rep_frigo: ["P N T", "2,5"],
  rep_ce: ["P N T", "2,5"],
  rep_32a: ["P N T", "6"],
  rep_vmc: ["P N T", "1,5"],
  rep_libre: "P N T",
  rep_rect: "P N T",
  clim_int: ["P N T", "1,5"],
  clim_ext: ["P N T", "2,5"],
  vmc: ["P N T", "1,5"],
  volet: "R R N T",
  daaf: "",
  tableau: "",
  compteur: "",
  boite: "",
};
/** diamètre conseillé des gaines : la section des fils (diamètre extérieur, isolant compris) ne dépasse pas une part
 *  de la section intérieure de la gaine — 1/3 quand les fils sont passés une fois la gaine posée (NF C 15-100).
 *  Valeurs réglables (⚙ Options > Diamètres des gaines) ; C : câble courant faible (RJ45, TV). */
const GAINES_INT = { 16: 10.7, 20: 14.1, 25: 18.3, 32: 24.3, 40: 31.2 }; // diamètre intérieur (mm), ICTA
/** conduits : gaine ICTA (encastré) ou moulure (apparent) ; moulures : largeur × hauteur extérieures (mm) */
const CONDUITS = { gaine: "Gaine ICTA", moulure: "Moulure", goulotte: "Goulotte" };
/** goulotte : une moulure plus grosse (même pose, collée au mur), sa propre liste de tailles et sa couleur */
const GOULOTTES_DEFAUT = "40x25, 60x40, 80x50, 100x50, 110x60";
/** tailles de moulures proposées (largeur × épaisseur, mm) ; la liste se change dans ⚙ Options > Gaines */
const MOULURES_DEFAUT = "22x12, 32x12, 32x20, 50x20, 75x20";
const dimsMoulure = k => {
  const m = /^(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)$/i.exec(String(k || "").trim());
  return m ? [parseFloat(m[1].replace(",", ".")), parseFloat(m[2].replace(",", "."))] : null;
};
const FILS_EXT = { "1,5": 3.0, "2,5": 3.6, 4: 4.2, 6: 4.8, 10: 6.1, C: 6.0 }; // diamètre extérieur des fils (mm), H07V-U
const SECTIONS_GAINE = ["1,5", "2,5", "4", "6", "10", "C"];
/** repères écrits à côté des fils (à changer dans ⚙ Options > Repères des gaines) */
const REPERES_GAINE = {
  prise: "PC",
  prise2: "PC",
  prise_etanche: "PC",
  prise_cmd: "PC",
  prise32: "32A",
  sortie: "SC",
  ligne_directe: "LD",
  rj45: "RJ",
  tv: "TV",
  inter: "SA",
  inter_va: "VV",
  inter_double: "DA",
  inter_temoin: "SA",
  poussoir: "BP",
  poussoir_temoin: "BP",
  variateur: "VAR",
  cmd_volet: "CVR",
  detecteur: "DET",
  thermostat: "TH",
  sonnette: "SON",
  dcl: "PL",
  point: "PL",
  applique: "APP",
  spot: "SPOT",
  reglette: "PL",
  projecteur: "PROJ",
  exterieur: "EXT",
  baes: "BAES",
  radiateur: "RAD",
  clim_int: "CLIM",
  clim_ext: "GE",
  seche_serviettes: "SS",
  chauffe_eau: "CE",
  lave_linge: "LL",
  seche_linge: "SL",
  lave_vaisselle: "LV",
  cuisiniere: "CUIS",
  four: "FOUR",
  micro_ondes: "MO",
  refrigerateur: "FR",
  congelateur: "CONG",
  borne_ve: "IRVE",
  vmc: "VMC",
  volet: "VR",
  rep_ll: "LL",
  rep_lv: "LV",
  rep_sl: "SL",
  rep_four: "FOUR",
  rep_mo: "MO",
  rep_frigo: "FR",
  rep_ce: "CE",
  rep_32a: "32A",
  rep_vmc: "VMC",
  rep_rj45: "RJ",
  rep_tv: "TV",
};
/** couleur d'un circuit : un bouton qui ouvre une palette de 30 couleurs (sur tablette, le sélecteur du système n'en
 *  propose que quelques-unes), et « Autre… » pour toutes les autres */
const PALETTE_CIRCUITS = [
  "#e11d48",
  "#dc2626",
  "#f97316",
  "#ea580c",
  "#d97706",
  "#ca8a04",
  "#eab308",
  "#84cc16",
  "#65a30d",
  "#16a34a",
  "#15803d",
  "#10b981",
  "#0d9488",
  "#06b6d4",
  "#0891b2",
  "#0284c7",
  "#2563eb",
  "#1d4ed8",
  "#4f46e5",
  "#7c3aed",
  "#9333ea",
  "#c026d3",
  "#db2777",
  "#be123c",
  "#92400e",
  "#b45309",
  "#78716c",
  "#475569",
  "#1f2937",
  "#000000",
];
function boutonCouleurCircuit(valeur, change) {
  const b = h("button", {
    type: "button",
    class: "btn petit bouton-couleur",
    title: "Couleur du circuit",
    style: `width:30px;height:26px;padding:0;background:${valeur};border:1px solid var(--bord)`,
  });
  b.addEventListener("click", e => {
    e.stopPropagation();
    document.querySelector(".palette-couleurs")?.remove();
    const autre = h("input", { type: "color", value: valeur, style: "width:34px;height:28px;padding:0" });
    const choisir = v => {
      valeur = v;
      b.style.background = v;
      pal.remove();
      change(v);
    };
    autre.addEventListener("change", () => choisir(autre.value));
    const pal = h(
      "div",
      { class: "palette-couleurs" },
      h(
        "div",
        { style: "display:grid;grid-template-columns:repeat(6, 30px);gap:5px" },
        ...PALETTE_CIRCUITS.map(c =>
          h("button", {
            type: "button",
            title: c,
            style: `width:30px;height:30px;border-radius:6px;border:${c === valeur ? "3px solid #111" : "1px solid #d1d5db"};background:${c};padding:0`,
            onclick: () => choisir(c),
          })
        )
      ),
      h("label", { class: "sous", style: "display:flex;gap:6px;align-items:center;margin-top:6px" }, autre, "Autre couleur…")
    );
    document.body.append(pal);
    const r = b.getBoundingClientRect();
    pal.style.left = Math.max(8, Math.min(innerWidth - pal.offsetWidth - 8, r.left)) + "px";
    pal.style.top = Math.max(8, Math.min(innerHeight - pal.offsetHeight - 8, r.bottom + 4)) + "px";
    const fermer = ev => {
      if (pal.contains(ev.target)) return;
      pal.remove();
      document.removeEventListener("pointerdown", fermer, true);
    };
    setTimeout(() => document.addEventListener("pointerdown", fermer, true));
  });
  return b;
}
const COULEURS_CIRCUITS = [
  "#e11d48",
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#ea580c",
  "#4f46e5",
  "#0d9488",
  "#b45309",
];
let TAILLE_SYMBOLE = 34; // cm à l'échelle du plan (Options du module Plans)
/** options du module Plans, communes à tous les plans (bouton « ⚙ Options » d'un plan) */
/** catégorie d'un symbole pour l'affichage (liste de gauche, options, ouvrages) : celle choisie dans ⚙ Options >
 *  Symboles de la liste, sinon la sienne. Le comportement (hauteurs, comptes) suit toujours la catégorie d'origine. */
const catVue = t => (optPlans().categories || {})[t] || (SYMB[t] || {}).categorie || "Divers";
/** symboles triés par nom (listes déroulantes) */
const parNom = (a, b) => String(a[1]).localeCompare(String(b[1]), "fr", { sensitivity: "base" });
const optPlans = () =>
  Object.assign(
    {
      // (version autonome publiée en ligne : alertes coupées tant qu'on ne les active pas dans ⚙ Options > Circuits)
      alertes_nfc: !window.PLANS_AUTONOMES && !((PARAMS && PARAMS.general) || {}).plan_sans_verif_nfc,
      // (volumes V1 / V2 de la salle d'eau dessinés ; version autonome en ligne : cachés tant qu'on ne les coche pas)
      volumes_sdb: !window.PLANS_AUTONOMES,
      taille_symbole: 34,
      taille_texte: 100,
      largeur_porte: 83,
      largeur_fenetre: 120,
      epaisseur: 20,
      grille: 5,
    },
    (PARAMS && PARAMS.plans) || {}
  );
const PL = { plan: null, d: null };

const plNouvellesDonnees = () => ({
  version: 1,
  murs: [],
  ouvertures: [],
  objets: [],
  liaisons: [],
  gaines: [],
  circuits: [],
  pieces: [],
  cotes: "toutes",
  epaisseur: optPlans().epaisseur,
  grille: optPlans().grille,
  niveaux: [{ id: "n0", nom: "Rez-de-chaussée" }],
  niveau: "n0",
  etages: {},
  masques: {},
});

/* ---------- symboles importés (SVG) : Options du module Plans ; gardés aussi dans chaque plan qui s'en sert ---------- */
const CAT_PERSO = "Mes symboles";
function ajouterSymbolePerso(def) {
  if (!def || !def.type || !def.dessin) return;
  SYMB[def.type] = {
    type: def.type,
    libelle: def.libelle || "Symbole",
    categorie: CAT_PERSO,
    pose: def.pose || "libre",
    dessin: def.dessin,
    prof: def.prof || 12,
    compte: def.compte || "",
  };
  const i = SYMBOLES.findIndex(x => x[0] === def.type),
    ligne = [def.type, def.libelle || "Symbole", CAT_PERSO, def.pose || "libre", def.dessin, def.prof || 12];
  if (i >= 0) SYMBOLES[i] = ligne;
  else SYMBOLES.push(ligne);
  // un symbole importé peut compter comme une prise, une lumière ou une commande (alertes, aides de pose)
  for (const [liste, k] of [
    [PRISES, "prise"],
    [LUMIERES, "lumiere"],
    [COMMANDES, "commande"],
  ]) {
    const j = liste.indexOf(def.type);
    if (def.compte === k && j < 0) liste.push(def.type);
    else if (def.compte !== k && j >= 0) liste.splice(j, 1);
  }
}
/** lit un fichier SVG et le ramène dans le carré du symbole (-18…18), en gardant ses proportions */
function svgVersDessin(texte) {
  const doc = new DOMParser().parseFromString(texte, "image/svg+xml"),
    racine = doc.documentElement;
  if (!racine || racine.nodeName.toLowerCase() !== "svg") throw new Error("Ce fichier n'est pas un SVG.");
  racine.querySelectorAll("script, foreignObject").forEach(n => n.remove());
  let vb = (racine.getAttribute("viewBox") || "").split(/[\s,]+/).map(Number);
  if (vb.length !== 4 || vb.some(isNaN))
    vb = [0, 0, parseFloat(racine.getAttribute("width")) || 100, parseFloat(racine.getAttribute("height")) || 100];
  const k = 36 / Math.max(vb[2], vb[3]);
  const interieur = [...racine.childNodes]
    .map(n => n.outerHTML || "")
    .join("")
    .replace(/\son\w+="[^"]*"/gi, "");
  return `<g transform="scale(${k.toFixed(5)}) translate(${-(vb[0] + vb[2] / 2)} ${-(vb[1] + vb[3] / 2)})">${interieur}</g>`;
}
const symbolesPerso = () => ((PARAMS && PARAMS.plans) || {}).symboles_perso || [];
const plId = () => Math.random().toString(36).slice(2, 9);

/* ---------- reconnaissance des dessins à main levée (symboles, portes) : méthode « $P » (nuage de points,
   Vatavu, Anthony et Wobbrock, 2012) ; les modèles viennent des dessins des symboles eux-mêmes ---------- */
const RECO_N = 32;
function recoNormaliser(pts) {
  // pts : [{x, y, s}] (s : n° du trait) → N points répartis le long des traits, centrés, à l'échelle 1
  const L = pts.reduce((a, q, i) => a + (i && pts[i - 1].s === q.s ? Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y) : 0), 0);
  const pas = L / (RECO_N - 1) || 1,
    out = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    let a = pts[i - 1];
    const b = pts[i];
    if (a.s !== b.s) continue;
    let dd = Math.hypot(b.x - a.x, b.y - a.y);
    while (acc + dd >= pas && out.length < RECO_N) {
      const t = (pas - acc) / dd,
        q = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y), s: b.s };
      out.push(q);
      a = q;
      dd = Math.hypot(b.x - a.x, b.y - a.y);
      acc = 0;
    }
    acc += dd;
  }
  while (out.length < RECO_N) out.push(pts[pts.length - 1]);
  const xs = out.map(q => q.x),
    ys = out.map(q => q.y),
    k = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  const cx = xs.reduce((a, v) => a + v, 0) / RECO_N,
    cy = ys.reduce((a, v) => a + v, 0) / RECO_N;
  return out.map(q => ({ x: (q.x - cx) / k, y: (q.y - cy) / k }));
}
function recoDistance(a, b) {
  const n = a.length,
    pas = Math.floor(Math.pow(n, 0.5));
  const nuage = (p, q, debut) => {
    const pris = new Array(n).fill(false);
    let somme = 0,
      i = debut;
    do {
      let jm = -1,
        dm = Infinity;
      for (let j = 0; j < n; j++)
        if (!pris[j]) {
          const dd = (p[i].x - q[j].x) ** 2 + (p[i].y - q[j].y) ** 2;
          if (dd < dm) {
            dm = dd;
            jm = j;
          }
        }
      pris[jm] = true;
      somme += (1 - ((i - debut + n) % n) / n) * Math.sqrt(dm);
      i = (i + 1) % n;
    } while (i !== debut);
    return somme;
  };
  let m = Infinity;
  for (let i = 0; i < n; i += pas) m = Math.min(m, nuage(a, b, i), nuage(b, a, i));
  return m;
}
let RECO_MODELES = null;
const RECO_COURANTS = ["prise", "inter", "inter_va", "dcl", "applique", "@porte"];
function recoModeles() {
  if (RECO_MODELES) return RECO_MODELES;
  const out = [];
  const tourner = (pts, k, miroir) =>
    pts.map(q => {
      let x = miroir ? -q.x : q.x,
        y = q.y;
      for (let i = 0; i < k; i++) [x, y] = [-y, x];
      return { x, y, s: q.s };
    });
  const ajouter = (type, pts, avecMiroir) => {
    for (let k = 0; k < 4; k++)
      for (const mi of avecMiroir ? [false, true] : [false]) out.push({ type, pts: recoNormaliser(tourner(pts, k, mi)) });
  };
  // les symboles : points pris le long des traits de leur dessin (sans les textes)
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("style", "position:absolute;left:-9999px;top:0;width:100px;height:100px");
  document.body.append(svg);
  try {
    for (const def of Object.values(SYMB)) {
      if (def.type.startsWith("rep_") || MASQUES.includes(def.type)) continue;
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.innerHTML = def.dessin;
      svg.append(g);
      const els = [...g.querySelectorAll("path, line, polyline, polygon, circle, ellipse, rect")].filter(el => !el.closest("text"));
      const longs = els.map(el => {
          try {
            return el.getTotalLength();
          } catch (e) {
            return 0;
          }
        }),
        total = longs.reduce((a, v) => a + v, 0);
      const pts = [];
      els.forEach((el, i) => {
        if (!longs[i]) return;
        const nb = Math.max(2, Math.round((80 * longs[i]) / total)),
          m = svg.getScreenCTM().inverse().multiply(el.getScreenCTM());
        for (let j = 0; j < nb; j++) {
          const q = el.getPointAtLength((longs[i] * j) / (nb - 1)).matrixTransform(m);
          pts.push({ x: q.x, y: q.y, s: i });
        }
      });
      g.remove();
      if (pts.length > 3) ajouter(def.type, pts, false);
    }
  } finally {
    svg.remove();
  }
  // porte : quart de cercle (avec ou sans le battant), dans tous les sens
  const arc = [];
  for (let j = 0; j <= 20; j++) {
    const a = ((Math.PI / 2) * j) / 20;
    arc.push({ x: Math.cos(a), y: Math.sin(a), s: 0 });
  }
  ajouter("@porte", arc, true);
  ajouter("@porte", [...arc, { x: 0, y: 1, s: 1 }, { x: 0, y: 0, s: 1 }], true);
  ajouter("@porte", [...arc, { x: 0, y: 1, s: 1 }, { x: 0, y: 0, s: 1 }, { x: 1, y: 0, s: 1 }], true);
  // tableau : rectangle et ses deux diagonales, plus ou moins allongé (à main levée, rarement aussi plat que le symbole)
  if (SYMB.tableau && !MASQUES.includes("tableau"))
    for (const r of [1.4, 2, 3]) {
      const seg = (x0, y0, x1, y1, s) =>
        Array.from({ length: 11 }, (_, i) => ({ x: x0 + ((x1 - x0) * i) / 10, y: y0 + ((y1 - y0) * i) / 10, s }));
      ajouter(
        "tableau",
        [
          ...seg(0, 0, r, 0, 0),
          ...seg(r, 0, r, 1, 0),
          ...seg(r, 1, 0, 1, 0),
          ...seg(0, 1, 0, 0, 0),
          ...seg(0, 0, r, 1, 1),
          ...seg(0, 1, r, 0, 2),
        ],
        false
      );
    }
  RECO_MODELES = out;
  return out;
}
/* abréviations écrites dans un rond ou un rectangle (habitude des plans d'électricien) : LL = lave-linge, TGBT = tableau… */
// → le symbole « repère » rond correspondant (Repères : cercle + texte) ; « rep_libre » : cercle avec l'abréviation écrite.
// Liste par défaut : chacun peut la changer (⚙ Options > Abréviations lues à main levée), gardée dans les paramètres des plans
const abreviationsActives = () => {
  const l = optPlans().abreviations;
  return Array.isArray(l) && l.length ? l : ABREVIATIONS;
};
const ABREVIATIONS = [
  ["PC", "prise"],
  ["LL", "rep_ll"],
  ["LV", "rep_lv"],
  ["SL", "rep_sl"],
  ["RAD", "rep_libre"],
  ["CE", "rep_ce"],
  ["FOUR", "rep_four"],
  ["MO", "rep_mo"],
  ["FR", "rep_frigo"],
  ["REF", "rep_frigo"],
  ["CONG", "rep_libre"],
  ["CG", "rep_libre"],
  ["PL", "rep_libre"],
  ["CUI", "rep_libre"],
  ["VMC", "rep_vmc"],
  ["TV", "rep_tv"],
  ["RJ", "rep_rj45"],
  ["RJ45", "rep_rj45"],
  ["32A", "rep_32a"],
  ["SS", "rep_libre"],
  ["VR", "rep_libre"],
  ["BAES", "baes"],
  ["VE", "rep_libre"],
  ["IRVE", "rep_libre"],
  ["DAAF", "daaf"],
  ["TAB", "tableau"],
  ["TD", "tableau"],
  ["TGBT", "tableau"],
  ["TG", "tableau"],
];
/** tracés des lettres majuscules dans un carré 0…1 (y vers le bas) : une ou plusieurs façons de les écrire, trait par trait */
const LETTRES_TRAITS = (() => {
  const arc = (cx, cy, rx, ry, a0, a1, n = 14) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
      return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
    });
  const boucleP = [[0.15, 0], [0.5, 0], ...arc(0.5, 0.27, 0.35, 0.27, -90, 90).slice(1), [0.15, 0.54]];
  const ventreD = [[0.15, 0], [0.4, 0], ...arc(0.4, 0.5, 0.45, 0.5, -90, 90).slice(1), [0.15, 1]];
  return {
    A: [
      [
        [
          [0, 1],
          [0.5, 0],
          [1, 1],
        ],
        [
          [0.25, 0.55],
          [0.75, 0.55],
        ],
      ],
    ],
    B: [
      [
        [
          [0.15, 0],
          [0.15, 1],
        ],
        [[0.15, 0], [0.5, 0], ...arc(0.5, 0.25, 0.3, 0.25, -90, 90).slice(1), [0.15, 0.5]],
        [[0.15, 0.5], [0.55, 0.5], ...arc(0.55, 0.75, 0.33, 0.25, -90, 90).slice(1), [0.15, 1]],
      ],
    ],
    C: [[arc(0.55, 0.5, 0.45, 0.5, -45, -315, 20)]],
    D: [
      [
        [
          [0.15, 0],
          [0.15, 1],
        ],
        ventreD,
      ],
      [[[0.15, 1], ...ventreD]],
    ],
    E: [
      [
        [
          [0.8, 0],
          [0.15, 0],
          [0.15, 1],
          [0.8, 1],
        ],
        [
          [0.15, 0.5],
          [0.65, 0.5],
        ],
      ],
      [
        [
          [0.15, 0],
          [0.15, 1],
        ],
        [
          [0.15, 0],
          [0.8, 0],
        ],
        [
          [0.15, 0.5],
          [0.65, 0.5],
        ],
        [
          [0.15, 1],
          [0.8, 1],
        ],
      ],
    ],
    F: [
      [
        [
          [0.8, 0],
          [0.15, 0],
          [0.15, 1],
        ],
        [
          [0.15, 0.5],
          [0.65, 0.5],
        ],
      ],
      [
        [
          [0.15, 0],
          [0.15, 1],
        ],
        [
          [0.15, 0],
          [0.8, 0],
        ],
        [
          [0.15, 0.5],
          [0.65, 0.5],
        ],
      ],
    ],
    G: [[[...arc(0.55, 0.5, 0.45, 0.5, -45, -360, 20), [0.6, 0.5]]]],
    I: [
      [
        [
          [0.5, 0],
          [0.5, 1],
        ],
      ],
    ],
    J: [[[[0.8, 0], [0.8, 0.7], ...arc(0.5, 0.7, 0.3, 0.3, 0, 180).slice(1)]]],
    L: [
      [
        [
          [0.2, 0],
          [0.2, 1],
          [0.85, 1],
        ],
      ],
    ],
    M: [
      [
        [
          [0, 1],
          [0.1, 0],
          [0.5, 0.65],
          [0.9, 0],
          [1, 1],
        ],
      ],
    ],
    N: [
      [
        [
          [0.1, 1],
          [0.1, 0],
          [0.9, 1],
          [0.9, 0],
        ],
      ],
    ],
    O: [[arc(0.5, 0.5, 0.45, 0.5, -90, 270, 24)]],
    P: [
      [
        [
          [0.15, 1],
          [0.15, 0],
        ],
        boucleP,
      ],
      [[[0.15, 1], [0.15, 0], ...boucleP.slice(1)]],
    ],
    R: [
      [
        [
          [0.15, 1],
          [0.15, 0],
        ],
        boucleP,
        [
          [0.45, 0.54],
          [0.9, 1],
        ],
      ],
      [[[0.15, 1], [0.15, 0], ...boucleP.slice(1), [0.9, 1]]],
    ],
    S: [[[...arc(0.5, 0.26, 0.38, 0.26, -20, -270, 12), ...arc(0.5, 0.74, 0.38, 0.26, -90, 160, 12)]]],
    T: [
      [
        [
          [0, 0],
          [1, 0],
        ],
        [
          [0.5, 0],
          [0.5, 1],
        ],
      ],
    ],
    U: [[[[0.1, 0], [0.1, 0.65], ...arc(0.5, 0.65, 0.4, 0.35, 180, 0).slice(1), [0.9, 0]]]],
    V: [
      [
        [
          [0, 0],
          [0.5, 1],
          [1, 0],
        ],
      ],
    ],
    H: [
      [
        [
          [0.15, 0],
          [0.15, 1],
        ],
        [
          [0.85, 0],
          [0.85, 1],
        ],
        [
          [0.15, 0.5],
          [0.85, 0.5],
        ],
      ],
    ],
    K: [
      [
        [
          [0.15, 0],
          [0.15, 1],
        ],
        [
          [0.85, 0],
          [0.15, 0.55],
          [0.85, 1],
        ],
      ],
    ],
    Q: [
      [
        arc(0.5, 0.5, 0.45, 0.5, -90, 270, 24),
        [
          [0.6, 0.7],
          [0.95, 1],
        ],
      ],
    ],
    W: [
      [
        [
          [0, 0],
          [0.25, 1],
          [0.5, 0.35],
          [0.75, 1],
          [1, 0],
        ],
      ],
    ],
    X: [
      [
        [
          [0, 0],
          [1, 1],
        ],
        [
          [1, 0],
          [0, 1],
        ],
      ],
    ],
    Y: [
      [
        [
          [0, 0],
          [0.5, 0.5],
          [1, 0],
        ],
        [
          [0.5, 0.5],
          [0.5, 1],
        ],
      ],
    ],
    Z: [
      [
        [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ],
      ],
    ],
    0: [[arc(0.5, 0.5, 0.45, 0.5, -90, 270, 24)]],
    1: [
      [
        [
          [0.25, 0.25],
          [0.6, 0],
          [0.6, 1],
        ],
      ],
      [
        [
          [0.5, 0],
          [0.5, 1],
        ],
      ],
    ],
    2: [[[...arc(0.5, 0.3, 0.4, 0.3, -160, 30), [0.05, 1], [0.95, 1]]]],
    3: [[[...arc(0.45, 0.26, 0.4, 0.26, -150, 90), ...arc(0.45, 0.74, 0.45, 0.26, -90, 150)]]],
    4: [
      [
        [
          [0.7, 1],
          [0.7, 0],
          [0.05, 0.7],
          [0.95, 0.7],
        ],
      ],
      [
        [
          [0.55, 0],
          [0.05, 0.7],
          [0.95, 0.7],
        ],
        [
          [0.7, 0.35],
          [0.7, 1],
        ],
      ],
    ],
    5: [[[[0.85, 0], [0.2, 0], [0.15, 0.45], ...arc(0.5, 0.68, 0.4, 0.32, -130, 150)]]],
    6: [[[...arc(0.55, 0.3, 0.4, 0.3, -30, -180), ...arc(0.5, 0.68, 0.4, 0.32, 180, 540, 20)]]],
  };
})();
/** une lettre : points répartis le long des traits, centrés sur leur cadre, ramenés à un carré de côté 1 */
function lettreNormalisee(pts) {
  const n = 48,
    L = pts.reduce((a, q, i) => a + (i && pts[i - 1].s === q.s ? Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y) : 0), 0),
    pas = L / n || 1,
    out = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    let a = pts[i - 1];
    const b = pts[i];
    if (a.s !== b.s) {
      out.push(b);
      acc = 0;
      continue;
    }
    let dd = Math.hypot(b.x - a.x, b.y - a.y);
    while (acc + dd >= pas) {
      const t = (pas - acc) / dd,
        q = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y), s: b.s };
      out.push(q);
      a = q;
      dd = Math.hypot(b.x - a.x, b.y - a.y);
      acc = 0;
    }
    acc += dd;
  }
  const xs = out.map(q => q.x),
    ys = out.map(q => q.y),
    x0 = Math.min(...xs),
    x1 = Math.max(...xs),
    y0 = Math.min(...ys),
    y1 = Math.max(...ys);
  // (largeur et hauteur ramenées à 1 chacune : l'écriture de chacun est plus ou moins large ; une lettre étroite, I,
  // le reste)
  const ky = Math.max(y1 - y0, (x1 - x0) * 0.3) || 1,
    kx = Math.max(x1 - x0, ky * 0.3),
    cx = (x0 + x1) / 2,
    cy = (y0 + y1) / 2;
  return out.map(q => ({ x: (q.x - cx) / kx, y: (q.y - cy) / ky }));
}
/** écart entre deux lettres : distance moyenne de chaque point au plus proche de l'autre, dans les deux sens */
function ecartLettres(a, b) {
  const sens = (p, q) =>
    p.reduce((s, u) => {
      let m = Infinity;
      for (const v of q) {
        const dd = (u.x - v.x) ** 2 + (u.y - v.y) ** 2;
        if (dd < m) m = dd;
      }
      return s + Math.sqrt(m);
    }, 0) / p.length;
  return sens(a, b) + sens(b, a);
}
let MODELES_LETTRES = null;
const modelesLettres = () =>
  MODELES_LETTRES ||
  (MODELES_LETTRES = Object.entries(LETTRES_TRAITS).flatMap(([lettre, variantes]) =>
    variantes.map(v => ({ lettre, pts: lettreNormalisee(v.flatMap((t, i) => t.map(([x, y]) => ({ x, y, s: i })))) }))
  ));
/** traits dessinés → types les plus proches, du meilleur au moins bon (un seul par type) */
function reconnaitre(traits, accepte) {
  const pts = recoNormaliser(traits.flatMap((t, s) => t.map(q => ({ x: q.x, y: q.y, s }))));
  const meilleur = {};
  for (const m of recoModeles()) {
    if (accepte && !accepte(m.type)) continue;
    const dd = recoDistance(pts, m.pts);
    const k = RECO_COURANTS.includes(m.type) ? 0.9 : 1; // (à dessin proche, les appareils les plus courants d'abord)
    if (!(m.type in meilleur) || dd * k < meilleur[m.type]) meilleur[m.type] = dd * k;
  }
  let liste = Object.entries(meilleur)
    .sort((a, b) => a[1] - b[1])
    .map(([type, score]) => ({ type, score }));
  // des lettres dans un rond (LL, LV, PC, RAD…) : on lit l'abréviation (le rond ressemble sinon à tous les symboles ronds)
  const dedans = lettreDansRond(traits);
  if (dedans) {
    const r = lireAbreviation(dedans, accepte);
    if (r.length) liste = [...r, ...liste.filter(x => !r.some(y => y.type === x.type))];
  }
  return liste;
}
/** traits d'une abréviation → types possibles, du plus probable au moins probable.
 * Les traits sont rangés de gauche à droite puis toutes les façons de les couper en 1 à 5 lettres sont essayées
 * (au doigt, le pied d'un L passe souvent sous la lettre suivante) : chaque morceau est comparé aux modèles de lettres,
 * et chaque abréviation connue de même longueur reçoit la moyenne des écarts de ses lettres. */
function lireAbreviation(traits, accepte) {
  const tri = traits
    .map(t => ({ t, x0: Math.min(...t.map(q => q.x)) }))
    .sort((a, b) => a.x0 - b.x0)
    .map(b => b.t);
  const n = tri.length;
  if (!n || n > 14) return [];
  const cache = {};
  const ecarts = (i, j) =>
    cache[i + "-" + j] ||
    (cache[i + "-" + j] = (() => {
      // traits i…j-1 = une lettre
      const pts = lettreNormalisee(tri.slice(i, j).flatMap((t, s) => t.map(q => ({ x: q.x, y: q.y, s }))));
      const e = {};
      for (const m of modelesLettres()) {
        const dd = ecartLettres(pts, m.pts);
        if (!(m.lettre in e) || dd < e[m.lettre]) e[m.lettre] = dd;
      }
      return e;
    })());
  const meilleur = {};
  for (const [abr, type] of abreviationsActives()) {
    const k = abr.length;
    if (k > n || !SYMB[type] || (accepte && !accepte(type))) continue;
    const cle = type === "rep_libre" ? "rep_libre|" + abr : type; // (cercle + texte libre : le texte est l'abréviation)
    // meilleure découpe des n traits en k lettres (à la suite) pour cette abréviation
    const memo = {};
    const best = (pos, l) => {
      // lettres l… de l'abréviation à partir du trait pos
      if (l === k) return pos === n ? 0 : Infinity;
      const cle = pos + ":" + l;
      if (cle in memo) return memo[cle];
      let m = Infinity;
      for (let j = pos + 1; j <= n - (k - l - 1); j++) m = Math.min(m, (ecarts(pos, j)[abr[l]] ?? 9) + best(j, l + 1));
      return (memo[cle] = m);
    };
    const sc = best(0, 0) / k;
    if (!(cle in meilleur) || sc < meilleur[cle]) meilleur[cle] = sc;
  }
  // (au-delà de 0,3, ce ne sont pas des lettres : une croix dans un rond reste un point lumineux…)
  return Object.entries(meilleur)
    .filter(([, sc]) => sc < 0.3)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([type, score]) => ({ type, score, abreviation: true }));
}
/** rond ou rectangle fermé autour d'autres traits (lettres entourées) → les traits du dedans, sinon null */
function lettreDansRond(traits) {
  if (traits.length < 2) return null;
  const boite = t => {
    const xs = t.map(q => q.x),
      ys = t.map(q => q.y);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  };
  for (let i = 0; i < traits.length; i++) {
    const t = traits[i],
      b = boite(t),
      taille = Math.max(b.x1 - b.x0, b.y1 - b.y0);
    if (taille <= 0 || Math.hypot(t[0].x - t[t.length - 1].x, t[0].y - t[t.length - 1].y) > taille * 0.5) continue; // pas fermé
    if (Math.min(b.x1 - b.x0, b.y1 - b.y0) < taille * 0.2) continue; // (rond, ou rectangle comme celui d'un tableau)
    const autres = traits.filter((_, j) => j !== i),
      m = taille * 0.15; // (au doigt, une lettre déborde un peu du rond)
    if (
      autres.every(u => {
        const c = boite(u);
        return c.x0 >= b.x0 - m && c.x1 <= b.x1 + m && c.y0 >= b.y0 - m && c.y1 <= b.y1 + m;
      })
    )
      return autres;
  }
  return null;
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const ns = "http://www.w3.org/2000/svg";
function svgEl(t, at, enfants) {
  const e = document.createElementNS(ns, t);
  for (const [k, v] of Object.entries(at || {})) if (v !== undefined && v !== null) e.setAttribute(k, v);
  for (const c of [].concat(enfants || [])) if (c) e.append(c);
  return e;
}
function plMetres(cm) {
  return (Math.round(cm) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " m";
}

/** case de nombre avec ses boutons − et + (au doigt, une case de nombre n'a pas de flèches) */
function avecFleches(input) {
  const pas = d => {
    const st = Number(input.step) || 1,
      mi = input.min === "" ? -Infinity : Number(input.min),
      ma = input.max === "" ? Infinity : Number(input.max);
    input.value = String(Math.max(mi, Math.min(ma, (Number(input.value) || 0) + d * st)));
    input.dispatchEvent(new Event("input"));
    input.dispatchEvent(new Event("change"));
  };
  const b = (txt, d, titre) =>
    h("button", { type: "button", class: "btn petit", title: titre, style: "min-width:34px;font-weight:700", onclick: () => pas(d) }, txt);
  return h("span", { style: "display:inline-flex;gap:4px;align-items:center" }, b("−", -1, "Un de moins"), input, b("+", 1, "Un de plus"));
}
/** liste déroulante sous une case de texte, qui se filtre en tapant (remplace <datalist>, qui ne déroule rien au doigt
 *  sur les tablettes) ; un choix met la valeur et envoie « change » */
function listeDeroulante(input, valeurs) {
  let boite = null;
  const fermer = () => {
    if (boite) boite.remove();
    boite = null;
  };
  const ouvrir = () => {
    fermer();
    const q = sansAccents(input.value).toLowerCase().trim(),
      mots = q.split(/\s+/).filter(Boolean),
      tout = !mots.length || valeurs.includes(input.value); // (valeur déjà choisie : toute la liste)
    const l = valeurs.filter(v => tout || mots.every(m => sansAccents(v).toLowerCase().includes(m))).slice(0, 200);
    const r = input.getBoundingClientRect();
    boite = h(
      "div",
      {
        class: "liste-deroulante",
        style: `position:fixed;left:${r.left}px;top:${r.bottom + 2}px;min-width:${Math.max(r.width, 260)}px;max-width:min(520px,96vw);max-height:min(50vh,${Math.max(160, innerHeight - r.bottom - 12)}px);overflow:auto;z-index:3000;background:var(--fond-carte,#fff);border:1px solid #94a3b8;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,.18);font-size:13px`,
      },
      [
        tactile && input.inputMode === "none"
          ? h(
              "div",
              { class: "ld-clavier", style: "padding:8px 10px;color:#2563eb;cursor:pointer;font-weight:600" },
              "⌨ Taper pour chercher…"
            )
          : "",
        h("div", { class: "ld-item", style: "padding:8px 10px;color:#64748b;cursor:pointer", "data-v": "" }, "— (aucun)"),
        ...l.map(v =>
          h("div", { class: "ld-item", style: "padding:8px 10px;border-top:1px solid #eef2f7;cursor:pointer", "data-v": v }, v)
        ),
        l.length ? "" : h("div", { style: "padding:8px 10px;color:#64748b" }, "Rien ne correspond."),
      ]
    );
    // (pointerdown : avant que la case perde le focus)
    boite.addEventListener("pointerdown", e => {
      if (e.target.closest(".ld-clavier")) {
        // (au doigt : le clavier seulement à la demande)
        e.preventDefault();
        input.inputMode = "text";
        input.blur();
        setTimeout(() => input.focus(), 30);
        return;
      }
      const it = e.target.closest(".ld-item");
      if (!it) return;
      e.preventDefault();
      input.value = it.dataset.v;
      fermer();
      input.dispatchEvent(new Event("change"));
    });
    document.body.append(boite);
  };
  input.setAttribute("autocomplete", "off");
  // (au doigt : la liste s'ouvre sans le clavier, qui la cacherait ; « Taper pour chercher » le fait venir)
  const tactile = window.matchMedia && matchMedia("(pointer: coarse)").matches;
  if (tactile) input.inputMode = "none";
  input.addEventListener("focus", ouvrir);
  input.addEventListener("click", () => boite || ouvrir());
  input.addEventListener("input", ouvrir);
  input.addEventListener("blur", () =>
    setTimeout(() => {
      if (document.activeElement === input) return;
      fermer();
      if (tactile) input.inputMode = "none";
    }, 150)
  );
  input.addEventListener("keydown", e => {
    if (e.key === "Escape") fermer();
    else if (e.key === "Enter" && boite) {
      const it = boite.querySelectorAll(".ld-item")[1];
      if (it && input.value.trim()) {
        input.value = it.dataset.v;
        fermer();
        input.dispatchEvent(new Event("change"));
      }
    }
  });
  return input;
}

/* ---------- échange avec la version autonome (fichier .plans.json) ----------
 * Même format que « Enregistrer mes plans » de la version autonome (plans-web/autonome.js) :
 * { format: "plans-electriques", version: 1, parametres: { plans: … }, plans: [ { nom, donnees, cree_le, … } ] }.
 * À l'export, chaque plan garde son numéro dans DF artisan (dfa_id) et une empreinte de son contenu (dfa_empreinte) : au
 * retour, il remplace le plan d'origine, sauf si celui-ci a aussi changé dans DF artisan entre-temps (alors : une copie,
 * retrouvée et mise à jour aux imports suivants). Ouvrir un plan ou déplacer la vue ne compte pas comme un changement. */
/** empreinte du contenu d'un plan (sans la position de la vue ni la taille des symboles, réglées à l'ouverture) */
function empreintePlan(donnees) {
  const tri = v =>
    Array.isArray(v)
      ? v.map(tri)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .map(k => [k, tri(v[k])])
          )
        : v;
  const d = { ...(donnees || {}) };
  for (const k of [
    "vue",
    "taille_symb",
    "origine_autonome",
    "empreinte_import",
    "tableau_id",
    "tableaux_armoires",
    "etiquettes_id",
    "etiquettes_armoires",
    "etiquettes_le",
  ])
    delete d[k];
  const s = JSON.stringify(tri(d));
  let h1 = 0xdeadbeef,
    h2 = 0x41c6ce57; // (cyrb53)
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
async function exporterVersAutonome(liste) {
  if (!liste.length) {
    toast("Aucun plan à exporter.");
    return;
  }
  const cases = liste.map(p => h("input", { type: "checkbox", checked: true, value: p.id }));
  const tous = v => cases.forEach(c => (c.checked = v));
  ouvrirModale(
    "Exporter pour la tablette",
    h(
      "div",
      { class: "pile" },
      h(
        "p",
        { class: "aide", style: "margin:0" },
        "Un fichier .plans.json à ouvrir dans la version autonome « Plans électriques » (📂 Ouvrir un fichier de plans). Il contient aussi vos options des plans et vos symboles importés. Au retour, « Importer un fichier de plans » met à jour ces mêmes plans."
      ),
      h(
        "div",
        { class: "ligne" },
        h("button", { class: "btn petit", onclick: () => tous(true) }, "Tout"),
        h("button", { class: "btn petit", onclick: () => tous(false) }, "Rien")
      ),
      h(
        "div",
        { style: "max-height:50vh;overflow:auto" },
        liste.map((p, i) =>
          h(
            "label",
            { class: "case", style: "display:flex;gap:6px;padding:2px 0" },
            cases[i],
            p.nom + (p.client_nom ? " — " + p.client_nom : "")
          )
        )
      )
    ),
    [
      h("button", { class: "btn", onclick: fermerModale }, "Annuler"),
      h(
        "button",
        {
          class: "btn principal",
          onclick: async () => {
            const ids = cases.filter(c => c.checked).map(c => Number(c.value));
            if (!ids.length) return toast("Aucun plan coché.", true);
            const maintenant = new Date().toISOString();
            const plans = [];
            for (const id of ids) {
              const p = await api("GET", "/api/plans/" + id);
              plans.push({
                id: p.id,
                dfa_id: p.id,
                dfa_exporte_le: maintenant,
                dfa_empreinte: empreintePlan(p.donnees),
                nom: p.nom,
                genre: "plan",
                adresse: p.adresse || "",
                client_nom: p.client_nom || "",
                donnees: p.donnees || {},
                cree_le: p.cree_le || maintenant,
                modifie_le: p.modifie_le || maintenant,
              });
            }
            const contenu = JSON.stringify({
              format: "plans-electriques",
              version: 1,
              enregistre_le: maintenant,
              parametres: { plans: PARAMS.plans || {} },
              plans,
            });
            const a = h("a", {
              href: URL.createObjectURL(new Blob([contenu], { type: "application/json" })),
              download: "plans-DF-artisan-" + maintenant.slice(0, 10) + ".plans.json",
            });
            document.body.append(a);
            a.click();
            a.remove();
            fermerModale();
            toast(plans.length + " plan(s) exporté(s).");
          },
        },
        "Exporter"
      ),
    ]
  );
}
async function importerDepuisAutonome() {
  const f = h("input", { type: "file", accept: ".json,application/json" });
  f.addEventListener("change", async () => {
    try {
      let x;
      try {
        x = JSON.parse(await f.files[0].text());
      } catch (e) {
        throw new Error("Ce fichier n'est pas un fichier de plans (.plans.json).");
      }
      if (!x || x.format !== "plans-electriques" || !Array.isArray(x.plans))
        throw new Error("Ce fichier n'est pas un fichier de plans (.plans.json).");
      const existants = await api("GET", "/api/plans?genre=plan");
      // (contenu de chaque plan d'ici, et plans déjà importés : retrouvés par leur origine)
      const complets = new Map(),
        parOrigine = new Map();
      for (const p of existants) {
        const d = await api("GET", "/api/plans/" + p.id).catch(() => null);
        if (!d) continue;
        complets.set(p.id, d);
        const o = d.donnees && d.donnees.origine_autonome;
        if (o) parOrigine.set(o, d);
      }
      const origine = p => (p.dfa_id ? "dfa:" + p.dfa_id + ":" + (p.dfa_exporte_le || "") : "autonome:" + (p.cree_le || ""));
      const actions = x.plans
        .filter(p => p && p.donnees && (p.genre || "plan") === "plan")
        .map(p => {
          const ep = empreintePlan(p.donnees),
            pareil = d => empreintePlan(d.donnees) === ep; // (déjà identique ici : rien à faire)
          const dejaImporte = parOrigine.get(origine(p)); // (copie faite à un import précédent : mise à jour)
          if (dejaImporte) {
            if (pareil(dejaImporte)) return { p, cible: dejaImporte, conflit: false, identique: true };
            // (changé ici depuis le dernier import : pas écrasé, la version de la tablette arrive en copie, qui prend le relais)
            const change = empreintePlan(dejaImporte.donnees) !== (dejaImporte.donnees || {}).empreinte_import;
            return change ? { p, cible: null, conflit: true, ancien: dejaImporte } : { p, cible: dejaImporte, conflit: false };
          }
          const lie = p.dfa_id && complets.get(p.dfa_id);
          if (lie && pareil(lie)) return { p, cible: lie, conflit: false, identique: true };
          if (lie) {
            // (changé dans DF artisan depuis l'export : on ne l'écrase pas, le plan de la tablette arrive en copie)
            // (pas changé ici depuis l'export, ni depuis le dernier import de la tablette : on peut le remplacer)
            const ici = empreintePlan(lie.donnees),
              conflit = !!p.dfa_empreinte && ici !== p.dfa_empreinte && ici !== (lie.donnees || {}).empreinte_import;
            return { p, cible: conflit ? null : lie, conflit };
          }
          return { p, cible: null, conflit: false };
        });
      if (!actions.length) throw new Error("Aucun plan dans ce fichier.");
      const maj = actions.filter(a => a.cible && !a.identique),
        nouveaux = actions.filter(a => !a.cible),
        pareils = actions.filter(a => a.identique);
      if (!maj.length && !nouveaux.length) {
        toast("Ces " + pareils.length + " plan(s) sont déjà à jour dans DF artisan.");
        return;
      }
      const lignes = actions.map(a =>
        h(
          "li",
          {},
          h("b", {}, a.p.nom || "Plan"),
          " — ",
          a.identique
            ? "déjà à jour"
            : a.cible
              ? "met à jour « " + a.cible.nom + " »"
              : a.conflit
                ? "en copie (le plan a aussi changé dans DF artisan depuis l'export)"
                : "nouveau plan"
        )
      );
      const ok = await new Promise(fin => {
        ouvrirModale(
          "Importer un fichier de plans",
          h(
            "div",
            {},
            h("p", { style: "margin:0 0 4px" }, nouveaux.length + " nouveau(x) plan(s), " + maj.length + " mis à jour :"),
            h("ul", { style: "max-height:40vh;overflow:auto;margin:4px 0" }, lignes)
          ),
          [
            h("button", { class: "btn", onclick: () => (fermerModale(), fin(false)) }, "Annuler"),
            h("button", { class: "btn principal", onclick: () => (fermerModale(), fin(true)) }, "Importer"),
          ]
        );
      });
      if (!ok) return;
      // symboles importés et ensembles de la tablette absents d'ici : ajoutés aux options (rien n'est remplacé)
      const pf = (x.parametres && x.parametres.plans) || {},
        ici = PARAMS.plans || {},
        ajout = {};
      const manquants = (cle, id) => (pf[cle] || []).filter(v => v && !(ici[cle] || []).some(w => w[id] === v[id]));
      if (manquants("symboles_perso", "type").length)
        ajout.symboles_perso = [...(ici.symboles_perso || []), ...manquants("symboles_perso", "type")];
      if (manquants("ensembles", "id").length) ajout.ensembles = [...(ici.ensembles || []), ...manquants("ensembles", "id")];
      if (Object.keys(ajout).length) {
        const plans = { ...ici, ...ajout };
        majVersionParams(await api("PUT", "/api/parametres", { plans }));
        PARAMS.plans = plans;
      }
      for (const a of actions) {
        if (a.identique) continue;
        if (a.ancien) {
          // (l'ancienne copie n'est plus suivie : les imports suivants mettront à jour la nouvelle)
          const v = { ...a.ancien.donnees };
          delete v.origine_autonome;
          delete v.empreinte_import;
          await api("PUT", "/api/plans/" + a.ancien.id, { donnees: v });
        }
        const donnees = { ...a.p.donnees, empreinte_import: empreintePlan(a.p.donnees) };
        // (plan né sur la tablette, ou copie d'un plan changé des deux côtés : retrouvé aux imports suivants)
        if (!a.p.dfa_id || a.conflit || (a.cible && a.cible.donnees && a.cible.donnees.origine_autonome))
          donnees.origine_autonome = origine(a.p);
        if (a.cible) {
          const ancien = await api("GET", "/api/plans/" + a.cible.id);
          // (on garde ce que seul DF artisan connaît : liens vers les tableaux, etc.)
          await api("PUT", "/api/plans/" + a.cible.id, {
            nom: / \(tablette\)$/.test(ancien.nom) ? ancien.nom : a.p.nom || ancien.nom,
            donnees: { ...(ancien.donnees || {}), ...donnees },
          });
        } else {
          delete donnees.tableau_id;
          delete donnees.tableaux_armoires;
          delete donnees.etiquettes_id;
          delete donnees.etiquettes_armoires;
          await api("POST", "/api/plans", {
            nom: (a.p.nom || "Plan") + (a.conflit ? " (tablette)" : ""),
            adresse: a.p.adresse || "",
            donnees,
          });
        }
      }
      toast(
        nouveaux.length +
          " plan(s) ajouté(s), " +
          maj.length +
          " mis à jour." +
          (nouveaux.length ? " Rattachez-les à un client ou à un devis depuis le plan." : "")
      );
      aller("plans");
    } catch (e) {
      erreur(e);
    }
  });
  f.click();
}

/* ---------- liste des plans ---------- */
/** version autonome « Plans électriques » (sans clients ni devis : plans-web/, outils/fabriquer_plans_web.py) */
const PLANS_AUTONOMES = !!window.PLANS_AUTONOMES;
/** page des retours (bugs, idées) de la version en ligne : les « issues » du dépôt GitHub qui la publie
 *  (déduit de l'adresse utilisateur.github.io/depot/), sinon rien */
function lienRetours() {
  const m = /^([a-z0-9-]+)\.github\.io$/i.exec(location.hostname || "");
  if (!m) return "";
  const premier = location.pathname.split("/").filter(Boolean)[0] || "",
    depot = premier && !premier.includes(".") ? premier : m[1] + ".github.io";
  return "https://github.com/" + m[1] + "/" + depot + "/issues";
}
/** version en ligne : ⚠ quand les plans ont changé depuis leur dernier enregistrement en fichier (affiché par
 *  plans-web/autonome.js, classe « a-sauver » du corps de la page) ; un clic : enregistrer, ou régler le rappel */
function boutonAlerteSauvegarde() {
  return h(
    "button",
    {
      class: "btn alerte-sauvegarde",
      title: "Plans modifiés depuis leur dernier enregistrement en fichier",
      onclick: () => typeof window.alerteSauvegarde === "function" && window.alerteSauvegarde(),
    },
    "⚠ Plans à enregistrer"
  );
}
async function sectionPlans(zone, arg) {
  if (arg && arg.id) return ouvrirPlan(zone, arg.id, arg);
  const liste = await api("GET", "/api/plans?genre=plan" + (arg && arg.client_id ? "&client_id=" + arg.client_id : ""));
  const fiche = h("div", { class: "fiche" });
  zone.append(fiche);
  fiche.append(
    entetePage(
      h("span", {}, "Plans électriques ", h("span", { class: "puce-beta" }, "BÊTA")),
      h("button", { class: "btn principal", onclick: () => nouveauPlan({}, !PLANS_AUTONOMES).catch(erreur) }, "+ Nouveau plan"),
      ...(PLANS_AUTONOMES
        ? [boutonAlerteSauvegarde()]
        : [
            h(
              "button",
              {
                class: "btn",
                title: "Fichier de plans pour la version autonome (tablette sur le terrain), avec vos options et symboles importés",
                onclick: () => exporterVersAutonome(liste).catch(erreur),
              },
              "💾 Exporter pour la tablette…"
            ),
            h(
              "button",
              {
                class: "btn",
                title: "Reprendre un fichier de plans (.plans.json) enregistré par la version autonome",
                onclick: () => importerDepuisAutonome().catch(erreur),
              },
              "📂 Importer un fichier de plans…"
            ),
          ]),
      h("span", { class: "espace" }),
      h("span", { class: "sous" }, liste.length + " plan(s)")
    ),
    PLANS_AUTONOMES
      ? h(
          "p",
          { class: "aide", style: "margin:0 0 10px" },
          "Module de plans issu de DF artisan, logiciel de devis et factures spécialisé dans le bâtiment, en cours de développement : il peut comporter des erreurs, vérifiez vos plans. Alertes NF C 15-100 (pour électricien averti) : ⚙ Options du plan > Circuits. Un bug, une idée : ",
          (() => {
            const l = lienRetours();
            return l
              ? h("a", { href: l, target: "_blank", rel: "noopener" }, "signalez-le sur GitHub")
              : "signalez-le sur la page GitHub du projet";
          })(),
          "."
        )
      : null,
    liste.length
      ? h(
          "table",
          { class: "resultats" },
          h(
            "thead",
            {},
            h(
              "tr",
              {},
              (PLANS_AUTONOMES ? ["Plan", "Adresse", "Modifié le"] : ["Plan", "Client", "Devis", "Adresse", "Modifié le", "Tableau"]).map(
                t => h("th", {}, t)
              )
            )
          ),
          h(
            "tbody",
            {},
            liste.map(p =>
              h(
                "tr",
                { class: "cliquable", onclick: () => aller("plans", { id: p.id }) },
                h("td", {}, h("b", {}, p.nom || "Plan")),
                PLANS_AUTONOMES ? null : h("td", {}, p.client_nom || ""),
                PLANS_AUTONOMES
                  ? null
                  : h("td", {}, p.document_numero ? p.document_numero + (p.document_objet ? " · " + p.document_objet : "") : ""),
                h("td", { class: "sous" }, (p.adresse || "").split("\n")[0]),
                h("td", { class: "sous" }, dateFr((p.modifie_le || "").slice(0, 10))),
                PLANS_AUTONOMES
                  ? null
                  : h(
                      "td",
                      { style: "white-space:nowrap" },
                      (PARAMS.general || {}).module_etiquettes
                        ? h(
                            "button",
                            {
                              class: "btn petit",
                              title: "Tableau électrique (étiquettes, schéma, nomenclature) d'après les circuits du plan",
                              onclick: e => {
                                e.stopPropagation();
                                aller("plans", { id: p.id, etiquettes: true });
                              },
                            },
                            "→ Tableau"
                          )
                        : null,
                      (PARAMS.general || {}).module_etiquettes && p.etiquettes_le
                        ? h(
                            "span",
                            { class: "sous", style: "margin-left:6px", title: "Tableau déjà fait depuis ce plan" },
                            "fait le " + dateFr(p.etiquettes_le)
                          )
                        : null,
                      (PARAMS.plans || {}).ouvrages_actif
                        ? h(
                            "div",
                            { style: "margin-top:3px" },
                            h(
                              "button",
                              {
                                class: "btn petit",
                                title: "Ouvrages du catalogue d'après les appareils du plan, dans son devis (un lot, une partie par pièce)",
                                onclick: e => {
                                  e.stopPropagation();
                                  aller("plans", { id: p.id, devis: true });
                                },
                              },
                              "→ Devis"
                            ),
                            p.devis_le ? h("span", { class: "sous", style: "margin-left:6px" }, "fait le " + dateFr(p.devis_le)) : null
                          )
                        : null
                    )
              )
            )
          )
        )
      : h(
          "p",
          { class: "aide" },
          "Aucun plan. « + Nouveau plan » pour dessiner une implantation électrique (murs, portes, fenêtres, prises, interrupteurs, lumières, circuits)."
        )
  );
}
async function nouveauPlan(v, rattacher) {
  const p = await api("POST", "/api/plans", Object.assign({ nom: "Plan", donnees: plNouvellesDonnees() }, v));
  await aller("plans", { id: p.id, rattacher }); // (nouveau plan depuis la liste : choisir tout de suite client, devis, adresse)
}
const SECTION_GENRE_PLAN = { eclairage: "eclairage", etiquettes: "etiquettes" };
const ouvrirPlanOuEtude = p => aller(SECTION_GENRE_PLAN[p.genre] || "plans", { id: p.id });
const LIB_GENRE_PLAN = {
  plan: "Plan",
  eclairage: "Étude d'éclairement",
  etiquettes: "Tableau électrique",
};
/** tableaux d'une même installation (plusieurs tableaux reliés) : regroupés en une entrée ; renvoie des
 *  { plan } ou { groupe: [plans…], tete } dans l'ordre de la liste */
function regrouperTableaux(plans) {
  const parGroupe = new Map();
  for (const p of plans)
    if (p.genre === "etiquettes" && p.armoire_groupe) {
      if (!parGroupe.has(p.armoire_groupe)) parGroupe.set(p.armoire_groupe, []);
      parGroupe.get(p.armoire_groupe).push(p);
    }
  const vus = new Set(),
    out = [];
  for (const p of plans) {
    const g = p.genre === "etiquettes" && p.armoire_groupe ? parGroupe.get(p.armoire_groupe) : null;
    if (!g || g.length < 2) out.push({ plan: p });
    else if (!vus.has(p.armoire_groupe)) {
      vus.add(p.armoire_groupe);
      // (le tableau de tête d'abord : celui qui n'est alimenté par aucun autre)
      const tete = g.find(x => !x.armoire_parent) || g[0];
      out.push({ groupe: [tete, ...g.filter(x => x !== tete)], tete });
    }
  }
  return out;
}
/** cellule dépliable : « N tableaux — tableau de tête » puis la liste, chaque tableau s'ouvre d'un clic */
function celluleTableaux(groupe, apresClic) {
  return h(
    "details",
    { class: "groupe-tableaux", onclick: e => e.stopPropagation() },
    h(
      "summary",
      { title: "Installation à plusieurs tableaux : déplier pour les voir" },
      `${groupe.length} tableaux — ${groupe[0].nom || "Tableau"}`
    ),
    h(
      "ul",
      {},
      groupe.map(p =>
        h(
          "li",
          {},
          h(
            "a",
            {
              href: "#",
              onclick: e => {
                e.preventDefault();
                if (apresClic) apresClic();
                ouvrirPlanOuEtude(p);
              },
            },
            p.nom || "Tableau"
          ),
          p.modifie_le ? h("span", { class: "sous" }, " · " + dateFr(String(p.modifie_le).slice(0, 10))) : null
        )
      )
    )
  );
}

/** fenêtre « Client, devis, adresse » d'un plan ou d'une étude d'éclairement (même table « plans ») */
async function rattacherPlan(p, titre, apres) {
  const [clients, tousDevis] = await Promise.all([api("GET", "/api/clients"), api("GET", "/api/documents?type=devis")]);
  let clientId = p.client_id || null;
  const nomDe = c => nom_client_js(c) + (c.ville ? " (" + c.ville + ")" : "");
  // client : tapez une partie du nom, la liste se réduit
  const champC = h("input", { type: "text", autocomplete: "off", placeholder: "Tapez le nom du client…" });
  const cl0 = clients.find(c => String(c.id) === String(clientId));
  if (cl0) champC.value = nomDe(cl0);
  const listeC = listeSousChamp(
    champC,
    () =>
      clients
        .map(nomDe)
        .filter(n => !champC.value.trim() || n.toLowerCase().includes(champC.value.trim().toLowerCase()))
        .slice(0, 60),
    v => {
      champC.value = v;
      const c = clients.find(x => nomDe(x) === v);
      choisirClient(c ? c.id : null).catch(erreur);
    }
  );
  champC.addEventListener("change", () => {
    if (!champC.value.trim()) choisirClient(null).catch(erreur);
  });
  // devis : ceux du client choisi, sinon tous (choisir un devis choisit son client)
  const selD = h("select", {});
  const adr = h("textarea", { rows: 2 }, p.adresse || "");
  const selAdr = h("select", { class: "cache", style: "margin-top:4px" });
  selAdr.addEventListener("change", () => {
    if (selAdr.value) {
      adr.value = selAdr.value;
      selAdr.value = "";
    }
  });
  const libDevis = x => [x.numero || "", x.objet || "", clientId ? "" : "— " + (x.client_nom || "")].filter(Boolean).join(" ");
  const chargerDevis = () => {
    const docs = clientId ? tousDevis.filter(x => String(x.client_id) === String(clientId)) : tousDevis;
    const garde = selD.value || p.document_id || "";
    selD.replaceChildren(h("option", { value: "" }, "— aucun —"), ...docs.map(x => h("option", { value: x.id }, libDevis(x))));
    selD.value = docs.some(x => String(x.id) === String(garde)) ? garde : "";
  };
  const chargerAdresses = async () => {
    selAdr.classList.add("cache");
    if (!clientId) return;
    const cl = await api("GET", "/api/clients/" + clientId);
    const rue = k => [(k.adresse || "").replace(/\n/g, ", "), [k.cp, k.ville].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    const l = [
      rue(cl) ? [cl.nom_affiche || nom_client_js(cl), rue(cl)].join("\n") : null,
      ...(cl.contacts || []).filter(k => k.adresse || k.ville).map(k => [k.nom, rue(k)].filter(Boolean).join("\n")),
    ].filter(Boolean);
    selAdr.replaceChildren(
      h("option", { value: "" }, `Choisir une adresse du client ou de ses contacts (${l.length})…`),
      ...l.map(a => h("option", { value: a }, a.replace("\n", " — ")))
    );
    selAdr.classList.toggle("cache", !l.length);
  };
  async function choisirClient(id) {
    clientId = id;
    chargerDevis();
    const c = clients.find(x => String(x.id) === String(id));
    if (c && !adr.value.trim()) adr.value = [c.adresse, [c.cp, c.ville].filter(Boolean).join(" ")].filter(Boolean).join("\n");
    await chargerAdresses();
  }
  selD.addEventListener("change", () => {
    const x = tousDevis.find(v => String(v.id) === selD.value);
    // (adresse du chantier : celle du devis — son contact ou son adresse de chantier —, sinon celle du client ;
    //  posée avant le client, pour qu'il ne la remplace pas par la sienne)
    if (x && x.chantier_adresse) adr.value = x.chantier_adresse;
    else if (x && x.client_id && String(x.client_id) !== String(clientId)) adr.value = "";
    if (x && x.client_id && String(x.client_id) !== String(clientId)) {
      const c = clients.find(v => v.id === x.client_id);
      if (c) champC.value = nomDe(c);
      choisirClient(x.client_id).catch(erreur);
    } else if (x && !x.chantier_adresse && !adr.value.trim()) {
      const c = clients.find(v => String(v.id) === String(x.client_id));
      if (c) adr.value = [c.adresse, [c.cp, c.ville].filter(Boolean).join(" ")].filter(Boolean).join("\n");
    }
  });
  chargerDevis();
  await chargerAdresses();
  ouvrirModale(
    titre,
    h(
      "div",
      { class: "pile" },
      h("label", { class: "champ" }, h("span", {}, "Client"), h("div", { style: "position:relative" }, champC, listeC)),
      h(
        "label",
        { class: "champ" },
        h("span", {}, "Devis"),
        selD,
        h("span", { class: "aide" }, "Sans client choisi : tous les devis ; choisir un devis choisit son client.")
      ),
      h("label", { class: "champ" }, h("span", {}, "Adresse du chantier"), adr, selAdr)
    ),
    [
      h("button", { class: "btn", onclick: fermerModale }, "Annuler"),
      h(
        "button",
        {
          class: "btn principal",
          onclick: async () => {
            try {
              await api("PUT", "/api/plans/" + p.id, { client_id: clientId || null, document_id: selD.value || null, adresse: adr.value });
              Object.assign(p, await api("GET", "/api/plans/" + p.id), { donnees: undefined });
              fermerModale();
              if (apres) apres();
            } catch (e) {
              erreur(e);
            }
          },
        },
        "Enregistrer"
      ),
    ],
    { largeur: "min(620px, 94vw)" }
  );
}

/* ---------- éditeur ---------- */
/** symboles du plan en fichiers .svg (web/symboles/plan, puis ceux de l'utilisateur du même nom, dossier « symboles »
 *  des données) : ils remplacent les dessins intégrés ; cadre -20…20, le mur en bas (y = 20). Chargés une fois ; la
 *  version autonome (sans serveur) garde les dessins intégrés. */
let plSymbolesCharges = null;
function plChargerSymboles() {
  if (PLANS_AUTONOMES) return Promise.resolve();
  if (!plSymbolesCharges)
    plSymbolesCharges = api("GET", "/api/symboles")
      .then(r => {
        let change = false;
        for (const [cle, t] of Object.entries(r.plan || {})) {
          if (!SYMB[cle] || typeof etSvgVersDessin !== "function") continue;
          const des = etSvgVersDessin(t, 40, 40);
          if (!des) continue;
          const dessin = `<g transform="translate(-20 -20)">${des}</g>`;
          SYMB[cle].dessin = dessin;
          const i = SYMBOLES.findIndex(x => x[0] === cle);
          if (i >= 0) SYMBOLES[i][4] = dessin;
          change = true;
        }
        if (change) RECO_MODELES = null; // (modèles de la main levée refaits d'après les nouveaux dessins)
      })
      .catch(() => {
        /* (sans les fichiers : les dessins intégrés) */
      });
  return plSymbolesCharges;
}
async function ouvrirPlan(zone, id, arg) {
  await plChargerSymboles();
  const p = await api("GET", "/api/plans/" + id);
  const d = Object.assign(plNouvellesDonnees(), p.donnees || {});
  PL.plan = p;
  PL.d = d;
  TAILLE_SYMBOLE = Number(optPlans().taille_symbole) || 34;
  (d.symboles_perso || []).forEach(ajouterSymbolePerso); // (symboles importés sur un autre PC)
  symbolesPerso().forEach(ajouterSymbolePerso);
  if (!(d.niveaux || []).length) {
    d.niveaux = [{ id: "n0", nom: "Rez-de-chaussée" }];
    d.niveau = "n0";
  }
  if (!d.niveau || !d.niveaux.some(n => n.id === d.niveau)) d.niveau = d.niveaux[0].id;
  d.etages = d.etages || {};
  d.masques = d.masques || {};
  // (l'image du fond de plan n'entre pas dans l'historique : trop lourde pour 200 copies)
  const instantane = () => JSON.stringify(d, (k, v) => (k === "src" ? undefined : v));
  const etat = {
    outil: "selection",
    symbole: "prise",
    sel: new Set(),
    vue: d.vue || { x: -100, y: -100, z: 1 },
    mur: null,
    liaison: null,
    tape: "",
    piece: null,
    calib: null,
    replies: new Set(["materiel"]),
    histo: [instantane()],
    futur: [],
    circuitVu: null,
    survol: null,
    fondSrc: d.fond ? d.fond.src : null,
    matPiece: "",
  };
  const page = h("div", { class: "plan-page" });
  zone.append(page);

  /* -- enregistrement automatique -- */
  let minuterie = null,
    enCours = Promise.resolve();
  const statut = h("span", { class: "sous plan-statut" }, "");
  const enregistrer = () => {
    clearTimeout(minuterie);
    minuterie = setTimeout(() => {
      d.vue = etat.vue;
      enCours = enCours.then(() =>
        api("PUT", "/api/plans/" + p.id, { donnees: d, _modifie_le: p.modifie_le })
          .then(r => {
            p.modifie_le = r.modifie_le;
            statut.textContent = "Enregistré ✓";
          })
          .catch(e => {
            statut.textContent = "Non enregistré";
            erreur(e);
          })
      );
    }, 900);
    statut.textContent = "…";
  };
  // murs à longueur figée (m.fige) : leur longueur ne doit pas changer (sinon on revient en arrière)
  const figesChanges = () => {
    const avant = JSON.parse(etat.histo[etat.histo.length - 1] || "{}").murs || [];
    return avant.some(m0 => m0.fige && d.murs.some(m => m.id === m0.id && m.fige && Math.abs(dist(m.a, m.b) - dist(m0.a, m0.b)) > 0.5));
  };
  const AVIS_FIGE =
    "🔒 Ce mur a une longueur figée : il ne peut pas être allongé ni raccourci (décochez « Longueur figée » dans le panneau de droite).";
  /** numérotation automatique (⚙ Options > Dessin et symboles) : des symboles choisis, chacun avec son préfixe — par
   *  défaut les boîtes de dérivation, B1, B2… ; un nouveau : le numéro suivant, sur tous les niveaux */
  const NUMEROTATION_DEFAUT = [{ type: "boite", prefixe: "B" }];
  const reglesNumeros = () => {
    const l = optPlans().numerotation;
    return (Array.isArray(l) ? l : NUMEROTATION_DEFAUT).filter(r => r && r.type && SYMB[r.type] && r.prefixe);
  };
  const prefixeNum = type => (reglesNumeros().find(r => r.type === type) || {}).prefixe || null;
  function numeroterAuto(tout, seulType) {
    const tous = [...d.objets, ...Object.values(d.etages || {}).flatMap(n => (n && n.objets) || [])];
    for (const { type, prefixe } of reglesNumeros()) {
      if (seulType && type !== seulType) continue;
      const re = new RegExp("^" + prefixe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\d+)$");
      const toutes = tous.filter(o => o.type === type);
      if (tout) {
        // (renuméroter le niveau affiché : de gauche à droite, de haut en bas)
        const ici = d.objets.filter(o => o.type === type).sort((a, b) => Math.round(a.y / 150) - Math.round(b.y / 150) || a.x - b.x);
        const pris = new Set(toutes.filter(o => !ici.includes(o)).map(o => o.num));
        let n = 1;
        ici.forEach(o => {
          while (pris.has(prefixe + n)) n++;
          o.num = prefixe + n++;
        });
        continue;
      }
      let max = Math.max(0, ...toutes.map(o => Number(re.exec(o.num || "")?.[1] || 0)));
      toutes.forEach(o => {
        if (!o.num) o.num = prefixe + ++max;
      });
    }
  }
  /** traversée de plancher : la même, à la même place, sur le niveau du dessus (ou du dessous) ; les gaines passent de l'une à l'autre */
  function jumelerTraversee(ob, cible) {
    const i = rangNiveau(d.niveau);
    cible = cible || (d.niveaux[i + 1] || d.niveaux[i - 1] || {}).id;
    if (!cible || cible === d.niveau) return false;
    retirerJumeau(ob);
    d.etages = d.etages || {};
    const e = d.etages[cible] || (d.etages[cible] = {});
    e.objets = e.objets || [];
    const j = { id: plId(), genre: "symbole", type: "traversee", x: ob.x, y: ob.y, rot: 0, circuit: null, jumeau: ob.id };
    const dessus = rangNiveau(cible) > i;
    ob.cote = dessus ? "plafond" : "sol";
    j.cote = dessus ? "sol" : "plafond";
    ob.jumeau = j.id;
    e.objets.push(j);
    return true;
  }
  function retirerJumeau(ob) {
    if (!ob.jumeau) return;
    for (const [, e] of autresNiveaux())
      if (e && e.objets && e.objets.some(o => o.id === ob.jumeau)) {
        e.objets = e.objets.filter(o => o.id !== ob.jumeau);
        e.gaines = (e.gaines || []).filter(g => g.de !== ob.jumeau && g.vers !== ob.jumeau);
      }
    delete ob.jumeau;
  }
  /** niveaux liés : traversées suivies (même place), traversées et liens orphelins retirés */
  function majNiveauxLies() {
    for (const o of d.objets)
      if (o.type === "traversee" && o.jumeau) {
        const j = objetPartout(o.jumeau);
        if (j && j !== o) {
          j.x = o.x;
          j.y = o.y;
        }
      }
    for (const [, e] of autresNiveaux())
      if (e && e.objets && e.objets.some(o => o.type === "traversee" && o.jumeau && !objetPartout(o.jumeau))) {
        const morts = new Set(e.objets.filter(o => o.type === "traversee" && o.jumeau && !objetPartout(o.jumeau)).map(o => o.id));
        e.objets = e.objets.filter(o => !morts.has(o.id));
        e.gaines = (e.gaines || []).filter(g => !morts.has(g.de) && !morts.has(g.vers));
      }
    if (d.liens_niveaux) {
      d.liens_niveaux = d.liens_niveaux.filter(l => objetPartout(l.a) && objetPartout(l.b));
      if (!d.liens_niveaux.length) delete d.liens_niveaux;
    }
    for (const c of d.circuits || []) if (c.armoire && !tableauxPlan().some(t => t.id === c.armoire)) delete c.armoire;
  }
  /** lien vers un appareil d'un autre niveau (interrupteur en bas de l'escalier, lumière en haut…) ; le circuit suit */
  function fenetreLienNiveau(o) {
    const autres = autresNiveaux().filter(([, e]) => ((e && e.objets) || []).some(x => x.genre === "symbole" && !estNoeud(x)));
    if (!autres.length) {
      toast("Aucun appareil sur un autre niveau : ajoutez un niveau et posez-y l'appareil d'abord.", true);
      return;
    }
    const selN = h(
      "select",
      {},
      autres.map(([k]) => h("option", { value: k }, nomNiveau(k)))
    );
    const selA = h("select", { size: 8, style: "width:100%" });
    const remplir = () => {
      const e = d.etages[selN.value] || {};
      selA.replaceChildren(
        ...(e.objets || [])
          .filter(x => x.genre === "symbole" && !estNoeud(x) && !estDecor(x) && !["compteur"].includes(x.type))
          .sort(
            (a, b) =>
              String(a.piece || "").localeCompare(String(b.piece || ""), "fr") ||
              String((SYMB[a.type] || {}).libelle).localeCompare(String((SYMB[b.type] || {}).libelle), "fr")
          )
          .map(x =>
            h(
              "option",
              { value: x.id },
              ((SYMB[x.type] || {}).libelle || x.type) + (repereDe(x) ? " [" + repereDe(x) + "]" : "") + (x.piece ? " — " + x.piece : "")
            )
          )
      );
      if (selA.options.length) selA.selectedIndex = 0;
    };
    selN.addEventListener("change", remplir);
    remplir();
    ouvrirModale(
      "Lier à un appareil d'un autre niveau",
      h(
        "div",
        { class: "pile" },
        h(
          "p",
          { class: "aide", style: "margin:0" },
          "Comme une liaison, mais entre deux niveaux (interrupteur en bas de l'escalier et lumière à l'étage, va-et-vient sur deux niveaux…). Dessinée par une flèche « ↑ Étage » à côté de chaque appareil ; le circuit passe de l'un à l'autre."
        ),
        h("label", { class: "champ" }, h("span", {}, "Niveau"), selN),
        h("label", { class: "champ" }, h("span", {}, "Appareil"), selA)
      ),
      [
        h("button", { class: "btn", onclick: fermerModale }, "Annuler"),
        h(
          "button",
          {
            class: "btn principal",
            onclick: () => {
              const b = objetPartout(selA.value);
              if (!b) return;
              d.liens_niveaux = d.liens_niveaux || [];
              if (!d.liens_niveaux.some(l => (l.a === o.id && l.b === b.id) || (l.a === b.id && l.b === o.id)))
                d.liens_niveaux.push({ id: plId(), a: o.id, b: b.id });
              const ci = o.circuit || b.circuit;
              if (ci) {
                if (!o.circuit)
                  groupe(o.id).forEach(x => {
                    if (!x.circuit) x.circuit = ci;
                  });
                if (!b.circuit) b.circuit = ci;
              }
              fermerModale();
              valider();
              toast("Lien vers « " + nomNiveau(selN.value) + " » ajouté.");
            },
          },
          "Lier"
        ),
      ],
      { largeur: "min(520px, 96vw)" }
    );
  }
  const valider = () => {
    // un changement terminé : annuler possible, enregistré
    if (figesChanges()) {
      toast(AVIS_FIGE, true);
      restaurer(etat.histo[etat.histo.length - 1]);
      return;
    }
    // (boîtes de dérivation et tableau : jamais sur un circuit, ils servent à plusieurs)
    for (const o of d.objets) if (o.circuit && (NOEUDS_GAINE.includes(o.type) || o.type === "compteur")) o.circuit = null;
    // blocs d'appareillages (même boîtier / même plaque) : sans les appareils effacés ; un bloc d'un seul : défait
    if (d.blocs) {
      d.blocs = d.blocs.map(b => ({ ...b, membres: b.membres.filter(id => objetDe(id)) })).filter(b => b.membres.length > 1);
      if (!d.blocs.length) delete d.blocs;
    }
    majNiveauxLies();
    numeroterAuto();
    numeroterGaines();
    majPiecesObjets();
    // symboles importés utilisés : gardés dans le plan (il s'ouvre aussi sur un autre PC)
    const persos = [
      ...new Set(
        [...d.objets, ...Object.values(d.etages || {}).flatMap(n => (n && n.objets) || [])]
          .map(o => o.type)
          .filter(t => t && t.startsWith("perso_") && SYMB[t])
      ),
    ];
    if (persos.length || d.symboles_perso)
      d.symboles_perso = persos.map(t => {
        const x = SYMB[t];
        return { type: t, libelle: x.libelle, pose: x.pose, dessin: x.dessin, prof: x.prof, compte: x.compte || "" };
      });
    if (d.fond && d.fond.src) etat.fondSrc = d.fond.src;
    const s = instantane();
    if (s !== etat.histo[etat.histo.length - 1]) {
      etat.histo.push(s);
      if (etat.histo.length > 200) etat.histo.shift();
      etat.futur = [];
    }
    enregistrer();
    dessiner();
    majPanneau();
  };
  const restaurer = s => {
    const x = JSON.parse(s);
    Object.keys(d).forEach(k => delete d[k]);
    Object.assign(d, x);
    if (d.fond && !d.fond.src) d.fond.src = etat.fondSrc;
    etat.sel.clear();
    enregistrer();
    dessiner();
    majPanneau();
  };
  const annuler = () => {
    if (etat.histo.length > 1) {
      etat.futur.push(etat.histo.pop());
      restaurer(etat.histo[etat.histo.length - 1]);
    }
  };
  const retablir = () => {
    if (etat.futur.length) {
      const s = etat.futur.pop();
      etat.histo.push(s);
      restaurer(s);
    }
  };
  avantDeQuitter = async () => {
    clearTimeout(minuterie);
    d.vue = etat.vue;
    try {
      await api("PUT", "/api/plans/" + p.id, { donnees: d, _modifie_le: p.modifie_le });
    } catch (e) {
      /* */
    }
    return true;
  };

  /* -- en-tête : nom, client, devis, adresse -- */
  const nom = h("input", { type: "text", value: p.nom || "", style: "font-weight:600;flex:0 1 340px;min-width:160px" });
  nom.addEventListener("change", () =>
    api("PUT", "/api/plans/" + p.id, { nom: nom.value })
      .then(r => {
        p.modifie_le = r.modifie_le;
      })
      .catch(erreur)
  );
  const infos = h("span", { class: "sous cache-tablette" });
  const majInfos = () => {
    infos.textContent =
      [p.client_nom, p.document_numero && "devis " + p.document_numero, (p.adresse || "").split("\n")[0]].filter(Boolean).join(" · ") ||
      "rattaché à aucun client ni devis";
  };
  majInfos();
  const rattacher = () => rattacherPlan(p, "Rattacher le plan", majInfos);
  const barreHaut = h(
    "div",
    { class: "plan-haut" },
    h("button", { class: "btn", onclick: () => aller("plans") }, "← Plans"),
    nom,
    h("span", { class: "puce-beta", title: "Module en rodage : vos remarques sont bienvenues" }, "BÊTA"),
    PLANS_AUTONOMES ? null : infos,
    PLANS_AUTONOMES ? null : h("button", { class: "btn petit", onclick: () => rattacher().catch(erreur) }, "Client, devis, adresse…"),
    h("span", { class: "espace" }),
    statut,
    h("button", { class: "btn cache-tablette", title: "Ctrl+Z", onclick: annuler }, "↶"),
    h("button", { class: "btn cache-tablette", title: "Ctrl+Y", onclick: retablir }, "↷"),
    h(
      "button",
      {
        class: "btn dans-menu",
        title: "Importer l'image ou le PDF d'un plan existant, à dessiner par-dessus",
        onclick: () => fenetreFond(),
      },
      "Fond de plan…"
    ),
    h("button", { class: "btn dans-menu", title: "Options du module Plans", onclick: () => optionsPlan() }, "⚙ Options"),
    h(
      "button",
      {
        class: "btn dans-menu",
        title: "Format A4, A3 ou A3 en 2 feuilles A4, échelle, position sur la feuille",
        onclick: () => dialogueImpression(),
      },
      "Imprimer…"
    ),
    h(
      "button",
      {
        class: "btn dans-menu",
        title: "Chaque gaine, ses fils et leurs longueurs ; gaines et fils à prévoir (⚙ Options > longueurs)",
        onclick: () => {
          if (!optPlans().longueurs_actif) {
            toast("Activez d'abord « Longueurs des gaines et des fils » dans ⚙ Options.", true);
            return;
          }
          registreGaines();
        },
      },
      "Registre des gaines et moulures"
    ),
    ...(PLANS_AUTONOMES
      ? [
          h(
            "button",
            { class: "btn", title: "Imprimer le plan, ou l'enregistrer en PDF (A4, A3, échelle)", onclick: () => dialogueImpression() },
            iconeImprimante(),
            "PDF / Imprimer"
          ),
          h(
            "button",
            {
              class: "btn fichiers-autonome disquette",
              title: "Enregistrer mes plans dans un fichier",
              onclick: () => typeof window.exporterPlans === "function" && window.exporterPlans().catch(erreur),
            },
            "💾"
          ),
          h(
            "button",
            {
              class: "btn fichiers-autonome",
              title: "Ouvrir un fichier de plans",
              onclick: () => typeof window.importerPlans === "function" && window.importerPlans(),
            },
            "📂"
          ),
        ]
      : []),
    h(
      "button",
      {
        class: "btn bouton-tablette",
        title:
          "Mode tablette : grande barre de boutons à la place du clavier et du clic droit (Échap, Entrée, Suppr, R, Ctrl, Maj, longueurs…)",
        onclick: () => basculerTablette(),
      },
      "✋ Tablette"
    ),
    h(
      "button",
      { class: "btn bouton-aide-plan", title: "Mode d'emploi et raccourcis clavier (touche ?)", onclick: () => aidePlan() },
      h("span", { class: "aide-ic" }, "?"),
      h("span", { class: "aide-lib" }, " Aide")
    ),
    h(
      "button",
      {
        class: "btn bouton-menu-plan",
        title: "Fond de plan, options, imprimer, dupliquer, supprimer",
        onclick: e => {
          const r = e.currentTarget.getBoundingClientRect();
          const par = lib => [...barreHaut.querySelectorAll("button.dans-menu")].find(b => b.textContent.includes(lib));
          ouvrirMenuContextuel(
            r.right - 220,
            r.bottom + 4,
            [
              ["Fond de plan…", "🖼 Fond de plan…"],
              ["Options", "⚙ Options"],
              ["Imprimer", "🖨 Imprimer…"],
              ["Registre des gaines et moulures", "📏 Registre des gaines et moulures"],
              ["@materiel", "📋 Liste du matériel (imprimable)"],
              ["Dupliquer", "⧉ Dupliquer"],
              ["Supprimer", "🗑 Supprimer…"],
            ]
              .map(([l, lib]) => ({
                libelle: lib,
                action: () => {
                  if (l === "@materiel") return imprimerMateriel();
                  const b = par(l);
                  if (b) b.click();
                },
              }))
              .concat(
                etat.tablette
                  ? [
                      {
                        libelle: mainDroite() ? "✋ Boutons à gauche (gaucher)" : "✋ Boutons à droite (droitier)",
                        action: () => basculerMain(),
                      },
                    ]
                  : []
              )
          );
        },
      },
      "☰"
    ),
    h(
      "button",
      {
        class: "btn dans-menu",
        onclick: async () => {
          try {
            const n = await api("POST", `/api/plans/${p.id}/dupliquer`, {});
            aller("plans", { id: n.id });
          } catch (e) {
            erreur(e);
          }
        },
      },
      "Dupliquer"
    ),
    h(
      "button",
      {
        class: "btn danger dans-menu",
        onclick: async () => {
          if (!(await demanderOui("Supprimer ce plan ?"))) return;
          avantDeQuitter = null;
          await api("DELETE", "/api/plans/" + p.id);
          aller("plans");
        },
      },
      "Supprimer"
    )
  );

  /* -- options : ce plan, et tous les plans -- */
  const optionsPlan = () => {
    const o = optPlans();
    const nombreChamp = (v, min, max) => h("input", { type: "number", min, max, step: 1, value: v, style: "width:80px" });
    const ep = nombreChamp(d.epaisseur, 2, 80),
      gr = nombreChamp(d.grille, 1, 100);
    const coulM = h("input", { type: "color", value: o.couleur_moulure || "#0d9488", style: "width:60px;height:30px;padding:0" });
    const listeMo = h("input", { type: "text", value: o.moulures || MOULURES_DEFAUT, placeholder: MOULURES_DEFAUT });
    const coulGo = h("input", { type: "color", value: o.couleur_goulotte || "#7c3aed", style: "width:60px;height:30px;padding:0" });
    const listeGo = h("input", { type: "text", value: o.goulottes || GOULOTTES_DEFAUT, placeholder: GOULOTTES_DEFAUT });
    const alertes = h("input", { type: "checkbox", checked: !!o.alertes_nfc });
    const volumes = h("input", { type: "checkbox", checked: !!o.volumes_sdb });
    const tTexte = h(
      "select",
      {},
      [85, 100, 115, 130, 150, 175].map(v => h("option", { value: v }, v + " %"))
    );
    tTexte.value = String([85, 100, 115, 130, 150, 175].includes(Number(o.taille_texte)) ? Number(o.taille_texte) : 100);
    const taille = nombreChamp(o.taille_symbole, 15, 80),
      lp = nombreChamp(o.largeur_porte, 40, 250),
      lf = nombreChamp(o.largeur_fenetre, 30, 400);
    const attente = h(
      "select",
      {},
      [0.6, 0.8, 1, 1.2, 1.5, 2].map(v => h("option", { value: v }, String(v).replace(".", ",") + " s"))
    );
    attente.value = String([0.6, 0.8, 1, 1.2, 1.5, 2].includes(Number(o.attente_symboles)) ? Number(o.attente_symboles) : 1);
    const ligne = (lib, el, aideTxt) =>
      h("label", { class: "champ" }, h("span", {}, lib), el, aideTxt ? h("span", { class: "aide" }, aideTxt) : null);
    const gSec = h("input", { type: "checkbox", checked: o.gaine_section !== false }),
      gRep = h("input", { type: "checkbox", checked: o.gaine_repere !== false });
    const gDia = h("input", { type: "checkbox", checked: o.gaine_diametre !== false });
    const gPli = h("input", { type: "checkbox", checked: o.courber_apres_pose !== false });
    const tSymb = h(
      "select",
      {},
      h("option", { value: "fin" }, "Fins"),
      h("option", { value: "normal" }, "Normaux"),
      h("option", { value: "gras" }, "Gras")
    );
    const iSy = h(
      "select",
      {},
      h("option", { value: 0 }, "Comme à l'écran"),
      [4, 5, 6, 7, 8, 10, 12].map(v => h("option", { value: v }, v + " mm"))
    );
    const iTx = h(
      "select",
      {},
      h("option", { value: 0 }, "Comme à l'écran"),
      [2, 2.5, 3, 3.5, 4, 5].map(v => h("option", { value: v }, String(v).replace(".", ",") + " mm"))
    );
    iSy.value = String(o.imp_symb ?? 6);
    iTx.value = String(o.imp_texte ?? 3);
    tSymb.value = ["fin", "gras"].includes(o.traits_symboles) ? o.traits_symboles : "normal";
    const gNom = h("input", { type: "checkbox", checked: o.gaine_nom !== false }),
      gAuto = h("input", { type: "checkbox", checked: o.gaines_nommees !== false });
    const gMode = h(
      "select",
      {},
      h("option", { value: "arrivee" }, "de l'appareil d'arrivée (SA, PC…)"),
      h("option", { value: "depart" }, "de l'appareil de départ (gaine entre deux appareils)"),
      h("option", { value: "circuit" }, "du circuit (alimentation)")
    );
    gMode.value = o.gaine_repere_mode || "arrivee";
    const gAlim = h(
      "select",
      {},
      h("option", { value: "type" }, "Alim PC, Alim LUM… (couleur du circuit)"),
      h("option", { value: "numero" }, "Q1, Q2… (repère du disjoncteur)")
    );
    gAlim.value = o.repere_alim === "numero" ? "numero" : "type";
    const gLet = h(
      "select",
      {},
      h("option", { value: "fonction" }, "de fonction (P N T R V FP C)"),
      h("option", { value: "couleur" }, "de couleur (R B VJ V O G M N BLC)")
    );
    gLet.value = o.lettres_fils === "couleur" ? "couleur" : "fonction";
    const oAct = h("input", { type: "checkbox", checked: !!o.ouvrages_actif }),
      lAct = h("input", { type: "checkbox", checked: !!o.longueurs_actif });
    const tMes = h(
      "select",
      {},
      Object.entries(MESURES_GAINE).map(([v, l]) => h("option", { value: v }, l))
    );
    tMes.value = mesureDe({});
    const tChant = h(
      "select",
      {},
      Object.entries(TYPES_CHANTIER).map(([v, l]) => h("option", { value: v }, l))
    );
    tChant.value = TYPES_CHANTIER[o.chantier_defaut] ? o.chantier_defaut : "neuf";
    // (options rangées par onglets ; le dernier onglet ouvert est gardé sur ce PC)
    // (numérotation automatique : des symboles choisis, chacun son préfixe — ex. boîte B, prise PC, point lumineux L)
    let regles = (Array.isArray(optPlans().numerotation) ? optPlans().numerotation : [{ type: "boite", prefixe: "B" }]).map(r => ({
      ...r,
    }));
    const listeNum = h("div", { class: "pile", style: "gap:4px" });
    const majListeNum = () =>
      listeNum.replaceChildren(
        ...regles.map((r, i) => {
          const sel = h(
            "select",
            { style: "width:auto;max-width:240px" },
            ...SYMBOLES.filter(x => !x[0].startsWith("rep_") && !DECOR_TAILLE[x[0]]).map(x => h("option", { value: x[0] }, x[1]))
          );
          sel.value = r.type;
          sel.addEventListener("change", () => (r.type = sel.value));
          const px = h("input", { type: "text", value: r.prefixe || "", maxlength: 6, style: "width:70px", placeholder: "ex. PC" });
          px.addEventListener("change", () => (r.prefixe = px.value.trim()));
          return h(
            "div",
            { style: "display:flex;gap:6px;align-items:center" },
            sel,
            px,
            h("span", { class: "sous" }, "→ " + (r.prefixe || "?") + "1, " + (r.prefixe || "?") + "2…"),
            h(
              "button",
              {
                type: "button",
                class: "btn petit",
                title: "Ne plus numéroter ce symbole",
                onclick: () => {
                  regles.splice(i, 1);
                  majListeNum();
                },
              },
              "✕"
            )
          );
        }),
        h(
          "button",
          {
            type: "button",
            class: "btn petit",
            style: "align-self:flex-start",
            onclick: () => {
              regles.push({ type: "prise", prefixe: "PC" });
              majListeNum();
            },
          },
          "+ Numéroter un autre symbole"
        )
      );
    majListeNum();
    const ONGLETS_OPT = [
      ["dessin", "Dessin et symboles"],
      ["circuits", "Circuits"],
      ["gaines", "Pieuvre / moulure"],
      ["impression", "Impression"],
      ["devis", "Devis et métrés"],
    ];
    const sections = {
      dessin: h(
        "div",
        { class: "pile" },
        h("h4", { style: "margin:0" }, "Ce plan"),
        h(
          "div",
          { class: "deux" },
          ligne("Épaisseur des nouveaux murs (cm)", ep),
          ligne("Aimantation à la grille (cm)", gr, "Pas des points et des déplacements")
        ),
        h("h4", { style: "margin:8px 0 0" }, "Tous les plans"),
        h(
          "div",
          { class: "deux" },
          ligne(
            "Taille des symboles à l'écran (cm de la maison)",
            taille,
            "34 : un symbole couvre 34 cm du plan réel. Sur papier : taille en mm dans la fenêtre d'impression"
          ),
          ligne("Largeur des nouvelles portes (cm)", lp)
        ),
        h(
          "div",
          { class: "deux" },
          ligne("Largeur des nouvelles fenêtres (cm)", lf),
          ligne("Taille du texte de l'écran Plans", tTexte, "Liste des symboles, panneau de droite, outils")
        ),
        h("div", { class: "deux" }, ligne("Traits des symboles", tSymb, "À l'écran et à l'impression (gras : plus lisible sur papier)")),
        h("h4", { style: "margin:8px 0 0" }, "Numérotation automatique"),
        h(
          "p",
          { class: "aide", style: "margin:0" },
          "Chaque symbole de la liste reçoit son numéro (préfixe puis 1, 2…, sur tous les niveaux), affiché à côté de lui ; il se change dans le panneau de droite, « Renuméroter » les remet dans l'ordre."
        ),
        listeNum,
        h(
          "div",
          { class: "deux" },
          ligne(
            "Main levée, symboles : attente avant de reconnaître",
            attente,
            "Temps laissé après le dernier trait pour tracer la suite (lettres dans un rond…)"
          )
        ),
        h(
          "div",
          { style: "display:flex;gap:6px;flex-wrap:wrap" },
          h(
            "button",
            {
              class: "btn",
              onclick: () => {
                fermerModale();
                fenetreSymboles();
              },
            },
            "Symboles de la liste : affichés, rangés, importés…"
          ),
          h(
            "button",
            {
              class: "btn",
              title: "Groupes et symboles proposés par la roue (outil W, ou appui sur le plan en mode tablette)",
              onclick: () => {
                fermerModale();
                fenetreRoue();
              },
            },
            "Roue des symboles…"
          ),
          h(
            "button",
            {
              class: "btn",
              title: "Main levée, mode symboles : les lettres écrites dans un rond (LL, LV, PC…) et le symbole posé pour chacune",
              onclick: () => {
                fermerModale();
                fenetreAbreviations();
              },
            },
            "Abréviations lues à main levée…"
          )
        )
      ),
      circuits: h(
        "div",
        { class: "pile" },
        h(
          "label",
          { class: "case" },
          alertes,
          "Alertes NF C 15-100 (nombre de prises et de points lumineux par circuit, gaines et moulures plus petites que conseillé, volumes de salle d'eau) — décochée : aucune alerte"
        ),
        h(
          "div",
          { class: "sous", style: "margin:-4px 0 0 24px" },
          "Une aide pour électricien averti : les alertes peuvent comporter des erreurs ou des oublis (module en développement) et ne remplacent ni la norme ni la vérification sur place."
        ),
        h("label", { class: "case" }, volumes, "Dessiner les volumes de la salle d'eau (V1, V2 autour de la douche et de la baignoire)"),
        h(
          "div",
          {},
          h(
            "button",
            {
              class: "btn",
              title: "Appareils qui ont leur propre circuit (disjoncteur dédié) dès qu'on les pose, et leur calibre",
              onclick: () => {
                fermerModale();
                fenetreSpeciaux();
              },
            },
            "Circuits spécialisés…"
          )
        )
      ),
      gaines: h(
        "div",
        { class: "pile" },
        h(
          "div",
          { style: "display:flex;gap:14px;flex-wrap:wrap" },
          h("label", { class: "case" }, gRep, "Repère des fils (SA, PC…)"),
          h("label", { class: "case" }, gSec, "Section des fils"),
          h("label", { class: "case" }, gDia, "Diamètre de la gaine"),
          h("label", { class: "case" }, gNom, "Nom de la gaine (A, B…)"),
          h(
            "label",
            { class: "case", title: "Chaque nouvelle gaine reçoit la première lettre libre ; le nom se change dans son panneau" },
            gAuto,
            "Nommer les nouvelles gaines"
          ),
          h(
            "label",
            {
              class: "case",
              title:
                "À la souris : après la pose, la gaine (ou la liaison) suit le pointeur ; le clic suivant la fixe (sans bouger : trait droit)",
            },
            gPli,
            "Courber juste après la pose"
          )
        ),
        h(
          "div",
          { class: "deux" },
          ligne(
            "Fils tapés dans une gaine : lettres",
            gLet,
            "R rouge, B bleu, VJ vert/jaune, V violet, O orange, G gris, M marron, N noir, BLC blanc"
          )
        ),
        h(
          "div",
          { class: "deux" },
          ligne("Gaines entre boîtes : repère des alimentations", gAlim, "Gaine du tableau à une boîte, ou d'une boîte à l'autre")
        ),
        h(
          "div",
          { class: "deux" },
          ligne("Repère écrit", gMode),
          h(
            "div",
            { style: "align-self:end" },
            h(
              "div",
              { style: "display:flex;gap:6px;flex-wrap:wrap" },
              h(
                "button",
                {
                  class: "btn",
                  onclick: () => {
                    fermerModale();
                    fenetreReperesGaines();
                  },
                },
                "Repères et fils par appareil…"
              ),
              h(
                "button",
                {
                  class: "btn",
                  onclick: () => {
                    fermerModale();
                    fenetreDiametres();
                  },
                },
                "Diamètres des gaines…"
              ),
              h(
                "button",
                {
                  class: "btn",
                  onclick: () => {
                    fermerModale();
                    fenetreCouleursFils();
                  },
                },
                "Couleurs des fils…"
              )
            )
          )
        ),
        h(
          "div",
          { class: "deux" },
          ligne("Couleur des moulures", coulM, "Trait des moulures (apparent), pour les reconnaître des gaines"),
          ligne(
            "Tailles de moulures (largeur × épaisseur, mm)",
            listeMo,
            "Séparées par des virgules, ex. 22x12, 32x12 : celles que vous posez ; la plus petite qui convient est conseillée"
          )
        ),
        h(
          "div",
          { class: "deux" },
          ligne("Couleur des goulottes", coulGo, "Goulotte : comme une moulure, plus grosse (2e appui sur le bouton Gaine)"),
          ligne("Tailles de goulottes (largeur × hauteur, mm)", listeGo, "Ex. 40x25, 60x40, 80x50")
        )
      ),
      impression: h(
        "div",
        { class: "pile" },
        h(
          "div",
          { class: "deux" },
          ligne("Impression : taille des symboles sur le papier", iSy, "Proposée pour les plans pas encore imprimés"),
          ligne("Impression : taille des textes et cotes", iTx)
        ),
        h(
          "p",
          { class: "aide", style: "margin:0" },
          "Le reste (format, échelle, légende, cartouche, calques imprimés) se règle dans la fenêtre Imprimer de chaque plan."
        )
      ),
      devis: h(
        "div",
        { class: "pile" },
        PLANS_AUTONOMES
          ? null
          : h("label", { class: "case" }, oAct, "Récupérer les ouvrages du plan dans son devis (bouton « → Devis » de la liste des plans)"),
        PLANS_AUTONOMES
          ? null
          : h(
              "div",
              { class: "deux" },
              ligne("Type de chantier proposé", tChant),
              h(
                "div",
                { style: "align-self:end" },
                h(
                  "button",
                  {
                    class: "btn",
                    title:
                      "L'ouvrage du catalogue à mettre dans le devis pour chaque genre d'appareil, en maison neuve, rénovation ou sous moulure",
                    onclick: () => {
                      fermerModale();
                      fenetreOuvragesPlan().catch(erreur);
                    },
                  },
                  "Ouvrages des appareils…"
                )
              )
            ),
        h("label", { class: "case" }, lAct, "Longueurs des gaines et des fils (pieuvre) et registre des gaines et moulures imprimable"),
        h(
          "div",
          { class: "deux" },
          ligne(
            "Parcours des gaines mesuré",
            tMes,
            "La courbe d'une gaine sert souvent à la lisibilité du plan : elle n'est comptée qu'avec « le tracé dessiné ». Chaque gaine peut avoir sa mesure, ou une longueur imposée (panneau de la gaine). Les moulures : toujours leur tracé le long des murs, montées et descentes comprises."
          ),
          h(
            "div",
            { style: "align-self:end" },
            h(
              "button",
              {
                class: "btn",
                onclick: () => {
                  fermerModale();
                  fenetreHauteurs();
                },
              },
              "Hauteurs et réserves…"
            )
          )
        )
      ),
    };
    let ongletOpt = "dessin";
    try {
      ongletOpt = localStorage.getItem("plan_onglet_options") || "dessin";
    } catch (e) {
      /* */
    }
    if (!sections[ongletOpt]) ongletOpt = "dessin";
    const barreOpt = h("div", {
      class: "onglets-options",
      style: "display:flex;gap:4px;flex-wrap:wrap;border-bottom:1px solid var(--bord, #e5e7eb);padding-bottom:6px",
    });
    const montrerOpt = k => {
      ongletOpt = k;
      try {
        localStorage.setItem("plan_onglet_options", k);
      } catch (e) {
        /* */
      }
      Object.entries(sections).forEach(([x, el]) => {
        el.style.display = x === k ? "" : "none";
      });
      barreOpt.replaceChildren(
        ...ONGLETS_OPT.map(([x, lib]) =>
          h("button", { type: "button", class: "btn petit" + (x === k ? " principal" : ""), onclick: () => montrerOpt(x) }, lib)
        )
      );
    };
    montrerOpt(ongletOpt);
    ouvrirModale(
      "Options des plans",
      h("div", { class: "pile" }, barreOpt, h("div", { style: "min-height:320px" }, ...Object.values(sections))),
      [
        h("button", { class: "btn", onclick: fermerModale }, "Annuler"),
        h(
          "button",
          {
            class: "btn principal",
            onclick: async () => {
              try {
                d.epaisseur = Math.max(2, nombre(ep.value) || 20);
                d.grille = Math.max(1, nombre(gr.value) || 5);
                const plans = {
                  ...(PARAMS.plans || {}),
                  alertes_nfc: alertes.checked,
                  volumes_sdb: volumes.checked,
                  taille_symbole: Math.max(15, nombre(taille.value) || 34),
                  taille_texte: Number(tTexte.value) || 100,
                  largeur_porte: Math.max(40, nombre(lp.value) || 83),
                  largeur_fenetre: Math.max(30, nombre(lf.value) || 120),
                  epaisseur: d.epaisseur,
                  grille: d.grille,
                  attente_symboles: Number(attente.value) || 1,
                  gaine_section: gSec.checked,
                  gaine_repere: gRep.checked,
                  gaine_diametre: gDia.checked,
                  gaine_repere_mode: gMode.value,
                  courber_apres_pose: gPli.checked,
                  gaine_nom: gNom.checked,
                  gaines_nommees: gAuto.checked,
                  lettres_fils: gLet.value,
                  repere_alim: gAlim.value,
                  traits_symboles: tSymb.value,
                  imp_symb: Number(iSy.value),
                  imp_texte: Number(iTx.value),
                  ouvrages_actif: oAct.checked,
                  longueurs_actif: lAct.checked,
                  chantier_defaut: tChant.value,
                  mesure_gaines: tMes.value,
                  couleur_moulure: coulM.value,
                  moulures: listeMo.value.trim() || null,
                  couleur_goulotte: coulGo.value,
                  goulottes: listeGo.value.trim() || null,
                  numerotation: regles.filter(r => r.type && r.prefixe),
                };
                majVersionParams(await api("PUT", "/api/parametres", { plans }));
                PARAMS.plans = Object.assign(PARAMS.plans || {}, plans);
                const recoller = retenirCollage();
                TAILLE_SYMBOLE = plans.taille_symbole;
                recoller();
                d.taille_symb = TAILLE_SYMBOLE;
                zoomInterface();
                fermerModale();
                valider();
              } catch (e) {
                erreur(e);
              }
            },
          },
          "Enregistrer"
        ),
      ],
      { largeur: "min(620px, 94vw)" }
    );
  };

  /** épaisseur des traits des symboles (⚙ Options : fin, normal, gras) ; les symboles dessinés à l'échelle 0,4
   *  (trait de 3,5) sont ramenés à la même épaisseur que les autres */
  const traitSymb = () => ({ fin: 1.4, normal: 2, gras: 2.7 })[optPlans().traits_symboles] || 2;
  const dessinTrait = des => String(des || "").replace(/stroke-width="3\.5"/g, `stroke-width="${(traitSymb() / 0.4).toFixed(2)}"`);
  /* -- symboles : ceux affichés dans la liste de gauche, et ceux importés (SVG) -- */
  const enregistrerPlans = async modif => {
    const plans = { ...(PARAMS.plans || {}), ...modif };
    majVersionParams(await api("PUT", "/api/parametres", { plans }));
    PARAMS.plans = plans;
  };
  /** abréviations écrites dans un rond (main levée, mode symboles) et symbole posé pour chacune : à personnaliser */
  function fenetreAbreviations() {
    const permises = new Set(Object.keys(LETTRES_TRAITS));
    const options = [
      ["rep_libre", "◯ Cercle avec ces lettres écrites dedans"],
      ...SYMBOLES.filter(x => !MASQUES.includes(x[0]) && x[0] !== "rep_libre")
        .map(x => [x[0], x[1] + " (" + catVue(x[0]) + ")"])
        .sort(parNom),
    ];
    const lignes = h("div", { style: "display:flex;flex-direction:column;gap:4px;max-height:52vh;overflow:auto;padding-right:4px" });
    const ajouterLigne = (abr, type) => {
      const t = h("input", {
        type: "text",
        value: abr || "",
        maxlength: 6,
        style: "width:90px;text-transform:uppercase;font-weight:700",
        placeholder: "ex. PAC",
      });
      const sel = h(
        "select",
        { style: "flex:1;min-width:0" },
        options.map(([v, lib]) => h("option", { value: v }, lib))
      );
      sel.value = SYMB[type] ? type : "rep_libre";
      const ic = svgEl("svg", { viewBox: "-20 -20 40 40", width: 26, height: 26 });
      const majIc = () => {
        ic.innerHTML =
          '<g stroke="currentColor" fill="currentColor" stroke-width="1.6">' +
          (sel.value === "rep_libre" ? dessinRepere(t.value.toUpperCase() || "?") : SYMB[sel.value].dessin) +
          "</g>";
      };
      t.addEventListener("input", majIc);
      sel.addEventListener("change", majIc);
      majIc();
      const l = h(
        "div",
        { style: "display:flex;gap:6px;align-items:center" },
        t,
        ic,
        sel,
        h("button", { class: "icone", title: "Retirer cette abréviation", onclick: () => l.remove() }, "✕")
      );
      l.lire = () => [t.value.trim().toUpperCase().replace(/\s+/g, ""), sel.value];
      lignes.append(l);
      return t;
    };
    const remplir = liste => {
      lignes.replaceChildren();
      liste.forEach(([a, ty]) => ajouterLigne(a, ty));
    };
    remplir(abreviationsActives());
    ouvrirModale(
      "Abréviations lues à main levée",
      h(
        "div",
        { class: "pile" },
        h(
          "p",
          { class: "aide", style: "margin:0" },
          "Main levée en mode symboles : écrivez ces lettres en majuscules, séparées, dans un rond (ou un rectangle) tracé d'un seul trait ; le symbole choisi est posé. Lettres reconnues : ",
          h("b", {}, [...permises].join(" ")),
          "."
        ),
        lignes,
        h(
          "div",
          { style: "display:flex;gap:6px;flex-wrap:wrap" },
          h(
            "button",
            {
              class: "btn petit",
              onclick: () => {
                const t = ajouterLigne("", "rep_libre");
                t.focus();
                lignes.scrollTop = lignes.scrollHeight;
              },
            },
            "+ Ajouter une abréviation"
          ),
          h("button", { class: "btn petit", onclick: () => remplir(ABREVIATIONS) }, "Revenir à la liste d'origine")
        )
      ),
      [
        h("button", { class: "btn", onclick: fermerModale }, "Annuler"),
        h(
          "button",
          {
            class: "btn principal",
            onclick: async () => {
              const liste = [...lignes.children].map(l => l.lire()).filter(([a]) => a);
              const mauvaises = liste.filter(([a]) => [...a].some(c => !permises.has(c))).map(([a]) => a);
              if (mauvaises.length) {
                toast(
                  "Lettres non reconnues dans : " + mauvaises.join(", ") + " (lettres possibles : " + [...permises].join(" ") + ").",
                  true
                );
                return;
              }
              try {
                await enregistrerPlans({ abreviations: liste });
                fermerModale();
                toast(liste.length + " abréviation(s) enregistrée(s).");
              } catch (e) {
                erreur(e);
              }
            },
          },
          "Enregistrer"
        ),
      ],
      { largeur: "min(640px, 96vw)" }
    );
  }
  function fenetreSymboles() {
    const masques = new Set(optPlans().symboles_masques || []);
    // (catégorie choisie par symbole : rangement de la liste de gauche, des options et des ouvrages ; rien d'autre ne change)
    const categories = { ...(optPlans().categories || {}) },
      catIci = t => categories[t] || (SYMB[t] || {}).categorie || "Divers";
    const coches = new Map(SYMBOLES.map(x => [x[0], !masques.has(x[0])]));
    const liste = h("div", { style: "max-height:46vh;overflow:auto;border:1px solid #e3e6ec;border-radius:6px;padding:6px 10px" });
    const changerCat = (types, nouvelle) => {
      for (const t of types) {
        if (nouvelle === (SYMB[t] || {}).categorie) delete categories[t];
        else categories[t] = nouvelle;
      }
      rendre();
    };
    const rendre = () => {
      const syms = SYMBOLES.filter(x => !MASQUES.includes(x[0])),
        cats = [...new Set(syms.map(x => catIci(x[0])))];
      liste.replaceChildren(
        ...cats.flatMap(cat => {
          const dans = syms.filter(x => catIci(x[0]) === cat);
          return [
            h(
              "div",
              { style: "font-weight:700;margin:8px 0 2px;display:flex;gap:8px;align-items:center" },
              cat,
              h(
                "button",
                {
                  class: "btn petit",
                  onclick: () => {
                    const v = !dans.every(x => coches.get(x[0]));
                    dans.forEach(x => coches.set(x[0], v));
                    rendre();
                  },
                },
                "tout / rien"
              ),
              h(
                "button",
                {
                  class: "btn petit",
                  title: "Renommer cette catégorie",
                  onclick: async () => {
                    const n = await demanderTexte("Nouveau nom de la catégorie « " + cat + " » :", cat);
                    if (n && n.trim() && n.trim() !== cat)
                      changerCat(
                        dans.map(x => x[0]),
                        n.trim()
                      );
                  },
                },
                "✎ renommer"
              )
            ),
            h(
              "div",
              { style: "display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:2px 12px" },
              dans.map(([t, lib]) => {
                const c = h("input", { type: "checkbox", checked: coches.get(t) });
                c.addEventListener("change", () => coches.set(t, c.checked));
                const ic = svgEl("svg", { viewBox: "-20 -20 40 40", width: 20, height: 20 });
                ic.innerHTML = '<g stroke="currentColor" fill="currentColor" stroke-width="1.6">' + SYMB[t].dessin + "</g>";
                const sc = h(
                  "select",
                  { title: "Ranger dans la catégorie…", style: "width:22px;padding:0;font-size:11px;flex:none" },
                  h("option", { value: "" }, "⇄"),
                  cats.filter(x => x !== cat).map(x => h("option", { value: x }, "→ " + x)),
                  h("option", { value: "@nouvelle" }, "→ Nouvelle catégorie…")
                );
                sc.addEventListener("change", async () => {
                  let v = sc.value;
                  if (v === "@nouvelle") v = ((await demanderTexte("Nom de la nouvelle catégorie :", "")) || "").trim();
                  if (v) changerCat([t], v);
                  else sc.value = "";
                });
                return h(
                  "div",
                  { style: "display:flex;gap:4px;align-items:center" },
                  h("label", { class: "case", style: "align-items:center;flex:1;min-width:0" }, c, ic, lib),
                  sc
                );
              })
            ),
          ];
        })
      );
    };
    rendre();
    // import d'un symbole (fichier SVG)
    const fichier = h("input", { type: "file", accept: ".svg,image/svg+xml" });
    const nomS = h("input", { type: "text", placeholder: "ex. Radiateur sèche-serviettes 2" });
    const pose = h(
      "select",
      {},
      h("option", { value: "mur" }, "Contre un mur"),
      h("option", { value: "plafond" }, "Au plafond (centré dans la pièce)"),
      h("option", { value: "libre" }, "Libre")
    );
    const compte = h(
      "select",
      {},
      h("option", { value: "" }, "Rien de spécial"),
      h("option", { value: "prise" }, "une prise"),
      h("option", { value: "lumiere" }, "un point lumineux"),
      h("option", { value: "commande" }, "une commande (interrupteur…)")
    );
    const apercuS = h("span", {});
    let dessin = null;
    fichier.addEventListener("change", async () => {
      const f = fichier.files[0];
      if (!f) return;
      try {
        dessin = svgVersDessin(await f.text());
        if (!nomS.value) nomS.value = f.name.replace(/\.svg$/i, "");
        const ic = svgEl("svg", { viewBox: "-20 -20 40 40", width: 40, height: 40 });
        ic.innerHTML = '<g stroke="currentColor" fill="none" stroke-width="1.6">' + dessin + "</g>";
        apercuS.replaceChildren(ic);
      } catch (e) {
        dessin = null;
        erreur(e);
      }
    });
    const perso = symbolesPerso();
    const listePerso = h(
      "div",
      {},
      perso.length
        ? perso.map(x =>
            h(
              "div",
              { style: "display:flex;gap:8px;align-items:center" },
              (() => {
                const ic = svgEl("svg", { viewBox: "-20 -20 40 40", width: 22, height: 22 });
                ic.innerHTML = '<g stroke="currentColor" fill="none" stroke-width="1.6">' + x.dessin + "</g>";
                return ic;
              })(),
              h("span", { style: "flex:1" }, x.libelle),
              h(
                "button",
                {
                  class: "icone",
                  title: "Retirer ce symbole de la liste (les plans qui l'utilisent le gardent)",
                  onclick: async () => {
                    if (!(await demanderOui("Retirer « " + x.libelle + " » de la liste ?"))) return;
                    try {
                      await enregistrerPlans({ symboles_perso: symbolesPerso().filter(v => v.type !== x.type) });
                      fermerModale();
                      majPalette();
                      fenetreSymboles();
                    } catch (e) {
                      erreur(e);
                    }
                  },
                },
                "✕"
              )
            )
          )
        : h("p", { class: "sous" }, "Aucun symbole importé.")
    );
    ouvrirModale(
      "Symboles de la liste",
      h(
        "div",
        { class: "pile" },
        h(
          "p",
          { class: "aide", style: "margin:0" },
          "Décochez les symboles que vous n'utilisez pas (par exemple un doublon entre un symbole et son repère cercle + lettres) : ils ne sont plus proposés dans la liste de gauche. Ceux déjà posés restent sur les plans. ⇄ : ranger un symbole dans une autre catégorie (ou une nouvelle) ; ✎ renommer une catégorie. Le rangement sert à la liste de gauche, aux calques et aux ouvrages des appareils."
        ),
        liste,
        PLANS_AUTONOMES
          ? null
          : h(
              "div",
              { class: "encadre", style: "display:flex;flex-direction:column;gap:6px" },
              h("b", {}, "Changer le dessin d'un symbole de la liste"),
              h(
                "p",
                { class: "aide", style: "margin:0" },
                "Un fichier .svg du même nom (prise.svg, inter.svg…) dans le sous-dossier « plan » du dossier des symboles remplace le dessin du logiciel (modèles : web\\symboles\\plan du dossier du logiciel ; voir le LISEZ-MOI). Puis Ctrl+F5."
              ),
              h(
                "button",
                {
                  type: "button",
                  class: "btn",
                  style: "align-self:flex-start",
                  onclick: async () => {
                    try {
                      const r = await api("POST", "/api/symboles/ouvrir");
                      toast("Dossier ouvert : " + r.chemin + " — sous-dossier « plan ».");
                    } catch (e) {
                      erreur(e);
                    }
                  },
                },
                "🖌 Ouvrir le dossier des symboles"
              )
            ),
        h("h4", { style: "margin:10px 0 0" }, CAT_PERSO),
        listePerso,
        h(
          "div",
          { class: "encadre", style: "display:flex;flex-direction:column;gap:6px" },
          h("b", {}, "Importer un symbole (fichier SVG)"),
          h("div", { style: "display:flex;gap:8px;align-items:center" }, fichier, apercuS),
          h("label", { class: "champ" }, h("span", {}, "Nom"), nomS),
          h(
            "div",
            { class: "deux" },
            h("label", { class: "champ" }, h("span", {}, "Pose"), pose),
            h("label", { class: "champ" }, h("span", {}, "Compte comme"), compte)
          ),
          h(
            "button",
            {
              class: "btn",
              style: "align-self:flex-start",
              onclick: async () => {
                if (!dessin) {
                  toast("Choisissez d'abord un fichier SVG (dessiné dans Inkscape, téléchargé…).", true);
                  return;
                }
                const def = {
                  type: "perso_" + plId(),
                  libelle: nomS.value.trim() || "Symbole",
                  pose: pose.value,
                  compte: compte.value,
                  dessin,
                  prof: pose.value === "mur" ? 10 : 12,
                };
                try {
                  await enregistrerPlans({ symboles_perso: [...symbolesPerso(), def] });
                  ajouterSymbolePerso(def);
                  fermerModale();
                  majPalette();
                  toast("Symbole ajouté à « " + CAT_PERSO + " ».");
                } catch (e) {
                  erreur(e);
                }
              },
            },
            "Ajouter à la liste"
          )
        )
      ),
      [
        h("button", { class: "btn", onclick: fermerModale }, "Annuler"),
        h(
          "button",
          {
            class: "btn principal",
            onclick: async () => {
              try {
                await enregistrerPlans({ symboles_masques: [...coches].filter(([, v]) => !v).map(([t]) => t), categories });
                fermerModale();
                majPalette();
              } catch (e) {
                erreur(e);
              }
            },
          },
          "Enregistrer"
        ),
      ],
      { largeur: "min(860px, 96vw)" }
    );
  }

  /* -- outils -- */
  const outils = [
    ["selection", "↖ Sélection", "V"],
    ["mur", "▭ Mur", "M"],
    ["rectangle", "⬚ Rectangle", "E"],
    ["porte", "◜ Porte", "P"],
    ["fenetre", "▤ Fenêtre", "F"],
    ["main", "✍ Main levée", "H"],
    ["gomme", "⌫ Gomme", "X"],
    ["piece", "▢ Pièce", "S"],
    ["liaison", "⤳ Liaison", "L"],
    ["gaine", "⌇ Gaine", "U"],
    ["texte", "T Texte", "T"],
    ["roue", "◎ Roue", "W"],
  ];
  // main levée : deux modes, choisis à l'appui sur le bouton (murs, ou symboles et portes) — pas de confusion entre les deux
  const LETTRE_MAIN = { murs: "M", symboles: "S", gaines: "G", notes: "N" },
    LIB_MAIN = { murs: "murs", symboles: "symboles", gaines: "gaines", notes: "notes" };
  try {
    const m = localStorage.getItem("dfa_plan_main");
    etat.modeMain = LETTRE_MAIN[m] ? m : "murs"; // (0.33.0-0.33.1 y rangeaient aussi « droite » / « gauche » : ignoré)
  } catch (e) {
    etat.modeMain = "murs";
  }
  if (!LETTRE_MAIN[etat.modeMain]) etat.modeMain = "murs";
  try {
    etat.couleurNote = localStorage.getItem("dfa_plan_note") || "#dc2626";
  } catch (e) {
    etat.couleurNote = "#dc2626";
  }
  try {
    etat.formeNote = localStorage.getItem("dfa_plan_forme") || "libre";
  } catch (e) {
    etat.formeNote = "libre";
  }
  /** notes : forme tirée d'un point à l'autre (gardée comme un trait, comme le dessin libre) */
  function formeNote(a, b, forme) {
    if (forme === "rect") return [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }, a];
    if (forme === "cercle") {
      const cx = (a.x + b.x) / 2,
        cy = (a.y + b.y) / 2,
        rx = Math.abs(b.x - a.x) / 2,
        ry = Math.abs(b.y - a.y) / 2;
      return Array.from({ length: 49 }, (_, i) => ({
        x: cx + rx * Math.cos((i / 48) * 2 * Math.PI),
        y: cy + ry * Math.sin((i / 48) * 2 * Math.PI),
      }));
    }
    if (forme === "fleche") {
      const L = Math.hypot(b.x - a.x, b.y - a.y) || 1,
        ux = (b.x - a.x) / L,
        uy = (b.y - a.y) / L,
        t = Math.min(L * 0.4, Math.max(L * 0.2, 14 / etat.vue.z));
      const pointe = s => ({ x: b.x - t * (ux * Math.cos(s) - uy * Math.sin(s)), y: b.y - t * (uy * Math.cos(s) + ux * Math.sin(s)) });
      return [a, b, pointe(0.45), b, pointe(-0.45)];
    }
    return [a, b];
  }
  const choisirMain = mode => {
    etat.modeMain = mode;
    try {
      localStorage.setItem("dfa_plan_main", mode);
    } catch (e) {
      /* */
    }
    majBoutonsOptions();
    choisirOutil("main");
  };
  const menuMain = bouton => {
    const r = bouton.getBoundingClientRect();
    const enColonne = !!bouton.closest(".plan-outils-col"); // (colonne d'icônes : menu à droite ; barre : menu dessous)
    ouvrirMenuContextuel(enColonne ? r.right + 4 : r.left, enColonne ? r.top : r.bottom + 4, [
      { titre: "Dessin à main levée" },
      { libelle: "▭ Murs, pièces et portes" + (etat.modeMain === "murs" ? "  ✓" : ""), action: () => choisirMain("murs") },
      {
        libelle: "⚡ Symboles électriques et liaisons" + (etat.modeMain === "symboles" ? "  ✓" : ""),
        action: () => choisirMain("symboles"),
      },
      {
        libelle: "⌇ Gaines (pieuvre) : un trait de la boîte à l'appareil" + (etat.modeMain === "gaines" ? "  ✓" : ""),
        action: () => choisirMain("gaines"),
      },
      { libelle: "✏ Notes libres (dessin, annotations)" + (etat.modeMain === "notes" ? "  ✓" : ""), action: () => choisirMain("notes") },
    ]);
  };
  etat.genrePorte = "porte";
  etat.genreMur = "droit"; // (outil Mur : murs droits, ou arrondi entre deux murs)
  // (outil Porte : [lettre du bouton, libellé court, libellé du menu])
  const GENRES_PORTE = {
    porte: ["P", "Porte", "Porte (battant)"],
    passage: ["L", "Libre", "Libre, sans porte"],
    galandage: ["G", "Galandage", "Porte coulissante à galandage (dans la cloison)"],
    applique: ["A", "Applique", "Porte coulissante en applique (sur le mur)"],
  };
  // l'icône et le libellé des outils à options montrent le choix en cours
  const ICONE_MAIN = { murs: "✍", symboles: "⚡", gaines: "⌇", notes: "✏" };
  const svgIcone = corps =>
    `<svg viewBox="0 0 20 20" width="1.15em" height="1.15em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="vertical-align:-0.2em">${corps}</svg>`;
  const ICONES_SVG = {
    porte: svgIcone(
      '<path d="M0.5 17h4.5M15.5 17h4" stroke-width="3"/><path d="M5 17V6" stroke-width="2.6"/><path d="M5 6A11 11 0 0 1 16 17" stroke-width="1.2" stroke-dasharray="1.8 1.4"/>'
    ),
    passage: svgIcone(
      '<path d="M1 14h5M14 14h5" stroke-width="3.2"/><path d="M6 10v8M14 10v8" stroke-width="1.8"/><path d="M8 14h4" stroke-width="1.2" stroke-dasharray="1 1.6"/>'
    ),
    piece: svgIcone(
      '<rect x="2" y="2" width="16" height="16" rx="1.5" stroke-width="1.8"/><text x="10" y="14.6" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor" stroke="none" font-family="sans-serif">P</text>'
    ),
  };
  function majBoutonsOptions() {
    const bmur = boutonsOutils.find(x => x.dataset.outil === "mur");
    if (bmur) {
      const arr = etat.genreMur === "arrondi";
      bmur.dataset.mode = arr ? "R" : "";
      bmur.querySelector(".ic-outil").textContent = arr ? "◠" : "▭";
      bmur.querySelector(".lib-outil").textContent = arr ? " Arrondi" : " Mur";
      bmur.title = (arr ? "Arrondir l'angle entre deux murs" : "Murs droits") + " — touche M (2e appui : mur droit ou arrondi)";
    }
    const bm = boutonsOutils.find(x => x.dataset.outil === "main"),
      bp = boutonsOutils.find(x => x.dataset.outil === "porte"),
      bg = boutonsOutils.find(x => x.dataset.outil === "gaine");
    if (bg) {
      const c = etat.conduitOutil;
      bg.dataset.mode = c === "moulure" ? "M" : c === "goulotte" ? "O" : "G";
      bg.querySelector(".ic-outil").textContent = c === "goulotte" ? "▭" : c === "moulure" ? "▬" : "⌇";
      bg.querySelector(".lib-outil").textContent = " " + CONDUITS[c].replace(" ICTA", "");
    }
    if (bm) {
      bm.dataset.mode = LETTRE_MAIN[etat.modeMain];
      bm.querySelector(".ic-outil").textContent = ICONE_MAIN[etat.modeMain];
      bm.querySelector(".lib-outil").textContent = " Main levée : " + LIB_MAIN[etat.modeMain];
      bm.title = "Main levée : " + LIB_MAIN[etat.modeMain] + " — touche H (2e appui : changer de mode)";
    }
    if (bp) {
      const pass = etat.genrePorte === "passage",
        gp = GENRES_PORTE[etat.genrePorte] || GENRES_PORTE.porte;
      bp.dataset.mode = gp[0];
      bp.querySelector(".ic-outil").innerHTML = ICONES_SVG[pass ? "passage" : "porte"];
      bp.querySelector(".lib-outil").textContent = " " + gp[1];
      bp.title = gp[2] + " — touche P (2e appui : porte, libre, à galandage, en applique)";
    }
  }
  // outil Gaine : gaines (encastré) ou moulures (apparent) ; les deux sur le même plan
  try {
    const c0 = localStorage.getItem("dfa_plan_conduit");
    etat.conduitOutil = c0 === "moulure" || c0 === "goulotte" ? c0 : "gaine";
  } catch (e) {
    etat.conduitOutil = "gaine";
  }
  const choisirConduit = c => {
    etat.conduitOutil = c;
    try {
      localStorage.setItem("dfa_plan_conduit", c);
    } catch (e) {
      /* */
    }
    majBoutonsOptions();
    choisirOutil("gaine");
  };
  const menuGaine = bouton => {
    const r = bouton.getBoundingClientRect(),
      enColonne = !!bouton.closest(".plan-outils-col");
    ouvrirMenuContextuel(enColonne ? r.right + 4 : r.left, enColonne ? r.top : r.bottom + 4, [
      { titre: "Nouvelles gaines" },
      { libelle: "⌇ Gaine ICTA (encastré)" + (etat.conduitOutil === "gaine" ? "  ✓" : ""), action: () => choisirConduit("gaine") },
      {
        libelle: "▬ Moulure (apparent, collée au mur)" + (etat.conduitOutil === "moulure" ? "  ✓" : ""),
        action: () => choisirConduit("moulure"),
      },
      {
        libelle: "▭ Goulotte (apparent, plus grosse)" + (etat.conduitOutil === "goulotte" ? "  ✓" : ""),
        action: () => choisirConduit("goulotte"),
      },
    ]);
  };
  const choisirGenreMur = g => {
    etat.genreMur = g;
    majBoutonsOptions();
    choisirOutil("mur");
  };
  const menuMur = bouton => {
    const r = bouton.getBoundingClientRect(),
      enColonne = !!bouton.closest(".plan-outils-col");
    ouvrirMenuContextuel(enColonne ? r.right + 4 : r.left, enColonne ? r.top : r.bottom + 4, [
      { titre: "Outil Mur" },
      { libelle: "▭ Murs droits" + (etat.genreMur !== "arrondi" ? "  ✓" : ""), action: () => choisirGenreMur("droit") },
      {
        libelle: "◠ Arrondi : le bout de deux murs, puis le rayon" + (etat.genreMur === "arrondi" ? "  ✓" : ""),
        action: () => choisirGenreMur("arrondi"),
      },
    ]);
  };
  const menuPorte = bouton => {
    const r = bouton.getBoundingClientRect(),
      enColonne = !!bouton.closest(".plan-outils-col");
    ouvrirMenuContextuel(enColonne ? r.right + 4 : r.left, enColonne ? r.top : r.bottom + 4, [
      { titre: "Ouverture à poser sur un mur" },
      ...Object.entries(GENRES_PORTE).map(([k, [, , lib]]) => ({
        libelle: lib + (etat.genrePorte === k ? "  ✓" : ""),
        action: () => {
          etat.genrePorte = k;
          majBoutonsOptions();
          choisirOutil("porte");
        },
      })),
    ]);
  };
  const boutonsOutils = outils.map(([o, lib, touche]) =>
    h(
      "button",
      {
        class: "btn petit",
        "data-outil": o,
        title: lib.slice(2) + " — touche " + touche,
        onclick: e => {
          e.currentTarget.blur();
          // (outils à options : un appui prend l'outil avec l'option déjà choisie ; un 2e appui ouvre le menu pour en changer)
          if (o === "main") {
            if (etat.outil === "main") menuMain(e.currentTarget);
            else choisirMain(etat.modeMain);
          } else if (o === "mur") {
            if (etat.outil === "mur") menuMur(e.currentTarget);
            else choisirOutil("mur");
          } else if (o === "porte") {
            if (etat.outil === "porte") menuPorte(e.currentTarget);
            else choisirOutil("porte");
          } else if (o === "gaine") {
            if (etat.outil === "gaine") menuGaine(e.currentTarget);
            else choisirOutil("gaine");
          } else choisirOutil(o);
        },
      },
      h("span", { class: "ic-outil" }, lib.split(" ")[0]),
      h("span", { class: "lib-outil" }, " " + lib.split(" ").slice(1).join(" ")),
      h("kbd", { class: "rc" }, touche)
    )
  );
  // (cotes : avant la 0.68.23, une liste « tous les murs / principales / aucune » ; maintenant des cases)
  if (d.cotes_ext === undefined) {
    d.cotes_ext = (d.cotes || "toutes") === "toutes";
    d.cotes_principales = d.cotes === "principales";
  }
  // niveaux (étages) : un plan par niveau, circuits communs
  const selNiveau = h("select", {
    title: "Niveau affiché (étage). Les circuits sont communs à tous les niveaux.",
    style: "width:auto;max-width:200px",
  });
  const majNiveaux = () => {
    selNiveau.replaceChildren(
      ...d.niveaux.map(n => h("option", { value: n.id }, "Niveau : " + (n.nom || "?"))),
      h("option", { value: "+" }, "＋ Ajouter un niveau…"),
      h("option", { value: "~" }, "✎ Renommer ce niveau…"),
      d.niveaux.length > 1 && d.niveaux[0].id !== d.niveau ? h("option", { value: "<" }, "↓ Placer ce niveau plus bas") : "",
      d.niveaux.length > 1 && d.niveaux[d.niveaux.length - 1].id !== d.niveau
        ? h("option", { value: ">" }, "↑ Placer ce niveau plus haut")
        : "",
      d.niveaux.length > 1 ? h("option", { value: "-" }, "✕ Supprimer ce niveau…") : ""
    );
    selNiveau.value = d.niveau;
  };
  selNiveau.addEventListener("change", async () => {
    const v = selNiveau.value;
    selNiveau.blur();
    if (v === "+") {
      const n = await demanderTexte(
        "Nom du nouveau niveau (ex. Étage, Sous-sol, Combles) :",
        d.niveaux.length === 1 ? "Étage" : "Niveau " + (d.niveaux.length + 1)
      );
      if (n && n.trim()) {
        const id = plId();
        d.niveaux.push({ id, nom: n.trim() });
        changerNiveau(id, true);
      } else majNiveaux();
      return;
    }
    if (v === "~") {
      const nv = d.niveaux.find(x => x.id === d.niveau);
      const n = await demanderTexte("Nom de ce niveau :", nv.nom || "");
      if (n && n.trim()) {
        nv.nom = n.trim();
        valider();
      }
      majNiveaux();
      return;
    }
    if (v === "<" || v === ">") {
      // (ordre des niveaux : du plus bas au plus haut — ex. un sous-sol ajouté après coup, placé sous le rez-de-chaussée)
      const i = d.niveaux.findIndex(x => x.id === d.niveau),
        j = v === "<" ? i - 1 : i + 1;
      if (i >= 0 && j >= 0 && j < d.niveaux.length) {
        [d.niveaux[i], d.niveaux[j]] = [d.niveaux[j], d.niveaux[i]];
        valider();
      }
      majNiveaux();
      return;
    }
    if (v === "-") {
      const nv = d.niveaux.find(x => x.id === d.niveau);
      if (await demanderOui("Supprimer le niveau « " + nv.nom + " » et tout ce qui est dessiné dessus ?")) {
        const autre = d.niveaux.find(x => x.id !== d.niveau);
        vider();
        d.niveaux = d.niveaux.filter(x => x !== nv);
        changerNiveau(autre.id, false, true);
      } else majNiveaux();
      return;
    }
    changerNiveau(v);
  });
  const CHAMPS_NIVEAU = ["murs", "ouvertures", "objets", "liaisons", "gaines", "pieces", "fond", "blocs"];
  /** fond d'un autre niveau, gardé en vue sur tous les niveaux (case de la fenêtre du fond) */
  function fondAutreNiveau() {
    for (const e of Object.values(d.etages || {})) if (e && e.fond && e.fond.tous && e.fond.src) return e.fond;
    return null;
  }
  function vider() {
    d.murs = [];
    d.ouvertures = [];
    d.objets = [];
    d.liaisons = [];
    d.gaines = [];
    d.pieces = [];
    d.fond = null;
    d.blocs = [];
  }
  /** passe à un autre niveau : celui affiché est rangé dans « etages », l'autre est sorti */
  async function changerNiveau(id, nouveau, sansRanger) {
    if (id === d.niveau) {
      majNiveaux();
      return;
    }
    if (!sansRanger) d.etages[d.niveau] = Object.fromEntries(CHAMPS_NIVEAU.map(k => [k, d[k]]));
    const n = d.etages[id] || {};
    delete d.etages[id];
    d.murs = n.murs || [];
    d.ouvertures = n.ouvertures || [];
    d.objets = n.objets || [];
    d.liaisons = n.liaisons || [];
    d.gaines = n.gaines || [];
    d.pieces = n.pieces || [];
    d.fond = n.fond || null;
    d.blocs = n.blocs || [];
    if (d.fond && d.fond.src) etat.fondSrc = d.fond.src;
    d.niveau = id;
    etat.sel = new Set();
    // nouveau niveau : les murs extérieurs du niveau d'où l'on vient, pour partir du même contour
    if (nouveau && !d.murs.length) {
      const dessous = Object.values(d.etages).pop();
      if (dessous && (dessous.murs || []).length && (await demanderOui("Reprendre les murs du niveau précédent comme point de départ ?")))
        d.murs = JSON.parse(JSON.stringify(dessous.murs));
    }
    majNiveaux();
    choisirOutil("selection"); // (jamais le mur d'office : un appui de trop dessinait un mur)
    valider();
  }
  // calques : ce qui est affiché (et imprimé)
  const CALQUES_FIXES = [
    ["murs", "Murs, portes et fenêtres"],
    ["cotes", "Cotes"],
    ["pieces", "Pièces (noms, surfaces)"],
    ["electricite", "Électricité (tous les appareils)"],
  ];
  const CALQUES_FIN = [
    ["liaisons", "Liaisons"],
    ["gaines", "Gaines et fils (pieuvre)"],
    ["textes", "Textes"],
    ["notes", "Notes à main levée"],
    ["fond", "Fond de plan"],
  ];
  const vu = k => !(d.masques || {})[k];
  // (boîtes de dérivation et tableau : pas cachés avec une famille, ex. « Prises » : ils portent les gaines de tous les circuits)
  const symboleVu = o =>
    NOEUDS_GAINE.includes(o.type) ? vu("electricite") || vu("gaines") : vu("electricite") && vu("cat:" + catVue(o.type));
  /** calques : bloc du panneau de droite (ce qui est affiché et imprimé) */
  function blocCalques() {
    const cats = [...new Set(d.objets.filter(o => o.genre === "symbole" && SYMB[o.type]).map(o => catVue(o.type)))];
    const ligneC = (k, lib, retrait) => {
      const c = h("input", { type: "checkbox", checked: vu(k) });
      c.addEventListener("change", () => {
        d.masques[k] = !c.checked;
        if (c.checked) delete d.masques[k];
        etat.sel = new Set();
        valider();
      });
      return h("label", { class: "case", style: retrait ? "padding-left:18px" : "" }, c, lib);
    };
    const dessous = h("input", { type: "checkbox", checked: !!d.voirDessous });
    dessous.addEventListener("change", () => {
      d.voirDessous = dessous.checked;
      valider();
    });
    return h(
      "div",
      { class: "plan-bloc plan-calques-bloc", "data-cle": "calques" },
      h("h4", {}, "Calques"),
      CALQUES_FIXES.map(([k, l]) => ligneC(k, l)),
      cats.map(c => ligneC("cat:" + c, c, true)),
      CALQUES_FIN.map(([k, l]) => ligneC(k, l)),
      d.niveaux.length > 1 ? h("label", { class: "case" }, dessous, "Niveau du dessous en transparence") : null,
      h(
        "div",
        { style: "display:flex;gap:6px;margin-top:6px;flex-wrap:wrap" },
        h(
          "button",
          {
            class: "btn petit",
            onclick: () => {
              d.masques = {};
              valider();
            },
          },
          "Tout afficher"
        ),
        h(
          "button",
          {
            class: "btn petit",
            title: "Cache tous les appareils et les liaisons",
            onclick: () => {
              d.masques = { electricite: true, liaisons: true };
              valider();
            },
          },
          "Plan seul"
        )
      )
    );
  }
  // colonnes de gauche (symboles) et de droite (panneau) repliables, retenu sur cet appareil
  let colonnes = {};
  try {
    colonnes = JSON.parse(localStorage.getItem("dfa_plan_colonnes") || "{}") || {};
  } catch (e) {
    /* */
  }
  const majColonnes = () => {
    page.classList.toggle("sans-palette", !!colonnes.palette);
    page.classList.toggle("sans-panneau", !!colonnes.panneau);
    if (etat.tablette) {
      // (colonne d'icônes : un pictogramme par colonne, en couleur quand elle est affichée)
      btPalette.textContent = "◧";
      btPanneau.textContent = "◨";
      btPalette.classList.toggle("actif", !colonnes.palette);
      btPanneau.classList.toggle("actif", !colonnes.panneau);
    } else {
      btPalette.classList.remove("actif");
      btPanneau.classList.remove("actif");
      btPalette.textContent = colonnes.palette ? "▸ Symboles" : "◂";
      btPanneau.textContent = colonnes.panneau ? "Panneau ◂" : "▸";
    }
  };
  const basculerColonne = c => {
    colonnes[c] = !colonnes[c];
    try {
      localStorage.setItem("dfa_plan_colonnes", JSON.stringify(colonnes));
    } catch (e) {
      /* */
    }
    majColonnes();
  };
  const btPalette = h("button", {
    class: "btn petit",
    title: "Afficher / masquer la colonne des symboles (gauche)",
    onclick: e => {
      e.currentTarget.blur();
      basculerColonne("palette");
    },
  });
  const btPanneau = h("button", {
    class: "btn petit",
    title: "Afficher / masquer le panneau de droite (élément choisi, pièces, circuits, matériel)",
    onclick: e => {
      e.currentTarget.blur();
      basculerColonne("panneau");
    },
  });
  const barreOutils = h("div", { class: "plan-outils" }, btPalette, ...boutonsOutils, btPanneau);
  // (barre trop étroite pour tout tenir sur une ligne : seuls les pictogrammes et les touches restent ; survol : le nom)
  const tasserOutils = () => {
    barreOutils.classList.remove("compacte");
    const b = barreOutils.children;
    if (b.length && b[b.length - 1].offsetTop > b[0].offsetTop + 4) barreOutils.classList.add("compacte");
  };
  try {
    new ResizeObserver(() => tasserOutils()).observe(barreOutils);
  } catch (e) {
    /* */
  }
  const palette = h("div", { class: "plan-palette" });
  const toucheDe = t => Object.keys(TOUCHES_SYMBOLES).find(k => TOUCHES_SYMBOLES[k] === t);
  const cherche = h("input", { type: "search", class: "plan-cherche", placeholder: "Chercher un symbole…" });
  const listeSymb = h("div", {});
  palette.append(cherche, listeSymb);
  const sansAcc = t =>
    (t || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  /** liste de gauche : symboles non masqués (⚙ Options), filtrés par la recherche */
  function majPalette() {
    const masques = new Set([...MASQUES, ...(optPlans().symboles_masques || [])]),
      q = sansAcc(cherche.value.trim());
    const dispo = SYMBOLES.filter(x => !masques.has(x[0]) && (!q || sansAcc(x[1] + " " + catVue(x[0])).includes(q)));
    const cats = [...new Set(dispo.map(x => catVue(x[0])))];
    // (catégories repliables, repliées au départ ; ouvertes pendant une recherche ; état gardé sur ce PC)
    let ouvertes;
    try {
      ouvertes = new Set(JSON.parse(localStorage.getItem("plan_cat_ouvertes") || "[]"));
    } catch (e) {
      ouvertes = new Set();
    }
    const basculer = cat => {
      ouvertes.has(cat) ? ouvertes.delete(cat) : ouvertes.add(cat);
      try {
        localStorage.setItem("plan_cat_ouvertes", JSON.stringify([...ouvertes]));
      } catch (e) {
        /* */
      }
      majPalette();
    };
    listeSymb.replaceChildren(
      ...cats.flatMap(cat => {
        const ouverte = !!q || ouvertes.has(cat),
          n = dispo.filter(x => catVue(x[0]) === cat).length;
        return [
          h(
            "button",
            {
              class: "plan-cat repliable" + (ouverte ? " ouverte" : ""),
              type: "button",
              title: ouverte ? "Replier" : "Déplier",
              onclick: e => {
                e.currentTarget.blur();
                if (!q) basculer(cat);
              },
            },
            h("span", { class: "fleche" }, ouverte ? "▾" : "▸"),
            " " + cat,
            h("span", { class: "sous" }, " " + n)
          ),
          ...(!ouverte
            ? []
            : dispo
                .filter(x => catVue(x[0]) === cat)
                .map(([t, lib]) => {
                  const tc = toucheDe(t);
                  return h(
                    "button",
                    {
                      class: "plan-symb" + (etat.outil === "symbole" && etat.symbole === t ? " actif" : ""),
                      "data-symbole": t,
                      title: lib + (tc ? " — touche " + tc.toUpperCase() : ""),
                      onclick: e => {
                        e.currentTarget.blur();
                        etat.symbole = t;
                        choisirOutil("symbole");
                      },
                    },
                    (() => {
                      const sv = svgEl("svg", { viewBox: "-20 -20 40 40", width: 26, height: 26 });
                      sv.innerHTML = '<g stroke="currentColor" fill="currentColor" stroke-width="1.6">' + SYMB[t].dessin + "</g>";
                      return sv;
                    })(),
                    h("span", {}, lib),
                    tc ? h("kbd", { class: "rc" }, tc.toUpperCase()) : null
                  );
                })),
        ];
      })
    );
    if (!dispo.length) listeSymb.append(h("p", { class: "sous", style: "padding:6px" }, "Aucun symbole."));
  }
  cherche.addEventListener("input", majPalette);
  cherche.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const b = listeSymb.querySelector(".plan-symb");
      if (b) b.click();
      cherche.blur();
    }
    if (e.key === "Escape") {
      cherche.value = "";
      majPalette();
      cherche.blur();
    }
  });
  majPalette();
  majNiveaux();
  const choisirOutil = o => {
    etat.recent = null; // (poignée du dernier posé : seulement tant qu'on reste dans l'outil)
    fermerRoue();
    clearTimeout(etat.minuterieMain);
    etat.traits = null;
    etat.trace = null;
    etat.gomme = null;
    if (etat.calib) {
      etat.calib = null;
      barreReco.style.display = "none";
    }
    if (etat.pli) {
      etat.pli = null;
      valider();
    } // (gaine ou liaison qu'on courbait : gardée telle quelle)
    etat.outil = o;
    etat.mur = null;
    etat.arrondi1 = null;
    etat.liaison = null;
    etat.gaine = null;
    etat.piece = null;
    etat.calib = null;
    etat.rect = null;
    etat.tape = "";
    etat.apercu = {};
    boutonsOutils.forEach(b => b.classList.toggle("principal", b.dataset.outil === o));
    palette.querySelectorAll(".plan-symb").forEach(b => b.classList.toggle("actif", o === "symbole" && b.dataset.symbole === etat.symbole));
    majPaletteNotes();
    aide.textContent = {
      selection:
        "Clic : choisir · Ctrl+clic ou Maj+clic : ajouter · cadre dans le vide · Ctrl+A : tout · glisser : déplacer (un mur glisse d'équerre et étire les murs reliés) · double-clic sur un appareil : son groupe de liaisons · poignées : taille d'un appareil, courbe d'une liaison · Suppr · R : tourner · ? : aide",
      mur:
        etat.genreMur === "arrondi"
          ? "Arrondi : clic sur le 1er mur, puis sur le 2e, sur leur moitié côté arrondi (le bout le plus proche est pris) ; tapez le rayon (cm) : l'angle devient un arc de cercle (ils n'ont pas besoin de se toucher) ; deux murs parallèles : arc de l'un à l'autre · rayon à changer : choisissez l'arrondi (panneau de droite) · M : murs droits · Échap ou clic droit : sélection"
          : "Clic : point de départ, puis clic à chaque angle · angles droits automatiques (Maj : angle libre) · tapez une longueur (ex. 3,45) puis Entrée · double-clic ou clic droit : fin du mur · Échap ou clic droit : sélection",
      rectangle:
        "Pièce rectangulaire : clic sur un angle puis sur l'angle opposé (ou glisser) · ou tapez les dimensions en mètres (ex. 4,5x3) puis Entrée · les murs déjà là ne sont pas doublés · Échap ou clic droit : sélection",
      main:
        etat.modeMain === "notes"
          ? "Main levée, notes : dessinez librement au doigt ou à la souris (flèches, entourages, mots…) ; couleur en haut du plan · calque « Notes » pour les cacher à l'écran et à l'impression · H : passer aux murs · une note se choisit avec Sélection (Suppr pour l'effacer)"
          : etat.modeMain === "gaines"
            ? "Main levée, gaines : un trait de la boîte (ou du tableau, ou d'un appareil pour un repiquage) jusqu'à l'appareil : gaine qui suit votre trait · plusieurs traits à la suite · H : mode suivant · ↶ (Ctrl+Z) pour annuler · Échap ou clic droit : sélection"
            : etat.modeMain === "symboles"
              ? "Main levée, symboles : dessinez un symbole électrique (DCL, interrupteur, prise…) : il est reconnu et remplacé — les autres possibilités s'affichent dans une barre ; un trait d'un appareil à un autre : liaison · H : mode suivant · ↶ (Ctrl+Z) pour annuler · Échap ou clic droit : sélection"
              : "Main levée, murs : dessinez le tour d'une pièce d'un seul trait : murs droits (carré, rectangle, pièce en L…) ; trait non fermé : murs ; quart de cercle (avec ou sans battant) contre un mur : porte · H : mode suivant · ↶ (Ctrl+Z) pour annuler · Échap ou clic droit : sélection",
      gomme:
        "Gomme : appuyez sur un mur et glissez le long de lui : au milieu du mur, le morceau devient un passage (les pièces restent séparées) ; jusqu'au bout du mur, le mur est raccourci · sur une note à main levée : glissez, chaque note touchée s'efface · la longueur s'affiche pendant le geste · ↶ (Ctrl+Z) pour annuler · Échap ou clic droit : sélection",
      porte:
        "Clic sur un mur : poser une porte (ou une ouverture libre, sans porte : 2e appui sur le bouton Porte) (réglez ensuite largeur, sens et charnières à droite) · Échap ou clic droit : sélection",
      roue: "Roue des symboles : clic là où poser l'appareil, puis choix dans la roue (Commande, Lumière… : survol pour les autres) · reste dans l'outil pour le suivant · Échap ou clic droit : sélection",
      fenetre: "Clic sur un mur : poser une fenêtre (largeur à droite) · Échap ou clic droit : sélection",
      symbole:
        "Clic : poser « " +
        SYMB[etat.symbole].libelle +
        " » (aimanté au mur, centré dans la pièce pour le plafond, aligné sur les appareils de la même pièce) · R : tourner · Échap ou clic droit : sélection",
      gaine:
        (etat.conduitOutil !== "gaine"
          ? CONDUITS[etat.conduitOutil] +
            " (apparent : collée au mur, toujours droite ; appui dans le vide près d'un mur : départ du plafond ; 2e appui sur le bouton : gaine, moulure ou goulotte) — "
          : "2e appui sur le bouton : gaine, moulure ou goulotte · ") +
        "Gaine : glisser de la boîte (ou du tableau) jusqu'à l'appareil, la gaine suit le trait ; ou clic sur la boîte puis sur l'appareil, et la gaine se courbe avec la souris jusqu'au clic suivant (sans bouger : droite) · une gaine par appareil, pas de T · prise → prise : repiquage · Échap : fin",
      liaison:
        "Clic sur un appareil puis sur le suivant : chaque liaison repart du dernier appareil (dans les deux sens, le circuit suit) · clic dans le vide : nouvelle chaîne · Échap ou clic droit : sélection",
      piece: etat.tablette
        ? "Appui dans une pièce fermée, de n'importe quelle forme : elle est trouvée toute seule (nom demandé) · contour à la main : bouton ⇧ Plusieurs en bas, puis un appui à chaque angle, ✓ Terminer · Échap ou clic droit : sélection"
        : "Clic dans une pièce fermée, de n'importe quelle forme : elle est trouvée toute seule · Maj+clic : dessiner son contour à la main (double-clic ou Entrée : fin) · Échap ou clic droit : sélection",
      texte: "Clic : écrire un texte · clic sur un appareil : texte attaché à l'appareil (il le suit) · Échap ou clic droit : sélection",
      calibrer:
        "Mise à l'échelle : tracez une ligne entre deux points dont vous connaissez la distance réelle (glisser, ou clic puis clic), ajustez ses bouts, tapez la distance en bas puis Valider · Échap : annuler",
      fond: "Glissez pour déplacer le fond de plan · Échap : fin",
    }[o];
    dessiner();
  };

  /* -- panneau de droite : propriétés et circuits -- */
  const panneau = h("div", { class: "plan-panneau" });
  const aide = h("div", { class: "plan-aide" });
  // couleurs des notes à main levée (en haut du plan, tant que l'outil est en mode notes)
  const COULEURS_NOTES = [
    ["#dc2626", "rouge"],
    ["#2563eb", "bleu"],
    ["#16a34a", "vert"],
    ["#f59e0b", "orange"],
    ["#7c3aed", "violet"],
    ["#111827", "noir"],
  ];
  const paletteNotes = h("div", { class: "plan-notes-coul", style: "display:none" });
  const pastilles = (actuelle, choisir) =>
    COULEURS_NOTES.map(([c, nom]) =>
      h("button", {
        type: "button",
        class: "pastille-note" + (c === actuelle ? " actif" : ""),
        title: nom,
        style: "background:" + c,
        onclick: e => {
          e.stopPropagation();
          e.currentTarget.blur();
          choisir(c);
        },
      })
    );
  function majPaletteNotes() {
    const vis = etat.outil === "main" && etat.modeMain === "notes";
    paletteNotes.style.display = vis ? "" : "none";
    const FORMES = [
      ["libre", "✎", "Dessin libre"],
      ["ligne", "╱", "Trait droit (d'un point à l'autre)"],
      ["cercle", "◯", "Cercle (tirer d'un coin à l'autre)"],
      ["rect", "▭", "Rectangle"],
      ["fleche", "➝", "Flèche (de la queue à la pointe)"],
      ["gomme", "⌫", "Gomme : glissez sur les notes à effacer"],
    ];
    if (vis)
      paletteNotes.replaceChildren(
        h("span", { class: "sous" }, "Notes :"),
        ...FORMES.map(([f, ic, lib]) =>
          h(
            "button",
            {
              type: "button",
              class: "btn petit" + ((etat.formeNote || "libre") === f ? " principal" : ""),
              title: lib,
              style: "min-width:30px;padding:2px 6px",
              onclick: e => {
                e.stopPropagation();
                etat.formeNote = f;
                try {
                  localStorage.setItem("dfa_plan_forme", f);
                } catch (er) {
                  /* */
                }
                majPaletteNotes();
              },
            },
            ic
          )
        ),
        h("span", { style: "width:6px" }),
        ...pastilles(etat.couleurNote, c => {
          etat.couleurNote = c;
          try {
            localStorage.setItem("dfa_plan_note", c);
          } catch (e) {
            /* */
          }
          majPaletteNotes();
        })
      );
  }
  const svg = svgEl("svg", { class: "plan-svg" });
  const cadre = h("div", { class: "plan-cadre" }, svg);
  // largeur du panneau de droite : bord gauche à glisser (gardée dans ce navigateur)
  const poigneePanneau = h("div", {
    class: "plan-poignee-panneau",
    title: "Glisser pour élargir ou rétrécir le panneau (double-clic : largeur d'origine)",
  });
  try {
    const lp = Number(localStorage.getItem("dfa_plan_panneau"));
    if (lp >= 220 && lp <= 700) panneau.style.width = lp + "px";
  } catch (e) {
    /* */
  }
  poigneePanneau.addEventListener("pointerdown", e => {
    e.preventDefault();
    poigneePanneau.setPointerCapture(e.pointerId);
    const k = Number(panneau.style.zoom) || 1,
      w0 = panneau.getBoundingClientRect().width / k,
      x0 = e.clientX;
    const bouge = ev => {
      panneau.style.width = Math.round(Math.max(220, Math.min(700, w0 - (ev.clientX - x0) / k))) + "px";
    };
    const fin = () => {
      poigneePanneau.removeEventListener("pointermove", bouge);
      poigneePanneau.removeEventListener("pointerup", fin);
      try {
        localStorage.setItem("dfa_plan_panneau", parseInt(panneau.style.width, 10));
      } catch (er) {
        /* */
      }
    };
    poigneePanneau.addEventListener("pointermove", bouge);
    poigneePanneau.addEventListener("pointerup", fin);
  });
  poigneePanneau.addEventListener("dblclick", () => {
    panneau.style.width = "";
    try {
      localStorage.removeItem("dfa_plan_panneau");
    } catch (e) {
      /* */
    }
  });
  page.append(barreHaut, barreOutils, h("div", { class: "plan-corps" }, palette, cadre, poigneePanneau, panneau), aide);
  // (le clavier reste au plan : une liste ou une case du panneau rend la main une fois changée)
  panneau.addEventListener("change", e => {
    if (e.target.tagName === "SELECT" || ["checkbox", "color"].includes(e.target.type)) e.target.blur();
  });
  panneau.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.tagName === "INPUT") e.target.blur();
  });
  /** fenêtre dessinée à main levée (mode murs) : un rectangle fermé, étroit, posé à cheval sur un mur ; sa longueur le
   *  long du mur donne la largeur de la fenêtre. Renvoie vrai si c'en est une. */
  function poserFenetreDessinee(tr) {
    if (tr.length < 6) return false;
    const xs = tr.map(q => q.x),
      ys = tr.map(q => q.y),
      dg = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    if (dist(tr[0], tr[tr.length - 1]) > Math.max(25 / etat.vue.z, dg * 0.3)) return false; // (pas fermé)
    const c = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
    const mp = murProche(c, Math.max(40, 30 / etat.vue.z));
    if (!mp) return false;
    const m = mp.m,
      L = dist(m.a, m.b) || 1,
      ux = (m.b.x - m.a.x) / L,
      uy = (m.b.y - m.a.y) / L;
    const le = tr.map(q => (q.x - m.a.x) * ux + (q.y - m.a.y) * uy),
      tv = tr.map(q => -(q.x - m.a.x) * uy + (q.y - m.a.y) * ux);
    const long = Math.max(...le) - Math.min(...le),
      large = Math.max(...tv) - Math.min(...tv),
      ep = m.ep || d.epaisseur;
    // (le long du mur, étroit en travers : moins de 3 épaisseurs de mur, ou 45 px à l'écran)
    if (long < 30 || long > 400 || large > Math.max(3 * ep, 45 / etat.vue.z) || long < large * 1.8) return false;
    const t0 = Math.max(0, Math.min(...le)),
      t1 = Math.min(L, Math.max(...le));
    if (t1 - t0 < 30) return false;
    const ouv = {
      id: plId(),
      genre: "fenetre",
      mur: m.id,
      t: (t0 + t1) / 2 / L,
      largeur: Math.round((t1 - t0) / 5) * 5,
      sens: 1,
      charniere: "g",
    };
    if (!(ouv.t > 0 && ouv.t < 1)) return false;
    d.ouvertures.push(ouv);
    etat.sel = new Set([ouv.id]);
    valider();
    toast("Fenêtre de " + ouv.largeur + " cm (largeur réglable à droite).");
    return true;
  }
  /** porte dessinée à main levée (mode murs) : posée sur le mur, avec le choix « Libre, sans porte » */
  function poserPorteDessinee(c, tol) {
    const mp = murProche(c, tol);
    if (!mp) {
      dessiner();
      return;
    }
    const ouv = { id: plId(), genre: "porte", mur: mp.m.id, t: mp.t, largeur: optPlans().largeur_porte, sens: 1, charniere: "g" };
    d.ouvertures.push(ouv);
    etat.sel = new Set([ouv.id]);
    valider();
    clearTimeout(minuterieReco);
    const autre = () => {
      ouv.genre = ouv.genre === "porte" ? "passage" : "porte";
      valider();
      maj();
    };
    const maj = () =>
      barreReco.replaceChildren(
        h("span", {}, "Reconnu : ", h("b", {}, ouv.genre === "porte" ? "Porte" : "Ouverture libre"), " · sinon :"),
        h(
          "button",
          {
            class: "btn petit",
            type: "button",
            onclick: e => {
              e.stopPropagation();
              autre();
            },
          },
          ouv.genre === "porte" ? "Libre, sans porte" : "Porte"
        ),
        h(
          "button",
          {
            class: "btn petit danger",
            type: "button",
            title: "Effacer",
            onclick: e => {
              e.stopPropagation();
              d.ouvertures = d.ouvertures.filter(x => x !== ouv);
              etat.sel.clear();
              valider();
              fermerReco();
            },
          },
          "✕"
        )
      );
    maj();
    barreReco.style.display = "";
    minuterieReco = setTimeout(fermerReco, 10000);
  }
  const barreReco = h("div", { class: "plan-reco", style: "display:none" }); // (dessin reconnu : autres choix)
  cadre.append(barreReco, paletteNotes);
  const zoomInterface = () => {
    const k = (Number(optPlans().taille_texte) || 100) / 100;
    [palette, panneau, barreOutils, aide].forEach(el => {
      el.style.zoom = k;
    });
  };
  zoomInterface();
  majBoutonsOptions();
  {
    const b = boutonsOutils.find(x => x.dataset.outil === "piece");
    if (b) b.querySelector(".ic-outil").innerHTML = ICONES_SVG.piece;
  }
  majColonnes();

  const objetDe = id => d.objets.find(o => o.id === id);
  /* -- plusieurs niveaux : objets, gaines et blocs de tous les niveaux (traversées de plancher, liens entre étages, armoires) -- */
  const autresNiveaux = () => Object.entries(d.etages || {}).filter(([k]) => k !== d.niveau);
  const objetsPartout = () => [...d.objets, ...autresNiveaux().flatMap(([, e]) => (e && e.objets) || [])];
  const objetPartout = id =>
    objetDe(id) ||
    autresNiveaux()
      .map(([, e]) => ((e && e.objets) || []).find(o => o.id === id))
      .find(Boolean);
  const niveauDe = id =>
    objetDe(id) ? d.niveau : (autresNiveaux().find(([, e]) => ((e && e.objets) || []).some(o => o.id === id)) || [])[0];
  /** nom d'une boîte, d'une armoire ou d'une traversée de plancher (« Traversée ↑ Étage ») */
  const nomNoeud = o =>
    o.type === "traversee"
      ? o.jumeau
        ? "Traversée " + (o.cote === "sol" ? "↓ " : "↑ ") + nomNiveau(niveauDe(o.jumeau))
        : "Arrivée ↑ Combles"
      : o.num || (o.type === "tableau" ? "Tableau" : "Boîte");
  const nomNiveau = nid => ((d.niveaux || []).find(n => n.id === nid) || {}).nom || "?";
  const rangNiveau = nid => (d.niveaux || []).findIndex(n => n.id === nid);
  const gainesPartout = () => [...(d.gaines || []), ...autresNiveaux().flatMap(([, e]) => (e && e.gaines) || [])];
  /** voisins d'un objet par les gaines (tous niveaux), la traversée jumelle de l'autre niveau comprise */
  function voisinsGaine(x, gs, sauf) {
    const out = [];
    for (const h2 of gs) if (h2 !== sauf && (h2.de === x || h2.vers === x)) out.push(h2.de === x ? h2.vers : h2.de);
    const o = objetPartout(x);
    if (o && o.type === "traversee" && o.jumeau) out.push(o.jumeau);
    return out;
  }
  /** liens entre appareils de niveaux différents (interrupteur au rez-de-chaussée, lumière à l'étage…) */
  const liensDe = id => (d.liens_niveaux || []).filter(l => l.a === id || l.b === id);
  /** tableaux électriques (armoires) de tous les niveaux ; la tête : celui qui n'est alimenté par aucun autre */
  const tableauxPlan = () => objetsPartout().filter(o => o.type === "tableau");
  const nomArmoire = o => (o && o.num) || "Tableau";
  /** repère du disjoncteur de chaque circuit : celui donné par plan → tableau (Q1, Q2… dans l'ordre du tableau, de
   *  gauche à droite), sinon le suivant libre */
  function repsCircuits() {
    const res = new Map(),
      pris = new Set(d.circuits.map(c => c.rep).filter(Boolean));
    let n = 0;
    for (const c of d.circuits) {
      if (c.rep) {
        res.set(c.id, c.rep);
        continue;
      }
      do n++;
      while (pris.has("Q" + n));
      pris.add("Q" + n);
      res.set(c.id, "Q" + n);
    }
    return res;
  }
  const repDe = c => (c && repsCircuits().get(c.id)) || "Q?";
  function teteArmoires() {
    const ts = tableauxPlan();
    return ts.find(t => !t.alim || !ts.some(x => x.id === t.alim)) || ts[0] || null;
  }
  /** armoire d'où part un circuit : choisie dans le panneau, sinon celle où arrivent les gaines de ses appareils, sinon la tête */
  function armoireDuCircuit(c) {
    const ts = tableauxPlan();
    if (!ts.length) return null;
    if (c.armoire && ts.some(t => t.id === c.armoire)) return ts.find(t => t.id === c.armoire);
    return armoireDevinee(c) || teteArmoires();
  }
  function armoireDevinee(c) {
    const ts = tableauxPlan();
    if (ts.length < 2) return ts[0] || null;
    const gs = gainesPartout(),
      n = {};
    for (const o of objetsPartout().filter(o => o.circuit === c.id)) {
      const vus = new Set([o.id]),
        file = [o.id];
      trouve: while (file.length) {
        const x = file.shift(),
          ox = objetPartout(x);
        for (const y of voisinsGaine(x, gs)) {
          if (vus.has(y)) continue;
          vus.add(y);
          const ob = objetPartout(y);
          if (!ob) continue;
          if (ob.type === "tableau") {
            // (gaine d'alimentation d'une armoire divisionnaire : venue du côté de son armoire mère, ses circuits n'y passent pas)
            const gx = gs.find(g => (g.de === x && g.vers === y) || (g.de === y && g.vers === x));
            if (ob.alim && ox && gx && versArmoire(gx, ox) < rangArmoire(ob)) continue;
            n[ob.id] = (n[ob.id] || 0) + 1;
            break trouve;
          }
          file.push(y);
        }
      }
    }
    const top = Object.entries(n).sort((a, b) => b[1] - a[1])[0];
    return top ? ts.find(t => t.id === top[0]) : null;
  }
  const murDe = id => d.murs.find(m => m.id === id);
  const circuitDe = id => d.circuits.find(c => c.id === id);
  const pieceDe = id => (d.pieces || []).find(x => x.id === id);
  /** appareils reliés entre eux par des liaisons (un interrupteur et ses lumières…) */
  const groupe = id => {
    const vus = new Set([id]),
      file = [id];
    while (file.length) {
      const x = file.pop();
      for (const l of d.liaisons) {
        const y = l.de === x ? l.vers : l.vers === x ? l.de : null;
        if (y && !vus.has(y)) {
          vus.add(y);
          file.push(y);
        }
      }
    }
    return [...vus].map(objetDe).filter(Boolean);
  };
  const surface = pts => {
    let a = 0;
    (pts || []).forEach((q, i) => {
      const r = pts[(i + 1) % pts.length];
      a += q.x * r.y - r.x * q.y;
    });
    return Math.abs(a) / 2 / 10000;
  };
  const m2 = v => v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " m²";
  const dansPolygone = (q, pts) => {
    let dedans = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i],
        b = pts[j];
      if (a.y > q.y !== b.y > q.y && q.x < ((b.x - a.x) * (q.y - a.y)) / (b.y - a.y) + a.x) dedans = !dedans;
    }
    return dedans;
  };
  /** côté extérieur d'un mur : +1 ou -1 (sens de sa normale), 0 pour un mur intérieur (des murs des deux côtés).
   *  Depuis trois points du mur, un rayon part de chaque côté : le côté d'où les rayons sortent sans toucher de mur est dehors. */
  function coteExterieur(m) {
    const L = dist(m.a, m.b);
    if (L < 1) return -1;
    const ux = (m.b.x - m.a.x) / L,
      uy = (m.b.y - m.a.y) / L,
      nx = -uy,
      ny = ux,
      ep = (m.ep || d.epaisseur) / 2 + 3;
    const touche = (ox, oy, dx, dy) =>
      d.murs.some(w => {
        if (w === m) return false;
        const ex = w.b.x - w.a.x,
          ey = w.b.y - w.a.y,
          den = dx * ey - dy * ex;
        if (Math.abs(den) < 1e-9) return false;
        const t = ((w.a.x - ox) * ey - (w.a.y - oy) * ex) / den,
          u = ((w.a.x - ox) * dy - (w.a.y - oy) * dx) / den;
        return t > 0 && u >= -0.02 && u <= 1.02;
      });
    const libre = sg =>
      [0.2, 0.5, 0.8].filter(f => {
        const x = m.a.x + ux * L * f + nx * ep * sg,
          y = m.a.y + uy * L * f + ny * ep * sg;
        return !touche(x, y, nx * sg, ny * sg);
      }).length >= 2;
    const plus = libre(1),
      moins = libre(-1);
    return plus && !moins ? 1 : moins && !plus ? -1 : plus && moins ? -1 : 0;
  }
  // (mur intérieur : pas de cote propre — ses cotes sont les cotes intérieures des pièces —, sauf case cochée à la main)
  const coteVisible = m =>
    !m.arc && !d.cotes_masquees && (m.cote === true || (m.cote !== false && d.cotes_ext !== false && coteExterieur(m) !== 0));
  /** mur de façade : de combien sa face extérieure dépasse son axe à chaque bout (le coin, ou un bout libre : la
   *  demi-épaisseur ; un mur qui le prolonge tout droit : rien) */
  function prolongementsExterieurs(m) {
    const L = dist(m.a, m.b) || 1,
      ux = (m.b.x - m.a.x) / L,
      uy = (m.b.y - m.a.y) / L,
      ep = (m.ep || d.epaisseur) / 2;
    return ["a", "b"].map(k => {
      const q = m[k];
      const suite = d.murs.some(w => {
        if (w === m) return false;
        const Lw = dist(w.a, w.b);
        if (Lw < 1) return false;
        const touche = dist(w.a, q) < 1 || dist(w.b, q) < 1;
        return touche && Math.abs(((w.b.x - w.a.x) * uy - (w.b.y - w.a.y) * ux) / Lw) < 0.05;
      });
      return suite ? 0 : ep;
    });
  }
  /** longueur d'un mur à afficher et à taper : de façade, au bord extérieur ; sinon, d'axe à axe */
  const longueurAffichee = m => {
    const L = dist(m.a, m.b);
    if (coteExterieur(m) === 0) return L;
    const [ea, eb] = prolongementsExterieurs(m);
    return L + ea + eb;
  };
  /** premier mur touché en partant de pt dans la direction (dx, dy) */
  function rayon(pt, dx, dy) {
    let best = Infinity,
      mur = null;
    for (const m of d.murs) {
      const ex = m.b.x - m.a.x,
        ey = m.b.y - m.a.y,
        D = dx * ey - dy * ex;
      if (Math.abs(D) < 1e-9) continue;
      const wx = m.a.x - pt.x,
        wy = m.a.y - pt.y,
        t = (wx * ey - ex * wy) / D,
        u = (dy * wx - dx * wy) / D;
      const marge = (m.ep || d.epaisseur) / 2 / (Math.hypot(ex, ey) || 1);
      if (t > 0.5 && u >= -marge && u <= 1 + marge && t < best) {
        best = t;
        mur = m;
      }
    }
    return mur && best < 5000 ? { t: best, mur } : null;
  }
  /** intérieur (rectangle, faces des murs) de la pièce autour de pt */
  function boitePiece(pt) {
    const g = rayon(pt, -1, 0),
      dr = rayon(pt, 1, 0),
      hh = rayon(pt, 0, -1),
      b = rayon(pt, 0, 1);
    if (!g || !dr || !hh || !b) return null;
    const e = r => (r.mur.ep || d.epaisseur) / 2;
    const bx = { x0: pt.x - g.t + e(g), x1: pt.x + dr.t - e(dr), y0: pt.y - hh.t + e(hh), y1: pt.y + b.t - e(b) };
    return bx.x1 - bx.x0 > 10 && bx.y1 - bx.y0 > 10 ? bx : null;
  }
  /** contour intérieur de la pièce fermée autour de pt, quelle que soit sa forme (en L, en T…) :
      on suit les murs (découpés à chaque jonction) en tournant toujours du même côté, et on garde le plus
      petit tour qui entoure pt ; puis on le décale de la demi-épaisseur des murs (faces intérieures). */
  function contourPiece(pt) {
    const murs = d.murs.filter(m => dist(m.a, m.b) > 1);
    if (murs.length < 3) return null;
    const coupes = murs.map(() => [0, 1]);
    murs.forEach((m, i) => {
      const ex = m.b.x - m.a.x,
        ey = m.b.y - m.a.y,
        L2 = ex * ex + ey * ey,
        L = Math.sqrt(L2);
      murs.forEach((w, j) => {
        if (i === j) return;
        for (const q of [w.a, w.b]) {
          const t = ((q.x - m.a.x) * ex + (q.y - m.a.y) * ey) / L2;
          if (t > 1e-3 && t < 1 - 1e-3 && Math.abs((q.x - m.a.x) * ey - (q.y - m.a.y) * ex) / L < 1) coupes[i].push(t);
        }
        const fx = w.b.x - w.a.x,
          fy = w.b.y - w.a.y,
          D = ex * fy - ey * fx;
        if (Math.abs(D) > 1e-9) {
          const wx = w.a.x - m.a.x,
            wy = w.a.y - m.a.y,
            t = (wx * fy - wy * fx) / D,
            u = (wx * ey - wy * ex) / D;
          if (t > 1e-3 && t < 1 - 1e-3 && u > 1e-3 && u < 1 - 1e-3) coupes[i].push(t);
        }
      });
    });
    const sommets = [],
      cles = new Map();
    const sommet = q => {
      const k = Math.round(q.x) + "," + Math.round(q.y);
      if (!cles.has(k)) {
        cles.set(k, sommets.length);
        sommets.push({ x: q.x, y: q.y, vers: [] });
      }
      return cles.get(k);
    };
    murs.forEach((m, i) => {
      const ts = [...new Set(coupes[i].map(t => +t.toFixed(5)))].sort((x, y) => x - y),
        ep = m.ep || d.epaisseur;
      for (let k = 1; k < ts.length; k++) {
        const u = sommet({ x: m.a.x + (m.b.x - m.a.x) * ts[k - 1], y: m.a.y + (m.b.y - m.a.y) * ts[k - 1] }),
          v = sommet({ x: m.a.x + (m.b.x - m.a.x) * ts[k], y: m.a.y + (m.b.y - m.a.y) * ts[k] });
        if (u !== v && !sommets[u].vers.some(x => x.v === v)) {
          sommets[u].vers.push({ v, ep });
          sommets[v].vers.push({ v: u, ep });
        }
      }
    });
    sommets.forEach(sm => {
      sm.vers.forEach(x => {
        x.ang = Math.atan2(sommets[x.v].y - sm.y, sommets[x.v].x - sm.x);
      });
      sm.vers.sort((x, y) => x.ang - y.ang);
    });
    const vus = new Set();
    let best = null;
    for (let u0 = 0; u0 < sommets.length; u0++)
      for (const e0 of sommets[u0].vers) {
        if (vus.has(u0 + ">" + e0.v)) continue;
        const face = [];
        let a = u0,
          e = e0,
          garde = 0;
        while (!vus.has(a + ">" + e.v) && garde++ < 5000) {
          vus.add(a + ">" + e.v);
          face.push({ s: a, ep: e.ep });
          const b = e.v,
            L = sommets[b].vers,
            i = L.findIndex(x => x.v === a);
          a = b;
          e = L[(i - 1 + L.length) % L.length];
        }
        if (face.length < 3) continue;
        const pts = face.map(f => sommets[f.s]);
        if (!dansPolygone(pt, pts)) continue;
        const sf = surface(pts);
        if (!best || sf < best.sf) best = { sf, face };
      }
    if (!best) return null;
    // bouts de murs qui s'avancent dans la pièce (aller-retour) : retirés
    let f = best.face.map(x => ({ ...x })),
      change = true;
    while (change && f.length > 3) {
      change = false;
      for (let i = 0; i < f.length; i++)
        if (f[(i - 1 + f.length) % f.length].s === f[(i + 1) % f.length].s) {
          f = f.slice((i - 1 + f.length) % f.length).concat(f.slice(0, (i - 1 + f.length) % f.length));
          f[0].ep = f[2].ep;
          f.splice(1, 2);
          change = true;
          break;
        }
    }
    if (f.length < 3) return null;
    const P = f.map(x => sommets[x.s]),
      n = P.length;
    let aire = 0;
    P.forEach((q, i) => {
      const r = P[(i + 1) % n];
      aire += q.x * r.y - r.x * q.y;
    });
    const sg = aire > 0 ? 1 : -1;
    const lignes = P.map((q, i) => {
      const r = P[(i + 1) % n],
        L = dist(q, r) || 1,
        dx = (r.x - q.x) / L,
        dy = (r.y - q.y) / L,
        o = f[i].ep / 2;
      return { x: q.x - dy * sg * o, y: q.y + dx * sg * o, dx, dy };
    });
    const out = [];
    for (let i = 0; i < n; i++) {
      const l1 = lignes[(i - 1 + n) % n],
        l2 = lignes[i],
        D = l1.dx * l2.dy - l1.dy * l2.dx;
      if (Math.abs(D) < 1e-6) {
        const L1 = dist(P[(i - 1 + n) % n], P[i]);
        out.push({ x: l1.x + l1.dx * L1, y: l1.y + l1.dy * L1 });
        if (Math.abs((l2.x - out[out.length - 1].x) * l2.dy - (l2.y - out[out.length - 1].y) * l2.dx) > 0.5) out.push({ x: l2.x, y: l2.y });
        continue;
      }
      const t = ((l2.x - l1.x) * l2.dy - (l2.y - l1.y) * l2.dx) / D;
      out.push({ x: l1.x + l1.dx * t, y: l1.y + l1.dy * t });
    }
    return surface(out) > 0.1 ? out : null;
  }
  /** le segment p-q traverse-t-il un mur ? (deux appareils de part et d'autre d'un mur ne s'alignent pas) */
  function traverseMur(p1, q1) {
    const cr = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    return d.murs.some(m => cr(p1, q1, m.a) * cr(p1, q1, m.b) < 0 && cr(m.a, m.b, p1) * cr(m.a, m.b, q1) < 0);
  }
  /** pièces « automatiques » : leur contour suit les murs (un mur déplacé agrandit la pièce) */
  // pièce « qui suit les murs » : retrouvée à partir de son repère intérieur (germe), remis au centre de la pièce à chaque
  // fois — sinon, une pièce réduite pourrait laisser son repère dehors et garder son ancienne taille
  function majPieces() {
    for (const pc of d.pieces || [])
      if (pc.auto && pc.germe) {
        let c = contourPiece(pc.germe);
        if (!c && pc.pts && pc.pts.length > 2) {
          const g = pointInterieur(pc.pts);
          if (g) c = contourPiece(g);
        } // (repère sorti : depuis l'ancien centre)
        if (!c) continue;
        pc.pts = c;
        const g = centrePiece(c);
        if (g) pc.germe = g;
      }
  }
  /** point bien à l'intérieur d'une pièce : son centre de gravité, ou le point de la grille le plus loin des bords */
  function centrePiece(pts) {
    let A = 0,
      cx = 0,
      cy = 0;
    pts.forEach((q, i) => {
      const r = pts[(i + 1) % pts.length],
        k = q.x * r.y - r.x * q.y;
      A += k;
      cx += (q.x + r.x) * k;
      cy += (q.y + r.y) * k;
    });
    if (Math.abs(A) > 1) {
      const c = { x: cx / (3 * A), y: cy / (3 * A) };
      if (dansPolygone(c, pts)) return c;
    }
    return pointInterieur(pts);
  }
  const pieceEn = q => (d.pieces || []).find(pc => pc.pts && pc.pts.length > 2 && dansPolygone(q, pc.pts));
  /** chaque appareil connaît le nom de sa pièce (liste du matériel par pièce, pour le devis) */
  function majPiecesObjets() {
    d.pieces = d.pieces || [];
    d.notes = d.notes || [];
    d.gaines = d.gaines || [];
    majPieces();
    for (const o of d.objets) {
      if (o.genre !== "symbole") continue;
      const pc = pieceEn(o);
      if (pc) o.piece = pc.nom || "Pièce";
      else delete o.piece;
    }
  }
  /** point de contrôle de la courbe d'une liaison (décalage gardé par rapport au milieu : il suit les appareils) */
  const controleLiaison = (li, a, b) => {
    const mx = (a.x + b.x) / 2,
      my = (a.y + b.y) / 2,
      L = dist(a, b) || 1;
    return li.dc ? { x: mx + li.dc.x, y: my + li.dc.y } : { x: mx - ((b.y - a.y) / L) * L * 0.18, y: my + ((b.x - a.x) / L) * L * 0.18 };
  };
  /** centre (de gravité) de la pièce, plus le décalage de l'étiquette si on l'a glissée */
  const etiquettePiece = pc => {
    let A = 0,
      cx = 0,
      cy = 0;
    const P = pc.pts;
    P.forEach((q, i) => {
      const r = P[(i + 1) % P.length],
        c = q.x * r.y - r.x * q.y;
      A += c;
      cx += (q.x + r.x) * c;
      cy += (q.y + r.y) * c;
    });
    const c =
      Math.abs(A) > 1e-6
        ? { x: cx / (3 * A), y: cy / (3 * A) }
        : { x: P.reduce((s, q) => s + q.x, 0) / P.length, y: P.reduce((s, q) => s + q.y, 0) / P.length };
    return { x: c.x + ((pc.etiquette || {}).dx || 0), y: c.y + ((pc.etiquette || {}).dy || 0) };
  };
  /** poignées à l'écran : coin (taille) et côté (largeur) d'un appareil choisi seul ; milieu d'une liaison choisie */
  const poignees = () => {
    const out = [],
      z = etat.vue.z;
    if (etat.sel.size !== 1 || etat.outil !== "selection") return out;
    const id = [...etat.sel][0],
      o = objetDe(id);
    if (o && etat.tablette && (o.genre === "symbole" ? symboleVu(o) : true)) {
      // (au doigt : une poignée sous l'appareil pour le déplacer en le voyant, et un carré en haut à droite pour sa taille)
      out.push({ genre: "bouger", x: o.x, y: o.y + 60 / z, o });
      if (o.genre === "symbole" && SYMB[o.type]) {
        const r = 21 * (TAILLE_SYMBOLE / 40) * Math.max(o.sx || 1, o.sy || 1) + 16 / z;
        out.push({ genre: "taille", x: o.x + r * 0.75, y: o.y - r * 0.75, o, doigt: true });
      }
    } else if (o && o.genre === "symbole" && SYMB[o.type] && symboleVu(o)) {
      const k = TAILLE_SYMBOLE / 40,
        a = ((o.rot || 0) * Math.PI) / 180,
        ca = Math.cos(a),
        sa = Math.sin(a);
      const loc = (lx, ly) => ({ x: o.x + (lx * ca - ly * sa), y: o.y + (lx * sa + ly * ca) });
      const hx = 21 * k * (o.sx || 1),
        hy = 21 * k * (o.sy || 1);
      out.push({ genre: "taille", ...loc(hx, hy), o }, { genre: "largeur", ...loc(hx, 0), o });
    }
    // (au doigt : poignée à côté de la porte / fenêtre choisie : elle glisse le long de son mur)
    const ov = etat.tablette && d.ouvertures.find(x => x.id === id),
      gov = ov && geomOuverture(ov);
    if (gov) {
      const e = gov.ep / 2 + 55 / z;
      out.push({ genre: "bouger", x: gov.c.x + gov.nx * e, y: gov.c.y + gov.ny * e, o: { x: gov.c.x, y: gov.c.y, id: ov.id, ouv: true } });
    }
    // (au doigt : poignée à côté du mur choisi, pour le faire glisser d'équerre en le voyant)
    const mu = etat.tablette && murDe(id);
    if (mu) {
      const L = dist(mu.a, mu.b) || 1,
        nx = -(mu.b.y - mu.a.y) / L,
        ny = (mu.b.x - mu.a.x) / L,
        e = d.epaisseur / 2 + 55 / z;
      out.push({
        genre: "bouger",
        x: (mu.a.x + mu.b.x) / 2 + nx * e,
        y: (mu.a.y + mu.b.y) / 2 + ny * e,
        o: { x: (mu.a.x + mu.b.x) / 2, y: (mu.a.y + mu.b.y) / 2, id: mu.id, mur: true },
      });
    }
    const ga = (d.gaines || []).find(g => g.id === id),
      chg = ga && cheminGaine(ga);
    if (chg && chg.length === 2 && conduitDe(ga) !== "moulure") {
      const c = controleGaine(ga, chg[0], chg[1]);
      out.push({
        genre: "courbeGaine",
        x: 0.25 * chg[0].x + 0.5 * c.x + 0.25 * chg[1].x,
        y: 0.25 * chg[0].y + 0.5 * c.y + 0.25 * chg[1].y,
        g: ga,
      });
    } else if (chg) {
      (ga.pts || []).forEach((q, i) => out.push({ genre: "coude", x: q.x, y: q.y, g: ga, i }));
      for (let i = 1; i < chg.length; i++)
        if (dist(chg[i - 1], chg[i]) * z > 40)
          out.push({ genre: "ajoutCoude", x: (chg[i - 1].x + chg[i].x) / 2, y: (chg[i - 1].y + chg[i].y) / 2, g: ga, i: i - 1 });
    }
    const li = d.liaisons.find(l => l.id === id);
    if (li) {
      const a = objetDe(li.de),
        b = objetDe(li.vers);
      if (a && b) {
        const c = controleLiaison(li, a, b);
        out.push({ genre: "courbe", x: 0.25 * a.x + 0.5 * c.x + 0.25 * b.x, y: 0.25 * a.y + 0.5 * c.y + 0.25 * b.y, li });
      }
    }
    return out.filter(() => z > 0);
  };
  /** au doigt : poignée bleue sur ce qu'on vient de poser (gaine, liaison, appareil) sans changer d'outil :
   *  la glisser courbe la gaine / la liaison ou déplace l'appareil ; toucher ailleurs continue avec l'outil */
  const OUTILS_POSE = ["gaine", "liaison", "main", "symbole", "roue"];
  const poigneesRecent = () => {
    const r = etat.recent,
      z = etat.vue.z;
    if (!r || !etat.tablette || !OUTILS_POSE.includes(etat.outil)) return [];
    if (r.genre === "gaine") {
      const g = (d.gaines || []).find(x => x.id === r.id),
        ch = g && cheminGaine(g);
      if (!ch || ch.length !== 2 || conduitDe(g) === "moulure") return [];
      const c = controleGaine(g, ch[0], ch[1]);
      return [
        {
          genre: "courbeGaine",
          x: 0.25 * ch[0].x + 0.5 * c.x + 0.25 * ch[1].x,
          y: 0.25 * ch[0].y + 0.5 * c.y + 0.25 * ch[1].y,
          g,
          recent: true,
        },
      ];
    }
    if (r.genre === "liaison") {
      const li = d.liaisons.find(x => x.id === r.id),
        a = li && objetDe(li.de),
        b = li && objetDe(li.vers);
      if (!a || !b) return [];
      const c = controleLiaison(li, a, b);
      return [{ genre: "courbe", x: 0.25 * a.x + 0.5 * c.x + 0.25 * b.x, y: 0.25 * a.y + 0.5 * c.y + 0.25 * b.y, li, recent: true }];
    }
    const o = objetDe(r.id);
    return o ? [{ genre: "bouger", x: o.x, y: o.y + 60 / z, o, recent: true }] : [];
  };
  const marquerRecent = (genre, id) => {
    if (etat.tablette) etat.recent = { genre, id };
  };
  const toutChoisir = () => {
    etat.sel = new Set([
      ...d.murs.map(m => m.id),
      ...d.ouvertures.map(o => o.id),
      ...d.objets.filter(o => (o.genre === "texte" ? vu("textes") : symboleVu(o))).map(o => o.id),
      ...(vu("pieces") ? (d.pieces || []).map(p => p.id) : []),
    ]);
    dessiner();
    majPanneau();
  };
  const couleurObjet = o => {
    if (estDecor(o)) return "#64748b"; // (sanitaires, mobilier : en gris)
    const c = o.circuit && circuitDe(o.circuit);
    return c ? c.couleur : COURANT_FAIBLE.includes(o.type) ? "#16a34a" : "#111827";
  };

  /** parties d'un mur vues de chaque côté : entre ses bouts et les murs qui en partent de ce côté (coins, cloisons en T),
   *  longueur entre les faces de ces murs (dimension intérieure de la pièce) */
  function segmentsInterieurs(m) {
    const L = dist(m.a, m.b);
    if (L < 20) return [];
    const ux = (m.b.x - m.a.x) / L,
      uy = (m.b.y - m.a.y) / L,
      nx = -uy,
      ny = ux,
      ep = (m.ep || d.epaisseur) / 2;
    const cotes = { 1: [], "-1": [] };
    for (const w of d.murs) {
      if (w === m) continue;
      const Lw = dist(w.a, w.b);
      if (Lw < 1) continue;
      if (Math.abs(((w.b.x - w.a.x) * nx + (w.b.y - w.a.y) * ny) / Lw) < 0.3) continue; // (parallèle : ne part pas de ce mur)
      for (const [k, o] of [
        ["a", "b"],
        ["b", "a"],
      ]) {
        const q = w[k],
          r = w[o],
          t = (q.x - m.a.x) * ux + (q.y - m.a.y) * uy,
          dn = (q.x - m.a.x) * nx + (q.y - m.a.y) * ny;
        if (t < -ep - 2 || t > L + ep + 2 || Math.abs(dn) > ep + 2) continue; // ce bout de w n'est pas sur m
        const cote = Math.sign((r.x - m.a.x) * nx + (r.y - m.a.y) * ny - dn);
        if (cote) cotes[cote].push({ t: Math.max(0, Math.min(L, t)), demi: (w.ep || d.epaisseur) / 2, mur: w.id });
      }
      // bout de m posé au milieu de w (m est une cloison en T sur w) : w arrête m des deux côtés
      for (const k of ["a", "b"]) {
        const q = m[k],
          wx = (w.b.x - w.a.x) / Lw,
          wy = (w.b.y - w.a.y) / Lw,
          tw = (q.x - w.a.x) * wx + (q.y - w.a.y) * wy;
        if (tw < 1 || tw > Lw - 1 || Math.abs((q.x - w.a.x) * -wy + (q.y - w.a.y) * wx) > (w.ep || d.epaisseur) / 2 + 2) continue;
        for (const cote of [1, -1])
          cotes[cote].push({ t: k === "a" ? 0 : L, demi: (w.ep || d.epaisseur) / 2, mur: w.id, traversant: true });
      }
    }
    const out = [];
    for (const cote of [1, -1]) {
      const j = cotes[cote];
      if (!j.length) continue; // (côté sans rien : l'extérieur)
      const pts = [...j];
      if (!pts.some(x => x.t < 1)) pts.push({ t: 0, demi: 0, bout: "a" });
      if (!pts.some(x => x.t > L - 1)) pts.push({ t: L, demi: 0, bout: "b" });
      pts.sort((a, b) => a.t - b.t);
      for (let i = 0; i < pts.length - 1; i++) {
        const u = pts[i],
          v = pts[i + 1],
          t0 = u.t + u.demi,
          t1 = v.t - v.demi;
        if (t1 - t0 < 15) continue;
        out.push({ mur: m.id, cote, t0, t1, longueur: t1 - t0, debut: u, fin: v });
      }
    }
    return out;
  }
  /** déplace un mur entier (ses deux bouts, et les bouts des murs qui y sont accrochés) */
  function translaterMur(w, dx, dy) {
    const a0 = { ...w.a },
      b0 = { ...w.b },
      Lw = dist(a0, b0) || 1,
      wx = (b0.x - a0.x) / Lw,
      wy = (b0.y - a0.y) / Lw,
      ep = (w.ep || d.epaisseur) / 2;
    const surW = (q, marge) => {
      const t = (q.x - a0.x) * wx + (q.y - a0.y) * wy;
      return t > 1 && t < Lw - 1 && Math.abs((q.x - a0.x) * -wy + (q.y - a0.y) * wx) <= marge;
    };
    // murs posés sur w (cloisons en T) : leur bout suit
    const bouts = [];
    for (const v of d.murs)
      if (v !== w) for (const k of ["a", "b"]) if (surW(v[k], ep + 2) && !bouts.some(q => dist(q, v[k]) < 0.01)) bouts.push({ ...v[k] });
    bouts.forEach(q => deplacerPoint(q, { x: q.x + dx, y: q.y + dy }));
    // appareils posés contre w : le suivent
    d.objets.forEach(o => {
      if (o.genre === "symbole" && surW(o, ep + TAILLE_SYMBOLE / 2 + 2)) {
        o.x += dx;
        o.y += dy;
      }
    });
    deplacerPoint(a0, { x: a0.x + dx, y: a0.y + dy });
    deplacerPoint(b0, { x: b0.x + dx, y: b0.y + dy });
  }
  /* cotes intérieures tapées à la main : gardées (🔒) ; en changer une autre déplace le mur qui ne les casse pas */
  const cleBout = x => (x.mur ? x.mur : "bout:" + x.bout);
  const cleSegment = sg => [sg.mur, sg.cote, cleBout(sg.debut), cleBout(sg.fin)].join("|");
  const segmentDe = cle => {
    const [mur] = cle.split("|"),
      m = murDe(mur);
    return m ? segmentsInterieurs(m).find(x => cleSegment(x) === cle) : null;
  };
  const coteFixee = sg => (d.cotes_fixes || []).find(f => f.cle === cleSegment(sg));
  /** cotes gardées qui ne sont plus respectées (hors celle dont la clé est donnée) */
  const fixesCassees = sauf =>
    (d.cotes_fixes || []).filter(
      f =>
        f.cle !== sauf &&
        (() => {
          const sg = segmentDe(f.cle);
          return !sg || Math.abs(sg.longueur - f.longueur) > 0.5;
        })()
    );
  /** clic sur une cote intérieure : nouvelle dimension ; la cloison (ou le mur) au bout de cette partie se déplace */
  async function modifierCoteInterieure(sg) {
    const m = murDe(sg.mur);
    if (!m) return;
    const dejaFixe = !!coteFixee(sg);
    const champ = h("input", {
      type: "text",
      inputmode: "decimal",
      value: (Math.round(sg.longueur) / 100).toLocaleString("fr-FR"),
      style: "font-size:16px;width:120px",
    });
    const garder = h("input", { type: "checkbox", checked: true });
    const rep = await new Promise(ok => {
      const fin_ = v => {
        fermerModale();
        ok(v);
      };
      champ.addEventListener("keydown", e => {
        e.stopPropagation();
        if (e.key === "Enter") fin_({ v: champ.value, garder: garder.checked });
      });
      ouvrirModale(
        "Dimension intérieure",
        h(
          "div",
          { class: "pile" },
          h("label", { class: "champ" }, h("span", {}, "Dimension de cette partie, en mètres"), champ),
          h(
            "label",
            {
              class: "case",
              title: "Quand vous changerez une autre cote, DF artisan déplacera le mur qui garde celle-ci (sinon il vous prévient)",
            },
            garder,
            "🔒 Garder cette dimension"
          ),
          dejaFixe ? h("p", { class: "aide", style: "margin:0" }, "Cette dimension est déjà gardée ; décochez pour la libérer.") : null
        ),
        [
          h("button", { class: "btn", onclick: () => fin_(null) }, "Annuler"),
          h("button", { class: "btn principal", onclick: () => fin_({ v: champ.value, garder: garder.checked }) }, "OK"),
        ],
        { largeur: "min(420px, 94vw)" }
      );
      setTimeout(() => {
        champ.focus();
        champ.select();
      }, 30);
    });
    if (!rep) return;
    const nv = nombre(rep.v) * 100;
    if (!(nv > 10)) {
      toast("Indiquez une dimension en mètres.", true);
      return;
    }
    appliquerCoteInterieure(sg, nv, rep.garder);
  }
  /** cote intérieure tapée (en cm) : la cloison (ou le mur) au bout de cette partie se déplace ; garder : 🔒 */
  function appliquerCoteInterieure(sg, nv, garder, bout) {
    const m = murDe(sg.mur);
    if (!m) return;
    const cle = cleSegment(sg);
    const rep = { garder };
    const delta = nv - sg.longueur;
    const majFixe = () => {
      d.cotes_fixes = (d.cotes_fixes || []).filter(f => f.cle !== cle);
      if (rep.garder) {
        const n = segmentDe(cle);
        if (n) d.cotes_fixes.push({ cle, longueur: n.longueur });
      }
    };
    if (Math.abs(delta) < 0.5) {
      majFixe();
      valider();
      return;
    }
    const L = dist(m.a, m.b),
      ux = (m.b.x - m.a.x) / L,
      uy = (m.b.y - m.a.y) / L;
    // façons possibles : déplacer le mur au bout de la partie, ou celui du début (pas un mur traversant, sur lequel
    // cette cloison est posée), sinon allonger le mur lui-même ; on garde celle qui casse le moins de cotes gardées,
    // à égalité une cloison intérieure plutôt qu'une façade
    const fin = sg.fin.mur && !sg.fin.traversant && murDe(sg.fin.mur),
      debut = sg.debut.mur && !sg.debut.traversant && murDe(sg.debut.mur);
    const essais = [];
    // (les murs sont repris par leur identifiant à chaque essai : entre deux essais, le dessin est remis tel qu'avant)
    if (fin)
      essais.push({ faire: () => translaterMur(murDe(fin.id), ux * delta, uy * delta), facade: coteExterieur(fin) !== 0, cote: "b" });
    if (debut)
      essais.push({ faire: () => translaterMur(murDe(debut.id), -ux * delta, -uy * delta), facade: coteExterieur(debut) !== 0, cote: "a" });
    if (!essais.length && sg.fin.bout === "b")
      essais.push({
        faire: () => {
          const w = murDe(m.id);
          deplacerPoint({ ...w.b }, { x: w.b.x + ux * delta, y: w.b.y + uy * delta });
        },
      });
    if (!essais.length && sg.debut.bout === "a")
      essais.push({
        faire: () => {
          const w = murDe(m.id);
          deplacerPoint({ ...w.a }, { x: w.a.x - ux * delta, y: w.a.y - uy * delta });
        },
      });
    if (!essais.length) {
      toast("Cette partie va d'un mur à l'autre : changez plutôt la cote d'un de ces deux murs.", true);
      return;
    }
    const avant = JSON.stringify({ murs: d.murs, objets: d.objets });
    const remettre = () => {
      const x = JSON.parse(avant);
      d.murs = x.murs;
      d.objets = x.objets;
    };
    for (const e of essais) {
      e.faire();
      e.cassees = fixesCassees(cle).length;
      remettre();
    }
    essais.sort((a, b) => a.cassees - b.cassees || (a.facade ? 1 : 0) - (b.facade ? 1 : 0));
    // (bout choisi dans le panneau du mur : le mur de ce côté-là bouge, s'il peut)
    const choisi = bout && essais.find(e => e.cote === bout);
    (choisi || essais[0]).faire();
    const cassees = fixesCassees(cle);
    majFixe();
    if (cassees.length) {
      // (aucune façon de tout garder : les cotes changées ne sont plus gardées, on prévient)
      d.cotes_fixes = d.cotes_fixes.filter(f => !cassees.includes(f));
      toast(cassees.length + " autre(s) dimension(s) gardée(s) ont dû changer (plus gardées) : vérifiez les cotes 🔒.", true);
    }
    valider();
  }

  function majPanneau() {
    panneau.replaceChildren();
    // (tablette : niveau et cotes en haut du panneau)
    const caseCote = (cle, lib, titre) => {
      const c = h("input", { type: "checkbox", checked: cle === "cotes_ext" ? d.cotes_ext !== false : !!d[cle] });
      c.addEventListener("change", () => {
        d[cle] = c.checked;
        valider();
      });
      if (cle !== "cotes_masquees" && d.cotes_masquees) c.disabled = true;
      return h("label", { class: "case", title: titre }, c, lib);
    };
    panneau.append(
      h("div", { class: "plan-bloc plan-affichage", "data-cle": "affichage" }, h("h4", {}, "Affichage"), selNiveau),
      h(
        "div",
        { class: "plan-bloc plan-cotes", "data-cle": "cotes" },
        h("h4", {}, "Cotes"),
        caseCote("cotes_principales", "Murs extérieurs", "Largeur et profondeur de tout le plan, faces extérieures"),
        caseCote("cotes_ext", "Murs extérieurs détaillés", "Longueur de chaque mur de façade, prise au bord extérieur"),
        caseCote(
          "cotes_interieures",
          "Murs intérieurs (cotes intérieures)",
          "De chaque côté des murs, une cote par partie de pièce (entre les cloisons), en vert ; clic dessus pour changer la dimension"
        ),
        caseCote("cotes_masquees", "Masquer les cotes", "Aucune cote affichée (les cases ci-dessus sont gardées pour la suite)")
      )
    );
    const sel = [...etat.sel];
    const objs = sel.map(objetDe).filter(Boolean),
      murs = sel.map(murDe).filter(Boolean),
      ouv = sel.map(id => d.ouvertures.find(o => o.id === id)).filter(Boolean);
    const lia = sel.map(id => d.liaisons.find(l => l.id === id)).filter(Boolean);
    const pcs = sel.map(pieceDe).filter(Boolean);
    if (sel.length) {
      const bloc = h("div", { class: "plan-bloc" }, h("h4", {}, sel.length > 1 ? sel.length + " éléments choisis" : "Élément choisi"));
      const notesSel = (d.notes || []).filter(n => etat.sel.has(n.id));
      if (notesSel.length)
        bloc.append(
          h("div", {}, notesSel.length > 1 ? notesSel.length + " notes à main levée" : "Note à main levée"),
          h(
            "div",
            { style: "display:flex;gap:6px;flex-wrap:wrap;margin:4px 0" },
            ...pastilles(notesSel[0].coul, c => {
              notesSel.forEach(n => {
                n.coul = c;
              });
              valider();
            })
          )
        );
      if (ouv.length === 1) {
        const o = ouv[0];
        const larg = h("input", { type: "number", min: 30, max: 400, step: 1, value: Math.round(o.largeur), style: "width:80px" });
        larg.addEventListener("change", () => {
          o.largeur = Math.max(30, nombre(larg.value));
          valider();
        });
        const genre = h(
          "select",
          {},
          h("option", { value: "porte" }, "Porte (battant)"),
          h("option", { value: "galandage" }, "Porte coulissante à galandage (dans la cloison)"),
          h("option", { value: "applique" }, "Porte coulissante en applique (sur le mur)"),
          h("option", { value: "passage" }, "Libre (sans porte)"),
          h("option", { value: "fenetre" }, "Fenêtre")
        );
        genre.value = o.genre === "porte" && o.coulissante ? o.coulissante : o.genre;
        genre.addEventListener("change", () => {
          if (genre.value === "galandage" || genre.value === "applique") {
            o.genre = "porte";
            o.coulissante = genre.value;
          } else {
            o.genre = genre.value;
            delete o.coulissante;
          }
          valider();
        });
        bloc.append(
          h("label", { class: "champ" }, h("span", {}, "Ouverture"), genre),
          h("label", { class: "champ" }, h("span", {}, "Largeur (cm)"), larg)
        );
        if (o.genre === "passage")
          bloc.append(
            h(
              "button",
              {
                class: "btn petit",
                title: "Le morceau de mur disparaît vraiment : la pièce n'est plus fermée de ce côté (elle se réunit à la voisine)",
                onclick: () => {
                  const m = murDe(o.mur);
                  if (!m) return;
                  const L = dist(m.a, m.b) || 1,
                    w = o.largeur / 2 / L;
                  d.ouvertures = d.ouvertures.filter(x => x !== o);
                  couperMur(m, o.t - w, o.t + w, true);
                },
              },
              "Effacer vraiment ce morceau de mur"
            )
          );
        if (o.genre === "porte" && o.coulissante)
          // (coulissante : elle s'efface d'un côté de l'ouverture — dans la cloison, ou le long du mur, sur une face)
          bloc.append(
            h(
              "div",
              { style: "display:flex;gap:6px;flex-wrap:wrap" },
              h(
                "button",
                {
                  class: "btn petit",
                  onclick: () => {
                    o.charniere = o.charniere === "d" ? "g" : "d";
                    valider();
                  },
                },
                "⇆ S'efface de l'autre côté"
              ),
              o.coulissante === "applique"
                ? h(
                    "button",
                    {
                      class: "btn petit",
                      onclick: () => {
                        o.sens = -(o.sens || 1);
                        valider();
                      },
                    },
                    "⇅ Sur l'autre face du mur"
                  )
                : null
            ),
            h(
              "p",
              { class: "aide", style: "margin:4px 0 0" },
              o.coulissante === "galandage"
                ? "Le vantail rentre dans la cloison (pointillé) : pas d'appareillage encastré sur ce morceau de cloison, des deux côtés."
                : "Le vantail glisse le long du mur, sur cette face : pas d'appareillage sur ce morceau de mur (pointillé)."
            )
          );
        else if (o.genre === "porte")
          bloc.append(
            h(
              "div",
              { style: "display:flex;gap:6px;flex-wrap:wrap" },
              h(
                "button",
                {
                  class: "btn petit",
                  onclick: () => {
                    o.sens = -(o.sens || 1);
                    valider();
                  },
                },
                "⇅ Ouvre de l'autre côté"
              ),
              h(
                "button",
                {
                  class: "btn petit",
                  onclick: () => {
                    o.charniere = o.charniere === "d" ? "g" : "d";
                    valider();
                  },
                },
                "⇆ Charnières de l'autre côté"
              )
            )
          );
        else if (o.genre === "fenetre")
          bloc.append(
            h(
              "button",
              {
                class: "btn petit",
                onclick: () => {
                  o.sens = -(o.sens || 1);
                  valider();
                },
              },
              "⇅ Côté du rebord"
            )
          );
      }
      // un mur arrondi choisi (tous ses morceaux) : son rayon
      const arcSeul = murs.length && murs.every(m => m.arc && m.arc === murs[0].arc) && !objs.length ? murs[0] : null;
      if (arcSeul) {
        const r = h("input", { type: "number", step: 1, min: 1, value: Math.round(arcSeul.rayon), style: "width:90px" });
        r.addEventListener("change", () => {
          const v = nombre(r.value);
          if (v > 0) changerRayon(arcSeul.arc, v);
        });
        bloc.append(
          h("div", {}, "Mur arrondi"),
          h("label", { class: "champ" }, h("span", {}, "Rayon (cm, au milieu du mur)"), r),
          h(
            "button",
            {
              class: "btn petit",
              title: "Les deux murs reviennent jusqu'à leur angle d'avant",
              onclick: () => {
                defaireArrondi(arcSeul.arc);
                etat.sel.clear();
                valider();
              },
            },
            "✕ Enlever l'arrondi (angle vif)"
          )
        );
      }
      if (murs.length > 1 && !objs.length) {
        const eps = [...new Set(murs.map(m => m.ep || d.epaisseur))];
        const ep = h("input", {
          type: "number",
          step: 1,
          min: 2,
          value: eps.length === 1 ? eps[0] : "",
          placeholder: "plusieurs",
          style: "width:80px",
        });
        ep.addEventListener("change", () => {
          const v = Math.max(2, nombre(ep.value));
          if (v) {
            const recoller = retenirCollage(null, murs);
            murs.forEach(m => {
              m.ep = v;
            });
            recoller();
            valider();
          }
        });
        const cote = h("input", { type: "checkbox", checked: murs.every(coteVisible) });
        cote.addEventListener("change", () => {
          murs.forEach(m => {
            m.cote = cote.checked;
          });
          valider();
        });
        const figes = h("input", { type: "checkbox", checked: murs.every(m => m.fige) });
        figes.addEventListener("change", () => {
          murs.forEach(m => {
            if (figes.checked) m.fige = true;
            else delete m.fige;
          });
          valider();
        });
        bloc.append(
          arcSeul ? "" : h("div", {}, murs.length + " murs"),
          h("label", { class: "champ" }, h("span", {}, "Épaisseur de ces murs (cm)"), ep),
          h("label", { class: "case" }, cote, "Afficher leurs cotes"),
          h("label", { class: "case" }, figes, "🔒 Longueurs figées")
        );
        // deux murs qui se touchent par un bout : l'angle entre eux, et lequel bouge (A et B marqués sur le plan)
        const ang = murs.length === 2 && !murs.some(m => m.arc) ? angleDeuxMurs(murs[0], murs[1]) : null;
        if (ang) {
          const va = h("input", { type: "number", step: 1, min: 1, max: 179, value: Math.round(ang.deg * 10) / 10, style: "width:80px" });
          const qui = h(
            "select",
            { title: "Le mur qui tourne autour de l'angle (A et B sont marqués sur le plan) ; il garde sa longueur", style: "width:auto" },
            h("option", { value: "b" }, "le mur B bouge"),
            h("option", { value: "a" }, "le mur A bouge")
          );
          qui.value = etat.murQuiBouge || "b";
          qui.addEventListener("change", () => {
            etat.murQuiBouge = qui.value;
          });
          va.addEventListener("change", () => {
            const v = nombre(va.value);
            if (!(v > 0 && v < 180)) return toast("Un angle entre 1 et 179°.", true);
            regleAngleDeuxMurs(murs[0], murs[1], v, qui.value);
          });
          bloc.append(
            h(
              "label",
              { class: "champ" },
              h("span", {}, "Angle entre les murs A et B (°)"),
              h("div", { style: "display:flex;gap:6px;align-items:center;flex-wrap:wrap" }, va, qui)
            )
          );
        } else if (murs.length === 2 && !arcSeul)
          bloc.append(h("div", { class: "aide" }, "Angle : seulement entre deux murs qui se touchent par un bout."));
        if (!arcSeul)
          bloc.append(
            h(
              "button",
              {
                class: "btn petit",
                title:
                  "Chaque mur choisi devient d'équerre (angles à 90°) avec le plus long d'entre eux ; les murs reliés suivent, les longueurs changent un peu si besoin",
                onclick: () => mettreDEquerre(murs),
              },
              "⊾ Tout d'équerre (90°)"
            )
          );
      }
      if (murs.length === 1 && !objs.length) {
        const m = murs[0];
        // (façade : la longueur au bord extérieur, comme sa cote ; mur intérieur : seulement ses cotes intérieures)
        const facade = coteExterieur(m) !== 0 || !segmentsInterieurs(m).length; // (mur seul : sa longueur)
        const lg = h("input", {
          type: "number",
          step: 1,
          value: Math.round(longueurAffichee(m)),
          style: "width:90px",
          disabled: !!m.fige,
          title: m.fige ? "Longueur figée" : "Longueur du mur au bord extérieur, comme sa cote",
        });
        const fige = h("input", { type: "checkbox", checked: !!m.fige });
        fige.addEventListener("change", () => {
          if (fige.checked) m.fige = true;
          else delete m.fige;
          valider();
        });
        const bout = h(
          "select",
          { title: "Le bout du mur qui bouge quand on change la longueur (A et B sont marqués sur le plan)", style: "width:auto" },
          h("option", { value: "b" }, "le bout B bouge"),
          h("option", { value: "a" }, "le bout A bouge")
        );
        bout.value = etat.boutMur || "b";
        bout.addEventListener("change", () => {
          etat.boutMur = bout.value;
        });
        lg.addEventListener("change", () => {
          const L = dist(m.a, m.b) || 1,
            k = Math.max(1, nombre(lg.value) - (longueurAffichee(m) - L)) / L,
            fixe = bout.value === "a" ? m.b : m.a,
            bouge = bout.value === "a" ? m.a : m.b;
          deplacerPoint(bouge, { x: fixe.x + (bouge.x - fixe.x) * k, y: fixe.y + (bouge.y - fixe.y) * k });
          valider();
        });
        const ep = h("input", { type: "number", step: 1, value: m.ep || d.epaisseur, style: "width:70px" });
        ep.addEventListener("change", () => {
          const recoller = retenirCollage(null, [m]);
          m.ep = Math.max(2, nombre(ep.value));
          recoller();
          valider();
        });
        const cote = h("input", { type: "checkbox", checked: coteVisible(m) });
        cote.addEventListener("change", () => {
          m.cote = cote.checked;
          valider();
        });
        // cotes intérieures de ce mur, tapées ici et gardées 🔒 : une case par face (une seule si les deux faces ont la
        // même), une par partie si des cloisons en partent
        const segs = segmentsInterieurs(m);
        const L0 = dist(m.a, m.b) || 1,
          ux = (m.b.x - m.a.x) / L0,
          uy = (m.b.y - m.a.y) / L0;
        const faces = [1, -1].map(cote => segs.filter(x => x.cote === cote)).filter(l => l.length);
        const memes =
          faces.length === 2 &&
          faces[0].length === faces[1].length &&
          faces[0].every((x, i) => Math.abs(x.t0 - faces[1][i].t0) < 1 && Math.abs(x.t1 - faces[1][i].t1) < 1);
        // (face nommée par sa pièce ; sans nom, par sa direction : haut, bas, gauche, droite — un mur penché : la
        //  direction la plus proche)
        const nomFace = l => {
          const sg = l[0],
            tm = (sg.t0 + sg.t1) / 2,
            e = (m.ep || d.epaisseur) / 2 + 15,
            nx = -uy * sg.cote,
            ny = ux * sg.cote,
            pc = pieceEn({ x: m.a.x + ux * tm + nx * e, y: m.a.y + uy * tm + ny * e });
          if (pc && pc.nom) return "côté " + pc.nom;
          return "côté " + (Math.abs(nx) > Math.abs(ny) ? (nx > 0 ? "droit" : "gauche") : ny > 0 ? "bas" : "haut");
        };
        // (bout qui bouge quand on tape une cote intérieure : le même choix que pour la longueur)
        const boutCote = h(
          "select",
          {
            title: "Le mur qui bouge quand on change une cote intérieure : celui du côté du bout A ou du bout B (marqués sur le plan)",
            style: "width:auto",
          },
          h("option", { value: "" }, "choix automatique"),
          h("option", { value: "b" }, "côté du bout B bouge"),
          h("option", { value: "a" }, "côté du bout A bouge")
        );
        boutCote.value = etat.boutCote || "";
        boutCote.addEventListener("change", () => {
          etat.boutCote = boutCote.value;
        });
        const champCote = (sg, lib) => {
          const v = h("input", { type: "number", step: 1, value: Math.round(sg.longueur), style: "width:90px" });
          const garde = h("input", { type: "checkbox", checked: !!coteFixee(sg) });
          v.addEventListener("change", () => {
            const n = nombre(v.value);
            if (n > 10) appliquerCoteInterieure(sg, n, garde.checked || !coteFixee(sg), boutCote.value);
          });
          garde.addEventListener("change", () => {
            const cle = cleSegment(sg);
            d.cotes_fixes = (d.cotes_fixes || []).filter(f => f.cle !== cle);
            if (garde.checked) d.cotes_fixes.push({ cle, longueur: sg.longueur });
            valider();
          });
          return h(
            "label",
            { class: "champ" },
            h("span", {}, lib),
            h(
              "div",
              { style: "display:flex;gap:6px;align-items:center" },
              v,
              h("label", { class: "case", title: "Garder cette cote quand une autre change (🔒 sur le plan)" }, garde, "🔒")
            )
          );
        };
        const champsCotes = [];
        (memes ? [faces[0]] : faces).forEach(l =>
          l.forEach((sg, i) =>
            champsCotes.push(
              champCote(
                sg,
                (memes || faces.length === 1 ? "Cote intérieure" : "Cote intérieure, " + nomFace(l)) +
                  (l.length > 1 ? " — partie " + (i + 1) + " en partant de A" : "") +
                  " (cm)"
              )
            )
          )
        );
        const morceauxMur = [
          h("div", {}, coteExterieur(m) !== 0 ? "Mur de façade" : "Mur intérieur"),
          facade
            ? h(
                "label",
                { class: "champ" },
                h("span", {}, "Longueur extérieure (cm)"),
                h("div", { style: "display:flex;gap:6px;align-items:center" }, lg, bout)
              )
            : null,
          ...champsCotes,
          champsCotes.length ? h("label", { class: "champ" }, h("span", {}, "Quand une cote intérieure change"), boutCote) : null,
          h("label", { class: "champ" }, h("span", {}, "Épaisseur (cm)"), ep),
          facade
            ? h(
                "label",
                {
                  class: "case",
                  title:
                    "Le mur garde sa longueur : en bougeant un bout, il tourne autour de l'autre ; les déplacements qui l'allongeraient ou le raccourciraient sont refusés",
                },
                fige,
                "🔒 Longueur figée"
              )
            : null,
          facade ? h("label", { class: "case" }, cote, "Afficher sa cote") : null,
        ];
        bloc.append(...morceauxMur.filter(Boolean)); // (append écrirait « null »)
      }
      if (objs.length === 1 && objs[0].genre === "texte") {
        const tx = objs[0];
        const t = h("input", { type: "text", value: tx.texte || "" });
        t.addEventListener("change", () => {
          tx.texte = t.value;
          valider();
        });
        const tl = h("input", {
          type: "number",
          min: 6,
          max: 200,
          step: 1,
          value: tx.taille || 22,
          style: "width:70px",
          title: "Hauteur des lettres en cm sur le plan",
        });
        tl.addEventListener("change", () => {
          tx.taille = Math.max(4, nombre(tl.value) || 22);
          valider();
        });
        const tc = h("input", { type: "color", value: tx.couleur || "#1f2937", style: "width:34px;height:26px;padding:0" });
        tc.addEventListener("change", () => {
          tx.couleur = tc.value;
          valider();
        });
        const gras = h("input", { type: "checkbox", checked: tx.gras !== false });
        gras.addEventListener("change", () => {
          tx.gras = gras.checked;
          valider();
        });
        const lie = tx.lie && objetDe(tx.lie);
        bloc.append(
          h("label", { class: "champ" }, h("span", {}, "Texte"), t),
          h(
            "div",
            { style: "display:flex;gap:10px;align-items:end;flex-wrap:wrap" },
            h("label", { class: "champ" }, h("span", {}, "Taille (cm)"), tl),
            h("label", { class: "champ" }, h("span", {}, "Couleur"), tc),
            h("label", { class: "case" }, gras, "Gras")
          ),
          lie
            ? h(
                "div",
                { class: "sous" },
                "Attaché à : " + ((SYMB[lie.type] || {}).libelle || "un appareil") + " ",
                h(
                  "button",
                  {
                    class: "btn petit",
                    onclick: () => {
                      delete tx.lie;
                      valider();
                    },
                  },
                  "Détacher"
                )
              )
            : h("div", { class: "sous" }, "Pour l'attacher à un appareil (il le suit) : Ctrl+clic sur l'appareil, puis « Attacher ».")
        );
      }
      if (objs.length === 2 && objs.filter(o => o.genre === "texte").length === 1 && objs.filter(o => o.genre === "symbole").length === 1) {
        const tx = objs.find(o => o.genre === "texte"),
          ap = objs.find(o => o.genre === "symbole");
        bloc.append(
          h(
            "button",
            {
              class: "btn petit",
              onclick: () => {
                tx.lie = ap.id;
                valider();
                toast("Le texte suit maintenant cet appareil.");
              },
            },
            "Attacher le texte à cet appareil"
          )
        );
      }
      const symb = objs.filter(o => o.genre === "symbole");
      if (symb.length === 1 && AVEC_TEXTE.includes(symb[0].type)) {
        const t = h("input", { type: "text", value: symb[0].texte || "", placeholder: "ex. 32 A, VMC", style: "width:140px" });
        t.addEventListener("change", () => {
          const v = t.value.trim();
          if (v) symb[0].texte = v;
          else delete symb[0].texte;
          valider();
        });
        bloc.append(h("label", { class: "champ" }, h("span", {}, "Texte à côté du symbole"), t));
      }
      if (symb.length) {
        if (symb.length === 1) bloc.append(h("div", {}, SYMB[symb[0].type] ? SYMB[symb[0].type].libelle : symb[0].type));
        if (symb.length === 1 && symb[0].type.startsWith("rep_")) {
          const r = REPERES.find(x => x[0] === symb[0].type);
          const rect = symb[0].type === "rep_rect";
          const t = h("input", {
            type: "text",
            maxlength: rect ? 12 : 6,
            value: symb[0].texte ?? (r ? r[1] : ""),
            style: "width:" + (rect ? 130 : 90) + "px",
          });
          t.addEventListener("change", () => {
            symb[0].texte = t.value.trim();
            valider();
          });
          bloc.append(h("label", { class: "champ" }, h("span", {}, rect ? "Texte dans le rectangle" : "Lettres dans le cercle"), t));
        }
        const selCi = h(
          "select",
          {},
          h("option", { value: "" }, "— aucun circuit —"),
          d.circuits.map(c => h("option", { value: c.id }, c.nom || "Circuit"))
        );
        const communs = [...new Set(symb.map(o => o.circuit || ""))];
        selCi.value = communs.length === 1 ? communs[0] : "";
        selCi.addEventListener("change", () => {
          symb.forEach(o => {
            o.circuit = selCi.value || null;
          });
          valider();
        });
        const pct = v => Math.round((v || 1) * 100);
        const tS = h("input", {
          type: "number",
          min: 30,
          max: 600,
          step: 5,
          value: pct(symb[0].sy),
          style: "width:70px",
          title: "Taille du symbole (100 % = taille normale)",
        });
        const lS = h("input", {
          type: "number",
          min: 30,
          max: 600,
          step: 5,
          value: pct(symb[0].sx),
          style: "width:70px",
          title: "Largeur seule (ex. radiateur plus long)",
        });
        tS.addEventListener("change", () => {
          const v = Math.max(30, nombre(tS.value)) / 100,
            recoller = retenirCollage(symb);
          symb.forEach(o => {
            const r = (o.sx || 1) / (o.sy || 1);
            o.sy = v;
            o.sx = v * r;
          });
          recoller();
          valider();
        });
        lS.addEventListener("change", () => {
          const v = Math.max(30, nombre(lS.value)) / 100;
          symb.forEach(o => {
            o.sx = v;
          });
          valider();
        });
        if (symb.every(estDecor)) {
          // (sanitaires, mobilier : leurs dimensions réelles, en cm ; pas de circuit, ne comptent nulle part)
          const T = TAILLE_SYMBOLE,
            o0 = symb[0],
            cm = v => Math.round((v || 1) * T);
          const lg = h("input", { type: "number", min: 10, max: 600, step: 5, value: cm(o0.sx), style: "width:72px" }),
            pf = h("input", { type: "number", min: 10, max: 600, step: 5, value: cm(o0.sy), style: "width:72px" });
          const appliquer = () => {
            const recoller = retenirCollage(symb);
            symb.forEach(o => {
              o.sx = Math.max(10, nombre(lg.value) || cm(o0.sx)) / T;
              o.sy = Math.max(10, nombre(pf.value) || cm(o0.sy)) / T;
            });
            recoller();
            valider();
          };
          lg.addEventListener("change", appliquer);
          pf.addEventListener("change", appliquer);
          bloc.append(
            h(
              "div",
              { style: "display:flex;gap:10px;align-items:end;flex-wrap:wrap" },
              h("label", { class: "champ" }, h("span", {}, "Largeur (cm)"), lg),
              h("label", { class: "champ" }, h("span", {}, "Profondeur (cm)"), pf)
            ),
            symb.every(o => o.type === "douche")
              ? (() => {
                  // (avec receveur : volume 1 = le receveur ; sans : rond de 1,20 m autour de l'arrivée d'eau)
                  const rc = h("input", { type: "checkbox", checked: !symb.some(sansReceveur) });
                  const rb = h(
                    "select",
                    { disabled: !symb.some(sansReceveur) },
                    h("option", { value: "milieu" }, "au milieu, côté mur"),
                    h("option", { value: "coin1" }, "dans un coin, côté mur"),
                    h("option", { value: "coin2" }, "dans l'autre coin, côté mur")
                  );
                  rb.value = o0.robinet || "milieu";
                  rc.addEventListener("change", () => {
                    symb.forEach(o => {
                      if (rc.checked) delete o.receveur;
                      else o.receveur = false;
                    });
                    valider();
                  });
                  rb.addEventListener("change", () => {
                    symb.forEach(o => (o.robinet = rb.value));
                    valider();
                  });
                  return h(
                    "div",
                    { class: "pile" },
                    h("label", { class: "case" }, rc, " Avec receveur (volume 1 = le receveur)"),
                    h("label", { class: "champ" }, h("span", {}, "Arrivée d'eau (sans receveur : volume 1 = 1,20 m autour)"), rb)
                  );
                })()
              : null,
            h(
              "div",
              { class: "sous" },
              "Pour voir l'usage de la pièce : ne compte ni dans le matériel, ni dans le devis, ni sur un circuit. R : tourner."
            )
          );
        } else
          bloc.append(
            h("label", { class: "champ" }, h("span", {}, "Circuit"), selCi),
            h(
              "div",
              { style: "display:flex;gap:10px;align-items:end;flex-wrap:wrap" },
              h("label", { class: "champ" }, h("span", {}, "Taille %"), tS),
              h("label", { class: "champ" }, h("span", {}, "Largeur %"), lS),
              h(
                "button",
                {
                  class: "btn petit",
                  title: "Taille normale",
                  onclick: () => {
                    const recoller = retenirCollage(symb);
                    symb.forEach(o => {
                      delete o.sx;
                      delete o.sy;
                    });
                    recoller();
                    valider();
                  },
                },
                "100 %"
              )
            ),
            h("div", { class: "sous" }, symb.length === 1 ? "Ou à la souris : poignées carrées (coin : taille, côté : largeur)." : ""),
            symb.every(o => PRISES.includes(o.type))
              ? (() => {
                  const c = h("input", { type: "checkbox", checked: symb.every(o => o.haute) });
                  c.addEventListener("change", () => {
                    symb.forEach(o => {
                      if (c.checked) o.haute = true;
                      else delete o.haute;
                    });
                    valider();
                  });
                  return h(
                    "div",
                    {},
                    h(
                      "label",
                      {
                        class: "case",
                        title: "Marquée « H » sur le plan ; hauteur : ⚙ Options > Hauteurs et réserves (" + hauteurs().prise_haute + " cm)",
                      },
                      c,
                      "Prise haute (H)"
                    ),
                    symb.some(estCommandee)
                      ? h("div", { class: "sous" }, "Prise commandée : reliée à une commande (le retour arrive à la prise).")
                      : null
                  );
                })()
              : "",
            optPlans().longueurs_actif && symb.length === 1
              ? (() => {
                  const o = symb[0],
                    i = h("input", {
                      type: "number",
                      min: 0,
                      max: 600,
                      step: 5,
                      value: o.h ?? "",
                      placeholder: String(hauteurDe({ ...o, h: null })),
                      style: "width:80px",
                    });
                  i.addEventListener("change", () => {
                    if (i.value === "") delete o.h;
                    else o.h = nombre(i.value);
                    valider();
                  });
                  return h(
                    "label",
                    {
                      class: "champ",
                      title: "Pour les longueurs des gaines et des fils ; vide : hauteur d'après son genre (⚙ Options > Hauteurs)",
                    },
                    h("span", {}, "Hauteur de pose (cm du sol)"),
                    i
                  );
                })()
              : "",
            h(
              "div",
              { style: "display:flex;gap:6px;flex-wrap:wrap" },
              h(
                "button",
                {
                  class: "btn petit",
                  title: "R",
                  onclick: () => {
                    symb.forEach(o => {
                      o.rot = ((o.rot || 0) + 90) % 360;
                    });
                    valider();
                  },
                },
                "⟳ Tourner"
              ),
              h(
                "button",
                {
                  class: "btn petit",
                  title:
                    "Un circuit à part (disjoncteur dédié) pour " +
                    (symb.length > 1 ? "chacun de ces appareils" : "cet appareil") +
                    " : four, lave-linge, VMC…",
                  onclick: () => {
                    const cs = symb.map(o => circuitSpecialise(o));
                    valider();
                    toast(
                      cs.length > 1
                        ? cs.length + " circuits spécialisés créés."
                        : "Circuit « " + cs[0].nom + " » (" + cs[0].calibre + " A) créé."
                    );
                  },
                },
                "⚡ Circuit spécialisé"
              ),
              // bloc : plusieurs appareillages dans le même boîtier / sur la même plaque (double prise, inter + prise…), sans limite de nombre
              symb.length > 1
                ? h(
                    "button",
                    {
                      class: "btn petit",
                      title:
                        "Ces appareillages sont dans le même bloc (même boîtier, même plaque) : entourés d'un rectangle, comptés ensemble dans le matériel, et leurs fils arrivent par la même gaine",
                      onclick: () => {
                        const ids = symb.filter(o => !estNoeud(o)).map(o => o.id);
                        d.blocs = (d.blocs || []).map(b => ({ ...b, membres: b.membres.filter(x => !ids.includes(x)) }));
                        d.blocs.push({ id: plId(), membres: ids });
                        valider();
                        toast("Bloc de " + ids.length + " appareillages.");
                      },
                    },
                    "▭ Mettre en bloc"
                  )
                : null,
              symb.some(o => blocDe(o.id))
                ? h(
                    "button",
                    {
                      class: "btn petit",
                      title: "Les appareillages choisis ne sont plus dans un bloc",
                      onclick: () => {
                        const ids = symb.map(o => o.id);
                        d.blocs = (d.blocs || []).map(b => ({ ...b, membres: b.membres.filter(x => !ids.includes(x)) }));
                        valider();
                      },
                    },
                    "Sortir du bloc"
                  )
                : null,
              symb.length === 1 && blocDe(symb[0].id)
                ? h(
                    "button",
                    {
                      class: "btn petit",
                      title: "Choisir tous les appareillages de ce bloc",
                      onclick: () => {
                        etat.sel = new Set(blocDe(symb[0].id).membres);
                        dessiner();
                        majPanneau();
                      },
                    },
                    "Tout le bloc"
                  )
                : null
            )
          );
      }
      if (pcs.length === 1) {
        const pc = pcs[0];
        const n = h("input", { type: "text", value: pc.nom || "", placeholder: "ex. Cuisine" });
        n.addEventListener("change", () => {
          pc.nom = n.value.trim();
          valider();
        });
        bloc.append(
          h("div", {}, "Pièce"),
          h("label", { class: "champ" }, h("span", {}, "Nom"), n),
          h(
            "div",
            {},
            h("b", {}, m2(surface(pc.pts))),
            h("span", { class: "sous" }, pc.auto ? " (suit les murs)" : " (contour dessiné)"),
            pc.auto
              ? null
              : h(
                  "button",
                  {
                    class: "btn petit",
                    style: "margin-left:6px",
                    title: "La pièce prend le contour des murs qui l'entourent et le suivra quand les murs bougent",
                    onclick: () => {
                      const g = centrePiece(pc.pts),
                        c = g && contourPiece(g);
                      if (!c) {
                        toast("Pas de murs fermés autour de cette pièce : son contour reste dessiné.", true);
                        return;
                      }
                      pc.auto = true;
                      pc.germe = g;
                      pc.pts = c;
                      valider();
                    },
                  },
                  "Suivre les murs"
                )
          ),
          h("div", { class: "sous", style: "margin-top:4px" }, "Aide à la pose dans cette pièce :"),
          h(
            "div",
            { style: "display:flex;gap:6px;flex-wrap:wrap" },
            h(
              "button",
              { class: "btn petit", title: "Répartit des prises le long des murs (hors portes et angles)", onclick: () => poserPrises(pc) },
              "Lot de prises…"
            ),
            h(
              "button",
              {
                class: "btn petit",
                title: "Points lumineux répartis dans la pièce, commandes près des portes, liaisons et circuit",
                onclick: () => poserEclairage(pc),
              },
              "Circuit lumière…"
            )
          ),
          ...(pc.etiquette
            ? [
                h(
                  "button",
                  {
                    class: "btn petit",
                    onclick: () => {
                      delete pc.etiquette;
                      valider();
                    },
                  },
                  "Nom au centre de la pièce"
                ),
              ]
            : [])
        );
      }
      if (objs.length === 1 && objs[0].type === "tableau") {
        // armoire : nom, armoire qui l'alimente, départ
        const ob = objs[0],
          sous = t => {
            let x = t,
              n = 0;
            while (x && x.alim && n++ < 20) {
              if (x.alim === ob.id) return true;
              x = tableauxPlan().find(y => y.id === x.alim);
            }
            return false;
          },
          ts = tableauxPlan().filter(t => t !== ob && !sous(t));
        const n = h("input", { type: "text", value: ob.num || "", placeholder: "ex. TGBT, TD étage, TD garage", style: "font-weight:700" });
        n.addEventListener("change", () => {
          const v = n.value.trim();
          if (v) ob.num = v;
          else delete ob.num;
          valider();
        });
        const bt = h("input", { type: "text", value: ob.batiment || "", placeholder: "ex. Maison, Garage" });
        bt.addEventListener("change", () => {
          const v = bt.value.trim();
          if (v) ob.batiment = v;
          else delete ob.batiment;
          valider();
        });
        bloc.append(
          h(
            "div",
            { style: "display:flex;gap:8px" },
            h("label", { class: "champ", style: "flex:1" }, h("span", {}, "Nom de l'armoire"), n),
            h("label", { class: "champ", style: "flex:1" }, h("span", {}, "Bâtiment"), bt)
          )
        );
        if (ts.length) {
          const al = h(
            "select",
            {},
            h("option", { value: "" }, "— aucune (tête de l'installation)"),
            ts.map(t =>
              h("option", { value: t.id }, nomArmoire(t) + (niveauDe(t.id) !== d.niveau ? " (" + nomNiveau(niveauDe(t.id)) + ")" : ""))
            )
          );
          al.value = ts.some(t => t.id === ob.alim) ? ob.alim : "";
          al.addEventListener("change", () => {
            if (al.value) ob.alim = al.value;
            else delete ob.alim;
            valider();
          });
          const cal = h(
            "select",
            { style: "width:80px" },
            ["16", "20", "25", "32", "40", "50", "63"].map(v => h("option", { value: v }, v + " A"))
          );
          cal.value = String(ob.alim_cal || 32);
          cal.addEventListener("change", () => {
            ob.alim_cal = Number(cal.value);
            valider();
          });
          const sec = h(
            "select",
            { style: "width:90px" },
            ["2,5", "4", "6", "10", "16", "25"].map(v => h("option", { value: v }, v + " mm²"))
          );
          sec.value = String(ob.alim_sec || "10");
          sec.addEventListener("change", () => {
            ob.alim_sec = sec.value;
            valider();
          });
          bloc.append(
            h("label", { class: "champ" }, h("span", {}, "Alimentée par"), al),
            ...(ob.alim
              ? [
                  h(
                    "div",
                    { style: "display:flex;gap:8px;flex-wrap:wrap" },
                    h("label", { class: "champ" }, h("span", {}, "Départ"), cal),
                    h("label", { class: "champ" }, h("span", {}, "Section"), sec)
                  ),
                ]
              : []),
            h(
              "div",
              { class: "sous" },
              "Plan → tableau : un tableau par armoire, avec le départ qui alimente chacune ; chaque circuit part de l'armoire choisie dans la liste des circuits (sinon : celle où arrivent ses gaines)."
            )
          );
        }
      }
      if (objs.length === 1 && objs[0].type === "traversee") {
        // traversée de plancher : l'autre niveau
        const ob = objs[0],
          ici = rangNiveau(d.niveau),
          nj = ob.jumeau && niveauDe(ob.jumeau);
        const sn = h(
          "select",
          {},
          (d.niveaux || [])
            .filter(x => x.id !== d.niveau && Math.abs(rangNiveau(x.id) - ici) >= 1)
            .map(x => h("option", { value: x.id }, x.nom)),
          h("option", { value: "@combles" }, "Combles (pas de niveau dessiné)")
        );
        sn.value = nj || "@combles";
        sn.addEventListener("change", () => {
          if (sn.value === "@combles") {
            retirerJumeau(ob);
            delete ob.jumeau;
            ob.cote = "plafond";
          } else jumelerTraversee(ob, sn.value);
          valider();
        });
        bloc.append(
          h("label", { class: "champ" }, h("span", {}, "Vers le niveau"), sn),
          h(
            "div",
            { class: "sous" },
            nj
              ? "La même traversée est posée sur l'autre niveau, à la même place : les gaines et leurs fils continuent de l'une à l'autre ; les longueurs comptent la hauteur sous plafond (" +
                  (ob.cote === "sol" ? "ici : au sol" : "ici : au plafond") +
                  ")."
              : "Arrivée par le plafond (câble ou gaine venant des combles) : les gaines et moulures qui en partent comptent la descente depuis le plafond."
          ),
          ...[
            nj
              ? h(
                  "button",
                  {
                    class: "btn petit",
                    onclick: () => {
                      const j = ob.jumeau;
                      changerNiveau(nj).then(() => {
                        choisirOutil("selection");
                        etat.sel = new Set([j]);
                        dessiner();
                        majPanneau();
                      });
                    },
                  },
                  "Aller à l'autre niveau"
                )
              : null,
          ].filter(Boolean)
        );
      }
      if (objs.length === 1 && objs[0].genre === "symbole" && !estNoeud(objs[0]) && (d.niveaux || []).length > 1) {
        // liens vers un autre niveau
        const ob = objs[0],
          ls = liensDe(ob.id);
        bloc.append(
          h("div", { class: "sous", style: "margin-top:4px" }, "Autres niveaux :"),
          ...ls.map(l => {
            const y = objetPartout(l.a === ob.id ? l.b : l.a),
              nv = niveauDe(y.id);
            return h(
              "div",
              { style: "display:flex;gap:6px;align-items:center" },
              h(
                "span",
                {},
                (rangNiveau(nv) > rangNiveau(d.niveau) ? "↑ " : "↓ ") +
                  nomNiveau(nv) +
                  " · " +
                  ((SYMB[y.type] || {}).libelle || y.type) +
                  (y.piece ? " (" + y.piece + ")" : "")
              ),
              h(
                "button",
                {
                  class: "icone",
                  title: "Retirer ce lien",
                  onclick: () => {
                    d.liens_niveaux = d.liens_niveaux.filter(x => x !== l);
                    valider();
                  },
                },
                "✕"
              )
            );
          }),
          h(
            "button",
            { class: "btn petit", title: "Interrupteur en bas de l'escalier et lumière à l'étage…", onclick: () => fenetreLienNiveau(ob) },
            "Lier à un appareil d'un autre niveau…"
          )
        );
      }
      if (objs.length === 1 && prefixeNum(objs[0].type)) {
        const ob = objs[0],
          px = prefixeNum(ob.type),
          num = h("input", { type: "text", value: ob.num || "", style: "width:90px;font-weight:700" });
        num.addEventListener("change", () => {
          const v = num.value.trim();
          if (v) ob.num = v;
          valider();
        });
        bloc.append(
          h("label", { class: "champ" }, h("span", {}, ob.type === "boite" ? "Numéro de la boîte" : "Numéro"), num),
          h(
            "button",
            {
              class: "btn petit",
              title: px + "1, " + px + "2… de gauche à droite et de haut en bas (ce niveau)",
              onclick: () => {
                numeroterAuto(true, ob.type);
                valider();
              },
            },
            "Renuméroter (" + px + "1, " + px + "2…)"
          )
        );
      }
      if (objs.length === 1 && objs[0].genre === "symbole") {
        const pg = porteGenante(objs[0]);
        if (pg)
          bloc.append(
            h(
              "div",
              { class: "plan-alerte" },
              pg.coulissante === "galandage"
                ? "⚠ Sur la poche d'une porte à galandage : la porte rentre dans la cloison à cet endroit, pas d'appareillage encastré ici (des deux côtés)."
                : "⚠ Derrière une porte coulissante en applique : le vantail glisse devant ce morceau de mur, pas d'appareillage ici."
            )
          );
        const vol = optPlans().alertes_nfc && volumeDe(objs[0]);
        if (vol)
          bloc.append(
            h(
              "div",
              { class: "plan-alerte" },
              "⚠ Dans le volume " +
                vol.v +
                " " +
                vol.nom +
                " (NF C 15-100, salle d'eau) : à vérifier — permis en volume 2 : prise rasoir à transformateur, appareils de classe II adaptés ; au-dessus de 2,25 m : hors volume."
            )
          );
        const gr = groupe(objs[0].id);
        if (gr.length > 1)
          bloc.append(
            h(
              "button",
              {
                class: "btn petit",
                title: "Touche G, ou double-clic sur l'appareil",
                onclick: () => {
                  etat.sel = new Set(gr.map(o => o.id));
                  dessiner();
                  majPanneau();
                },
              },
              "Choisir son groupe de liaisons (" + gr.length + ")"
            )
          );
      }
      const gns = sel.map(id => (d.gaines || []).find(g => g.id === id)).filter(Boolean);
      if (gns.length === 1 && !objs.length) bloc.append(panneauGaine(gns[0]));
      else if (gns.length) bloc.append(h("div", {}, gns.length + " gaine(s)"));
      if (lia.length && !objs.length)
        bloc.append(
          h("div", {}, lia.length + " liaison(s)"),
          h("div", { class: "sous" }, "Glissez la poignée ronde pour courber la liaison."),
          ...(lia.some(l => l.dc)
            ? [
                h(
                  "button",
                  {
                    class: "btn petit",
                    onclick: () => {
                      lia.forEach(l => {
                        delete l.dc;
                      });
                      valider();
                    },
                  },
                  "Courbe d'origine"
                ),
              ]
            : [])
        );
      if (murs.length === 1)
        bloc.append(
          h(
            "button",
            {
              class: "btn petit",
              title: "Ctrl+A : tout choisir",
              onclick: () => {
                etat.sel = new Set(d.murs.map(m => m.id));
                dessiner();
                majPanneau();
              },
            },
            "Choisir tous les murs"
          )
        );
      bloc.append(h("button", { class: "btn petit danger", style: "margin-top:6px", onclick: supprimerSelection }, "Supprimer (Suppr)"));
      panneau.append(bloc);
    } else
      panneau.append(
        h(
          "div",
          { class: "plan-bloc" },
          h("h4", {}, "Choisir"),
          h(
            "div",
            { style: "display:flex;gap:6px;flex-wrap:wrap" },
            h(
              "button",
              {
                class: "btn petit",
                onclick: () => {
                  etat.sel = new Set(d.murs.map(m => m.id));
                  dessiner();
                  majPanneau();
                },
              },
              "Tous les murs"
            ),
            h("button", { class: "btn petit", title: "Ctrl+A", onclick: () => toutChoisir() }, "Tout")
          ),
          h("div", { class: "sous", style: "margin-top:4px" }, "Clic, Ctrl+clic ou Maj+clic pour en ajouter, cadre dans le vide.")
        )
      );
    // pièces : passer de l'une à l'autre sans chercher son nom sur le plan
    if ((d.pieces || []).length)
      panneau.append(
        h(
          "div",
          { class: "plan-bloc", "data-cle": "pieces" },
          h("h4", {}, `Pièces (${d.pieces.length})`),
          h(
            "div",
            { class: "plan-liste-pieces" },
            d.pieces.map(pc =>
              h(
                "button",
                {
                  class: "plan-piece-ligne" + (etat.sel.has(pc.id) ? " actif" : ""),
                  title: "Choisir cette pièce (nom, surface, aides à la pose)",
                  onclick: e => {
                    e.currentTarget.blur();
                    choisirOutil("selection");
                    etat.sel = new Set([pc.id]);
                    dessiner();
                    majPanneau();
                  },
                },
                h("span", {}, pc.nom || "Pièce sans nom"),
                h("span", { class: "sous" }, m2(surface(pc.pts)))
              )
            )
          )
        )
      );
    // circuits
    const symbs = d.objets.filter(o => o.genre === "symbole" && !estDecor(o)); // (sanitaires, mobilier : ne comptent pas)
    const bc = h("div", { class: "plan-bloc", "data-cle": "circuits" }, h("h4", {}, `Circuits (${d.circuits.length} départ(s))`));
    d.circuits.forEach(c => {
      const app = symbs.filter(o => o.circuit === c.id);
      const nbPrises = app.filter(o => PRISES.includes(o.type)).length,
        nbLum = app.filter(o => LUMIERES.includes(o.type) && o.type !== "prise_cmd").length;
      const alertes = [];
      const verifier = optPlans().alertes_nfc; // (⚙ Options du plan)
      if (verifier && nbPrises > (Number(c.calibre) >= 20 ? 12 : 8)) alertes.push(`${nbPrises} prises (repère : 8 en 16 A, 12 en 20 A)`);
      if (verifier && nbLum > 8) alertes.push(`${nbLum} points lumineux (repère : 8 par circuit)`);
      const nomC = h("input", { type: "text", value: c.nom || "", placeholder: "ex. Prises cuisine", style: "flex:1;min-width:0" });
      nomC.addEventListener("change", () => {
        c.nom = nomC.value;
        valider();
      });
      const cal = h(
        "select",
        { title: "Calibre du disjoncteur" },
        ["2", "10", "16", "20", "25", "32", "40"].map(v => h("option", { value: v }, v + " A"))
      );
      cal.value = String(c.calibre || 16);
      cal.addEventListener("change", () => {
        c.calibre = Number(cal.value);
        valider();
      });
      const coul = boutonCouleurCircuit(c.couleur, v => {
        c.couleur = v;
        valider();
      });
      cal.style.width = "72px";
      cal.style.flex = "none";
      coul.style.flex = "none";
      const secC = h(
        "select",
        {
          title: "Section des fils de ce circuit (gaines) : d'après le calibre, ou imposée",
          style: "width:auto;flex:none;padding:2px 4px;font-size:12px",
        },
        h("option", { value: "" }, "section auto"),
        ["1,5", "2,5", "4", "6", "10"].map(v => h("option", { value: v }, v + " mm²"))
      );
      secC.value = c.section || "";
      secC.addEventListener("change", () => {
        if (secC.value) c.section = secC.value;
        else delete c.section;
        valider();
      });
      const tsC = tableauxPlan();
      let selArm = null;
      if (tsC.length > 1) {
        const dev = armoireDevinee(c) || teteArmoires();
        selArm = h(
          "select",
          {
            title: "Armoire d'où part ce circuit (plan → tableau : un tableau par armoire)",
            style: "width:auto;flex:none;padding:2px 4px;font-size:12px",
          },
          h("option", { value: "" }, "⚡ " + nomArmoire(dev) + " (auto)"),
          tsC.map(t => h("option", { value: t.id }, "⚡ " + nomArmoire(t)))
        );
        selArm.value = c.armoire && tsC.some(t => t.id === c.armoire) ? c.armoire : "";
        selArm.addEventListener("change", () => {
          if (selArm.value) c.armoire = selArm.value;
          else delete c.armoire;
          valider();
        });
      }
      bc.append(
        h(
          "div",
          { class: "plan-circuit" + (etat.circuitVu === c.id ? " vu" : "") },
          h(
            "div",
            { style: "display:flex;gap:4px;align-items:center" },
            h(
              "b",
              {
                title: "Repère du disjoncteur (Q1, Q2… : le même dans le tableau ; repère des gaines entre boîtes)",
                style: "min-width:24px;font-size:12px",
              },
              repDe(c)
            ),
            coul,
            nomC,
            cal
          ),
          h(
            "div",
            { style: "display:flex;gap:4px;align-items:center;flex-wrap:wrap" },
            secC,
            selArm,
            h(
              "span",
              { class: "sous", title: "Sans les commandes (interrupteurs, poussoirs…), qui ne comptent pas dans un circuit" },
              app.filter(o => (SYMB[o.type] || {}).categorie !== "Commandes").length + " appareil(s)"
            ),
            h(
              "button",
              {
                class: "btn petit",
                title: "Mettre les éléments choisis sur ce circuit",
                onclick: () => {
                  const s = [...etat.sel].map(objetDe).filter(o => o && o.genre === "symbole");
                  if (!s.length) {
                    toast("Choisissez d'abord des appareils (clic, Maj+clic ou cadre).", true);
                    return;
                  }
                  s.forEach(o => {
                    o.circuit = c.id;
                  });
                  valider();
                },
              },
              "← Affecter"
            ),
            h(
              "button",
              {
                class: "btn petit",
                title: "Montrer seulement ce circuit",
                onclick: () => {
                  etat.circuitVu = etat.circuitVu === c.id ? null : c.id;
                  dessiner();
                  majPanneau();
                },
              },
              etat.circuitVu === c.id ? "Tout voir" : "Voir"
            ),
            h(
              "button",
              {
                class: "icone",
                title: "Supprimer ce circuit",
                onclick: () => {
                  d.circuits = d.circuits.filter(x => x !== c);
                  d.objets.forEach(o => {
                    if (o.circuit === c.id) o.circuit = null;
                  });
                  valider();
                },
              },
              "✕"
            )
          ),
          alertes.length ? h("div", { class: "plan-alerte" }, "⚠ " + alertes.join(" ; ")) : null
        )
      );
    });
    bc.append(
      h(
        "div",
        { style: "display:flex;gap:6px;flex-wrap:wrap" },
        h(
          "button",
          {
            class: "btn petit",
            onclick: () => {
              d.circuits.push({
                id: plId(),
                nom: "Circuit " + (d.circuits.length + 1),
                calibre: 16,
                couleur: COULEURS_CIRCUITS[d.circuits.length % COULEURS_CIRCUITS.length],
              });
              valider();
            },
          },
          "+ Circuit"
        )
      )
    );
    panneau.append(bc);
    // matériel
    const comptes = {};
    const pcMat = d.pieces.find(x => x.id === etat.matPiece);
    if (!pcMat) etat.matPiece = "";
    symbs
      .filter(o => !pcMat || dansPolygone(o, pcMat.pts))
      .forEach(o => {
        const k = cleMateriel(o);
        comptes[k] = (comptes[k] || 0) + 1;
      });
    const sansCircuit = symbs.filter(o => !o.circuit && !["tableau"].includes(o.type)).length;
    const selMat = d.pieces.length
      ? h(
          "select",
          {},
          h("option", { value: "" }, "Tout le plan"),
          d.pieces.map(x => h("option", { value: x.id }, (x.nom || "Pièce sans nom") + " · " + m2(surface(x.pts))))
        )
      : null;
    if (selMat) {
      selMat.value = etat.matPiece;
      selMat.addEventListener("change", () => {
        etat.matPiece = selMat.value;
        majPanneau();
      });
    }
    panneau.append(blocCalques());
    // matériel : replié par défaut (clic sur le titre)
    const mat = h(
      "div",
      { class: "plan-bloc", "data-cle": "materiel" },
      h("h4", {}, "Matériel · " + symbs.length + " appareil(s)"),
      h(
        "div",
        { style: "display:flex;gap:6px;align-items:center;flex-wrap:wrap" },
        selMat,
        h(
          "button",
          { class: "btn petit", title: "Liste du matériel du plan, pièce par pièce, à imprimer", onclick: () => imprimerMateriel() },
          iconeImprimante(),
          "Imprimer"
        )
      ),
      Object.keys(comptes).length
        ? h(
            "table",
            { class: "plan-mat" },
            h(
              "tbody",
              {},
              Object.entries(comptes)
                .sort((a, b) => b[1] - a[1])
                .map(([t, n]) => h("tr", {}, h("td", {}, libMateriel(t)), h("td", { style: "text-align:right;font-weight:600" }, n)))
            )
          )
        : h("p", { class: "sous" }, "Aucun appareil."),
      sansCircuit ? h("p", { class: "sous" }, sansCircuit + " appareil(s) sans circuit") : null,
      (() => {
        // blocs : plaques / boîtiers multipostes, par composition (pour commander le bon support)
        const cb = {};
        for (const b of d.blocs || []) {
          const ms = b.membres.map(objetDe).filter(o => o && (!pcMat || dansPolygone(o, pcMat.pts)));
          if (ms.length < 2) continue;
          const k =
            ms.length +
            " postes : " +
            ms
              .map(o => (SYMB[o.type] || {}).libelle || o.type)
              .sort()
              .join(" + ");
          cb[k] = (cb[k] || 0) + 1;
        }
        return Object.keys(cb).length
          ? h(
              "div",
              {},
              h("div", { style: "font-weight:600;margin-top:6px" }, "Blocs (même boîtier, même plaque)"),
              h(
                "table",
                { class: "plan-mat" },
                h(
                  "tbody",
                  {},
                  Object.entries(cb)
                    .sort()
                    .map(([k, n]) => h("tr", {}, h("td", {}, k), h("td", { style: "text-align:right;font-weight:600" }, n)))
                )
              )
            )
          : null;
      })()
    );
    panneau.append(mat);
    // chaque partie du panneau se replie (clic sur son titre) ; le matériel est replié au départ
    for (const bl of [...panneau.children]) {
      const t = bl.querySelector(":scope > h4");
      if (!t) continue;
      const cle = bl.dataset.cle || "choix";
      const det = h("details", { class: bl.className + " plan-repliable" }, h("summary", {}, t));
      det.append(...[...bl.childNodes]);
      det.open = !etat.replies.has(cle);
      det.addEventListener("toggle", () => {
        det.open ? etat.replies.delete(cle) : etat.replies.add(cle);
      });
      bl.replaceWith(det);
    }
  }

  /* -- dessin -- */
  const taille = () => {
    const r = cadre.getBoundingClientRect();
    return { l: r.width || 800, h: r.height || 600 };
  };
  const versMonde = (cx, cy) => {
    const r = svg.getBoundingClientRect();
    return { x: etat.vue.x + (cx - r.left) / etat.vue.z, y: etat.vue.y + (cy - r.top) / etat.vue.z };
  };
  // (Alt maintenue : hors grille, au centimètre près)
  let horsGrille = false;
  const suivreAlt = e => {
    horsGrille = !!e.altKey;
  };
  document.addEventListener("keydown", suivreAlt, true);
  document.addEventListener("keyup", suivreAlt, true);
  window.addEventListener("blur", () => (horsGrille = false));
  const grille = v => {
    if (horsGrille) return Math.round(v);
    const g = d.grille || 5;
    return Math.round(v / g) * g;
  };
  function geomOuverture(o) {
    const m = murDe(o.mur);
    if (!m) return null;
    const L = dist(m.a, m.b) || 1,
      ux = (m.b.x - m.a.x) / L,
      uy = (m.b.y - m.a.y) / L;
    const c = { x: m.a.x + ux * o.t * L, y: m.a.y + uy * o.t * L };
    return { m, ux, uy, nx: -uy, ny: ux, c, L, ep: m.ep || d.epaisseur };
  }
  function dessiner() {
    const { l, h: ht } = taille();
    svg.setAttribute("viewBox", `${etat.vue.x} ${etat.vue.y} ${l / etat.vue.z} ${ht / etat.vue.z}`);
    svg.setAttribute("width", l);
    svg.setAttribute("height", ht);
    svg.replaceChildren();
    const z = etat.vue.z,
      trait = 1.2 / z;
    // grille (1 m)
    const g0x = Math.floor(etat.vue.x / 100) * 100,
      g0y = Math.floor(etat.vue.y / 100) * 100;
    const gr = svgEl("g", { stroke: "#e5e7eb", "stroke-width": trait });
    for (let x = g0x; x < etat.vue.x + l / z; x += 100) gr.append(svgEl("line", { x1: x, y1: etat.vue.y, x2: x, y2: etat.vue.y + ht / z }));
    for (let y = g0y; y < etat.vue.y + ht / z; y += 100) gr.append(svgEl("line", { x1: etat.vue.x, y1: y, x2: etat.vue.x + l / z, y2: y }));
    svg.append(gr);
    // fond de plan (image ou PDF importé) ; un niveau sans fond montre celui d'un autre niveau gardé « sur tous les niveaux »
    const fondVu = d.fond && d.fond.src ? d.fond : fondAutreNiveau();
    if (fondVu && vu("fond"))
      svg.append(
        svgEl("image", {
          href: fondVu.src,
          x: fondVu.x,
          y: fondVu.y,
          width: fondVu.l,
          height: fondVu.h,
          opacity: fondVu.op ?? 0.5,
          preserveAspectRatio: "none",
          "pointer-events": "none",
          "data-fond": 1,
        })
      );
    // niveau du dessous en transparence (pour caler les murs d'un étage)
    if (d.voirDessous && !etat.imp) {
      const i = d.niveaux.findIndex(n => n.id === d.niveau),
        dessous = i > 0 ? d.etages[d.niveaux[i - 1].id] : null;
      if (dessous) {
        const gd = svgEl("g", { "pointer-events": "none", opacity: 0.18 });
        for (const m of dessous.murs || [])
          gd.append(
            svgEl("line", {
              x1: m.a.x,
              y1: m.a.y,
              x2: m.b.x,
              y2: m.b.y,
              stroke: "#7c3aed",
              "stroke-width": m.ep || d.epaisseur,
              "stroke-linecap": "square",
            })
          );
        svg.append(gd);
      }
    }
    // pièces : fond léger (ne capte pas les clics : le vide de la pièce reste le « vide » du plan)
    majPieces();
    const gp = svgEl("g", { "pointer-events": "none" });
    for (const pc of d.pieces || [])
      if (pc.pts && pc.pts.length > 2 && vu("pieces"))
        gp.append(
          svgEl("polygon", {
            points: pc.pts.map(q => q.x + "," + q.y).join(" "),
            fill: etat.sel.has(pc.id) ? "rgba(37,99,235,.12)" : "rgba(14,165,233,.06)",
            stroke: etat.sel.has(pc.id) ? "#2563eb" : "none",
            "stroke-width": 1.5 / z,
          })
        );
    svg.append(gp);
    // murs
    const gm = svgEl("g", {});
    for (const m of vu("murs") ? d.murs : []) {
      const s = etat.sel.has(m.id);
      gm.append(
        svgEl("line", {
          x1: m.a.x,
          y1: m.a.y,
          x2: m.b.x,
          y2: m.b.y,
          stroke: s ? "#2563eb" : "#374151",
          "stroke-width": m.ep || d.epaisseur,
          "stroke-linecap": m.arc ? "round" : "square", // (arrondi : petits murs droits bien jointifs)
          "data-mur": m.id,
        })
      );
    }
    svg.append(gm);
    // cotes des murs
    const gc = svgEl("g", { "font-size": 11 / z, fill: "#6b7280", "text-anchor": "middle" });
    for (const m0 of d.murs) {
      const L0 = dist(m0.a, m0.b);
      if (L0 < 20 || !coteVisible(m0) || !vu("cotes") || !vu("murs")) continue;
      // (mur de façade : la cote va d'un bord extérieur à l'autre, comme l'encombrement total — pas d'axe à axe)
      const [ea, eb] = coteExterieur(m0) !== 0 ? prolongementsExterieurs(m0) : [0, 0],
        ux0 = (m0.b.x - m0.a.x) / L0,
        uy0 = (m0.b.y - m0.a.y) / L0;
      const m = {
          ...m0,
          a: { x: m0.a.x - ux0 * ea, y: m0.a.y - uy0 * ea },
          b: { x: m0.b.x + ux0 * eb, y: m0.b.y + uy0 * eb },
        },
        L = L0 + ea + eb;
      const mx = (m.a.x + m.b.x) / 2,
        my = (m.a.y + m.b.y) / 2,
        ang = (Math.atan2(m.b.y - m.a.y, m.b.x - m.a.x) * 180) / Math.PI;
      const a2 = ang > 90 || ang < -90 ? ang + 180 : ang;
      // (côté extérieur du mur : la cote ne tombe pas sur un mur ou une cote intérieure ; le texte est sous la ligne de base : un peu plus loin de ce côté)
      const ce = coteExterieur(m0) || -1,
        off = ((m.ep || d.epaisseur) / 2 + (ce * (a2 === ang ? 1 : -1) > 0 ? 18 : 9) / z) * ce;
      const nx = -(m.b.y - m.a.y) / L,
        ny = (m.b.x - m.a.x) / L;
      // trait de cote (avec ses deux traits de rappel) entre le mur et le texte
      const lo = ((m.ep || d.epaisseur) / 2 + 6 / z) * ce,
        tk = 3.5 / z,
        stc = { stroke: "#6b7280", "stroke-width": 0.9 / z };
      gc.append(
        svgEl("line", { x1: m.a.x + nx * lo, y1: m.a.y + ny * lo, x2: m.b.x + nx * lo, y2: m.b.y + ny * lo, ...stc }),
        svgEl("line", {
          x1: m.a.x + nx * (lo - tk * ce),
          y1: m.a.y + ny * (lo - tk * ce),
          x2: m.a.x + nx * (lo + tk * ce),
          y2: m.a.y + ny * (lo + tk * ce),
          ...stc,
        }),
        svgEl("line", {
          x1: m.b.x + nx * (lo - tk * ce),
          y1: m.b.y + ny * (lo - tk * ce),
          x2: m.b.x + nx * (lo + tk * ce),
          y2: m.b.y + ny * (lo + tk * ce),
          ...stc,
        })
      );
      gc.append(
        svgEl(
          "text",
          { x: mx + nx * off, y: my + ny * off, transform: `rotate(${a2} ${mx + nx * off} ${my + ny * off})` },
          document.createTextNode(plMetres(L) + (m.fige ? " 🔒" : ""))
        )
      );
    }
    // murs arrondis : leur rayon, côté extérieur de l'arc
    if (vu("cotes") && vu("murs") && !d.cotes_masquees)
      for (const id of new Set(d.murs.filter(m => m.arc).map(m => m.arc))) {
        const segs = mursArc(id),
          m = segs[Math.floor(segs.length / 2)],
          c = segs[0].coin,
          mx = (m.a.x + m.b.x) / 2,
          my = (m.a.y + m.b.y) / 2,
          l = dist(c, { x: mx, y: my }) || 1,
          o = (m.ep || d.epaisseur) / 2 + 14 / z;
        gc.append(
          svgEl(
            "text",
            { x: mx + ((c.x - mx) / l) * o, y: my + ((c.y - my) / l) * o + 4 / z, "data-rayon": id },
            document.createTextNode("R " + plMetres(segs[0].rayon))
          )
        );
      }
    svg.append(gc);
    // cotes intérieures : de chaque côté d'un mur, une cote par partie de pièce (entre les cloisons qui en partent)
    etat.cotesInt = [];
    if (d.cotes_interieures && !d.cotes_masquees && vu("cotes") && vu("murs")) {
      const gi = svgEl("g", { "font-size": 10.5 / z, fill: "#0f766e", "text-anchor": "middle", "font-weight": 600 });
      // (partie identique des deux côtés d'un mur, ex. une cloison : une seule cote, de préférence celle gardée 🔒)
      const uniques = m => {
        const l = segmentsInterieurs(m);
        return l.filter(
          sg =>
            !l.some(
              o =>
                o !== sg &&
                o.cote !== sg.cote &&
                Math.abs(o.t0 - sg.t0) < 1 &&
                Math.abs(o.t1 - sg.t1) < 1 &&
                ((coteFixee(o) && !coteFixee(sg)) || (!!coteFixee(o) === !!coteFixee(sg) && o.cote > sg.cote))
            )
        );
      };
      // (deux murs face à face, de la même longueur intérieure — les deux côtés d'une pièce rectangulaire — : une
      //  seule cote, la gardée 🔒 de préférence, sinon celle du haut ou de gauche)
      const tous = d.murs.flatMap(m => uniques(m).map(sg => ({ sg, m })));
      const geo = ({ sg, m }) => {
        const L = dist(m.a, m.b) || 1,
          ux = (m.b.x - m.a.x) / L,
          uy = (m.b.y - m.a.y) / L,
          tm = (sg.t0 + sg.t1) / 2;
        return { ux, uy, nx: -uy * sg.cote, ny: ux * sg.cote, cx: m.a.x + ux * tm, cy: m.a.y + uy * tm, m };
      };
      const vis = tous.map(geo);
      const cache = new Set();
      tous.forEach((x, i) => {
        if (cache.has(i)) return;
        const gi = vis[i];
        tous.forEach((y, j) => {
          if (j === i || cache.has(j) || y.m === x.m || Math.abs(y.sg.longueur - x.sg.longueur) > 0.5) return;
          const gj = vis[j];
          if (gi.nx * gj.nx + gi.ny * gj.ny > -0.99) return; // (pas face à face)
          const dx = gj.cx - gi.cx,
            dy = gj.cy - gi.cy;
          if (dx * gi.nx + dy * gi.ny <= 0) return; // (l'autre n'est pas devant)
          if (Math.abs(dx * gi.ux + dy * gi.uy) > 1 + Math.max(0, x.sg.longueur * 0.05)) return; // (pas en vis-à-vis)
          // (pas de mur entre les deux : la même pièce)
          const r = rayon(
            { x: gi.cx + gi.nx * ((x.m.ep || d.epaisseur) / 2 + 1), y: gi.cy + gi.ny * ((x.m.ep || d.epaisseur) / 2 + 1) },
            gi.nx,
            gi.ny
          );
          if (!r || r.mur !== y.m) return;
          const garderI =
            !!coteFixee(x.sg) !== !!coteFixee(y.sg)
              ? !!coteFixee(x.sg)
              : gi.cy < gj.cy - 0.5 || (Math.abs(gi.cy - gj.cy) <= 0.5 && gi.cx <= gj.cx);
          cache.add(garderI ? j : i);
        });
      });
      for (const [k, { sg, m }] of tous.entries()) {
        if (cache.has(k)) continue;
        {
          const L = dist(m.a, m.b),
            ux = (m.b.x - m.a.x) / L,
            uy = (m.b.y - m.a.y) / L,
            nx = -uy * sg.cote,
            ny = ux * sg.cote;
          const off = (m.ep || d.epaisseur) / 2 + 7 / z,
            P = t => ({ x: m.a.x + ux * t + nx * off, y: m.a.y + uy * t + ny * off });
          const p0 = P(sg.t0),
            p1 = P(sg.t1),
            pm = P((sg.t0 + sg.t1) / 2),
            tick = 3 / z;
          const ang = (Math.atan2(uy, ux) * 180) / Math.PI,
            a2 = ang > 90 || ang < -90 ? ang + 180 : ang;
          const i = etat.cotesInt.push(sg) - 1,
            st = { stroke: "#0f766e", "stroke-width": 0.8 / z };
          gi.append(
            svgEl("line", { x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y, ...st }),
            svgEl("line", { x1: p0.x - nx * tick, y1: p0.y - ny * tick, x2: p0.x + nx * tick, y2: p0.y + ny * tick, ...st }),
            svgEl("line", { x1: p1.x - nx * tick, y1: p1.y - ny * tick, x2: p1.x + nx * tick, y2: p1.y + ny * tick, ...st })
          );
          const tx = { x: pm.x + (nx * 7) / z, y: pm.y + (ny * 7) / z + 3.5 / z };
          gi.append(
            svgEl(
              "text",
              { x: tx.x, y: tx.y, transform: `rotate(${a2} ${tx.x} ${tx.y})`, "data-cotei": i, style: etat.imp ? "" : "cursor:pointer" },
              document.createTextNode(plMetres(sg.longueur) + (coteFixee(sg) ? " 🔒" : ""))
            )
          );
        }
      }
      svg.append(gi);
    }
    // cotes principales : encombrement total (largeur et profondeur, faces extérieures)
    if (d.cotes_principales && !d.cotes_masquees && d.murs.length && vu("cotes")) {
      const ep = m => (m.ep || d.epaisseur) / 2;
      const x0 = Math.min(...d.murs.map(m => Math.min(m.a.x, m.b.x) - ep(m))),
        x1 = Math.max(...d.murs.map(m => Math.max(m.a.x, m.b.x) + ep(m)));
      const y0 = Math.min(...d.murs.map(m => Math.min(m.a.y, m.b.y) - ep(m))),
        y1 = Math.max(...d.murs.map(m => Math.max(m.a.y, m.b.y) + ep(m)));
      const o = 28 / z + 10,
        t = 5 / z,
        st = { stroke: "#4b5563", "stroke-width": 1 / z };
      const gq = svgEl("g", { "font-size": 12 / z, fill: "#374151", "text-anchor": "middle", "font-weight": 600 });
      const yh = y0 - o,
        xg = x0 - o;
      gq.append(
        svgEl("line", { x1: x0, y1: yh, x2: x1, y2: yh, ...st }),
        svgEl("line", { x1: x0, y1: yh - t, x2: x0, y2: y0, ...st }),
        svgEl("line", { x1: x1, y1: yh - t, x2: x1, y2: y0, ...st }),
        svgEl("text", { x: (x0 + x1) / 2, y: yh - 4 / z }, document.createTextNode(plMetres(x1 - x0))),
        svgEl("line", { x1: xg, y1: y0, x2: xg, y2: y1, ...st }),
        svgEl("line", { x1: xg - t, y1: y0, x2: x0, y2: y0, ...st }),
        svgEl("line", { x1: xg - t, y1: y1, x2: x0, y2: y1, ...st }),
        svgEl(
          "text",
          { x: xg - 4 / z, y: (y0 + y1) / 2, transform: `rotate(-90 ${xg - 4 / z} ${(y0 + y1) / 2})` },
          document.createTextNode(plMetres(y1 - y0))
        )
      );
      svg.append(gq);
    }
    // ouvertures
    for (const o of vu("murs") ? d.ouvertures : []) {
      const g = geomOuverture(o);
      if (!g) continue;
      const w = o.largeur / 2,
        s = etat.sel.has(o.id) ? "#2563eb" : "#111827";
      const a = { x: g.c.x - g.ux * w, y: g.c.y - g.uy * w },
        b = { x: g.c.x + g.ux * w, y: g.c.y + g.uy * w };
      const gg = svgEl("g", { "data-ouv": o.id });
      gg.append(svgEl("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: "#fff", "stroke-width": g.ep + 1 }));
      if (o.genre === "passage") {
        // passage sans porte : le mur s'arrête de chaque côté (la pièce reste fermée pour le calcul)
        gg.append(
          svgEl("line", {
            x1: a.x + (g.nx * g.ep) / 2,
            y1: a.y + (g.ny * g.ep) / 2,
            x2: a.x - (g.nx * g.ep) / 2,
            y2: a.y - (g.ny * g.ep) / 2,
            stroke: s,
            "stroke-width": trait * 1.5,
          }),
          svgEl("line", {
            x1: b.x + (g.nx * g.ep) / 2,
            y1: b.y + (g.ny * g.ep) / 2,
            x2: b.x - (g.nx * g.ep) / 2,
            y2: b.y - (g.ny * g.ep) / 2,
            stroke: s,
            "stroke-width": trait * 1.5,
          }),
          svgEl("line", {
            x1: a.x,
            y1: a.y,
            x2: b.x,
            y2: b.y,
            stroke: s,
            "stroke-width": trait * 0.8,
            "stroke-dasharray": `${2 / z} ${5 / z}`,
            opacity: 0.5,
          }),
          svgEl("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: "transparent", "stroke-width": g.ep })
        );
      } else if (o.genre === "porte" && o.coulissante) {
        // porte coulissante : le vantail fermé dans l'ouverture ; à galandage, la poche dans la cloison (pointillé) ; en
        // applique, le rail le long du mur, sur une face (pointillé)
        const cote = o.charniere === "d" ? 1 : -1,
          w2 = o.largeur / 2,
          P = (k, n) => ({ x: g.c.x + g.ux * k + g.nx * n, y: g.c.y + g.uy * k + g.ny * n }),
          e = g.ep / 2;
        if (o.coulissante === "galandage") {
          const p0 = P(cote * w2, 0),
            p1 = P(cote * (w2 + o.largeur), 0);
          const poche = [
            P(cote * w2, -e * 0.55),
            P(cote * (w2 + o.largeur), -e * 0.55),
            P(cote * (w2 + o.largeur), e * 0.55),
            P(cote * w2, e * 0.55),
          ];
          gg.append(
            svgEl("polygon", {
              points: poche.map(q => q.x + "," + q.y).join(" "),
              fill: "#fff",
              stroke: s,
              "stroke-width": trait * 0.8,
              "stroke-dasharray": `${3 / z} ${2 / z}`,
            }),
            svgEl("line", {
              x1: p0.x,
              y1: p0.y,
              x2: p1.x,
              y2: p1.y,
              stroke: s,
              "stroke-width": trait * 0.8,
              "stroke-dasharray": `${3 / z} ${2 / z}`,
            }),
            svgEl("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: s, "stroke-width": 2.5 / z + 1 })
          );
        } else {
          const sens = o.sens || 1,
            n = sens * (e + 3);
          const v0 = P(-w2 - 4, n),
            v1 = P(w2 + 4, n),
            r0 = P(cote > 0 ? -w2 - 4 : -(w2 + o.largeur + 4), n + sens * 2.5),
            r1 = P(cote > 0 ? w2 + o.largeur + 4 : w2 + 4, n + sens * 2.5);
          gg.append(
            svgEl("line", {
              x1: r0.x,
              y1: r0.y,
              x2: r1.x,
              y2: r1.y,
              stroke: s,
              "stroke-width": trait * 0.8,
              "stroke-dasharray": `${3 / z} ${2 / z}`,
            }),
            svgEl("line", { x1: v0.x, y1: v0.y, x2: v1.x, y2: v1.y, stroke: s, "stroke-width": 2.5 / z + 1 })
          );
        }
        gg.append(svgEl("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: "transparent", "stroke-width": g.ep }));
      } else if (o.genre === "porte") {
        const sens = o.sens || 1,
          piv = o.charniere === "d" ? b : a,
          autre = o.charniere === "d" ? a : b;
        const bout = { x: piv.x + g.nx * o.largeur * sens, y: piv.y + g.ny * o.largeur * sens };
        const balayage = (o.charniere === "d" ? 1 : 0) ^ (sens > 0 ? 0 : 1) ? 1 : 0;
        gg.append(
          svgEl("line", { x1: piv.x, y1: piv.y, x2: bout.x, y2: bout.y, stroke: s, "stroke-width": 2.5 / z + 1 }),
          svgEl("path", {
            d: `M${bout.x} ${bout.y} A${o.largeur} ${o.largeur} 0 0 ${balayage} ${autre.x} ${autre.y}`,
            fill: "none",
            stroke: s,
            "stroke-width": trait,
            "stroke-dasharray": `${4 / z} ${3 / z}`,
          }),
          svgEl("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: "transparent", "stroke-width": g.ep })
        );
      } else {
        // fenêtre : le cadre dans l'épaisseur du mur (rectangle) et le vitrage au milieu (double trait fin)
        const e = g.ep / 2,
          P = (q, k) => ({ x: q.x + g.nx * k, y: q.y + g.ny * k });
        const cadre = [P(a, -e), P(b, -e), P(b, e), P(a, e)];
        gg.append(
          svgEl("polygon", {
            points: cadre.map(q => q.x + "," + q.y).join(" "),
            fill: "#fff",
            stroke: s,
            "stroke-width": trait * 1.4,
          })
        );
        for (const k of [-Math.min(1.5, e / 4), Math.min(1.5, e / 4)])
          gg.append(svgEl("line", { x1: P(a, k).x, y1: P(a, k).y, x2: P(b, k).x, y2: P(b, k).y, stroke: s, "stroke-width": trait }));
        gg.append(svgEl("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: "transparent", "stroke-width": g.ep }));
      }
      svg.append(gg);
    }
    // volumes de la salle d'eau (pointillés fins : volume 1 = la douche ou la baignoire, volume 2 = 60 cm autour)
    for (const zv of optPlans().volumes_sdb ? volumesSdb() : []) {
      const gv = svgEl("g", {
        transform: `translate(${zv.o.x} ${zv.o.y}) rotate(${zv.o.rot || 0})`,
        fill: "none",
        "pointer-events": "none",
        opacity: etat.circuitVu ? 0.4 : 1,
      });
      const fs = 11 / z;
      if (zv.rob) {
        // (douche sans receveur : ronds autour de l'arrivée d'eau, dans le repère de la page)
        gv.setAttribute("transform", "");
        const R1 = VOLUME1_ITALIENNE,
          R2 = R1 + VOLUME2,
          c = zv.rob;
        gv.append(
          svgEl("circle", {
            cx: c.x,
            cy: c.y,
            r: R2,
            stroke: "#93c5fd",
            "stroke-width": 1.2 / z,
            "stroke-dasharray": `${6 / z} ${4 / z}`,
            fill: "#3b82f6",
            "fill-opacity": 0.04,
          }),
          svgEl("circle", {
            cx: c.x,
            cy: c.y,
            r: R1,
            stroke: "#3b82f6",
            "stroke-width": 1.2 / z,
            "stroke-dasharray": `${3 / z} ${3 / z}`,
            fill: "#3b82f6",
            "fill-opacity": 0.06,
          }),
          svgEl("circle", { cx: c.x, cy: c.y, r: 4, fill: "#3b82f6" }),
          svgEl("text", { x: c.x - R2 * 0.7, y: c.y - R2 * 0.7, "font-size": fs, fill: "#60a5fa" }, document.createTextNode("V2")),
          svgEl("text", { x: c.x - R1 * 0.7 + 4, y: c.y - R1 * 0.7 + 4, "font-size": fs, fill: "#3b82f6" }, document.createTextNode("V1"))
        );
      } else
        gv.append(
          svgEl("rect", {
            x: -zv.w - VOLUME2,
            y: -zv.h - VOLUME2,
            width: 2 * (zv.w + VOLUME2),
            height: 2 * (zv.h + VOLUME2),
            rx: VOLUME2,
            stroke: "#93c5fd",
            "stroke-width": 1.2 / z,
            "stroke-dasharray": `${6 / z} ${4 / z}`,
            fill: "#3b82f6",
            "fill-opacity": 0.04,
          }),
          svgEl("rect", {
            x: -zv.w,
            y: -zv.h,
            width: 2 * zv.w,
            height: 2 * zv.h,
            stroke: "#3b82f6",
            "stroke-width": 1.2 / z,
            "stroke-dasharray": `${3 / z} ${3 / z}`,
            fill: "#3b82f6",
            "fill-opacity": 0.06,
          }),
          svgEl(
            "text",
            { x: -zv.w - VOLUME2 + 6, y: -zv.h - VOLUME2 + 6 + fs, "font-size": fs, fill: "#60a5fa" },
            document.createTextNode("V2")
          ),
          svgEl("text", { x: -zv.w + 4, y: -zv.h + 4 + fs, "font-size": fs, fill: "#3b82f6" }, document.createTextNode("V1"))
        );
      // (limités à la pièce : les volumes ne passent pas à travers les murs)
      const pcv = (d.pieces || []).find(pc => (pc.pts || []).length >= 3 && dansPolygone(zv.o, pc.pts));
      if (pcv) {
        const idc = "vol-" + zv.o.id,
          cp = svgEl("clipPath", { id: idc });
        cp.append(svgEl("polygon", { points: pcv.pts.map(q => q.x + "," + q.y).join(" ") }));
        const enveloppe = svgEl("g", { "clip-path": `url(#${idc})` });
        enveloppe.append(gv);
        svg.append(cp, enveloppe);
      } else svg.append(gv);
    }
    // liaisons
    for (const li of vu("liaisons") ? d.liaisons : []) {
      const a = objetDe(li.de),
        b = objetDe(li.vers);
      if (!a || !b || !symboleVu(a) || !symboleVu(b)) continue;
      const { x: cx, y: cy } = controleLiaison(li, a, b);
      const c = a.circuit ? couleurObjet(a) : "#6b7280";
      const fade = etat.circuitVu && a.circuit !== etat.circuitVu && b.circuit !== etat.circuitVu;
      svg.append(
        svgEl("path", {
          d: `M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}`,
          fill: "none",
          stroke: etat.sel.has(li.id) ? "#2563eb" : c,
          "stroke-width": (etat.sel.has(li.id) ? 3 : 1.6) / z + 0.5,
          "stroke-dasharray": `${6 / z} ${4 / z}`,
          opacity: fade ? 0.15 : 0.9,
          "data-liaison": li.id,
        })
      );
      svg.append(
        svgEl("path", {
          d: `M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}`,
          fill: "none",
          stroke: "transparent",
          "stroke-width": 12 / z,
          "data-liaison": li.id,
        })
      );
    }
    // gaines (plan de pieuvre) et leurs fils : traits obliques de couleur, un lot par fonction, séparés par un espace
    const centresFils = []; // (gaines qui passent au même endroit : leurs fils côte à côte, pas les uns sur les autres)
    if (vu("gaines"))
      for (const g of d.gaines || []) {
        const ch = cheminGaine(g);
        if (!ch) continue;
        const A = objetDe(g.de),
          B = objetDe(g.vers);
        if (!symboleVu(A) || !symboleVu(B)) continue;
        const choisi = etat.sel.has(g.id),
          courbe = ch.length === 2;
        const cc = courbe && controleGaine(g, ch[0], ch[1]);
        const dPath = courbe
          ? `M${ch[0].x} ${ch[0].y} Q${cc.x} ${cc.y} ${ch[1].x} ${ch[1].y}`
          : "M" + ch.map(q => q.x + " " + q.y).join(" L");
        const gg = svgEl("g", { "data-gaine": g.id, style: etat.imp ? "" : "cursor:pointer" });
        if (choisi)
          gg.append(
            svgEl("path", {
              d: dPath,
              fill: "none",
              stroke: "#93c5fd",
              "stroke-width": 9 / z,
              "stroke-linejoin": "round",
              "stroke-linecap": "round",
              opacity: 0.8,
            })
          );
        const cond = conduitDe(g);
        if (cond === "moulure") {
          const cm = couleurConduit(g);
          gg.append(
            svgEl("path", {
              d: dPath,
              fill: "none",
              stroke: cm,
              "stroke-width": 5 / z + 1,
              "stroke-linejoin": "round",
              "stroke-linecap": "butt",
              opacity: 0.85,
            }),
            svgEl("path", { d: dPath, fill: "none", stroke: "transparent", "stroke-width": 16 / z })
          );
          // (montées et descentes : vers chaque appareil, et le long du parcours — angle, coude — d'après les changements)
          const hs = hauteursMoulure(g, ch),
            fs = 12 / z;
          // (passage par-dessus une porte : ce bout en pointillé, pour voir qu'il est compté)
          for (const pc of portesContournees(g, ch, hs))
            gg.append(
              svgEl("line", {
                x1: pc.a.x,
                y1: pc.a.y,
                x2: pc.b.x,
                y2: pc.b.y,
                stroke: "#fff",
                "stroke-width": 5 / z + 1.4,
                "stroke-dasharray": `${5 / z} ${5 / z}`,
                "pointer-events": "none",
              })
            );
          const fleche = (q, haut) =>
            gg.append(
              svgEl(
                "text",
                {
                  x: q.x,
                  y: q.y + fs * 0.35,
                  "text-anchor": "middle",
                  "font-size": fs,
                  "font-weight": 700,
                  fill: cm,
                  stroke: "#fff",
                  "stroke-width": fs * 0.22,
                  "paint-order": "stroke",
                },
                document.createTextNode(haut ? "↑" : "↓")
              )
            );
          [
            [objetDe(g.de), ch[0], ch[1], hs[0]],
            [objetDe(g.vers), ch[ch.length - 1], ch[ch.length - 2], hs[hs.length - 1]],
          ].forEach(([o, p0, p1, hm]) => {
            if (!o || !p1) return;
            const dh = ecartMoulure(o, hm);
            if (Math.abs(dh) < 15) return;
            fleche(dist(p0, p1) > 4 ? p1 : p0, dh > 0);
          });
          for (let i = 1; i < hs.length; i++) if (Math.abs(hs[i] - hs[i - 1]) >= 15) fleche(ch[i], hs[i] < hs[i - 1] ? false : true);
        } else
          gg.append(
            svgEl("path", {
              d: dPath,
              fill: "none",
              stroke: "#475569",
              "stroke-width": 2.2 / z + 0.6,
              "stroke-linejoin": "round",
              "stroke-linecap": "round",
            }),
            svgEl("path", { d: dPath, fill: "none", stroke: "transparent", "stroke-width": 16 / z })
          );
        // (fils : au milieu de la courbe, ou sur la plus longue partie d'une gaine à coudes)
        let iL = 0,
          lL = 0;
        for (let i = 1; i < ch.length; i++) {
          const l = dist(ch[i - 1], ch[i]);
          if (l > lL) {
            lL = l;
            iL = i;
          }
        }
        // (morceau choisi dans le panneau de la gaine : « Fils dessinés sur… »)
        if (g.morceauFils > 0 && g.morceauFils < ch.length && !courbe) {
          iL = g.morceauFils;
          lL = dist(ch[iL - 1], ch[iL]);
        }
        const lots = lotsTries(g);
        if (lots.length && lL > 0) {
          let p0 = ch[iL - 1],
            p1 = ch[iL];
          if (courbe) {
            // (corde locale de la courbe autour de son milieu, prise comme segment droit)
            const m = surCourbe(ch[0], cc, ch[1], 0.5),
              tl = Math.hypot(m.tx, m.ty) || 1;
            p0 = { x: m.x - ((m.tx / tl) * lL) / 2, y: m.y - ((m.ty / tl) * lL) / 2 };
            p1 = { x: m.x + ((m.tx / tl) * lL) / 2, y: m.y + ((m.ty / tl) * lL) / 2 };
          }
          const ux = (p1.x - p0.x) / lL,
            uy = (p1.y - p0.y) / lL;
          let nx = -uy,
            ny = ux;
          if (ny > 0 || (ny === 0 && nx > 0)) {
            nx = -nx;
            ny = -ny;
          } // (normale vers le haut de l'écran : le repère au-dessus)
          const pas = 4.6 / z,
            ecart = 16 / z,
            total = lots.reduce((t, l) => t + (l.fils.length - 1) * pas, 0) + (lots.length - 1) * ecart;
          // (place libre le long de la partie : décalée si une autre gaine a déjà ses fils là)
          const pas2 = total + 46 / z,
            essais = [0, 1, -1, 2, -2, 3, -3].map(k => k * pas2).filter(dc => Math.abs(dc) + total / 2 < lL / 2 - 4 / z || dc === 0);
          const libre = dc => {
            const x = (p0.x + p1.x) / 2 + ux * dc,
              y = (p0.y + p1.y) / 2 + uy * dc;
            return centresFils.every(q => Math.hypot(q.x - x, q.y - y) > Math.max(q.r, total / 2) + 30 / z);
          };
          let dcc = essais.find(libre) ?? 0,
            mx = (p0.x + p1.x) / 2 + ux * dcc,
            my = (p0.y + p1.y) / 2 + uy * dcc;
          if (courbe && dcc) {
            const q = surCourbe(ch[0], cc, ch[1], Math.max(0.15, Math.min(0.85, 0.5 + dcc / lL)));
            mx = q.x;
            my = q.y;
          }
          centresFils.push({ x: mx, y: my, r: total / 2 });
          let t = -total / 2;
          const vx = ux * 0.55 + nx,
            vy = uy * 0.55 + ny,
            vl = Math.hypot(vx, vy),
            ox = ((vx / vl) * 7) / z,
            oy = ((vy / vl) * 7) / z;
          const o = optPlans(),
            avecSec = o.gaine_section !== false,
            avecRep = o.gaine_repere !== false;
          lots.forEach((l, k) => {
            const t0 = t;
            l.fils.forEach((f, i) => {
              const cx = mx + ux * t,
                cy = my + uy * t,
                cf = couleurFil(g, k, l, i),
                coul = hexFil(cf);
              gg.append(
                svgEl("line", {
                  x1: cx - ox,
                  y1: cy - oy,
                  x2: cx + ox,
                  y2: cy + oy,
                  stroke: coul,
                  "stroke-width": 2.1 / z,
                  "stroke-linecap": "round",
                })
              );
              if (cf === "vj")
                gg.append(
                  svgEl("line", {
                    x1: cx - ox,
                    y1: cy - oy,
                    x2: cx + ox,
                    y2: cy + oy,
                    stroke: "#facc15",
                    "stroke-width": 2.1 / z,
                    "stroke-dasharray": `${2 / z} ${2 / z}`,
                  })
                );
              t += pas;
            });
            const tc = (t0 + t - pas) / 2,
              cx = mx + ux * tc,
              cy = my + uy * tc;
            if (avecRep && l.rep) texteGaine(gg, cx, cy, nx, ny, 14 / z, l.rep, 11 / z, true, l.coulRep || undefined);
            if (avecSec && l.section) texteGaine(gg, cx, cy, nx, ny, -13.5 / z, l.section, 9.5 / z, false);
            t += ecart - pas;
          });
          if (o.gaine_diametre !== false) {
            // (diamètre au bout des fils, du côté droit ou bas de l'écran)
            const ec = (Math.abs(ux) > 0.6 ? 10 : 15) / z; // (gaine plutôt verticale : un peu plus loin, sous la section du dernier lot)
            const fin = ux > 0.2 || (Math.abs(ux) <= 0.2 && uy > 0) ? total / 2 + ec : -total / 2 - ec;
            // (gaine plutôt horizontale : écrit à la suite, pour ne pas chevaucher la section du dernier lot)
            const anc = Math.abs(ux) > 0.6 ? (ux * fin > 0 ? "start" : "end") : null; // (vers la droite de l'écran : écrit à droite)
            const petit = optPlans().alertes_nfc && tropPetite(g); // (plus petit que conseillé : en orange, si les alertes sont actives)
            texteGaine(
              gg,
              mx + ux * fin,
              my + uy * fin,
              nx,
              ny,
              -13.5 / z,
              (estGoulotte(g) ? "goul. " : "") +
                libTaille(g, tailleGaine(g)) +
                (conduitDe(g) === "moulure" ? " " + libPoses(g) : "") +
                (petit ? " !" : ""),
              9 / z,
              petit,
              petit ? "#c2410c" : "#64748b",
              anc
            );
          }
          if (g.nom && o.gaine_nom !== false) {
            // (nom de la gaine : étiquette sur le trait, avant les fils)
            const deb = ux > 0.2 || (Math.abs(ux) <= 0.2 && uy > 0) ? -total / 2 - 24 / z : t - ecart + pas + 24 / z;
            etiquetteGaine(gg, mx + ux * deb, my + uy * deb, g.nom, z);
          }
        } else if (g.nom && optPlans().gaine_nom !== false) {
          const m = courbe ? surCourbe(ch[0], cc, ch[1], 0.5) : { x: (ch[0].x + ch[1].x) / 2, y: (ch[0].y + ch[1].y) / 2 };
          etiquetteGaine(gg, m.x, m.y, g.nom, z);
        }
        svg.append(gg);
      }
    // noms et surfaces des pièces
    for (const pc of vu("pieces") ? d.pieces || [] : []) {
      if (!pc.pts || pc.pts.length < 3) continue;
      // (au centre de la pièce, ou là où on l'a glissé)
      const xs = pc.pts.map(q => q.x),
        ys = pc.pts.map(q => q.y),
        lp = Math.max(...xs) - Math.min(...xs),
        hp = Math.max(...ys) - Math.min(...ys);
      // (à l'écran : au moins 15 points, plus grand dans une grande pièce, sans déborder de la pièce)
      const kt = (Number(optPlans().taille_texte) || 100) / 100;
      const fe = Math.min(
        Math.max(20, (15 * kt) / z, Math.min(lp, hp) * 0.07),
        lp / (0.62 * Math.max(4, (pc.nom || "Pièce").length) + 1),
        hp / 3
      );
      const f1 = etat.imp ? etat.imp.texteCm * 1.35 : Math.max(20, fe),
        f2 = etat.imp ? etat.imp.texteCm * 1.05 : f1 * 0.75;
      const ce = etiquettePiece(pc),
        cx = ce.x,
        cy = ce.y;
      const fade = etat.circuitVu ? 0.3 : 0.85,
        coul = etat.sel.has(pc.id) ? "#2563eb" : "#0369a1";
      svg.append(
        svgEl("g", { "data-piece": pc.id, opacity: fade, "text-anchor": "middle", fill: coul, style: "cursor:pointer" }, [
          svgEl("text", { x: cx, y: cy - f1 * 0.2, "font-size": f1, "font-weight": 700 }, document.createTextNode(pc.nom || "Pièce")),
          svgEl("text", { x: cx, y: cy + f2 * 0.95, "font-size": f2 }, document.createTextNode(m2(surface(pc.pts)))),
        ])
      );
    }
    // objets
    for (const o of d.objets) {
      const s = etat.sel.has(o.id);
      const fade = etat.circuitVu && o.circuit !== etat.circuitVu;
      if (o.genre === "texte") {
        if (!vu("textes")) continue;
        const te = svgEl(
          "text",
          {
            x: o.x,
            y: o.y,
            "font-size": etat.imp ? (etat.imp.texteCm * 1.3 * (o.taille || 22)) / 22 : o.taille || 22,
            "text-anchor": "middle",
            fill: o.couleur || "#1f2937",
            "font-weight": o.gras === false ? 400 : 600,
            "data-objet": o.id,
            opacity: fade ? 0.3 : 1,
          },
          document.createTextNode(o.texte || "")
        );
        svg.append(te);
        // choisi : un cadre bleu autour (le texte garde sa couleur)
        if (s) {
          try {
            const bx = te.getBBox();
            svg.append(
              svgEl("rect", {
                x: bx.x - 3 / z,
                y: bx.y - 2 / z,
                width: bx.width + 6 / z,
                height: bx.height + 4 / z,
                fill: "none",
                stroke: "#2563eb",
                "stroke-width": 1.5 / z,
                "stroke-dasharray": `${4 / z} ${3 / z}`,
                "pointer-events": "none",
              })
            );
          } catch (er) {
            /* */
          }
        }
        continue;
      }
      const def = SYMB[o.type];
      if (!def || !symboleVu(o)) continue;
      const c = couleurObjet(o),
        k = TAILLE_SYMBOLE / 40;
      // (repère rond avec des lettres : jamais tourné, les lettres restent à l'endroit même posé contre un mur)
      const rotA = o.type.startsWith("rep_") || o.type === "daaf" ? 0 : o.rot || 0;
      const g = svgEl("g", {
        transform: `translate(${o.x} ${o.y}) rotate(${rotA}) scale(${k * (o.sx || 1)} ${k * (o.sy || 1)})`,
        style: "color:" + c,
        stroke: "currentColor",
        fill: "currentColor",
        "stroke-width": traitSymb(),
        "data-objet": o.id,
        opacity: fade ? 0.15 : 1,
      });
      g.innerHTML =
        '<rect x="-20" y="-20" width="40" height="40" fill="#fff" fill-opacity="0.01" stroke="none"/>' +
        (o.texte !== undefined && o.type.startsWith("rep_") ? dessinRepere(o.texte, o.type === "rep_rect") : dessinTrait(def.dessin));
      if (s)
        g.append(
          svgEl("rect", {
            x: -21,
            y: -21,
            width: 42,
            height: 42,
            fill: "none",
            stroke: "#2563eb",
            "stroke-width": 1.5,
            "stroke-dasharray": "4 3",
            "vector-effect": "non-scaling-stroke",
          })
        );
      svg.append(g);
      if (porteGenante(o))
        svg.append(
          svgEl(
            "text",
            {
              x: o.x + TAILLE_SYMBOLE * 0.45,
              y: o.y - TAILLE_SYMBOLE * 0.45,
              "font-size": 14 / z,
              "font-weight": 700,
              fill: "#c2410c",
              stroke: "#fff",
              "stroke-width": 3 / z,
              "paint-order": "stroke",
              "pointer-events": "none",
            },
            document.createTextNode("⚠ porte")
          )
        );
      const vol = optPlans().alertes_nfc && volumeDe(o);
      if (vol)
        svg.append(
          svgEl(
            "text",
            {
              x: o.x + TAILLE_SYMBOLE * 0.45,
              y: o.y + TAILLE_SYMBOLE * 0.55,
              "font-size": 14 / z,
              "font-weight": 700,
              fill: "#c2410c",
              stroke: "#fff",
              "stroke-width": 3 / z,
              "paint-order": "stroke",
              "pointer-events": "none",
            },
            document.createTextNode("⚠ V" + vol.v)
          )
        );
      if ((o.type === "tableau" || prefixeNum(o.type)) && o.num) {
        // numéro automatique (boîte B1…, autres symboles choisis dans les options), nom de l'armoire (TGBT…)
        const fs = etat.imp ? etat.imp.texteCm * 1.15 : TAILLE_SYMBOLE * 0.42;
        svg.append(
          svgEl(
            "text",
            {
              x: o.x + TAILLE_SYMBOLE * 0.45,
              y: o.y - TAILLE_SYMBOLE * 0.4,
              "font-size": fs,
              "font-weight": 700,
              fill: "#0f172a",
              "data-objet": o.id,
              opacity: fade ? 0.15 : 1,
            },
            document.createTextNode(o.num)
          )
        );
      }
      if (o.haute && PRISES.includes(o.type)) {
        // prise haute : « H 1,10 » à côté (sa hauteur de pose)
        const fs = etat.imp ? etat.imp.texteCm * 1.15 : TAILLE_SYMBOLE * 0.42;
        const ar = ((o.rot || 0) * Math.PI) / 180,
          k = TAILLE_SYMBOLE * 0.5 * (o.sx || 1) + fs * 1.25; // (le long du mur, à droite de la prise)
        svg.append(
          svgEl(
            "text",
            {
              x: o.x + Math.cos(ar) * k,
              y: o.y + Math.sin(ar) * k + fs * 0.35,
              "text-anchor": "middle",
              "font-size": fs,
              "font-weight": 700,
              fill: "#0f172a",
              "data-objet": o.id,
              opacity: fade ? 0.15 : 1,
            },
            document.createTextNode("H " + (hauteurDe(o) / 100).toFixed(2).replace(".", ","))
          )
        );
      }
      // traversée de plancher : vers quel niveau ; liens vers un appareil d'un autre niveau : flèche « ↑ Étage »
      const versNiv = [];
      if (o.type === "traversee" && o.jumeau) versNiv.push(niveauDe(o.jumeau));
      if (vu("liaisons")) for (const l of liensDe(o.id)) versNiv.push(niveauDe(l.a === o.id ? l.b : l.a));
      [...new Set(versNiv.filter(Boolean))].forEach((nv, k) => {
        const fs = etat.imp ? etat.imp.texteCm : TAILLE_SYMBOLE * 0.36,
          haut = rangNiveau(nv) > rangNiveau(d.niveau);
        const x0 = o.x + TAILLE_SYMBOLE * 0.5,
          y0 = o.y + TAILLE_SYMBOLE * (0.35 + 0.45 * k);
        if (o.type !== "traversee")
          svg.append(
            svgEl("line", {
              x1: o.x,
              y1: o.y,
              x2: x0,
              y2: y0 - fs * 0.35,
              stroke: "#0f172a",
              "stroke-width": 1,
              "stroke-dasharray": "3 2",
              "vector-effect": "non-scaling-stroke",
              opacity: fade ? 0.15 : 1,
            })
          );
        svg.append(
          svgEl(
            "text",
            {
              x: x0,
              y: y0,
              "font-size": fs,
              "font-weight": 700,
              fill: "#0f172a",
              stroke: "#fff",
              "stroke-width": fs * 0.25,
              "paint-order": "stroke",
              "data-objet": o.id,
              opacity: fade ? 0.15 : 1,
            },
            document.createTextNode((haut ? "↑ " : "↓ ") + nomNiveau(nv))
          )
        );
      });
      // texte libre à côté du symbole (reste horizontal, du côté de la pièce)
      if (AVEC_TEXTE.includes(o.type) && o.texte) {
        // (au bout de la flèche, côté pièce)
        const a = ((o.rot || 0) * Math.PI) / 180,
          dx = Math.sin(a),
          dy = -Math.cos(a),
          r = 22 * k * (o.sy || 1);
        const fs = etat.imp ? etat.imp.texteCm * 1.1 : TAILLE_SYMBOLE * 0.36;
        const ancre = Math.abs(dx) > 0.5 ? (dx > 0 ? "start" : "end") : "middle";
        svg.append(
          svgEl(
            "text",
            {
              x: o.x + dx * r,
              y: o.y + dy * r + (ancre !== "middle" ? fs * 0.35 : dy > 0 ? fs * 0.8 : 0),
              "font-size": fs,
              "font-weight": 600,
              "text-anchor": ancre,
              fill: c,
              "data-objet": o.id,
              opacity: fade ? 0.15 : 1,
            },
            document.createTextNode(o.texte)
          )
        );
      }
    }
    // blocs d'appareillages : un rectangle noir autour, dans le sens des appareils (posés contre un mur ou non)
    if (vu("electricite"))
      for (const b of d.blocs || []) {
        const ms = b.membres.map(objetDe).filter(o => o && symboleVu(o));
        if (ms.length < 2) continue;
        const a = ((ms[0].rot || 0) * Math.PI) / 180,
          ca = Math.cos(a),
          sa = Math.sin(a),
          o0 = ms[0];
        let x1 = Infinity,
          y1 = Infinity,
          x2 = -Infinity,
          y2 = -Infinity;
        for (const o of ms) {
          const lx = (o.x - o0.x) * ca + (o.y - o0.y) * sa,
            ly = -(o.x - o0.x) * sa + (o.y - o0.y) * ca,
            r = (TAILLE_SYMBOLE / 2) * Math.max(o.sx || 1, o.sy || 1);
          x1 = Math.min(x1, lx - r);
          x2 = Math.max(x2, lx + r);
          y1 = Math.min(y1, ly - r);
          y2 = Math.max(y2, ly + r);
        }
        const m = TAILLE_SYMBOLE * 0.08;
        x1 -= m;
        y1 -= m;
        x2 += m;
        y2 += m;
        const pt = (lx, ly) => o0.x + lx * ca - ly * sa + "," + (o0.y + lx * sa + ly * ca);
        const choisi = b.membres.some(id => etat.sel.has(id));
        svg.append(
          svgEl("polygon", {
            points: [pt(x1, y1), pt(x2, y1), pt(x2, y2), pt(x1, y2)].join(" "),
            fill: "none",
            stroke: choisi && !etat.imp ? "#2563eb" : "#111",
            "stroke-width": (etat.imp ? 1.2 : 1.6) / z,
            "data-bloc": b.id,
            "pointer-events": "none",
          })
        );
      }
    // poignées : taille d'un appareil choisi seul, courbe d'une liaison choisie
    if (!etat.imp)
      for (const pg of [...poignees(), ...poigneesRecent()])
        if (pg.genre === "bouger") {
          svg.append(
            svgEl("line", {
              x1: pg.o.x,
              y1: pg.o.y,
              x2: pg.x,
              y2: pg.y,
              stroke: "#2563eb",
              "stroke-width": 1.5 / z,
              "stroke-dasharray": `${4 / z} ${3 / z}`,
              "pointer-events": "none",
            }),
            svgEl("circle", { cx: pg.o.x, cy: pg.o.y, r: 3 / z, fill: "#2563eb", "pointer-events": "none" }),
            svgEl("circle", {
              cx: pg.x,
              cy: pg.y,
              r: 16 / z,
              fill: "#2563eb",
              "fill-opacity": 0.85,
              stroke: "#fff",
              "stroke-width": 2 / z,
            }),
            svgEl(
              "text",
              { x: pg.x, y: pg.y + 6 / z, "font-size": 18 / z, fill: "#fff", "text-anchor": "middle", "pointer-events": "none" },
              document.createTextNode("✥")
            )
          );
        } else
          svg.append(
            pg.genre === "courbe" || pg.genre === "coude" || pg.genre === "courbeGaine"
              ? svgEl("circle", {
                  cx: pg.x,
                  cy: pg.y,
                  r: (etat.tablette ? 12 : 6) / z,
                  fill: "#fff",
                  stroke: "#2563eb",
                  "stroke-width": 2 / z,
                  style: "cursor:move",
                })
              : pg.genre === "ajoutCoude"
                ? svgEl("circle", {
                    cx: pg.x,
                    cy: pg.y,
                    r: (etat.tablette ? 9 : 4.5) / z,
                    fill: "#dbeafe",
                    stroke: "#2563eb",
                    "stroke-width": 1.2 / z,
                    style: "cursor:copy",
                  })
                : svgEl("rect", {
                    x: pg.x - (pg.doigt ? 11 : 5) / z,
                    y: pg.y - (pg.doigt ? 11 : 5) / z,
                    width: (pg.doigt ? 22 : 10) / z,
                    height: (pg.doigt ? 22 : 10) / z,
                    fill: "#fff",
                    stroke: "#2563eb",
                    "stroke-width": 2 / z,
                    style: "cursor:" + (pg.genre === "taille" ? "nwse-resize" : "ew-resize"),
                  })
          );
    // extrémités des murs choisis
    for (const m of d.murs)
      if (etat.sel.has(m.id) && !m.arc)
        for (const pt of [m.a, m.b])
          svg.append(
            svgEl("circle", { cx: pt.x, cy: pt.y, r: (etat.tablette ? 13 : 6) / z, fill: "#fff", stroke: "#2563eb", "stroke-width": 2 / z })
          );
    // un seul mur choisi : ses bouts A et B (longueur tapée dans le panneau)
    const murSeul = etat.sel.size === 1 && murDe([...etat.sel][0]);
    if (murSeul && !etat.imp)
      for (const [k, pt] of [
        ["A", murSeul.a],
        ["B", murSeul.b],
      ]) {
        const L = dist(murSeul.a, murSeul.b) || 1,
          ux = (murSeul.b.x - murSeul.a.x) / L,
          uy = (murSeul.b.y - murSeul.a.y) / L,
          sg = k === "A" ? -1 : 1,
          o = 16 / z;
        svg.append(
          svgEl(
            "text",
            {
              x: pt.x + ux * o * sg,
              y: pt.y + uy * o * sg + 5 / z,
              "font-size": 14 / z,
              "font-weight": 700,
              fill: "#2563eb",
              "text-anchor": "middle",
              "pointer-events": "none",
            },
            document.createTextNode(k)
          )
        );
      }
    // outil Arrondi : le 1er mur touché, et son bout
    const ar1 = etat.outil === "mur" && etat.arrondi1 && murDe(etat.arrondi1.id);
    if (ar1)
      svg.append(
        svgEl("line", {
          x1: ar1.a.x,
          y1: ar1.a.y,
          x2: ar1.b.x,
          y2: ar1.b.y,
          stroke: "#f97316",
          "stroke-width": (ar1.ep || d.epaisseur) + 4 / z,
          opacity: 0.5,
          "pointer-events": "none",
        }),
        svgEl("circle", {
          cx: ar1[etat.arrondi1.k].x,
          cy: ar1[etat.arrondi1.k].y,
          r: (etat.tablette ? 13 : 7) / z,
          fill: "#f97316",
          "pointer-events": "none",
        })
      );
    // deux murs choisis : A et B au milieu de chacun (angle réglé dans le panneau)
    const deuxMurs = etat.sel.size === 2 && [...etat.sel].map(murDe);
    if (deuxMurs && deuxMurs.every(Boolean) && !etat.imp)
      deuxMurs.forEach((m, i) => {
        const L = dist(m.a, m.b) || 1,
          nx = -(m.b.y - m.a.y) / L,
          ny = (m.b.x - m.a.x) / L,
          o = (m.ep || d.epaisseur) / 2 + 14 / z;
        svg.append(
          svgEl(
            "text",
            {
              x: (m.a.x + m.b.x) / 2 + nx * o,
              y: (m.a.y + m.b.y) / 2 + ny * o + 5 / z,
              "font-size": 14 / z,
              "font-weight": 700,
              fill: "#2563eb",
              "text-anchor": "middle",
              "pointer-events": "none",
              "data-mur-lettre": i ? "B" : "A",
            },
            document.createTextNode(i ? "B" : "A")
          )
        );
      });
    // notes à main levée (calque à part)
    if (vu("notes"))
      for (const n of d.notes || []) {
        if (!n.pts || n.pts.length < 2) continue;
        const pts = n.pts.map(q => q.x + "," + q.y).join(" "),
          choisi = etat.sel.has(n.id);
        const gn = svgEl("g", { "data-note": n.id, style: "cursor:pointer" });
        if (choisi)
          gn.append(
            svgEl("polyline", {
              points: pts,
              fill: "none",
              stroke: "#93c5fd",
              "stroke-width": (n.ep || 4) + 8 / z,
              "stroke-linecap": "round",
              "stroke-linejoin": "round",
              opacity: 0.7,
            })
          );
        gn.append(
          svgEl("polyline", {
            points: pts,
            fill: "none",
            stroke: n.coul || "#dc2626",
            "stroke-width": n.ep || 4,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
          }),
          svgEl("polyline", { points: pts, fill: "none", stroke: "transparent", "stroke-width": Math.max(n.ep || 4, 16 / z) })
        );
        svg.append(gn);
      }
    // cadre de la zone à reconnaître
    const zc = etat.cadrage && etat.cadrage.a ? etat.cadrage : etat.detect && etat.detect.zone;
    if (zc)
      svg.append(
        svgEl("rect", {
          x: Math.min(zc.a.x, zc.b.x),
          y: Math.min(zc.a.y, zc.b.y),
          width: Math.abs(zc.a.x - zc.b.x),
          height: Math.abs(zc.a.y - zc.b.y),
          fill: "rgba(37,99,235,.06)",
          stroke: "#2563eb",
          "stroke-width": 2 / z,
          "stroke-dasharray": `${8 / z} ${5 / z}`,
          "pointer-events": "none",
        })
      );
    // murs et portes reconnus sur la photo, à vérifier (un appui enlève ou remet)
    if (etat.detect) {
      const gd = svgEl("g", {});
      const trait = (m, coul, i, genre) => {
        gd.append(
          svgEl("line", {
            x1: m.a.x,
            y1: m.a.y,
            x2: m.b.x,
            y2: m.b.y,
            stroke: m.ok ? coul : "#dc2626",
            "stroke-width": m.ok ? d.epaisseur : 4 / z,
            opacity: m.ok ? 0.6 : 0.8,
            "stroke-dasharray": m.ok ? "" : `${6 / z} ${4 / z}`,
            "stroke-linecap": "butt",
          })
        );
        gd.append(
          svgEl("line", {
            x1: m.a.x,
            y1: m.a.y,
            x2: m.b.x,
            y2: m.b.y,
            stroke: "transparent",
            "stroke-width": Math.max(d.epaisseur, 24 / z),
            "data-detect": genre + ":" + i,
            style: "cursor:pointer",
          })
        );
      };
      etat.detect.murs.forEach((m, i) => trait(m, "#f97316", i, "mur"));
      etat.detect.portes.forEach((m, i) => trait(m, m.vide ? "#0d9488" : "#16a34a", i, "porte"));
      svg.append(gd);
    }
    // aperçus (mur en cours, liaison, cadre, guides)
    const ap = etat.apercu || {};
    const gap = svgEl("g", { "pointer-events": "none" }); // (les aperçus ne doivent pas cacher ce qu'on clique)
    svg.append(gap);
    if (etat.mur && ap.point) {
      gap.append(
        svgEl("line", {
          x1: etat.mur.x,
          y1: etat.mur.y,
          x2: ap.point.x,
          y2: ap.point.y,
          stroke: "#2563eb",
          "stroke-width": d.epaisseur,
          opacity: 0.45,
          "stroke-linecap": "square",
        })
      );
      gap.append(
        svgEl(
          "text",
          { x: ap.point.x + 10 / z, y: ap.point.y - 10 / z, "font-size": 13 / z, fill: "#2563eb", "font-weight": 700 },
          document.createTextNode(etat.tape ? etat.tape.replace(".", ",") + " m ↵" : plMetres(dist(etat.mur, ap.point)))
        )
      );
    }
    if (ap.accroche)
      gap.append(
        svgEl("circle", { cx: ap.accroche.x, cy: ap.accroche.y, r: 7 / z, fill: "none", stroke: "#16a34a", "stroke-width": 2 / z })
      );
    for (const gd of ap.guides || [])
      gap.append(svgEl("line", Object.assign({ stroke: "#16a34a", "stroke-width": 1 / z, "stroke-dasharray": `${4 / z} ${3 / z}` }, gd)));
    if (ap.trace && ap.trace.length > 1)
      gap.append(
        svgEl("polyline", {
          points: ap.trace.map(q => q.x + "," + q.y).join(" "),
          fill: "none",
          stroke: "#475569",
          "stroke-width": 2.2 / z,
          "stroke-dasharray": `${5 / z} ${3 / z}`,
          "stroke-linecap": "round",
        })
      );
    else if (etat.gaine) {
      // gaine en cours : départ, coudes, jusqu'au pointeur
      const a = objetDe(etat.gaine.de);
      if (a) {
        const l = [a, ...etat.gaine.pts, ...(ap.point ? [ap.point] : [])];
        gap.append(
          svgEl("polyline", {
            points: l.map(q => q.x + "," + q.y).join(" "),
            fill: "none",
            stroke: "#475569",
            "stroke-width": 2.2 / z,
            "stroke-dasharray": `${5 / z} ${3 / z}`,
            "stroke-linejoin": "round",
          }),
          svgEl("circle", { cx: a.x, cy: a.y, r: 7 / z, fill: "none", stroke: "#2563eb", "stroke-width": 2 / z })
        );
        etat.gaine.pts.forEach(q => gap.append(svgEl("circle", { cx: q.x, cy: q.y, r: 3 / z, fill: "#475569" })));
      }
    }
    if ((etat.liaisonGlisse || etat.liaison) && ap.point) {
      const a = objetDe(etat.liaisonGlisse || etat.liaison);
      if (a)
        gap.append(
          svgEl("line", {
            x1: a.x,
            y1: a.y,
            x2: ap.point.x,
            y2: ap.point.y,
            stroke: "#6b7280",
            "stroke-width": 1.5 / z,
            "stroke-dasharray": `${6 / z} ${4 / z}`,
          })
        );
    }
    if (etat.piece && etat.piece.length) {
      const pts = [...etat.piece, ap.point || etat.piece[etat.piece.length - 1]];
      gap.append(
        svgEl("polyline", {
          points: pts.map(q => q.x + "," + q.y).join(" "),
          fill: "rgba(14,165,233,.1)",
          stroke: "#0284c7",
          "stroke-width": 2 / z,
          "stroke-dasharray": `${5 / z} ${3 / z}`,
        })
      );
    }
    if (etat.gomme) {
      const { m, t0, t1 } = etat.gomme,
        [u0, u1] = bornesGomme(m, Math.min(t0, t1), Math.max(t0, t1));
      const pa = { x: m.a.x + (m.b.x - m.a.x) * u0, y: m.a.y + (m.b.y - m.a.y) * u0 },
        pb = { x: m.a.x + (m.b.x - m.a.x) * u1, y: m.a.y + (m.b.y - m.a.y) * u1 };
      gap.append(
        svgEl("line", { x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, stroke: "#dc2626", "stroke-width": d.epaisseur + 4 / z, opacity: 0.55 }),
        svgEl(
          "text",
          {
            x: (pa.x + pb.x) / 2,
            y: (pa.y + pb.y) / 2 - d.epaisseur / 2 - 8 / z,
            "font-size": 14 / z,
            "font-weight": 700,
            fill: "#dc2626",
            "text-anchor": "middle",
          },
          document.createTextNode(plMetres(dist(pa, pb)))
        )
      );
    }
    for (const tr of etat.traits || [])
      gap.append(
        svgEl("polyline", {
          points: tr.map(q => q.x + "," + q.y).join(" "),
          fill: "none",
          stroke: "#7c3aed",
          "stroke-width": 3 / z,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        })
      );
    if (etat.trace && etat.trace.length > 1)
      gap.append(
        svgEl("polyline", {
          points: etat.trace.map(q => q.x + "," + q.y).join(" "),
          fill: "none",
          stroke: etat.outil === "main" && etat.modeMain === "notes" ? etat.couleurNote : "#7c3aed",
          "stroke-width": 3 / z,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        })
      );
    if (ap.piece)
      gap.append(
        svgEl("polygon", {
          points: ap.piece.map(q => q.x + "," + q.y).join(" "),
          fill: "rgba(14,165,233,.12)",
          stroke: "#0284c7",
          "stroke-width": 1.5 / z,
        })
      );
    if (etat.rect && (ap.point || etat.tape)) {
      const b = rectTape(ap.point) || ap.point,
        a = etat.rect;
      const x0 = Math.min(a.x, b.x),
        y0 = Math.min(a.y, b.y),
        w = Math.abs(b.x - a.x),
        hh = Math.abs(b.y - a.y);
      gap.append(
        svgEl("rect", {
          x: x0,
          y: y0,
          width: w,
          height: hh,
          fill: "rgba(37,99,235,.06)",
          stroke: "#2563eb",
          "stroke-width": d.epaisseur,
          opacity: 0.45,
        }),
        svgEl(
          "text",
          { x: x0 + w / 2, y: y0 - 12 / z, "font-size": 13 / z, fill: "#2563eb", "font-weight": 700, "text-anchor": "middle" },
          document.createTextNode(plMetres(w) + " × " + plMetres(hh) + (etat.tape ? "   (" + etat.tape.replace(".", ",") + " ↵)" : ""))
        )
      );
    }
    if (etat.calib) {
      // ligne de mise à l'échelle et ses deux bouts (gros ronds faciles à prendre au doigt)
      const cb = etat.calib,
        b = cb.b || ap.point,
        r = (etat.tablette ? 16 : 8) / z;
      if (b)
        gap.append(
          svgEl("line", { x1: cb.a.x, y1: cb.a.y, x2: b.x, y2: b.y, stroke: "#dc2626", "stroke-width": 3 / z }),
          svgEl(
            "text",
            {
              x: (cb.a.x + b.x) / 2,
              y: (cb.a.y + b.y) / 2 - 10 / z,
              "font-size": 14 / z,
              fill: "#dc2626",
              "font-weight": 700,
              "text-anchor": "middle",
            },
            document.createTextNode(plMetres(dist(cb.a, b)))
          )
        );
      for (const q of cb.b ? [cb.a, cb.b] : [cb.a])
        gap.append(
          svgEl("circle", { cx: q.x, cy: q.y, r, fill: "rgba(255,255,255,.75)", stroke: "#dc2626", "stroke-width": 2.5 / z }),
          svgEl("circle", { cx: q.x, cy: q.y, r: 1.5 / z, fill: "#dc2626" })
        );
    }
    if (ap.cadre) {
      const c = ap.cadre;
      gap.append(
        svgEl("rect", {
          x: Math.min(c.a.x, c.b.x),
          y: Math.min(c.a.y, c.b.y),
          width: Math.abs(c.b.x - c.a.x),
          height: Math.abs(c.b.y - c.a.y),
          fill: "rgba(37,99,235,.08)",
          stroke: "#2563eb",
          "stroke-width": 1 / z,
        })
      );
    }
    if (ap.fantome) {
      const f = ap.fantome;
      const g = svgEl("g", {
        transform: `translate(${f.x} ${f.y}) rotate(${etat.symbole.startsWith("rep_") || etat.symbole === "daaf" ? 0 : f.rot || 0}) scale(${TAILLE_SYMBOLE / 40})`,
        style: "color:#2563eb",
        stroke: "currentColor",
        fill: "currentColor",
        "stroke-width": traitSymb(),
        opacity: 0.5,
      });
      g.innerHTML = dessinTrait(SYMB[etat.symbole].dessin);
      gap.append(g);
    }
    if (ap.ouverture) {
      const o = ap.ouverture;
      gap.append(svgEl("line", { x1: o.a.x, y1: o.a.y, x2: o.b.x, y2: o.b.y, stroke: "#2563eb", "stroke-width": 8 / z, opacity: 0.5 }));
    }
  }

  /* -- aimantation -- */
  const pointsMurs = () => d.murs.flatMap(m => [m.a, m.b]);
  function accrocherPoint(pt, sauf) {
    const r = 14 / etat.vue.z;
    let best = null,
      bd = r;
    for (const q of pointsMurs()) {
      if (sauf && sauf.includes(q)) continue;
      const dd = dist(pt, q);
      if (dd < bd) {
        bd = dd;
        best = q;
      }
    }
    return best ? { x: best.x, y: best.y, accroche: true } : { x: grille(pt.x), y: grille(pt.y) };
  }
  /** coude de gaine : à l'équerre du point d'avant (horizontal ou vertical) */
  const coudeDroit = (prec, pt) => (Math.abs(pt.x - prec.x) > Math.abs(pt.y - prec.y) ? { x: pt.x, y: prec.y } : { x: prec.x, y: pt.y });
  function contraindre(depart, pt, libre) {
    if (libre) return pt;
    const r = contraindreAngle(depart, pt);
    // aligné sur une extrémité de mur existante (pour fermer une pièce bien d'équerre)
    const tol = 12 / etat.vue.z;
    for (const q of pointsMurs()) {
      if (Math.abs(r.y - depart.y) < 0.01 && Math.abs(q.x - r.x) < tol) r.x = q.x;
      if (Math.abs(r.x - depart.x) < 0.01 && Math.abs(q.y - r.y) < tol) r.y = q.y;
    }
    return r;
  }
  function contraindreAngle(depart, pt) {
    const dx = pt.x - depart.x,
      dy = pt.y - depart.y;
    // angles droits (et 45° si on en est proche)
    const ang = Math.atan2(dy, dx),
      pas = Math.PI / 4,
      a = Math.round(ang / pas) * pas;
    const diag = Math.abs(Math.round(ang / pas)) % 2 === 1;
    if (diag && Math.abs(ang - a) > 0.06) return Math.abs(dx) > Math.abs(dy) ? { x: pt.x, y: depart.y } : { x: depart.x, y: pt.y };
    const L = Math.hypot(dx, dy);
    return { x: depart.x + Math.cos(a) * L, y: depart.y + Math.sin(a) * L };
  }
  function murProche(pt, maxi) {
    let best = null,
      bd = maxi;
    for (const m of d.murs) {
      const L2 = (m.b.x - m.a.x) ** 2 + (m.b.y - m.a.y) ** 2 || 1;
      const t = Math.max(0, Math.min(1, ((pt.x - m.a.x) * (m.b.x - m.a.x) + (pt.y - m.a.y) * (m.b.y - m.a.y)) / L2));
      const q = { x: m.a.x + (m.b.x - m.a.x) * t, y: m.a.y + (m.b.y - m.a.y) * t };
      const dd = dist(pt, q);
      if (dd < bd) {
        bd = dd;
        best = { m, t, q, d: dd };
      }
    }
    return best;
  }
  /** appareils muraux collés à un mur : retenus avant un changement (épaisseur du mur, taille des symboles…), puis
   *  recollés après, au même endroit du mur, du même côté (sinon ils flottent devant un mur plus fin, ou rentrent dedans) */
  const decalMur = (m, o, T) => (m.ep || d.epaisseur) / 2 + (SYMB[o.type].prof * (T || TAILLE_SYMBOLE) * (o.sy || 1)) / 40 + 1;
  function retenirCollage(objets, murs, T) {
    const r = [];
    for (const o of objets || d.objets) {
      const def = SYMB[o.type];
      if (o.genre !== "symbole" || !def || def.pose !== "mur") continue;
      let best = null;
      for (const m of murs || d.murs) {
        const L2 = (m.b.x - m.a.x) ** 2 + (m.b.y - m.a.y) ** 2 || 1,
          t = Math.max(0, Math.min(1, ((o.x - m.a.x) * (m.b.x - m.a.x) + (o.y - m.a.y) * (m.b.y - m.a.y)) / L2));
        const q = { x: m.a.x + (m.b.x - m.a.x) * t, y: m.a.y + (m.b.y - m.a.y) * t },
          dd = dist(o, q);
        if (!best || dd < best.d) best = { m, t, q, d: dd };
      }
      if (!best || Math.abs(best.d - decalMur(best.m, o, T)) > 3) continue; // (seulement ceux qui touchent le mur)
      const m = best.m,
        L = dist(m.a, m.b) || 1,
        nx = -(m.b.y - m.a.y) / L,
        ny = (m.b.x - m.a.x) / L;
      r.push({ o, m, t: best.t, cote: (o.x - best.q.x) * nx + (o.y - best.q.y) * ny >= 0 ? 1 : -1 });
    }
    return () => {
      for (const { o, m, t, cote } of r) {
        const L = dist(m.a, m.b) || 1,
          nx = -(m.b.y - m.a.y) / L,
          ny = (m.b.x - m.a.x) / L,
          off = decalMur(m, o);
        o.x = m.a.x + (m.b.x - m.a.x) * t + nx * off * cote;
        o.y = m.a.y + (m.b.y - m.a.y) * t + ny * off * cote;
      }
    };
  }
  {
    // (0.36 : tableau électrique plus épais : ceux collés au mur avec l'ancienne épaisseur sont recollés, sans chevaucher le mur)
    const T = TAILLE_SYMBOLE;
    for (const o of d.objets)
      if (o.genre === "symbole" && o.type === "tableau") {
        let best = null;
        for (const m of d.murs) {
          const L2 = (m.b.x - m.a.x) ** 2 + (m.b.y - m.a.y) ** 2 || 1,
            t = Math.max(0, Math.min(1, ((o.x - m.a.x) * (m.b.x - m.a.x) + (o.y - m.a.y) * (m.b.y - m.a.y)) / L2)),
            q = { x: m.a.x + (m.b.x - m.a.x) * t, y: m.a.y + (m.b.y - m.a.y) * t },
            dd = dist(o, q);
          if (!best || dd < best.d) best = { m, q, d: dd };
        }
        if (!best) continue;
        const ancien = (best.m.ep || d.epaisseur) / 2 + (3.2 * T * (o.sy || 1)) / 40 + 1;
        if (Math.abs(best.d - ancien) > 2 || best.d < 0.5) continue;
        const k = decalMur(best.m, o) / best.d;
        o.x = best.q.x + (o.x - best.q.x) * k;
        o.y = best.q.y + (o.y - best.q.y) * k;
      }
  }
  {
    // (0.27 : conduit du plan entier → donné à chaque gaine ; plus de tube IRL)
    for (const gs of [d.gaines || [], ...Object.values(d.etages || {}).map(e => (e && e.gaines) || [])])
      for (const g of gs) {
        if (g.conduit === "tube") delete g.conduit;
        {
          const x = dimsMoulure(g.moulure);
          if (x && x[0] < x[1]) g.moulure = x[1] + "x" + x[0];
        } // (0.27 : « 12x20 » → « 20x12 », largeur d'abord)
        if (d.conduit === "moulure" && !g.conduit) g.conduit = "moulure";
      }
    delete d.conduit;
  }
  {
    // (plan fait avec une autre taille de symboles : les appareils muraux qui touchaient le mur y sont recollés)
    const T0 = Number(d.taille_symb) || 34;
    if (T0 !== TAILLE_SYMBOLE) {
      retenirCollage(null, null, T0)();
      for (const [k, e] of Object.entries(d.etages || {}))
        if (k !== d.niveau && e && e.objets && e.murs) retenirCollage(e.objets, e.murs, T0)();
      etat.histo = [instantane()];
    }
    d.taille_symb = TAILLE_SYMBOLE;
  }
  /** coin intérieur de deux murs qui se touchent, le plus proche du point, décalé dans l'angle du côté du point */
  function coinProche(pt, maxi) {
    let best = null;
    for (const m1 of d.murs)
      for (const k1 of ["a", "b"]) {
        const c = m1[k1];
        if (dist(c, pt) > maxi + 40) continue;
        for (const m2 of d.murs) {
          if (m2 === m1) continue;
          const k2 = dist(m2.a, c) < 1 ? "a" : dist(m2.b, c) < 1 ? "b" : null;
          if (!k2) continue;
          // directions des deux murs depuis le coin, et le côté où est le point
          const o1 = k1 === "a" ? m1.b : m1.a,
            o2 = k2 === "a" ? m2.b : m2.a,
            l1 = dist(c, o1) || 1,
            l2 = dist(c, o2) || 1,
            u1 = { x: (o1.x - c.x) / l1, y: (o1.y - c.y) / l1 },
            u2 = { x: (o2.x - c.x) / l2, y: (o2.y - c.y) / l2 };
          if (Math.abs(u1.x * u2.y - u1.y * u2.x) < 0.3) continue; // (murs alignés : pas un coin)
          const e1 = (m1.ep || d.epaisseur) / 2 + 9,
            e2 = (m2.ep || d.epaisseur) / 2 + 9;
          // (le point est dans l'angle formé par les deux murs : décalé de chaque mur vers lui)
          const s1 = Math.sign((pt.x - c.x) * -u1.y + (pt.y - c.y) * u1.x) || 1,
            s2 = Math.sign((pt.x - c.x) * -u2.y + (pt.y - c.y) * u2.x) || 1;
          const n1 = { x: -u1.y * s1, y: u1.x * s1 },
            n2 = { x: -u2.y * s2, y: u2.x * s2 };
          // point à e1 du mur 1 et e2 du mur 2 : c + a·u1 + b·u2
          const det = u1.x * u2.y - u1.y * u2.x,
            // (on résout n1·P = e1, n2·P = e2 avec P = c + a·u1 + b·u2)
            A11 = n1.x * u1.x + n1.y * u1.y,
            A12 = n1.x * u2.x + n1.y * u2.y,
            A21 = n2.x * u1.x + n2.y * u1.y,
            A22 = n2.x * u2.x + n2.y * u2.y,
            dd = A11 * A22 - A12 * A21;
          if (Math.abs(det) < 1e-6 || Math.abs(dd) < 1e-6) continue;
          const a = (e1 * A22 - A12 * e2) / dd,
            b = (A11 * e2 - A21 * e1) / dd,
            q = { x: c.x + a * u1.x + b * u2.x, y: c.y + a * u1.y + b * u2.y },
            dq = dist(q, pt);
          if (dq <= maxi && (!best || dq < best.d)) best = { x: q.x, y: q.y, d: dq };
        }
      }
    return best;
  }
  // (ech : profondeur de l'appareil, o.sy — un lit, un symbole agrandi : son centre est plus loin du mur)
  function placerSymbole(pt, type, sauf, ech) {
    const def = SYMB[type];
    let x = pt.x,
      y = pt.y,
      rot = 0;
    const guides = [];
    const prof0 = (def.prof * TAILLE_SYMBOLE) / 40,
      prof = prof0 * (ech || 1);
    const mp = def.pose !== "plafond" ? murProche(pt, 45 + Math.max(0, prof - prof0)) : null;
    // (collé au mur : l'alignement sur les autres appareils ne joue que le long du mur — sinon un appareil d'une autre
    //  taille, aligné sur l'axe d'un voisin, se décollait du mur)
    let collerX = false,
      collerY = false;
    if (mp) {
      // contre le mur, côté de la souris, tourné vers la pièce
      const m = mp.m,
        L = dist(m.a, m.b) || 1,
        nx = -(m.b.y - m.a.y) / L,
        ny = (m.b.x - m.a.x) / L;
      const cote = (pt.x - mp.q.x) * nx + (pt.y - mp.q.y) * ny >= 0 ? 1 : -1;
      const off = (m.ep || d.epaisseur) / 2 + prof + 1; // (le symbole touche le mur)
      x = mp.q.x + nx * off * cote;
      y = mp.q.y + ny * off * cote;
      rot = Math.round(((Math.atan2(ny * cote, nx * cote) * 180) / Math.PI + 90) / 90) * 90;
      rot = ((rot % 360) + 360) % 360;
      if (Math.abs(Math.atan2(m.b.y - m.a.y, m.b.x - m.a.x) % (Math.PI / 2)) > 0.01)
        rot = (Math.atan2(ny * cote, nx * cote) * 180) / Math.PI + 90;
      collerX = Math.abs(nx) > 0.01; // (mur pas horizontal : x tient la distance au mur)
      collerY = Math.abs(ny) > 0.01; // (mur pas vertical : y tient la distance au mur)
    } else {
      x = grille(x);
      y = grille(y);
    }
    // traversée (arrivée des combles) et boîte près d'un coin de murs : dans le coin, côté pièce
    if (type === "traversee" || type === "boite") {
      const c = coinProche(pt, Math.max(40, 30 / etat.vue.z));
      if (c) {
        x = c.x;
        y = c.y;
        rot = 0;
      }
    }
    // plafond : centré dans sa pièce (au milieu entre les murs, dans un sens ou dans les deux)
    let fixeX = collerX,
      fixeY = collerY;
    if (def.pose === "plafond") {
      const bx = boitePiece(pt),
        tc = 22 / etat.vue.z;
      if (bx) {
        const cx = (bx.x0 + bx.x1) / 2,
          cy = (bx.y0 + bx.y1) / 2;
        if (Math.abs(pt.x - cx) < tc) {
          x = cx;
          fixeX = true;
          guides.push({ x1: cx, y1: bx.y0, x2: cx, y2: bx.y1 });
        }
        if (Math.abs(pt.y - cy) < tc) {
          y = cy;
          fixeY = true;
          guides.push({ x1: bx.x0, y1: cy, x2: bx.x1, y2: cy });
        }
      }
    }
    // alignement sur les autres appareils de la même pièce (pas à travers un mur)
    const tol = 10 / etat.vue.z;
    // (sanitaires, mobilier : ni alignés sur l'appareillage, ni pris pour l'aligner — ils resteraient décollés du mur)
    for (const o of DECOR_TAILLE[type] ? [] : d.objets) {
      if (o.genre !== "symbole" || estDecor(o) || (sauf && sauf.includes(o.id))) continue;
      const ax = !fixeX && Math.abs(o.x - x) < tol,
        ay = !fixeY && Math.abs(o.y - y) < tol;
      if ((ax || ay) && traverseMur(o, { x, y })) continue;
      if (ax) {
        x = o.x;
        guides.push({ x1: x, y1: Math.min(o.y, y) - 30, x2: x, y2: Math.max(o.y, y) + 30 });
      }
      if (ay) {
        y = o.y;
        guides.push({ x1: Math.min(o.x, x) - 30, y1: y, x2: Math.max(o.x, x) + 30, y2: y });
      }
    }
    return { x, y, rot, guides };
  }
  /* -- murs arrondis : deux murs droits raccordés par un arc de cercle, tangent aux deux (comme un « congé » de DAO).
   *  L'arc est une suite de petits murs droits (6° chacun) : pièces, cotes, appareils posés contre lui marchent comme
   *  pour les autres murs. Chacun garde arc (son groupe), rayon, coin (l'angle d'avant) et arcMurs (les deux murs raccordés). */
  /** deux murs parallèles (bouts tournés du même côté) : leur écart ; sinon null */
  function ecartParalleles(m1, k1, m2, k2) {
    const e1 = m1[k1],
      f1 = m1[k1 === "a" ? "b" : "a"],
      e2 = m2[k2],
      f2 = m2[k2 === "a" ? "b" : "a"];
    const l1 = dist(e1, f1) || 1,
      l2 = dist(e2, f2) || 1,
      u1 = { x: (e1.x - f1.x) / l1, y: (e1.y - f1.y) / l1 },
      u2 = { x: (e2.x - f2.x) / l2, y: (e2.y - f2.y) / l2 };
    if (Math.abs(u1.x * u2.y - u1.y * u2.x) > 0.035) return null; // (plus de 2° d'écart : pas parallèles)
    return { u1, u2, meme: u1.x * u2.x + u1.y * u2.y > 0, w: Math.abs((e2.x - e1.x) * u1.y - (e2.y - e1.y) * u1.x) };
  }
  function creerArrondi(m1, k1, m2, k2, R) {
    const f1 = m1[k1 === "a" ? "b" : "a"],
      f2 = m2[k2 === "a" ? "b" : "a"];
    let T1, T2, C, bal, retour, vers;
    const par = ecartParalleles(m1, k1, m2, k2);
    if (par) {
      // murs parallèles, bouts du même côté : un arc de l'un à l'autre (demi-cercle au rayon le plus petit, plus plat
      // au-delà) ; le mur le plus court est prolongé pour que les deux bouts soient face à face
      if (!par.meme) return "Les deux bouts se font face : choisissez les bouts tournés du même côté.";
      if (par.w < 5) return "Les deux murs sont dans le prolongement l'un de l'autre.";
      const u = par.u1,
        e1 = m1[k1],
        e2 = m2[k2],
        s = (e2.x - e1.x) * u.x + (e2.y - e1.y) * u.y;
      if (R < par.w / 2 - 0.5) return "Rayon trop petit : " + Math.ceil(par.w / 2) + " cm au moins (demi-cercle).";
      R = Math.max(R, par.w / 2);
      T1 = s > 0 ? { x: e1.x + u.x * s, y: e1.y + u.y * s } : { x: e1.x, y: e1.y };
      T2 = s < 0 ? { x: e2.x - u.x * s, y: e2.y - u.y * s } : { x: e2.x, y: e2.y };
      const mi = { x: (T1.x + T2.x) / 2, y: (T1.y + T2.y) / 2 },
        recul = Math.sqrt(Math.max(0, R * R - (par.w / 2) ** 2));
      C = { x: mi.x - u.x * recul, y: mi.y - u.y * recul };
      const th1 = Math.atan2(T1.y - C.y, T1.x - C.x);
      bal = Math.atan2(T2.y - C.y, T2.x - C.x) - th1;
      while (bal > Math.PI) bal -= 2 * Math.PI;
      while (bal < -Math.PI) bal += 2 * Math.PI;
      // (l'arc passe du côté où vont les murs)
      const am = th1 + bal / 2;
      if (Math.cos(am) * u.x + Math.sin(am) * u.y < 0) bal = bal > 0 ? bal - 2 * Math.PI : bal + 2 * Math.PI;
      retour = [
        { x: e1.x, y: e1.y },
        { x: e2.x, y: e2.y },
      ];
      vers = { x: mi.x + u.x * (R + 100), y: mi.y + u.y * (R + 100) };
    } else {
      const d1 = { x: m1[k1].x - f1.x, y: m1[k1].y - f1.y },
        d2 = { x: m2[k2].x - f2.x, y: m2[k2].y - f2.y };
      const den = d1.x * d2.y - d1.y * d2.x;
      const s1 = ((f2.x - f1.x) * d2.y - (f2.y - f1.y) * d2.x) / den,
        I = { x: f1.x + d1.x * s1, y: f1.y + d1.y * s1 }; // (coin : là où les deux murs se croisent, prolongés au besoin)
      const l1 = dist(I, f1),
        l2 = dist(I, f2);
      if (l1 < 2 || l2 < 2) return "Choisissez les bouts des murs qui vont vers l'angle.";
      const u1 = { x: (f1.x - I.x) / l1, y: (f1.y - I.y) / l1 },
        u2 = { x: (f2.x - I.x) / l2, y: (f2.y - I.y) / l2 };
      const phi = Math.acos(Math.max(-1, Math.min(1, u1.x * u2.x + u1.y * u2.y)));
      if (phi < 0.02 || phi > Math.PI - 0.02) return "Les deux murs sont dans le prolongement l'un de l'autre.";
      const t = R / Math.tan(phi / 2),
        maxi = Math.floor(Math.min(l1, l2) * Math.tan(phi / 2) - 1);
      if (t > Math.min(l1, l2) - 1) return "Rayon trop grand pour ces murs (" + Math.max(0, maxi) + " cm au plus).";
      T1 = { x: I.x + u1.x * t, y: I.y + u1.y * t };
      T2 = { x: I.x + u2.x * t, y: I.y + u2.y * t };
      const bl = Math.hypot(u1.x + u2.x, u1.y + u2.y) || 1,
        hc = R / Math.sin(phi / 2);
      C = { x: I.x + ((u1.x + u2.x) / bl) * hc, y: I.y + ((u1.y + u2.y) / bl) * hc };
      const th1 = Math.atan2(T1.y - C.y, T1.x - C.x);
      bal = Math.atan2(T2.y - C.y, T2.x - C.x) - th1;
      while (bal > Math.PI) bal -= 2 * Math.PI;
      while (bal < -Math.PI) bal += 2 * Math.PI;
      retour = [
        { x: I.x, y: I.y },
        { x: I.x, y: I.y },
      ];
      vers = { x: I.x, y: I.y };
    }
    const th1 = Math.atan2(T1.y - C.y, T1.x - C.x);
    const n = Math.max(4, Math.ceil(Math.abs(bal) / ((6 * Math.PI) / 180)));
    // (portes et fenêtres des deux murs : à la même place, le mur raccourci)
    const garder = m =>
      d.ouvertures.filter(o => o.mur === m.id).map(o => ({ o, p: { x: m.a.x + (m.b.x - m.a.x) * o.t, y: m.a.y + (m.b.y - m.a.y) * o.t } }));
    const ouv = [...garder(m1).map(x => [m1, x]), ...garder(m2).map(x => [m2, x])];
    m1[k1] = { x: T1.x, y: T1.y };
    m2[k2] = { x: T2.x, y: T2.y };
    for (const [m, { o, p }] of ouv) {
      const L2 = (m.b.x - m.a.x) ** 2 + (m.b.y - m.a.y) ** 2 || 1;
      o.t = Math.max(0, Math.min(1, ((p.x - m.a.x) * (m.b.x - m.a.x) + (p.y - m.a.y) * (m.b.y - m.a.y)) / L2));
    }
    const id = plId(),
      pts = [];
    for (let i = 0; i <= n; i++) {
      const a = th1 + (bal * i) / n;
      pts.push(i === 0 ? T1 : i === n ? T2 : { x: C.x + Math.cos(a) * R, y: C.y + Math.sin(a) * R });
    }
    for (let i = 0; i < n; i++)
      d.murs.push({
        id: plId(),
        a: { x: pts[i].x, y: pts[i].y },
        b: { x: pts[i + 1].x, y: pts[i + 1].y },
        ep: m1.ep || undefined,
        arc: id,
        rayon: R,
        coin: vers, // (côté où écrire le rayon : l'angle d'avant, ou l'extérieur du demi-cercle)
        retour, // (là où reviennent les bouts des deux murs si on enlève l'arrondi)
        arcMurs: [m1.id, m2.id],
      });
    return id;
  }
  const mursArc = id => d.murs.filter(m => m.arc === id);
  /** enlever l'arrondi : les deux murs revont jusqu'à leur angle d'avant ; renvoie ces deux murs et leurs bouts */
  function defaireArrondi(id) {
    const segs = mursArc(id);
    if (!segs.length) return null;
    const retour = segs[0].retour || [segs[0].coin, segs[0].coin],
      debut = segs[0].a,
      fin = segs[segs.length - 1].b;
    const res = [];
    for (const [mid, p, coin] of [
      [segs[0].arcMurs[0], debut, retour[0]],
      [segs[0].arcMurs[1], fin, retour[1]],
    ]) {
      const m = murDe(mid);
      if (!m) continue;
      const k = dist(m.a, p) <= dist(m.b, p) ? "a" : "b";
      const ouv = d.ouvertures
        .filter(o => o.mur === m.id)
        .map(o => ({ o, p: { x: m.a.x + (m.b.x - m.a.x) * o.t, y: m.a.y + (m.b.y - m.a.y) * o.t } }));
      m[k] = { x: coin.x, y: coin.y };
      for (const { o, p: q } of ouv) {
        const L2 = (m.b.x - m.a.x) ** 2 + (m.b.y - m.a.y) ** 2 || 1;
        o.t = Math.max(0, Math.min(1, ((q.x - m.a.x) * (m.b.x - m.a.x) + (q.y - m.a.y) * (m.b.y - m.a.y)) / L2));
      }
      res.push([m, k]);
    }
    const ids = new Set(segs.map(m => m.id));
    d.murs = d.murs.filter(m => !ids.has(m.id));
    d.ouvertures = d.ouvertures.filter(o => !ids.has(o.mur));
    return res.length === 2 ? res : null;
  }
  /** nouveau rayon d'un arrondi (0 : angle vif) */
  function changerRayon(id, R) {
    const segs = mursArc(id);
    if (!segs.length) return;
    const R0 = segs[0].rayon,
      murs = defaireArrondi(id);
    if (murs && R > 0) {
      const r = creerArrondi(murs[0][0], murs[0][1], murs[1][0], murs[1][1], R);
      if (!d.murs.some(m => m.arc === r)) {
        toast(r, true);
        creerArrondi(murs[0][0], murs[0][1], murs[1][0], murs[1][1], R0);
      }
    }
    etat.sel = new Set(
      d.murs.filter(m => m.arc && murs && m.arcMurs && m.arcMurs[0] === murs[0][0].id && m.arcMurs[1] === murs[1][0].id).map(m => m.id)
    );
    valider();
  }
  /** outil Mur, mode arrondi : un appui près du bout du 1er mur, puis du 2e ; le rayon est demandé */
  async function clicArrondi(pt) {
    let best = null;
    for (const m of d.murs) {
      if (m.arc) continue;
      const L2 = (m.b.x - m.a.x) ** 2 + (m.b.y - m.a.y) ** 2 || 1,
        t = Math.max(0, Math.min(1, ((pt.x - m.a.x) * (m.b.x - m.a.x) + (pt.y - m.a.y) * (m.b.y - m.a.y)) / L2)),
        dd = dist(pt, { x: m.a.x + (m.b.x - m.a.x) * t, y: m.a.y + (m.b.y - m.a.y) * t });
      if (dd < Math.max((m.ep || d.epaisseur) / 2 + 10, (etat.tablette ? 30 : 14) / etat.vue.z) && (!best || dd < best.d))
        best = { m, d: dd, k: dist(pt, m.a) <= dist(pt, m.b) ? "a" : "b" };
    }
    if (!best) return toast("Touchez un mur droit, sur sa moitié du côté de l'arrondi.", true);
    const a1 = etat.arrondi1 && murDe(etat.arrondi1.id);
    if (!a1 || a1 === best.m) {
      etat.arrondi1 = { id: best.m.id, k: best.k };
      dessiner();
      return toast("Touchez maintenant le 2e mur, sur sa moitié du côté de l'arrondi.");
    }
    const k1 = etat.arrondi1.k;
    etat.arrondi1 = null;
    dessiner();
    const par = ecartParalleles(a1, k1, best.m, best.k);
    const mini = par && par.meme ? Math.ceil(par.w / 2) : 0;
    const v = await demanderTexte(
      mini ? "Rayon de l'arc (cm) : " + mini + " pour un demi-cercle, plus pour un arc plus plat :" : "Rayon de l'arrondi (cm) :",
      String(mini || etat.rayonArrondi || 100)
    );
    const R = nombre(v || "");
    if (!(R > 0)) return;
    if (!mini) etat.rayonArrondi = R;
    const r = creerArrondi(a1, k1, best.m, best.k, R);
    if (!d.murs.some(m => m.arc === r)) return toast(r, true);
    valider();
  }
  /** deux murs qui se touchent par un bout : le point commun, les deux autres bouts et l'angle entre eux (°) */
  function angleDeuxMurs(m1, m2) {
    for (const k1 of ["a", "b"])
      for (const k2 of ["a", "b"])
        if (dist(m1[k1], m2[k2]) < 0.5) {
          const c = m1[k1],
            p1 = m1[k1 === "a" ? "b" : "a"],
            p2 = m2[k2 === "a" ? "b" : "a"];
          const a1 = Math.atan2(p1.y - c.y, p1.x - c.x),
            a2 = Math.atan2(p2.y - c.y, p2.x - c.x);
          let da = a2 - a1;
          while (da > Math.PI) da -= 2 * Math.PI;
          while (da < -Math.PI) da += 2 * Math.PI;
          return { c, p1, p2, a1, a2, sens: da >= 0 ? 1 : -1, deg: (Math.abs(da) * 180) / Math.PI };
        }
    return null;
  }
  /** angle entre deux murs : le mur qui bouge (« a » : le 1er, « b » : le 2e) tourne autour du point commun, même longueur */
  function regleAngleDeuxMurs(m1, m2, deg, qui) {
    const g = angleDeuxMurs(m1, m2);
    if (!g) return;
    const recoller = retenirCollage(null, null);
    const r = (deg * Math.PI) / 180;
    const [fixe, bouge, sens] = qui === "a" ? [g.a2, g.p1, -g.sens] : [g.a1, g.p2, g.sens],
      L = dist(g.c, bouge),
      an = fixe + sens * r;
    deplacerPoint(bouge, { x: g.c.x + Math.cos(an) * L, y: g.c.y + Math.sin(an) * L });
    recoller();
    valider();
  }
  /** les murs choisis d'équerre avec le plus long d'entre eux (0°, 90°, 180°, 270°) : de proche en proche à partir de lui,
   *  chaque mur garde le bout déjà réglé et son autre bout vient sur l'équerre (les murs reliés suivent) */
  function mettreDEquerre(murs) {
    const droits = murs.filter(m => !m.arc && dist(m.a, m.b) > 1);
    if (!droits.length) return;
    const recoller = retenirCollage(null, null);
    const ref = droits.reduce((x, y) => (dist(y.a, y.b) > dist(x.a, x.b) ? y : x));
    const al = Math.atan2(ref.b.y - ref.a.y, ref.b.x - ref.a.x);
    const fixes = [];
    const estFixe = p => fixes.some(f => dist(f, p) < 0.5);
    const fixer = p => fixes.push({ x: p.x, y: p.y });
    const reste = new Set(droits);
    const regler = (m, k) => {
      // (k : le bout déjà en place)
      const p = m[k],
        q = m[k === "a" ? "b" : "a"];
      const a = Math.atan2(q.y - p.y, q.x - p.x),
        an = al + (Math.round((a - al) / (Math.PI / 2)) * Math.PI) / 2,
        ux = Math.cos(an),
        uy = Math.sin(an),
        l = (q.x - p.x) * ux + (q.y - p.y) * uy;
      deplacerPoint(q, { x: p.x + ux * l, y: p.y + uy * l });
      fixer(q);
    };
    while (reste.size) {
      let avance = false;
      for (const m of [...reste]) {
        const fa = estFixe(m.a),
          fb = estFixe(m.b);
        if (fa && fb) reste.delete(m);
        else if (fa || fb) {
          regler(m, fa ? "a" : "b");
          reste.delete(m);
          avance = true;
        }
      }
      if (!avance && reste.size) {
        // (départ : le mur de référence, ou le plus long d'un groupe à part)
        const m = reste.has(ref) ? ref : [...reste].reduce((x, y) => (dist(y.a, y.b) > dist(x.a, x.b) ? y : x));
        fixer(m.a);
        regler(m, "a");
        reste.delete(m);
      }
    }
    recoller();
    valider();
    toast("Murs mis d'équerre.");
  }
  function deplacerPoint(ancien, nouveau) {
    // un point partagé par plusieurs murs bouge partout
    const ax = ancien.x,
      ay = ancien.y;
    for (const m of d.murs)
      for (const k of ["a", "b"])
        if (Math.abs(m[k].x - ax) < 0.01 && Math.abs(m[k].y - ay) < 0.01) {
          m[k].x = nouveau.x;
          m[k].y = nouveau.y;
        }
  }

  /** poser le symbole choisi (etat.symbole) à cet endroit : aimanté au mur, texte demandé, circuit spécialisé… */
  async function poserIci(pt) {
    const s = placerSymbole(pt, etat.symbole);
    const ob = { id: plId(), genre: "symbole", type: etat.symbole, x: s.x, y: s.y, rot: s.rot, circuit: etat.circuitVu || null };
    if (estDecor(ob)) {
      // (sanitaires, mobilier : à leur taille réelle, contre le mur ; jamais sur un circuit)
      const [lx, py] = DECOR_TAILLE[ob.type];
      ob.circuit = null;
      ob.sx = lx / TAILLE_SYMBOLE;
      ob.sy = py / TAILLE_SYMBOLE;
      const mp = murProche(pt, 45);
      if (mp) {
        const m = mp.m,
          L = dist(m.a, m.b) || 1,
          nx = -(m.b.y - m.a.y) / L,
          ny = (m.b.x - m.a.x) / L,
          cote = (pt.x - mp.q.x) * nx + (pt.y - mp.q.y) * ny >= 0 ? 1 : -1,
          off = decalMur(m, ob);
        ob.x = mp.q.x + nx * off * cote;
        ob.y = mp.q.y + ny * off * cote;
      }
    }
    if (AVEC_TEXTE.includes(etat.symbole)) {
      const t = await demanderTexte("Texte à côté du symbole (facultatif, ex. 32 A, VMC, portail) :", "");
      if (t === null) return;
      if (t.trim()) ob.texte = t.trim();
    }
    if (etat.symbole === "rep_libre") {
      const t = await demanderTexte("Lettres dans le cercle (ex. PAC, BAL, HOTTE) :", etat.dernierRepere || "");
      if (!t) return;
      ob.texte = etat.dernierRepere = t.trim().slice(0, 6);
    }
    if (etat.symbole === "rep_rect") {
      const t = await demanderTexte("Texte dans le rectangle (ex. POMPE, PORTAIL, SPA) :", etat.dernierRect || "");
      if (!t) return;
      ob.texte = etat.dernierRect = t.trim().slice(0, 12);
    }
    // (traversée : la même sur le niveau du dessus ; sans niveau au-dessus : arrivée des combles, par le plafond)
    if (ob.type === "traversee" && !(rangNiveau(d.niveau) < (d.niveaux || []).length - 1 && jumelerTraversee(ob))) ob.cote = "plafond";
    d.objets.push(ob);
    const cs = circuitALaPose(ob);
    etat.sel = new Set([ob.id]);
    marquerRecent("objet", ob.id);
    valider();
    if (ob.type === "traversee")
      toast(
        ob.jumeau
          ? "Traversée posée aussi sur « " + nomNiveau(niveauDe(ob.jumeau)) + " », à la même place : les gaines y continuent."
          : "Arrivée des combles (par le plafond) : les gaines et moulures en partent, la descente depuis le plafond est comptée."
      );
    if (cs) toast("Circuit spécialisé « " + cs.nom + " » (" + cs.calibre + " A) créé.");
  }
  /* -- roue des symboles : un clic sur le plan ouvre une roue des symboles courants autour du pointeur ; un groupe
   *  (commandes, éclairage…) ouvre une 2e couronne au survol ou à l'appui, comme les lettres d'une touche de téléphone -- */
  const ROUE_DEF = [
    ["prise", "Prise", ["prise", "prise2", "prise32", "sortie", "ligne_directe", "rj45", "tv"]],
    ["dcl", "Lumière", ["dcl", "point", "applique", "spot", "reglette", "exterieur", "projecteur", "baes"]],
    ["inter", "Commande", ["inter", "inter_va", "inter_double", "poussoir", "variateur", "detecteur", "cmd_volet", "thermostat"]],
    ["boite", "Boîte"],
    [
      "lave_linge",
      "Appareils",
      ["lave_linge", "seche_linge", "lave_vaisselle", "four", "cuisiniere", "micro_ondes", "refrigerateur", "congelateur", "borne_ve"],
    ],
    ["radiateur", "Chauffage", ["radiateur", "seche_serviettes", "chauffe_eau", "clim_int", "clim_ext", "vmc"]],
    ["tableau", "Divers", ["tableau", "traversee", "daaf", "sonnette", "volet", "compteur"]],
    ["@liaison", "Liaison, gaine", ["@liaison", "@gaine", "@moulure", "@texte"]],
  ];
  ROUE_DEF.find(x => x[0] === "tableau")[2].push("rep_libre");
  /** roue en service : celle des options (groupes : [symbole du centre, nom, symboles de la couronne]), sinon celle d'origine */
  const roueDef = () => {
    const r = optPlans().roue;
    const ok = Array.isArray(r) && r.length && r.every(g => Array.isArray(g) && g[0] && Array.isArray(g[2]) && g[2].length);
    // (groupe d'un seul symbole : un bouton direct, sans couronne)
    return ok ? r.map(g => (g[2].length === 1 ? [g[2][0], g[1]] : g)) : ROUE_DEF;
  };
  function fenetreRoue() {
    // (comme la roue les montrera : un symbole décoché dans « Symboles de la liste » est remplacé par son repère rond,
    //  ou retiré s'il n'en a pas ; la liste d'ajout ne propose que les symboles affichés)
    const masques = new Set([...MASQUES, ...(optPlans().symboles_masques || [])]),
      vu = t => OUTILS_ROUE[t] || (SYMB[t] && !masques.has(t)),
      sub = t => (vu(t) ? t : RELAIS_REPERE[t] && vu(RELAIS_REPERE[t]) ? RELAIS_REPERE[t] : null);
    const groupes = JSON.parse(JSON.stringify(roueDef()))
      .map(g => {
        const l = [...new Set((g[2] || [g[0]]).map(sub).filter(Boolean))];
        return [sub(g[0]) && l.includes(sub(g[0])) ? sub(g[0]) : l[0], g[1], l];
      })
      .filter(g => g[2].length);
    const tous = [
      ...Object.entries(OUTILS_ROUE).map(([t, x]) => [t, x[1]]),
      ...SYMBOLES.filter(x => !masques.has(x[0]))
        .map(x => [x[0], x[1] + " (" + catVue(x[0]) + ")"])
        .sort(parNom),
    ];
    const libDe = t => (OUTILS_ROUE[t] ? OUTILS_ROUE[t][1] : (SYMB[t] || {}).libelle || t);
    const ic = t => {
      if (OUTILS_ROUE[t]) return h("span", { style: "font-size:15px;width:20px;text-align:center" }, OUTILS_ROUE[t][2]);
      const sv = svgEl("svg", { viewBox: "-20 -20 40 40", width: 20, height: 20 });
      sv.innerHTML = '<g stroke="currentColor" fill="currentColor" stroke-width="1.6">' + ((SYMB[t] || {}).dessin || "") + "</g>";
      return sv;
    };
    const zone = h("div", { class: "pile", style: "max-height:56vh;overflow:auto;gap:8px" });
    const rendre = () =>
      zone.replaceChildren(
        ...groupes.map((g, k) => {
          const nom = h("input", { type: "text", value: g[1] || "", style: "width:150px;font-weight:600" });
          nom.addEventListener("change", () => (g[1] = nom.value.trim() || "Groupe"));
          const ajout = h(
            "select",
            { style: "max-width:240px;font-size:12px" },
            h("option", { value: "" }, "+ ajouter un outil ou un symbole…"),
            h(
              "optgroup",
              { label: "Outils (tracé, main levée, gaines…)" },
              tous.filter(([t]) => OUTILS_ROUE[t]).map(([t, l]) => h("option", { value: t }, l))
            ),
            h(
              "optgroup",
              { label: "Symboles" },
              tous.filter(([t]) => !OUTILS_ROUE[t]).map(([t, l]) => h("option", { value: t }, l))
            )
          );
          ajout.addEventListener("change", () => {
            if (ajout.value && !g[2].includes(ajout.value)) g[2].push(ajout.value);
            if (!g[0] || !g[2].includes(g[0])) g[0] = g[2][0];
            rendre();
          });
          const bouger = (dk, txt, titre) =>
            h(
              "button",
              {
                class: "icone",
                title: titre,
                onclick: () => {
                  const j = k + dk;
                  if (j < 0 || j >= groupes.length) return;
                  [groupes[k], groupes[j]] = [groupes[j], groupes[k]];
                  rendre();
                },
              },
              txt
            );
          return h(
            "div",
            { class: "encadre", style: "display:flex;flex-direction:column;gap:4px;padding:6px 8px" },
            h(
              "div",
              { style: "display:flex;gap:6px;align-items:center;flex-wrap:wrap" },
              bouger(-1, "▲", "Monter"),
              bouger(1, "▼", "Descendre"),
              nom,
              h("span", { class: "sous" }, "★ : symbole du centre"),
              h("span", { style: "flex:1" }),
              h(
                "button",
                {
                  class: "icone",
                  title: "Supprimer ce groupe",
                  onclick: () => {
                    groupes.splice(k, 1);
                    rendre();
                  },
                },
                "✕"
              )
            ),
            h(
              "div",
              { style: "display:flex;gap:4px;flex-wrap:wrap;align-items:center" },
              g[2].map((t, i) =>
                h(
                  "span",
                  {
                    class: "puce-compo",
                    style: "display:inline-flex;gap:3px;align-items:center" + (t === g[0] ? ";outline:2px solid #2563eb" : ""),
                    title: libDe(t),
                  },
                  h(
                    "button",
                    {
                      class: "icone",
                      title: "En faire le symbole du centre (couronne intérieure)",
                      onclick: () => {
                        g[0] = t;
                        rendre();
                      },
                    },
                    t === g[0] ? "★" : "☆"
                  ),
                  ic(t),
                  h("span", { style: "font-size:12px" }, libDe(t)),
                  h(
                    "button",
                    {
                      class: "icone",
                      title: "Retirer",
                      onclick: () => {
                        g[2].splice(i, 1);
                        if (t === g[0]) g[0] = g[2][0];
                        if (!g[2].length) groupes.splice(k, 1);
                        rendre();
                      },
                    },
                    "✕"
                  )
                )
              ),
              ajout
            )
          );
        }),
        h(
          "button",
          {
            class: "btn petit",
            style: "align-self:flex-start",
            onclick: () => {
              groupes.push(["", "Nouveau groupe", []]);
              rendre();
            },
          },
          "+ Groupe"
        )
      );
    rendre();
    ouvrirModale(
      "Roue des symboles",
      h(
        "div",
        { class: "pile" },
        h(
          "p",
          { class: "aide", style: "margin:0" },
          "Chaque groupe est un bouton de la roue (son symbole ★) ; au survol ou à l'appui, ses symboles s'ouvrent en couronne. Ne sont proposés que les symboles affichés dans « Symboles de la liste » (un appareil décoché y est remplacé par son repère rond). Les outils de tracé (mur, porte, fenêtre, pièce, main levée…) peuvent aussi y être ajoutés."
        ),
        zone
      ),
      [
        h(
          "button",
          {
            class: "btn",
            style: "margin-right:auto",
            onclick: async () => {
              await enregistrerPlans({ roue: null });
              fermerModale();
              toast("Roue d'origine remise.");
            },
          },
          "Remettre la roue d'origine"
        ),
        h("button", { class: "btn", onclick: fermerModale }, "Annuler"),
        h(
          "button",
          {
            class: "btn principal",
            onclick: async () => {
              const r = groupes.filter(g => g[2].length).map(g => [g[2].includes(g[0]) ? g[0] : g[2][0], g[1] || "Groupe", g[2]]);
              if (!r.length) return toast("La roue doit garder au moins un groupe.", true);
              await enregistrerPlans({ roue: r });
              fermerModale();
              toast("Roue enregistrée.");
            },
          },
          "Enregistrer"
        ),
      ],
      { largeur: "min(760px, 96vw)" }
    );
  }
  /** symbole masqué dans les options : son repère rond le remplace (LL pour le lave-linge…) */
  const RELAIS_REPERE = {
    lave_linge: "rep_ll",
    seche_linge: "rep_sl",
    lave_vaisselle: "rep_lv",
    four: "rep_four",
    cuisiniere: "rep_32a",
    prise32: "rep_32a",
    micro_ondes: "rep_mo",
    refrigerateur: "rep_frigo",
    chauffe_eau: "rep_ce",
    vmc: "rep_vmc",
    rj45: "rep_rj45",
    tv: "rep_tv",
  };
  /** outils proposés dans la roue (pas des symboles) */
  const OUTILS_ROUE = {
    "@liaison": ["liaison", "Liaison (outil L)", "⤳"],
    "@gaine": ["gaine", "Gaine (outil U)", "⌇"],
    "@moulure": ["gaine", "Moulure (outil U)", "▬"],
    "@goulotte": ["gaine", "Goulotte (outil U)", "▭"],
    "@texte": ["texte", "Texte (outil T)", "T"],
    // (outils de tracé, à ajouter à la roue dans ⚙ Options > Roue des symboles)
    "@selection": ["selection", "Sélection (outil V)", "↖"],
    "@mur": ["mur", "Mur (outil M)", "▭"],
    "@rectangle": ["rectangle", "Rectangle de murs (outil E)", "⬚"],
    "@porte": ["porte", "Porte (outil P)", "◜"],
    "@passage": ["porte", "Ouverture libre (outil P)", "⊓"],
    "@fenetre": ["fenetre", "Fenêtre (outil F)", "▤"],
    "@piece": ["piece", "Pièce (outil S)", "▢"],
    "@main": ["main", "Main levée (outil H, mode en cours)", "✍"],
    "@main_murs": ["main", "Main levée : murs, pièces et portes", "✍"],
    "@main_symboles": ["main", "Main levée : symboles électriques et liaisons", "⚡"],
    "@main_gaines": ["main", "Main levée : gaines (pieuvre)", "〰"],
    "@main_notes": ["main", "Main levée : notes libres", "✏"],
    "@gomme": ["gomme", "Gomme (outil X)", "⌫"],
  };
  let roue = null;
  function fermerRoue() {
    if (roue) {
      roue.remove();
      roue = null;
    }
  }
  function ouvrirRoue(cx, cy, pt) {
    fermerRoue();
    const RD = roueDef();
    const masques = new Set([...MASQUES, ...(optPlans().symboles_masques || [])]),
      visible = t => OUTILS_ROUE[t] || (SYMB[t] && !masques.has(t));
    // (un appareil masqué : son repère rond prend le relais ; pas deux fois le même dans une couronne)
    const sub = t => (visible(t) ? t : RELAIS_REPERE[t] && visible(RELAIS_REPERE[t]) ? RELAIS_REPERE[t] : null),
      vis = t => !!sub(t);
    const libDe = t => (OUTILS_ROUE[t] ? OUTILS_ROUE[t][1] : SYMB[t].libelle);
    const B = etat.tablette ? 52 : 44,
      nG = RD.filter(([t, , l]) => vis(t) || (l || []).some(vis)).length;
    const R1 = Math.max(etat.tablette ? 84 : 70, (nG * (B + 18)) / (2 * Math.PI)),
      R2 = R1 + B + 14;
    roue = h("div", { class: "plan-roue", style: `left:${cx}px;top:${cy}px;--rr:${Math.round(R1 + B * 0.75)}px` });
    const leg = h("div", { class: "roue-legende", style: `top:${R2 + B * 0.7}px` });
    roue.append(leg);
    roue.addEventListener("pointerover", ev => {
      const b = ev.target.closest && ev.target.closest(".roue-btn");
      leg.textContent = b ? b.title.replace(/ \(survol.*$/, "") : "";
    });
    const icone = t => {
      if (OUTILS_ROUE[t]) return h("span", { style: `font-size:${Math.round(B * 0.42)}px;line-height:1` }, OUTILS_ROUE[t][2]);
      const sv = svgEl("svg", { viewBox: "-20 -20 40 40", width: B * 0.55, height: B * 0.55 });
      sv.innerHTML = '<g stroke="currentColor" fill="currentColor" stroke-width="1.6">' + SYMB[t].dessin + "</g>";
      return sv;
    };
    const choisir = t => {
      fermerRoue();
      if (t === "@gaine" || t === "@moulure" || t === "@goulotte") {
        choisirConduit(t.slice(1));
        toast(CONDUITS[t.slice(1)].replace(" ICTA", "") + " : « W » ou la roue pour revenir aux symboles.");
        return;
      }
      if (t === "@porte" || t === "@passage") etat.genrePorte = t === "@passage" ? "passage" : "porte";
      if (t.startsWith("@main_")) {
        choisirMain(t.slice(6));
        toast(OUTILS_ROUE[t][1] + " : « W » ou la roue pour revenir aux symboles.");
        return;
      }
      if (OUTILS_ROUE[t]) {
        choisirOutil(OUTILS_ROUE[t][0]);
        toast(OUTILS_ROUE[t][1].replace(/ \(.*/, "") + " : « W » ou la roue pour revenir aux symboles.");
        return;
      }
      etat.symbole = t;
      poserIci(pt).catch(erreur);
    };
    let sous = [];
    const ouvrirSous = (k, ang) => {
      sous.forEach(x => x.remove());
      sous = [];
      const liste = [...new Set(RD[k][2].map(sub).filter(Boolean))],
        pas = Math.min(0.42, 2.6 / Math.max(1, liste.length));
      liste.forEach((t, i) => {
        const a = ang + (i - (liste.length - 1) / 2) * pas;
        const b = h(
          "button",
          {
            type: "button",
            class: "roue-btn sous",
            title: libDe(t),
            style: `left:${Math.cos(a) * R2}px;top:${Math.sin(a) * R2}px;width:${B}px;height:${B}px`,
            onclick: ev => {
              ev.stopPropagation();
              choisir(t);
            },
          },
          icone(t)
        );
        roue.append(b);
        sous.push(b);
      });
    };
    const groupes = RD.filter(([t, , l]) => vis(t) || (l || []).some(vis));
    groupes.forEach(([t, lib, liste], i) => {
      const k = RD.findIndex(x => x[0] === t),
        a = -Math.PI / 2 + (i * 2 * Math.PI) / groupes.length;
      const b = h(
        "button",
        {
          type: "button",
          class: "roue-btn" + (liste ? " groupe" : ""),
          title: lib + (liste ? " (survol : les autres)" : ""),
          style: `left:${Math.cos(a) * R1}px;top:${Math.sin(a) * R1}px;width:${B}px;height:${B}px`,
          onclick: ev => {
            ev.stopPropagation();
            if (liste && etat.tablette && !b.classList.contains("ouvert")) {
              roue.querySelectorAll(".roue-btn.ouvert").forEach(x => x.classList.remove("ouvert"));
              b.classList.add("ouvert");
              ouvrirSous(k, a);
            } else choisir(sub(t) || sub(liste.find(vis)));
          },
        },
        icone(sub(t) || sub(liste.find(vis))),
        h("span", { class: "roue-lib" }, lib),
        liste ? h("span", { class: "roue-plus" }, "▸") : null
      );
      if (liste)
        b.addEventListener("pointerenter", () => {
          if (!etat.tablette) {
            roue.querySelectorAll(".roue-btn.ouvert").forEach(x => x.classList.remove("ouvert"));
            b.classList.add("ouvert");
            ouvrirSous(k, a);
          }
        });
      else
        b.addEventListener("pointerenter", () => {
          if (!etat.tablette) {
            sous.forEach(x => x.remove());
            sous = [];
            roue.querySelectorAll(".roue-btn.ouvert").forEach(x => x.classList.remove("ouvert"));
          }
        });
      roue.append(b);
    });
    roue.append(
      h(
        "button",
        {
          type: "button",
          class: "roue-btn centre",
          title: "Fermer (Échap, clic droit)",
          style: `left:0;top:0;width:${B * 0.8}px;height:${B * 0.8}px`,
          onclick: ev => {
            ev.stopPropagation();
            fermerRoue();
          },
        },
        "✕"
      )
    );
    roue.addEventListener("contextmenu", ev => {
      ev.preventDefault();
      fermerRoue();
    });
    // (doigt : le « clic » de l'appui qui a ouvert la roue arrive après coup sur le bouton du centre, sous le doigt — il la
    //  refermait ; un vrai choix commence toujours par un appui sur la roue elle-même)
    let appuiSurRoue = false;
    roue.addEventListener("pointerdown", () => (appuiSurRoue = true), true);
    roue.addEventListener(
      "click",
      ev => {
        if (!appuiSurRoue) {
          ev.stopPropagation();
          ev.preventDefault();
        }
      },
      true
    );
    document.body.append(roue);
    setTimeout(
      () =>
        document.addEventListener(
          "pointerdown",
          function hors(ev) {
            if (roue && !roue.contains(ev.target)) {
              fermerRoue();
              ev.stopPropagation();
              ev.preventDefault();
            }
            document.removeEventListener("pointerdown", hors, true);
          },
          true
        ),
      0
    );
  }
  /* -- souris / doigts -- */
  const pointeurs = new Map();
  let geste = null; // { genre: "vue" | "deplacer" | "cadre" | "point" | "pince", ... }
  const cible = e => {
    const t = e.target.closest
      ? e.target.closest("[data-objet],[data-ouv],[data-mur],[data-liaison],[data-gaine],[data-piece],[data-note]")
      : null;
    if (!t) return null;
    if (t.dataset.gaine) return { genre: "gaine", id: t.dataset.gaine };
    if (t.dataset.note) return { genre: "note", id: t.dataset.note };
    if (t.dataset.piece) return { genre: "piece", id: t.dataset.piece };
    if (t.dataset.objet) return { genre: "objet", id: t.dataset.objet };
    if (t.dataset.ouv) return { genre: "ouv", id: t.dataset.ouv };
    if (t.dataset.liaison) return { genre: "liaison", id: t.dataset.liaison };
    return { genre: "mur", id: t.dataset.mur };
  };
  let espace = false;
  svg.addEventListener("pointerdown", async e => {
    svg.setPointerCapture(e.pointerId);
    pointeurs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointeurs.size === 2) {
      // deux doigts : déplacer et zoomer la vue
      const [p1, p2] = [...pointeurs.values()];
      etat.trace = null;
      geste = {
        genre: "pince",
        d0: dist(p1, p2),
        z0: etat.vue.z,
        c0: versMonde((p1.x + p2.x) / 2, (p1.y + p2.y) / 2),
        m0: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
      };
      etat.apercu = {};
      return;
    }
    const pt = versMonde(e.clientX, e.clientY);
    // (une case du panneau ou du haut garde sinon le clavier : les raccourcis ne marcheraient plus)
    const actif = document.activeElement;
    if (actif && actif !== document.body && page.contains(actif) && actif.blur) actif.blur();
    if (etat.detect && e.target.dataset && e.target.dataset.detect) {
      const [genre, i] = e.target.dataset.detect.split(":"),
        m = etat.detect[genre === "mur" ? "murs" : "portes"][Number(i)];
      if (m && genre === "porte" && m.ok && m.alt && m.i < m.alt.length - 1) {
        m.i++;
        Object.assign(m, { a: m.alt[m.i].a, b: m.alt[m.i].b });
      } else if (m && genre === "porte" && !m.ok && m.alt) {
        m.ok = true;
        m.i = 0;
        Object.assign(m, { a: m.alt[0].a, b: m.alt[0].b });
      } else if (m) m.ok = !m.ok;
      if (m) {
        dessiner();
        majBarreDetect();
      }
      return;
    }
    if (etat.cadrage) {
      // encadrer le plan sur la photo
      etat.cadrage.a = pt;
      etat.cadrage.b = pt;
      geste = { genre: "cadrage" };
      dessiner();
      return;
    }
    if (e.button === 0 && e.target.dataset && e.target.dataset.cotei !== undefined && etat.outil === "selection") {
      const sg = (etat.cotesInt || [])[Number(e.target.dataset.cotei)];
      if (sg) modifierCoteInterieure(sg).catch(erreur);
      return;
    }
    if (e.button === 1 || espace || etat.tabVue) {
      geste = { genre: "vue", x: e.clientX, y: e.clientY, v: { ...etat.vue } };
      return;
    }
    // clic droit : finit la suite de murs ou la pièce, lâche la liaison ou la gaine commencée ; sinon, retour à la sélection (comme Échap)
    if (e.button === 2) {
      e.preventDefault();
      if (etat.mur) {
        etat.mur = null;
        etat.apercu = {};
        valider();
      } else if (etat.piece) finirPiece();
      else if (etat.liaison || etat.gaine) {
        etat.liaison = null;
        etat.gaine = null;
        etat.apercu = {};
        dessiner();
      } else if (etat.outil !== "selection") choisirOutil("selection");
      return;
    }
    const o = etat.outil;
    // (au doigt : poignée de ce qu'on vient de poser ; ailleurs : l'outil continue, la poignée s'en va)
    if (OUTILS_POSE.includes(o) && etat.recent) {
      let pg = poigneesRecent().find(q => dist(q, pt) < (q.genre === "bouger" ? 26 : 22) / etat.vue.z);
      // (roue : l'appareil qu'on vient de poser se glisse aussi en le prenant lui-même, sans le choisir avant)
      const rec = o === "roue" && etat.recent.genre === "objet" && objetDe(etat.recent.id);
      if (!pg && rec && dist(rec, pt) < 26 / etat.vue.z) pg = { genre: "bouger", o: rec };
      if (pg) {
        if (etat.pli) etat.pli = null;
        if (pg.genre === "bouger")
          geste = { genre: "deplacer", depart: pt, bouge: false, cible: { genre: "objet", id: pg.o.id }, base: JSON.parse(instantane()) };
        else if (pg.genre === "courbe") geste = { genre: "courbe", li: pg.li };
        else geste = { genre: "courbeGaine", g: pg.g };
        return;
      }
      etat.recent = null;
    }
    if (o === "piece") {
      if (etat.piece || e.shiftKey || etat.tabMaj) {
        // contour à la main, aimanté aux angles des murs
        const q = accrocherPoint(pt);
        if (etat.piece && etat.piece.length > 2 && dist(q, etat.piece[0]) < 12 / etat.vue.z) {
          finirPiece();
          return;
        }
        (etat.piece = etat.piece || []).push({ x: q.x, y: q.y });
        dessiner();
        return;
      }
      const contour = contourPiece(pt);
      if (!contour) {
        toast(
          "Pas de pièce fermée trouvée ici (un mur ne rejoint pas l'autre ?) : Maj+clic pour dessiner son contour point par point.",
          true
        );
        return;
      }
      const nomP = await demanderTexte("Nom de la pièce (ex. Cuisine, Chambre 1) :", "");
      if (nomP === null) return;
      const pc = { id: plId(), nom: nomP.trim(), auto: true, germe: { x: pt.x, y: pt.y }, pts: contour };
      d.pieces.push(pc);
      etat.sel = new Set([pc.id]);
      valider();
      return;
    }
    if (o === "calibrer") {
      // ligne de mise à l'échelle : bouts déplaçables, validée dans la barre du bas
      const cb = etat.calib,
        rayon = (etat.tablette ? 30 : 14) / etat.vue.z;
      if (cb && cb.b) {
        const k = dist(cb.a, pt) < rayon && dist(cb.a, pt) <= dist(cb.b, pt) ? "a" : dist(cb.b, pt) < rayon ? "b" : null;
        if (k) {
          geste = { genre: "calib", k };
          return;
        }
      }
      if (cb && !cb.b) {
        cb.b = { x: pt.x, y: pt.y };
        geste = { genre: "calib", k: "b" };
        dessiner();
        return;
      }
      etat.calib = { a: { x: pt.x, y: pt.y }, b: null };
      geste = { genre: "calib", k: "b", nouveau: true };
      barreReco.style.display = "none";
      dessiner();
      return;
    }
    if (o === "fond") {
      if (d.fond) geste = { genre: "fond", depart: pt, x0: d.fond.x, y0: d.fond.y };
      return;
    }
    if (o === "mur" && etat.genreMur === "arrondi") {
      clicArrondi(pt);
      return;
    }
    if (o === "mur") {
      let q = accrocherPoint(pt);
      if (etat.mur) {
        q = contraindre(etat.mur, q, e.shiftKey || etat.tabMaj); // (Maj, ou « ⇧ Maj » sur tablette : angle libre)
        const a2 = accrocherPoint(q);
        if (a2.accroche) q = a2;
        if (dist(etat.mur, q) > 2) {
          d.murs.push({ id: plId(), a: { x: etat.mur.x, y: etat.mur.y }, b: { x: q.x, y: q.y } });
          const ferme = d.murs.some(m => m.a !== d.murs[d.murs.length - 1].a && dist(m.a, q) < 0.5) && q.accroche;
          etat.mur = ferme ? null : { x: q.x, y: q.y };
          valider();
        }
      } else etat.mur = { x: q.x, y: q.y };
      etat.tape = "";
      dessiner();
      return;
    }
    // gomme des notes à main levée (outil gomme sur une note, ou ⌫ des notes) : chaque note touchée en glissant s'efface
    if ((o === "gomme" && noteSous(pt).length) || (o === "main" && etat.modeMain === "notes" && etat.formeNote === "gomme")) {
      geste = { genre: "gommeNotes", n: gommerNotes(pt) };
      dessiner();
      return;
    }
    if (o === "gomme") {
      const mp = murProche(pt, Math.max(d.epaisseur, 24 / etat.vue.z));
      if (!mp) {
        // (à côté des murs : la gomme balaie les notes à main levée qu'elle croise)
        geste = { genre: "gommeNotes", n: 0 };
        return;
      }
      etat.gomme = { m: mp.m, t0: mp.t, t1: mp.t };
      geste = { genre: "gomme" };
      dessiner();
      return;
    }
    if (o === "main") {
      clearTimeout(etat.minuterieMain);
      fermerReco();
      etat.trace = [pt];
      geste = { genre: "main", debut: pt };
      dessiner();
      return;
    }
    if (o === "rectangle") {
      const q = accrocherPoint(pt);
      if (!etat.rect) {
        etat.rect = { x: q.x, y: q.y };
        etat.tape = "";
        geste = { genre: "rect", sx: e.clientX, sy: e.clientY };
        dessiner();
        return;
      }
      creerRectangle(etat.rect, q);
      return;
    }
    if (o === "porte" || o === "fenetre") {
      const mp = murProche(pt, Math.max(40, (etat.tablette ? 34 : 22) / etat.vue.z)); // (à l'écran : pas besoin de zoomer)
      if (!mp) {
        toast("Cliquez sur un mur.", true);
        return;
      }
      const gp = o === "porte" ? etat.genrePorte || "porte" : o;
      const ouv = {
        id: plId(),
        genre: gp === "galandage" || gp === "applique" ? "porte" : gp,
        mur: mp.m.id,
        t: mp.t,
        largeur: o === "porte" ? optPlans().largeur_porte : optPlans().largeur_fenetre,
        sens: 1,
        charniere: "g",
      };
      if (gp === "galandage" || gp === "applique") ouv.coulissante = gp;
      d.ouvertures.push(ouv);
      etat.sel = new Set([ouv.id]);
      choisirOutil("selection");
      valider();
      return;
    }
    if (o === "roue") {
      // (appui sur un appareil déjà posé : on le choisit et on peut le glisser ; la roue s'ouvre dans le vide)
      const c = cible(e);
      let ob = c && c.genre === "objet" ? objetDe(c.id) : null;
      if (!ob || ob.genre !== "symbole") ob = symboleProche(pt, (etat.tablette ? 24 : 14) / etat.vue.z);
      if (ob) {
        etat.sel = new Set([ob.id]);
        geste = { genre: "deplacer", depart: pt, bouge: false, cible: { genre: "objet", id: ob.id }, base: JSON.parse(instantane()) };
        dessiner();
        return;
      }
      ouvrirRoue(e.clientX, e.clientY, pt);
      return;
    }
    if (o === "symbole") return poserIci(pt);
    if (o === "texte") {
      // clic sur un appareil : le texte s'y attache (il le suit quand on le déplace)
      const c = cible(e),
        ap = c && c.genre === "objet" ? objetDe(c.id) : null,
        lie = ap && ap.genre === "symbole" ? ap : null;
      const t = await demanderTexte(
        lie
          ? "Texte attaché à « " + ((SYMB[lie.type] || {}).libelle || "l'appareil") + " » (ex. 16 A, h=1,10 m) :"
          : "Texte (ex. Cuisine, Chambre 1) :"
      );
      if (t) {
        const ob = {
          id: plId(),
          genre: "texte",
          texte: t,
          x: lie ? lie.x : grille(pt.x),
          y: lie ? lie.y + TAILLE_SYMBOLE * 0.9 : grille(pt.y),
          taille: lie ? 14 : 22,
        };
        if (lie) ob.lie = lie.id;
        d.objets.push(ob);
        etat.sel = new Set([ob.id]);
        valider();
      }
      return;
    }
    if (o === "gaine") {
      // départ (boîte, tableau ou appareil), coudes, arrivée
      if (etat.pli) {
        etat.pli = null;
        valider();
        return;
      } // (clic qui fixe la courbe de la gaine qu'on vient de poser)
      const c = cible(e);
      let ob = c && c.genre === "objet" ? objetDe(c.id) : null;
      if (!ob || ob.genre !== "symbole" || estDecor(ob)) ob = symboleProche(pt, (etat.tablette ? 30 : 18) / etat.vue.z);
      const gn = etat.gaine;
      // (appareil déjà relié à ce départ : il devient le départ, pour un repiquage vers l'appareil suivant)
      const dejaRelie = gn && ob && d.gaines.some(g => (g.de === gn.de && g.vers === ob.id) || (g.de === ob.id && g.vers === gn.de));
      if (!gn || (ob && ob.id === gn.de) || dejaRelie) {
        if (!ob && etat.conduitOutil !== "gaine") {
          // (moulure qui descend du plafond : câble arrivant des combles ; une arrivée des combles est posée là, au mur)
          const s = placerSymbole(pt, "traversee");
          ob = { id: plId(), genre: "symbole", type: "traversee", x: s.x, y: s.y, rot: s.rot || 0, circuit: null, cote: "plafond" };
          d.objets.push(ob);
          toast("Départ du plafond (arrivée des combles) : touchez maintenant l'appareil ou la boîte à rejoindre.");
        }
        if (!ob) {
          toast(
            "Une gaine part d'une boîte de dérivation, du tableau, d'un appareil ou d'une traversée (arrivée des combles) : cliquez dessus.",
            true
          );
          return;
        }
        // (appui sur le départ : clic, puis clic sur l'appareil ; ou glisser jusqu'à l'appareil, la gaine suit le trait)
        etat.gaine = { de: ob.id, pts: [] };
        geste = { genre: "gaineMain", de: ob.id, trace: [{ x: pt.x, y: pt.y }], sx: e.clientX, sy: e.clientY };
        dessiner();
        return;
      }
      if (ob) {
        const ng = { id: plId(), de: gn.de, vers: ob.id, pts: gn.pts };
        ajouterGaine(ng);
        if (!gn.pts.length && pliageActif() && conduitDe(ng) !== "moulure") {
          etat.pli = { genre: "gaine", id: ng.id };
          etat.apercu = {};
        }
        // la suivante repart de la même boîte (une pieuvre : de la boîte vers chaque appareil)
        const dep = objetDe(gn.de);
        // (arrivée sur une boîte, ex. depuis le tableau : on repart de cette boîte)
        etat.gaine = suiteGaine(dep, ob);
        if (etat.pli) dessiner();
        else valider();
        return;
      }
      // (dans le vide : un coude ; sans coude la gaine est un trait direct, qu'on courbe ensuite par sa poignée)
      const prec = gn.pts.length ? gn.pts[gn.pts.length - 1] : objetDe(gn.de);
      const q = e.shiftKey ? pt : coudeDroit(prec, pt);
      gn.pts.push({ x: Math.round(q.x * 10) / 10, y: Math.round(q.y * 10) / 10 });
      dessiner();
      return;
    }
    if (o === "liaison") {
      if (etat.pli) {
        etat.pli = null;
        valider();
        return;
      } // (clic qui fixe la courbe de la liaison qu'on vient de poser)
      const c = cible(e);
      let ob = c && c.genre === "objet" ? objetDe(c.id) : null;
      if (!ob || ob.genre !== "symbole" || estDecor(ob)) ob = symboleProche(pt);
      if (!ob) {
        etat.liaison = null;
        dessiner();
        return;
      } // clic dans le vide : nouvelle chaîne
      // (on attend le relâchement : glissé jusqu'à un autre appareil = liaison entre les deux ; simple appui = chaîne de clics)
      geste = { genre: "liaison", de: ob.id, sx: e.clientX, sy: e.clientY };
      etat.liaisonGlisse = ob.id;
      dessiner();
      return;
    }
    // sélection
    let c = cible(e);
    if (etat.tablette && (!c || c.genre === "mur" || c.genre === "piece")) {
      const sp = symboleProche(pt, 24 / etat.vue.z);
      if (sp) c = { genre: "objet", id: sp.id };
    }
    if (!c || c.genre === "mur" || c.genre === "piece") {
      // (porte ou fenêtre près du doigt, ou clic dans l'arc d'ouverture d'une porte : elle plutôt que le mur ou la pièce)
      let bo = null,
        bd = Infinity;
      for (const o of d.ouvertures) {
        const g = geomOuverture(o);
        if (!g) continue;
        const t = Math.abs((pt.x - g.c.x) * g.ux + (pt.y - g.c.y) * g.uy),
          n = Math.abs((pt.x - g.c.x) * g.nx + (pt.y - g.c.y) * g.ny);
        const portee = etat.tablette
          ? g.ep / 2 + 24 / etat.vue.z
          : o.genre === "porte"
            ? g.ep / 2 + o.largeur * 0.9 // (le quart de cercle du battant)
            : g.ep / 2 + 6 / etat.vue.z;
        if (t < o.largeur / 2 + (etat.tablette ? 10 : 2) / etat.vue.z && n < portee && n < bd) {
          bd = n;
          bo = o;
        }
      }
      if (bo) c = { genre: "ouv", id: bo.id };
    }
    // poignée (taille d'un appareil, courbe d'une liaison) ?
    for (const pg of poignees())
      if (
        dist(pg, pt) <
        (pg.genre === "bouger"
          ? 26
          : etat.tablette && (pg.genre === "coude" || pg.genre === "ajoutCoude" || pg.genre === "courbeGaine" || pg.doigt)
            ? 20
            : 9) /
          etat.vue.z
      ) {
        if (pg.genre === "bouger") {
          geste = {
            genre: "deplacer",
            depart: pt,
            bouge: false,
            cible: { genre: pg.o.mur ? "mur" : pg.o.ouv ? "ouv" : "objet", id: pg.o.id },
            base: JSON.parse(instantane()),
          };
          return;
        }
        if (pg.genre === "courbe") geste = { genre: "courbe", li: pg.li };
        else if (pg.genre === "coude") geste = { genre: "coude", g: pg.g, i: pg.i };
        else if (pg.genre === "courbeGaine") geste = { genre: "courbeGaine", g: pg.g };
        else if (pg.genre === "ajoutCoude") {
          (pg.g.pts = pg.g.pts || []).splice(pg.i, 0, { x: pg.x, y: pg.y });
          geste = { genre: "coude", g: pg.g, i: pg.i, bouge: true };
        } else {
          const a = ((pg.o.rot || 0) * Math.PI) / 180;
          geste = {
            genre: pg.genre,
            o: pg.o,
            sx0: pg.o.sx || 1,
            sy0: pg.o.sy || 1,
            a,
            d0: Math.hypot(pg.x - pg.o.x, pg.y - pg.o.y),
            recoller: retenirCollage([pg.o]), // (contre un mur : il y reste collé en grandissant, sans le chevaucher)
          };
        }
        return;
      }
    // extrémité d'un mur choisi ?
    for (const m of d.murs)
      if (etat.sel.has(m.id) && !m.arc)
        for (const k of ["a", "b"])
          if (dist(m[k], pt) < (etat.tablette ? 24 : 9) / etat.vue.z) {
            geste = { genre: "point", depart: { x: m[k].x, y: m[k].y }, courant: { x: m[k].x, y: m[k].y }, fixe: m[k === "a" ? "b" : "a"] };
            return;
          }
    if (c) {
      // double-clic sur un appareil : tout son groupe de liaisons (fait ici : le dessin est refait entre les deux clics)
      const ob2 = c.genre === "objet" && objetDe(c.id);
      if (ob2 && ob2.genre === "symbole" && etat.dernierClic && etat.dernierClic.id === c.id && Date.now() - etat.dernierClic.t < 450) {
        etat.dernierClic = null;
        choisirGroupe(c.id);
        return;
      }
      etat.dernierClic = { id: c.id, t: Date.now() };
      if (e.shiftKey || e.ctrlKey || e.metaKey || etat.tabMaj) {
        etat.sel.has(c.id) ? etat.sel.delete(c.id) : etat.sel.add(c.id);
      } else if (!etat.sel.has(c.id)) etat.sel = new Set([c.id]);
      // (un morceau de mur arrondi : tout l'arrondi)
      const mArc = c.genre === "mur" && murDe(c.id);
      if (mArc && mArc.arc) for (const m of mursArc(mArc.arc)) etat.sel[etat.sel.has(c.id) ? "add" : "delete"](m.id);
      geste = { genre: "deplacer", depart: pt, bouge: false, cible: c, base: JSON.parse(instantane()) };
    } else {
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !etat.tabMaj) etat.sel.clear();
      geste = { genre: "cadre", a: pt, b: pt };
    }
    dessiner();
    majPanneau();
  });
  svg.addEventListener("pointermove", e => {
    if (pointeurs.has(e.pointerId)) pointeurs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pt = versMonde(e.clientX, e.clientY);
    etat.apercu = {};
    if (geste && geste.genre === "cadrage" && etat.cadrage) {
      etat.cadrage.b = pt;
      dessiner();
      return;
    }
    if (geste && geste.genre === "gommeNotes") {
      geste.n += gommerNotes(pt);
      dessiner();
      return;
    }
    if (geste && geste.genre === "gomme" && etat.gomme) {
      const m = etat.gomme.m,
        L2 = (m.b.x - m.a.x) ** 2 + (m.b.y - m.a.y) ** 2 || 1;
      etat.gomme.t1 = Math.max(0, Math.min(1, ((pt.x - m.a.x) * (m.b.x - m.a.x) + (pt.y - m.a.y) * (m.b.y - m.a.y)) / L2));
      dessiner();
      return;
    }
    if (geste && geste.genre === "main" && etat.trace && etat.modeMain === "notes" && (etat.formeNote || "libre") !== "libre") {
      etat.trace = formeNote(geste.debut, pt, etat.formeNote);
      dessiner();
      return;
    }
    if (geste && geste.genre === "main" && etat.trace) {
      const der = etat.trace[etat.trace.length - 1];
      if (dist(der, pt) > 3 / etat.vue.z) {
        etat.trace.push(pt);
        dessiner();
      }
      return;
    }
    if (geste && geste.genre === "pince" && pointeurs.size === 2) {
      const [p1, p2] = [...pointeurs.values()];
      const z = Math.min(8, Math.max(0.1, (geste.z0 * dist(p1, p2)) / (geste.d0 || 1)));
      const m = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
        r = svg.getBoundingClientRect();
      etat.vue = { z, x: geste.c0.x - (m.x - r.left) / z, y: geste.c0.y - (m.y - r.top) / z };
      dessiner();
      return;
    }
    if (geste && geste.genre === "vue") {
      etat.vue = { ...geste.v, x: geste.v.x - (e.clientX - geste.x) / etat.vue.z, y: geste.v.y - (e.clientY - geste.y) / etat.vue.z };
      dessiner();
      return;
    }
    if (geste && geste.genre === "cadre") {
      geste.b = pt;
      etat.apercu.cadre = { a: geste.a, b: pt };
      dessiner();
      return;
    }
    if (geste && (geste.genre === "gaineMain" || geste.genre === "liaison")) {
      // (le tracé, pour la courbe)
      (geste.trace = geste.trace || []).push({ x: pt.x, y: pt.y });
      if (geste.genre === "gaineMain") {
        etat.apercu.trace = geste.trace;
        dessiner();
        return;
      }
    }
    if (geste && geste.genre === "courbeGaine") {
      // la courbe de la gaine passe par le pointeur
      const a = objetDe(geste.g.de),
        b = objetDe(geste.g.vers);
      if (a && b) {
        const mx = (a.x + b.x) / 2,
          my = (a.y + b.y) / 2;
        geste.g.dc = { x: 2 * (pt.x - mx), y: 2 * (pt.y - my) };
      }
      geste.bouge = true;
      dessiner();
      return;
    }
    if (geste && geste.genre === "coude") {
      // coude de gaine : à l'équerre du point d'avant (Maj : libre)
      const ch = cheminGaine(geste.g),
        prec = ch && ch[geste.i];
      const q = e.shiftKey || !prec ? pt : coudeDroit(prec, pt);
      geste.g.pts[geste.i] = { x: Math.round(q.x * 10) / 10, y: Math.round(q.y * 10) / 10 };
      geste.bouge = true;
      dessiner();
      return;
    }
    if (geste && geste.genre === "deplacer" && geste.cible && geste.cible.genre === "gaine") {
      // gaine glissée : ses coudes suivent
      const g = d.gaines.find(x => x.id === geste.cible.id),
        g0 = (geste.base.gaines || []).find(x => x.id === geste.cible.id);
      const dx = pt.x - geste.depart.x,
        dy = pt.y - geste.depart.y;
      if (Math.hypot(dx, dy) * etat.vue.z > 3) geste.bouge = true;
      if (g && g0 && geste.bouge) g.pts = (g0.pts || []).map(q => ({ x: q.x + dx, y: q.y + dy }));
      dessiner();
      return;
    }
    if (geste && geste.genre === "courbe") {
      // la courbe passe par le pointeur
      const a = objetDe(geste.li.de),
        b = objetDe(geste.li.vers);
      if (a && b) {
        const mx = (a.x + b.x) / 2,
          my = (a.y + b.y) / 2;
        geste.li.dc = { x: 2 * (pt.x - mx), y: 2 * (pt.y - my) };
      }
      geste.bouge = true;
      dessiner();
      return;
    }
    if (geste && (geste.genre === "taille" || geste.genre === "largeur")) {
      // taille d'un appareil à la souris
      const o = geste.o,
        ca = Math.cos(-geste.a),
        sa = Math.sin(-geste.a),
        lx = (pt.x - o.x) * ca - (pt.y - o.y) * sa;
      if (geste.genre === "largeur") o.sx = Math.min(8, Math.max(0.3, Math.abs(lx) / ((21 * TAILLE_SYMBOLE) / 40)));
      else {
        const f = Math.hypot(pt.x - o.x, pt.y - o.y) / (geste.d0 || 1);
        o.sx = Math.min(8, Math.max(0.3, geste.sx0 * f));
        o.sy = Math.min(8, Math.max(0.3, geste.sy0 * f));
      }
      if (geste.recoller) geste.recoller();
      geste.bouge = true;
      dessiner();
      return;
    }
    if (geste && geste.genre === "calib") {
      etat.calib[geste.k] = { x: pt.x, y: pt.y };
      geste.bouge = true;
      dessiner();
      return;
    }
    if (geste && geste.genre === "fond") {
      d.fond.x = geste.x0 + pt.x - geste.depart.x;
      d.fond.y = geste.y0 + pt.y - geste.depart.y;
      dessiner();
      return;
    }
    if (geste && geste.genre === "point") {
      let q = accrocherPoint(pt, [geste.courant]);
      if (!e.shiftKey && !etat.tabMaj && !q.accroche) q = contraindre(geste.fixe, q, false);
      const pareil = (a, b) => Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01;
      const figes = d.murs.filter(m => m.fige && (pareil(m.a, geste.courant) || pareil(m.b, geste.courant)));
      if (figes.length) {
        // garde la longueur : le bout reste à la même distance de l'autre bout
        const m = figes[0],
          f = pareil(m.a, geste.courant) ? m.b : m.a,
          L = dist(m.a, m.b),
          r = dist(f, q);
        if (r > 0.01) q = { x: f.x + ((q.x - f.x) / r) * L, y: f.y + ((q.y - f.y) / r) * L };
        else q = { ...geste.courant };
      }
      const avantFige = JSON.stringify(d.murs);
      deplacerPoint(geste.courant, q);
      if (figesChanges()) {
        d.murs = JSON.parse(avantFige);
        if (!geste.avis) {
          geste.avis = true;
          toast(AVIS_FIGE, true);
        }
        dessiner();
        return;
      }
      geste.courant = { x: q.x, y: q.y };
      if (q.accroche) etat.apercu.accroche = q;
      dessiner();
      return;
    }
    if (geste && geste.genre === "deplacer") {
      const dx = pt.x - geste.depart.x,
        dy = pt.y - geste.depart.y;
      if (!geste.bouge && Math.hypot(dx, dy) * etat.vue.z < 3) return;
      const base = geste.base;
      geste.bouge = true;
      const ids = [...etat.sel];
      for (const n0 of base.notes || [])
        if (ids.includes(n0.id)) {
          const n = (d.notes || []).find(x => x.id === n0.id);
          if (n) n.pts = n0.pts.map(q => ({ x: q.x + dx, y: q.y + dy }));
        }
      if (ids.every(id => (d.notes || []).some(n => n.id === id))) {
        dessiner();
        return;
      }
      // objets : le premier choisi s'aimante (mur, alignement), les autres suivent
      const objs = ids.map(id => base.objets.find(o => o.id === id)).filter(Boolean);
      if (objs.length) {
        const ref = objs[0];
        let nx = ref.x + dx,
          ny = ref.y + dy,
          rot = ref.rot;
        if (ref.genre === "symbole") {
          const s = placerSymbole({ x: nx, y: ny }, ref.type, ids, ref.sy);
          nx = s.x;
          ny = s.y;
          if (objs.length === 1 && SYMB[ref.type].pose === "mur") rot = s.rot;
          etat.apercu.guides = s.guides;
        } else {
          nx = grille(nx);
          ny = grille(ny);
        }
        const ddx = nx - ref.x,
          ddy = ny - ref.y;
        for (const ob of objs) {
          const cur = objetDe(ob.id);
          cur.x = ob.x + ddx;
          cur.y = ob.y + ddy;
          if (ob === ref && rot !== undefined) cur.rot = rot;
        }
        // textes attachés à un appareil déplacé : le suivent
        const bouges = new Set(objs.map(x => x.id));
        for (const t0 of base.objets)
          if (t0.genre === "texte" && t0.lie && bouges.has(t0.lie) && !bouges.has(t0.id)) {
            const ap0 = base.objets.find(x => x.id === t0.lie),
              ap = objetDe(t0.lie),
              t = objetDe(t0.id);
            if (ap0 && ap && t) {
              t.x = t0.x + ap.x - ap0.x;
              t.y = t0.y + ap.y - ap0.y;
            }
          }
      }
      // ouvertures : glissent le long de leur mur
      for (const id of ids) {
        const o = d.ouvertures.find(x => x.id === id);
        if (o) {
          const m = murDe(o.mur);
          const L2 = (m.b.x - m.a.x) ** 2 + (m.b.y - m.a.y) ** 2 || 1;
          o.t = Math.max(0.02, Math.min(0.98, ((pt.x - m.a.x) * (m.b.x - m.a.x) + (pt.y - m.a.y) * (m.b.y - m.a.y)) / L2));
        }
      }
      // pièces : leur repère (ou leur contour) suit
      // (pièce seule : on glisse son nom ; avec des murs : toute la pièce suit)
      const avecMurs = ids.some(id => base.murs.some(m => m.id === id));
      for (const id of ids) {
        const p0 = (base.pieces || []).find(x => x.id === id),
          pc = pieceDe(id);
        if (p0 && pc) {
          const gx = grille(dx),
            gy = grille(dy);
          if (!avecMurs) {
            pc.etiquette = { dx: ((p0.etiquette || {}).dx || 0) + dx, dy: ((p0.etiquette || {}).dy || 0) + dy };
            continue;
          }
          if (pc.germe) pc.germe = { x: p0.germe.x + gx, y: p0.germe.y + gy };
          if (!pc.auto) pc.pts = p0.pts.map(q => ({ x: q.x + gx, y: q.y + gy }));
        }
      }
      // murs entiers : un mur seul glisse d'équerre (perpendiculairement) ; les murs reliés s'allongent ou raccourcissent
      const murs0 = ids.map(id => base.murs.find(m => m.id === id)).filter(Boolean);
      if (murs0.length) {
        let gx = grille(dx),
          gy = grille(dy);
        if (murs0.length === 1 && !objs.length) {
          const m0 = murs0[0],
            L = dist(m0.a, m0.b) || 1,
            nx = -(m0.b.y - m0.a.y) / L,
            ny = (m0.b.x - m0.a.x) / L,
            brut = dx * nx + dy * ny;
          let k = grille(brut);
          // alignement : le mur s'aimante sur l'alignement d'un autre mur parallèle, ou sur le bout d'un autre mur
          // (ex. réduire une pièce jusqu'au mur de la pièce d'à côté) ; un trait vert montre l'alignement trouvé
          const ux = -ny,
            uy = nx,
            c0 = m0.a.x * nx + m0.a.y * ny,
            tol = 14 / etat.vue.z;
          const relie = m => [m.a, m.b].some(q => [m0.a, m0.b].some(r => Math.abs(q.x - r.x) < 2 && Math.abs(q.y - r.y) < 2));
          let cible = null;
          for (const m of base.murs) {
            if (m.id === m0.id || relie(m)) continue;
            const Lm = dist(m.a, m.b) || 1,
              par = Math.abs(((m.b.x - m.a.x) / Lm) * ny - ((m.b.y - m.a.y) / Lm) * nx) > 0.995;
            for (const q of par ? [m.a] : [m.a, m.b]) {
              const c = q.x * nx + q.y * ny,
                ecart = Math.abs(c - (c0 + brut));
              if (ecart < tol && (!cible || ecart < cible.ecart)) cible = { ecart, c, m };
            }
          }
          if (cible) {
            k = cible.c - c0;
            const proj = q => q.x * ux + q.y * uy,
              ts = [m0.a, m0.b, cible.m.a, cible.m.b].map(proj),
              t0 = Math.min(...ts) - 30,
              t1 = Math.max(...ts) + 30;
            etat.apercu.guides = [
              { x1: ux * t0 + nx * cible.c, y1: uy * t0 + ny * cible.c, x2: ux * t1 + nx * cible.c, y2: uy * t1 + ny * cible.c },
            ];
          }
          gx = nx * k;
          gy = ny * k;
        }
        const bouges = [];
        for (const m0 of murs0) {
          const m = murDe(m0.id);
          m.a = { x: m0.a.x + gx, y: m0.a.y + gy };
          m.b = { x: m0.b.x + gx, y: m0.b.y + gy };
          bouges.push([m0.a, m.a, m0], [m0.b, m.b, m0]);
        }
        const pareil = (a, b) => Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2;
        const dir = m => {
          const L = dist(m.a, m.b) || 1;
          return { x: (m.b.x - m.a.x) / L, y: (m.b.y - m.a.y) / L };
        };
        const parallele = (m1, m2) => {
          const u = dir(m1),
            v = dir(m2);
          return Math.abs(u.x * v.y - u.y * v.x) < 0.05;
        };
        // murs « ponts » ajoutés pendant le glissement (refaits à chaque mouvement)
        if (geste.ponts) d.murs = d.murs.filter(m => !geste.ponts.includes(m.id));
        geste.ponts = [];
        const glisse = Math.hypot(gx, gy) > 0.5,
          aRelier = [],
          etires = [];
        const surMur = (q, m) => {
          const L2 = (m.b.x - m.a.x) ** 2 + (m.b.y - m.a.y) ** 2 || 1,
            t = ((q.x - m.a.x) * (m.b.x - m.a.x) + (q.y - m.a.y) * (m.b.y - m.a.y)) / L2;
          return t > -0.001 && t < 1.001 && dist(q, { x: m.a.x + (m.b.x - m.a.x) * t, y: m.a.y + (m.b.y - m.a.y) * t }) < 2;
        };
        for (const w0 of base.murs) {
          if (ids.includes(w0.id)) continue;
          const w = murDe(w0.id);
          if (!w) continue;
          let change = null;
          for (const k of ["a", "b"]) {
            w[k] = { x: w0[k].x, y: w0[k].y };
            let bg = bouges.find(([a]) => pareil(a, w0[k]));
            if (!bg) {
              // bout posé au milieu du mur déplacé (cloison en T) : suit aussi
              const m0 = murs0.find(m => {
                const L2 = (m.b.x - m.a.x) ** 2 + (m.b.y - m.a.y) ** 2 || 1,
                  t = ((w0[k].x - m.a.x) * (m.b.x - m.a.x) + (w0[k].y - m.a.y) * (m.b.y - m.a.y)) / L2;
                return t > 0 && t < 1 && dist(w0[k], { x: m.a.x + (m.b.x - m.a.x) * t, y: m.a.y + (m.b.y - m.a.y) * t }) < 2;
              });
              if (m0 && !parallele(w0, m0)) {
                w[k] = { x: w0[k].x + gx, y: w0[k].y + gy };
                change = k;
              }
              continue;
            }
            if (parallele(w0, bg[2])) {
              // mur dans le prolongement : il ne penche pas ; un petit mur d'équerre relie les deux
              if (glisse && murs0.length === 1)
                aRelier.push({ a: { x: w0[k].x, y: w0[k].y }, b: { x: bg[1].x, y: bg[1].y }, ep: w0.ep || bg[2].ep });
              else if (murs0.length > 1) {
                w[k] = { x: bg[1].x, y: bg[1].y };
                change = k;
              }
              continue;
            }
            w[k] = { x: bg[1].x, y: bg[1].y };
            change = k;
          }
          // portes et fenêtres du mur étiré : restent où elles sont, sauf si le mur déplacé arrive sur elles :
          // il les pousse devant lui (elles restent dans leur pièce, juste à côté de la cloison)
          if (change) {
            const L0 = dist(w0.a, w0.b) || 1,
              L = dist(w.a, w.b) || 1,
              mobile = murs0[0],
              epM = (mobile.ep || d.epaisseur) / 2;
            etires.push({ w0, w, change, L0, L, epM });
            for (const o0 of base.ouvertures.filter(o => o.mur === w0.id)) {
              const o = d.ouvertures.find(x => x.id === o0.id);
              if (!o) continue;
              const dm0 = (change === "a" ? o0.t : 1 - o0.t) * L0; // distance au bout qui bouge
              let dm = Math.max(dm0 + L - L0, Math.min(dm0, o0.largeur / 2 + epM + 5));
              // la porte reste entre les mêmes murs de l'autre côté : elle donne toujours sur la même pièce voisine
              const fixe = change === "a" ? w0.b : w0.a,
                df0 = L0 - dm0,
                jonctions = [];
              for (const x of base.murs) {
                if (x.id === w0.id || ids.includes(x.id)) continue;
                for (const q of [x.a, x.b]) {
                  const tq =
                    ((q.x - fixe.x) * ((change === "a" ? w0.a : w0.b).x - fixe.x) +
                      (q.y - fixe.y) * ((change === "a" ? w0.a : w0.b).y - fixe.y)) /
                    (L0 * L0);
                  if (tq > 0.001 && tq < 0.999 && surMur(q, w0)) jonctions.push({ df: tq * L0, ep: (x.ep || d.epaisseur) / 2 });
                }
              }
              const avant = jonctions.filter(j => j.df < df0).sort((u, v) => v.df - u.df)[0],
                apres = jonctions.filter(j => j.df > df0).sort((u, v) => u.df - v.df)[0];
              const marge = o0.largeur / 2 + 3,
                lo = avant ? avant.df + avant.ep + marge : -Infinity,
                hi = apres ? apres.df - apres.ep - marge : Infinity;
              if (lo <= hi) dm = L - Math.min(hi, Math.max(lo, L - dm));
              o.t = Math.max(0.02, Math.min(0.98, change === "a" ? dm / L : 1 - dm / L));
            }
          }
        }
        // (pas de pont si un mur d'équerre, allongé, couvre déjà l'écart)
        for (const r of aRelier)
          if (!d.murs.some(m => surMur(r.a, m) && surMur(r.b, m))) {
            const id = plId();
            geste.ponts.push(id);
            d.murs.push({ id, ...r });
          }
        // appareils posés contre un mur déplacé : suivent le mur
        if (!objs.length)
          for (const o0 of base.objets) {
            if (o0.genre !== "symbole" || ids.includes(o0.id)) continue;
            const lie = murs0.some(m0 => {
              const L2 = (m0.b.x - m0.a.x) ** 2 + (m0.b.y - m0.a.y) ** 2 || 1,
                t = ((o0.x - m0.a.x) * (m0.b.x - m0.a.x) + (o0.y - m0.a.y) * (m0.b.y - m0.a.y)) / L2;
              return (
                t > 0 &&
                t < 1 &&
                dist(o0, { x: m0.a.x + (m0.b.x - m0.a.x) * t, y: m0.a.y + (m0.b.y - m0.a.y) * t }) <
                  (m0.ep || d.epaisseur) / 2 + TAILLE_SYMBOLE / 2 + 2
              );
            });
            if (lie) {
              const o = objetDe(o0.id);
              o.x = o0.x + gx;
              o.y = o0.y + gy;
              continue;
            }
            // ceux posés sur un mur étiré : restent en place, sauf si le mur déplacé arrive sur eux (poussés devant lui)
            for (const { w0, w, change, L0, L, epM } of etires) {
              const t = ((o0.x - w0.a.x) * (w0.b.x - w0.a.x) + (o0.y - w0.a.y) * (w0.b.y - w0.a.y)) / (L0 * L0);
              if (
                !(t > 0 && t < 1) ||
                dist(o0, { x: w0.a.x + (w0.b.x - w0.a.x) * t, y: w0.a.y + (w0.b.y - w0.a.y) * t }) >
                  (w0.ep || d.epaisseur) / 2 + TAILLE_SYMBOLE / 2 + 2
              )
                continue;
              const dm0 = (change === "a" ? t : 1 - t) * L0,
                dm = Math.max(dm0 + L - L0, Math.min(dm0, epM + TAILLE_SYMBOLE / 2 + 2)),
                pousse = dm - (dm0 + L - L0);
              if (pousse > 0.01) {
                const fin = change === "a" ? w.a : w.b,
                  autre = change === "a" ? w.b : w.a,
                  ux = (autre.x - fin.x) / L,
                  uy = (autre.y - fin.y) / L,
                  o = objetDe(o0.id);
                o.x = o0.x + ux * pousse;
                o.y = o0.y + uy * pousse;
              }
              break;
            }
          }
        if (figesChanges()) {
          if (geste.correct) {
            const x = JSON.parse(geste.correct.s);
            ["murs", "objets", "ouvertures", "pieces"].forEach(k => {
              d[k] = x[k];
            });
            geste.ponts = geste.correct.ponts;
          } else {
            const x = JSON.parse(JSON.stringify(base));
            ["murs", "objets", "ouvertures", "pieces"].forEach(k => {
              d[k] = x[k];
            });
            geste.ponts = [];
          }
          if (!geste.avis) {
            geste.avis = true;
            toast(AVIS_FIGE, true);
          }
        } else
          geste.correct = {
            s: JSON.stringify({ murs: d.murs, objets: d.objets, ouvertures: d.ouvertures, pieces: d.pieces }),
            ponts: [...geste.ponts],
          };
      }
      dessiner();
      return;
    }
    // aperçus des outils
    if (etat.outil === "mur" && etat.genreMur !== "arrondi") {
      let q = accrocherPoint(pt);
      if (etat.mur) {
        q = contraindre(etat.mur, q, e.shiftKey || etat.tabMaj); // (Maj, ou « ⇧ Maj » sur tablette : angle libre)
        const a2 = accrocherPoint(q);
        if (a2.accroche) q = a2;
      }
      etat.apercu.point = q;
      if (q.accroche) etat.apercu.accroche = q;
      dessiner();
    } else if (etat.outil === "symbole") {
      const s = placerSymbole(pt, etat.symbole);
      etat.apercu.fantome = s;
      etat.apercu.guides = s.guides;
      dessiner();
    } else if (etat.outil === "porte" || etat.outil === "fenetre") {
      const mp = murProche(pt, 40);
      if (mp) {
        const m = mp.m,
          L = dist(m.a, m.b) || 1,
          ux = (m.b.x - m.a.x) / L,
          uy = (m.b.y - m.a.y) / L,
          w = (etat.outil === "porte" ? optPlans().largeur_porte : optPlans().largeur_fenetre) / 2;
        etat.apercu.ouverture = { a: { x: mp.q.x - ux * w, y: mp.q.y - uy * w }, b: { x: mp.q.x + ux * w, y: mp.q.y + uy * w } };
      }
      dessiner();
    } else if (etat.outil === "liaison" && (etat.liaison || etat.liaisonGlisse) && !etat.pli) {
      etat.apercu.point = pt;
      dessiner();
    } else if ((etat.outil === "gaine" || etat.outil === "liaison") && etat.pli) plier(pt);
    else if (etat.outil === "gaine" && etat.gaine) {
      const gn = etat.gaine,
        prec = gn.pts.length ? gn.pts[gn.pts.length - 1] : objetDe(gn.de),
        sp = symboleProche(pt, (etat.tablette ? 30 : 18) / etat.vue.z);
      etat.apercu.point = sp && sp.id !== gn.de ? { x: sp.x, y: sp.y } : !gn.pts.length || e.shiftKey || !prec ? pt : coudeDroit(prec, pt);
      dessiner();
    } else if (etat.outil === "piece") {
      if (etat.piece) {
        const q = accrocherPoint(pt);
        etat.apercu.point = q;
        if (q.accroche) etat.apercu.accroche = q;
      } else {
        const c = contourPiece(pt);
        if (c) etat.apercu.piece = c;
      }
      dessiner();
    } else if (etat.outil === "calibrer" && etat.calib && !etat.calib.b) {
      etat.apercu.point = pt;
      dessiner();
    } else if (etat.outil === "rectangle") {
      const q = accrocherPoint(pt);
      etat.apercu.point = q;
      if (q.accroche) etat.apercu.accroche = q;
      dessiner();
    }
  });
  const finGeste = e => {
    pointeurs.delete(e.pointerId);
    if (!geste) return;
    if (geste.genre === "calib") {
      const cb = etat.calib;
      // simple clic (pas glissé) : on attend le 2e point ; sinon la ligne est là, à ajuster puis valider
      if (geste.nouveau && (!cb.b || dist(cb.a, cb.b) * etat.vue.z < 8)) cb.b = null;
      else barreCalibrage();
      geste = null;
      etat.apercu = {};
      dessiner();
      return;
    }
    if (geste.genre === "cadre") {
      const a = geste.a,
        b = geste.b,
        x0 = Math.min(a.x, b.x),
        x1 = Math.max(a.x, b.x),
        y0 = Math.min(a.y, b.y),
        y1 = Math.max(a.y, b.y);
      if (x1 - x0 > 3 || y1 - y0 > 3) {
        const dans = q => q.x >= x0 && q.x <= x1 && q.y >= y0 && q.y <= y1;
        d.objets.forEach(o => {
          if (dans(o) && (o.genre === "texte" ? vu("textes") : symboleVu(o))) etat.sel.add(o.id);
        });
        if (vu("murs"))
          d.murs.forEach(m => {
            if (dans(m.a) && dans(m.b)) etat.sel.add(m.id);
          });
        if (vu("pieces"))
          (d.pieces || []).forEach(pc => {
            if (pc.pts && pc.pts.length && pc.pts.every(dans)) etat.sel.add(pc.id);
          });
      }
      etat.apercu = {};
      dessiner();
      majPanneau();
    } else if (geste.genre === "cadrage") {
      const c = etat.cadrage;
      etat.cadrage = null;
      if (c && c.a && Math.abs(c.a.x - c.b.x) > 20 && Math.abs(c.a.y - c.b.y) > 20) {
        etat.zoneDetect = { a: c.a, b: c.b };
        analyserPhoto(c.sens, etat.zoneDetect);
      } else {
        toast("Glissez d'un coin à l'autre du plan.", true);
        lancerDetection(c ? c.sens : 1);
      }
    } else if (geste.genre === "gommeNotes") {
      if (geste.n) valider();
      else dessiner();
    } else if (geste.genre === "gomme") {
      const g = etat.gomme;
      etat.gomme = null;
      if (g) couperMur(g.m, Math.min(g.t0, g.t1), Math.max(g.t0, g.t1));
      else dessiner();
    } else if (geste.genre === "gaineMain") {
      const glisse = Math.hypot(e.clientX - geste.sx, e.clientY - geste.sy) > 14;
      etat.apercu = {};
      if (glisse) {
        // glissé de la boîte jusqu'à l'appareil : la gaine suit le trait
        const dep = objetDe(geste.de),
          vers = symboleProche(versMonde(e.clientX, e.clientY), (etat.tablette ? 34 : 22) / etat.vue.z);
        if (vers && vers.id !== geste.de) {
          const ng = { id: plId(), de: geste.de, vers: vers.id, pts: [] },
            dc = courbePar(dep, vers, milieuTrace(geste.trace || []), 8);
          if (dc) ng.dc = dc;
          ajouterGaine(ng);
          etat.gaine = suiteGaine(dep, vers);
          valider();
        } else dessiner();
      } else dessiner(); // (simple clic sur le départ : on attend le clic sur l'appareil)
    } else if (geste.genre === "liaison") {
      const ob = objetDe(geste.de),
        glisse = Math.hypot(e.clientX - geste.sx, e.clientY - geste.sy) > 14;
      etat.liaisonGlisse = null;
      if (glisse) {
        // glissé : jusqu'à l'appareil sous le doigt (la liaison suit le trait)
        const vers = symboleProche(versMonde(e.clientX, e.clientY));
        if (vers && vers.id !== ob.id) {
          lier(ob, vers);
          const li = d.liaisons.find(l => (l.de === ob.id && l.vers === vers.id) || (l.de === vers.id && l.vers === ob.id));
          if (li && geste.trace && geste.trace.length > 2) {
            const a = objetDe(li.de),
              b = objetDe(li.vers),
              dc = courbePar(a, b, milieuTrace(geste.trace), 8);
            li.dc = dc || { x: 0, y: 0 };
          }
          etat.liaison = vers.id;
          valider();
        } else {
          etat.apercu = {};
          dessiner();
        }
      } else {
        // simple appui : la chaîne continue depuis le dernier appareil
        if (etat.liaison && etat.liaison !== ob.id) {
          const avant = d.liaisons.length;
          lier(objetDe(etat.liaison), ob);
          etat.liaison = ob.id;
          if (d.liaisons.length > avant && pliageActif()) {
            const li = d.liaisons[d.liaisons.length - 1];
            li.dc = { x: 0, y: 0 };
            etat.pli = { genre: "liaison", id: li.id };
            etat.apercu = {};
            dessiner();
          } else valider();
        } else {
          etat.liaison = ob.id;
          dessiner();
        }
      }
    } else if (geste.genre === "main" && etat.modeMain === "notes") {
      const tr = etat.trace;
      etat.trace = null;
      if (tr && tr.length > 1) {
        (d.notes = d.notes || []).push({
          id: plId(),
          pts: tr.map(q => ({ x: Math.round(q.x * 10) / 10, y: Math.round(q.y * 10) / 10 })),
          coul: etat.couleurNote,
          ep: Math.max(3, Math.round(3 / etat.vue.z)),
        });
        valider();
      } else dessiner();
    } else if (geste.genre === "main") {
      const tr = etat.trace;
      etat.trace = null;
      if (tr && tr.length > 1) (etat.traits = etat.traits || []).push(tr);
      clearTimeout(etat.minuterieMain);
      etat.minuterieMain = setTimeout(
        analyserDessin,
        etat.modeMain === "symboles" ? Math.round((Number(optPlans().attente_symboles) || 1) * 1000) : 650
      ); // (un autre trait dans la foulée : même dessin ; symboles : le temps d'écrire plusieurs lettres)
      dessiner();
    } else if (geste.genre === "rect") {
      // glisser : le rectangle est fini au relâchement
      if (etat.rect && Math.hypot(e.clientX - geste.sx, e.clientY - geste.sy) > 12)
        creerRectangle(etat.rect, accrocherPoint(versMonde(e.clientX, e.clientY)));
    } else if (geste.genre === "fond") valider();
    else if (["courbe", "coude", "courbeGaine", "taille", "largeur"].includes(geste.genre)) {
      if (geste.bouge) valider();
      else dessiner();
    } else if (geste.genre === "deplacer" || geste.genre === "point") {
      etat.apercu = {};
      if (geste.genre === "point" || geste.bouge) valider();
      else dessiner();
    } else if (geste.genre === "vue" || geste.genre === "pince") enregistrer();
    if (pointeurs.size < 2) geste = null;
  };
  svg.addEventListener("pointerup", finGeste);
  svg.addEventListener("pointercancel", finGeste);
  svg.addEventListener("dblclick", e => {
    if (etat.outil === "mur") {
      etat.mur = null;
      etat.apercu = {};
      dessiner();
    } else if (etat.outil === "piece" && etat.piece) finirPiece();
  });
  /* -- aides à la pose dans une pièce -- */
  /** réglage des circuits spécialisés : type → calibre (0 : pas de circuit à la pose) */
  const reglageSpeciaux = () => {
    const o = optPlans().circuits_speciaux;
    return Object.fromEntries(
      Object.entries(SPECIAUX).map(([t, [, cal]]) => [t, o && t in o ? Number(o[t]) || 0 : SPECIAUX_AUTO.includes(t) ? cal : 0])
    );
  };
  /** circuit spécialisé pour cet appareil (nom de l'appareil, et de sa pièce s'il y en a) */
  function circuitSpecialise(ob, calibre) {
    const def = SPECIAUX[ob.type],
      lib = def ? def[0] : (SYMB[ob.type] || {}).libelle || "Circuit",
      pc = pieceEn(ob);
    const c = nouveauCircuit(lib + (pc && pc.nom ? " " + pc.nom.toLowerCase() : ""), calibre || (def ? def[1] : 20));
    c.specialise = true;
    ob.circuit = c.id;
    return c;
  }
  /** à la pose : circuit spécialisé d'office pour les appareils choisis dans les options */
  function circuitALaPose(ob) {
    if (ob.circuit || estDecor(ob)) return null;
    const cal = reglageSpeciaux()[ob.type];
    return cal ? circuitSpecialise(ob, cal) : null;
  }
  const nouveauCircuit = (nom, calibre) => {
    const c = { id: plId(), nom, calibre, couleur: COULEURS_CIRCUITS[d.circuits.length % COULEURS_CIRCUITS.length] };
    d.circuits.push(c);
    return c;
  };
  /** portes qui donnent dans la pièce (leur milieu est sur le contour de la pièce) */
  function portesDe(pc) {
    const P = pc.pts,
      out = [];
    const distSeg = (q, a, b) => {
      const L2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2 || 1,
        t = Math.max(0, Math.min(1, ((q.x - a.x) * (b.x - a.x) + (q.y - a.y) * (b.y - a.y)) / L2));
      return dist(q, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    };
    for (const o of d.ouvertures) {
      if (o.genre !== "porte" && o.genre !== "passage") continue;
      const g = geomOuverture(o);
      if (!g) continue;
      if (P.some((a, i) => distSeg(g.c, a, P[(i + 1) % P.length]) < g.ep / 2 + 6)) {
        const s = dansPolygone({ x: g.c.x + g.nx * (g.ep / 2 + 15), y: g.c.y + g.ny * (g.ep / 2 + 15) }, P) ? 1 : -1;
        out.push({ o, g, demi: o.largeur / 2, nx: g.nx * s, ny: g.ny * s });
      }
    }
    return out;
  }
  async function poserPrises(pc) {
    const n = parseInt(
      await demanderTexte(`Nombre de prises à répartir dans « ${pc.nom || "la pièce"} » (vous les ajusterez ensuite à la souris) :`, "4"),
      10
    );
    if (!(n > 0) || n > 60) return;
    const P = pc.pts,
      segs = P.map((a, i) => [a, P[(i + 1) % P.length]]),
      L = segs.map(([a, b]) => dist(a, b)),
      tot = L.reduce((x, y) => x + y, 0);
    const portes = portesDe(pc);
    const pointA = s0 => {
      let r = ((s0 % tot) + tot) % tot;
      for (let i = 0; i < segs.length; i++) {
        if (r <= L[i]) {
          const [a, b] = segs[i];
          return { x: a.x + ((b.x - a.x) * r) / L[i], y: a.y + ((b.y - a.y) * r) / L[i] };
        }
        r -= L[i];
      }
      return P[0];
    };
    const coin = q => P.some(v => dist(v, q) < 30);
    const libre = q =>
      !coin(q) &&
      !portes.some(pt => dist(q, pt.g.c) < pt.demi + 25) &&
      !d.objets.some(o => o.genre === "symbole" && dist(o, q) < TAILLE_SYMBOLE * 1.2);
    const nouveaux = [];
    for (let i = 0; i < n; i++) {
      let s0 = ((i + 0.5) * tot) / n,
        q = pointA(s0),
        essais = 0;
      while (!libre(q) && essais++ < 60) {
        s0 += 10;
        q = pointA(s0);
      }
      const sp = placerSymbole(q, "prise");
      const ob = { id: plId(), genre: "symbole", type: "prise", x: sp.x, y: sp.y, rot: sp.rot, circuit: null };
      d.objets.push(ob);
      nouveaux.push(ob.id);
    }
    etat.sel = new Set(nouveaux);
    choisirOutil("selection");
    valider();
    toast(n + " prise(s) posée(s), choisies : ajustez-les à la souris, puis « ← Affecter » sur un circuit.");
  }
  /* -- salle d'eau : volumes 1 et 2 autour de la douche et de la baignoire (NF C 15-100, vus de dessus) --
   * volume 1 : l'emprise du receveur ou de la baignoire ; volume 2 : 60 cm autour. Sans la hauteur (au-dessus de 2,25 m on
   * en sort) ni les parois fixes qui les limitent : une alerte à vérifier sur place. */
  const VOLUME2 = 60,
    VOLUME1_ITALIENNE = 120;
  /** douche sans receveur (à l'italienne) : le volume 1 est un rond de 1,20 m autour de l'arrivée d'eau (pomme fixe ou
   *  départ du flexible) ; o.robinet : "milieu" (du côté du mur), "coin1" ou "coin2" */
  const sansReceveur = o => o.type === "douche" && o.receveur === false;
  function robinetDe(o) {
    const a = ((o.rot || 0) * Math.PI) / 180,
      w = ((o.sx || 1) * TAILLE_SYMBOLE) / 2,
      hh = ((o.sy || 1) * TAILLE_SYMBOLE) / 2;
    const lx = o.robinet === "coin1" ? -w + 8 : o.robinet === "coin2" ? w - 8 : 0,
      ly = hh - 8; // (côté du mur : +y)
    return { x: o.x + lx * Math.cos(a) - ly * Math.sin(a), y: o.y + lx * Math.sin(a) + ly * Math.cos(a) };
  }
  const volumesSdb = () =>
    d.objets
      .filter(o => (o.type === "douche" || o.type === "baignoire") && symboleVu(o))
      .map(o => {
        const a = ((o.rot || 0) * Math.PI) / 180;
        return {
          o,
          w: ((o.sx || 1) * TAILLE_SYMBOLE) / 2,
          h: ((o.sy || 1) * TAILLE_SYMBOLE) / 2,
          ca: Math.cos(a),
          sa: Math.sin(a),
          rob: sansReceveur(o) ? robinetDe(o) : null,
        };
      });
  // (ce qui est interdit dans les volumes 1 et 2 : prises, commandes, boîtes, courant faible, appareils posés bas)
  const SOUMIS_VOLUMES = new Set([
    ...PRISES,
    "prise32",
    "sortie",
    "ligne_directe",
    "rj45",
    "tv",
    "boite",
    ...COMMANDES,
    "cmd_volet",
    "thermostat",
  ]);
  /** volume de salle d'eau où tombe un appareil : { v: 1 | 2, nom } ou null */
  /** appareil posé là où glisse une porte coulissante : dans la poche d'une porte à galandage (les deux faces de la
   *  cloison), ou derrière le vantail d'une porte en applique (sur sa face du mur) */
  function porteGenante(o) {
    if (!o || o.genre !== "symbole" || estDecor(o)) return null;
    for (const p of d.ouvertures) {
      if (p.genre !== "porte" || !p.coulissante) continue;
      const g = geomOuverture(p);
      if (!g) continue;
      const cote = p.charniere === "d" ? 1 : -1,
        du = ((o.x - g.c.x) * g.ux + (o.y - g.c.y) * g.uy) * cote,
        dn = (o.x - g.c.x) * g.nx + (o.y - g.c.y) * g.ny;
      if (du < p.largeur / 2 - 2 || du > p.largeur * 1.5 + 4 || Math.abs(dn) > g.ep / 2 + 30) continue;
      if (p.coulissante === "applique" && dn * (p.sens || 1) < 0) continue;
      return p;
    }
    return null;
  }
  function volumeDe(o) {
    if (!o || estDecor(o) || !SOUMIS_VOLUMES.has(o.type) || hauteurDe(o) >= 225) return null;
    let res = null;
    for (const z of volumesSdb()) {
      if (z.rob) {
        const dr = dist(o, z.rob) - VOLUME1_ITALIENNE,
          vr = dr <= 0 ? 1 : dr <= VOLUME2 ? 2 : 0;
        if (vr && (!res || vr < res.v)) res = { v: vr, nom: "de la douche" };
        continue;
      }
      const dx = o.x - z.o.x,
        dy = o.y - z.o.y,
        lx = dx * z.ca + dy * z.sa,
        ly = -dx * z.sa + dy * z.ca,
        ex = Math.max(Math.abs(lx) - z.w, 0),
        ey = Math.max(Math.abs(ly) - z.h, 0),
        dd = Math.hypot(ex, ey);
      const v = dd === 0 ? 1 : dd <= VOLUME2 ? 2 : 0;
      if (v && (!res || v < res.v)) res = { v, nom: z.o.type === "douche" ? "de la douche" : "de la baignoire" };
    }
    return res;
  }
  /** lits posés dans la pièce */
  const litsDe = pc => d.objets.filter(o => (o.type === "lit1" || o.type === "lit2") && dansPolygone(o, pc.pts));
  /** places des commandes en tête de lit (n = 1 : un côté, 2 : les deux) : contre le mur de la tête, à côté du lit ;
   *  un seul côté : celui qui a le plus de place (le plus loin d'un autre mur) */
  function positionsTeteDeLit(pc, n) {
    const out = [];
    if (!n) return out;
    const T = TAILLE_SYMBOLE;
    for (const o of litsDe(pc)) {
      const a = ((o.rot || 0) * Math.PI) / 180,
        ca = Math.cos(a),
        sa = Math.sin(a),
        w = ((o.sx || 1) * T) / 2,
        hh = ((o.sy || 1) * T) / 2;
      // (repère du lit : la tête contre le mur en +y ; à 20 cm du bord du lit, au ras du mur)
      const loc = (lx, ly) => ({ x: o.x + lx * ca - ly * sa, y: o.y + lx * sa + ly * ca });
      const mt = (murProche(loc(0, hh + 8), 60) || {}).m; // (mur de la tête de lit)
      const dSeg = (q, m) => {
        const L2 = (m.b.x - m.a.x) ** 2 + (m.b.y - m.a.y) ** 2 || 1,
          t = Math.max(0, Math.min(1, ((q.x - m.a.x) * (m.b.x - m.a.x) + (q.y - m.a.y) * (m.b.y - m.a.y)) / L2));
        return dist(q, { x: m.a.x + (m.b.x - m.a.x) * t, y: m.a.y + (m.b.y - m.a.y) * t });
      };
      const cotes = [1, -1]
        .map(k => loc(k * (w + 20), hh - 4))
        .filter(q => dansPolygone(q, pc.pts))
        .map(q => ({ q, place: Math.min(400, ...d.murs.filter(m => m !== mt).map(m => dSeg(q, m))) }));
      cotes.sort((u, v) => v.place - u.place);
      out.push(...cotes.slice(0, n).map(c => c.q));
    }
    return out;
  }
  /** fenêtre des options d'éclairage : luminaire, lignes, points par ligne, sens, distance aux murs, commandes (aperçu) */
  function optionsEclairage(pc, portes) {
    const P = pc.pts,
      xs = P.map(q => q.x),
      ys = P.map(q => q.y),
      x0 = Math.min(...xs),
      x1 = Math.max(...xs),
      y0 = Math.min(...ys),
      y1 = Math.max(...ys);
    const w = x1 - x0,
      ht = y1 - y0;
    const memo = etat.optEclairage || {};
    const type = h(
      "select",
      {},
      ["dcl", "point", "spot", "reglette"].filter(t => SYMB[t]).map(t => h("option", { value: t }, SYMB[t].libelle))
    );
    type.value = memo.type || "dcl";
    const lignes = h("input", { type: "number", min: 1, max: 8, step: 1, value: memo.lignes || 1, style: "width:70px" });
    const parLigne = h("input", { type: "number", min: 1, max: 20, step: 1, value: memo.parLigne || 1, style: "width:70px" });
    const sens = h(
      "select",
      {},
      h("option", { value: "long" }, "dans la longueur de la pièce"),
      h("option", { value: "large" }, "dans la largeur de la pièce")
    );
    sens.value = memo.sens || "long";
    const marge = h("input", { type: "number", min: 0, step: 5, value: memo.marge ?? "", placeholder: "auto", style: "width:80px" });
    // (lit dans la pièce : la 2e commande va en tête de lit, la 3e de l'autre côté du lit)
    const lits = litsDe(pc);
    const nc = h("input", {
      type: "number",
      min: 1,
      max: 12,
      step: 1,
      value: lits.length || portes.length > 1 ? 2 : 1,
      style: "width:70px",
    });
    const apercu = svgEl("svg", {
      viewBox: `${x0 - 30} ${y0 - 30} ${w + 60} ${ht + 60}`,
      style: "width:100%;height:220px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:6px",
    });
    const info = h("p", { class: "sous", style: "margin:0" });
    // départ du tableau : un départ éclairage existant (plusieurs circuits lumière sur un même disjoncteur), ou un nouveau
    const depart = h(
      "select",
      {},
      h("option", { value: "" }, "Nouveau départ « Éclairage »"),
      d.circuits.map((c, i) => h("option", { value: c.id }, repDe(c) + " · " + (c.nom || "Circuit") + " (" + (c.calibre || 16) + " A)"))
    );
    const dejaEcl = d.circuits.find(c => c.id === etat.circuitVu) || d.circuits.find(c => /clairage|lumi/i.test(c.nom || ""));
    depart.value = dejaEcl ? dejaEcl.id : "";
    const lire = () => ({
      type: type.value,
      lignes: Math.max(1, Math.min(8, parseInt(lignes.value, 10) || 1)),
      parLigne: Math.max(1, Math.min(20, parseInt(parLigne.value, 10) || 1)),
      sens: sens.value,
      marge: marge.value === "" ? null : Math.max(0, nombre(marge.value)),
      nc: Math.max(1, Math.min(12, parseInt(nc.value, 10) || 1)),
      depart: depart.value,
    });
    // positions : lignes parallèles au côté choisi ; écart aux murs « auto » = moitié de l'entraxe (répartition égale)
    const calculer = o => {
      const long = w >= ht,
        leLong = (o.sens === "long") === long; // vrai : lignes horizontales (le long de x)
      const A = leLong ? w : ht,
        B = leLong ? ht : w; // A : le long des lignes, B : à travers
      const pos = (n, L) => {
        if (o.marge === null) return Array.from({ length: n }, (_, i) => ((i + 0.5) * L) / n);
        const m = Math.min(o.marge, L / 2);
        return n === 1 ? [L / 2] : Array.from({ length: n }, (_, i) => m + (i * (L - 2 * m)) / (n - 1));
      };
      // chaque ligne est répartie sur la longueur réelle de la pièce à cet endroit (pièce en L, renfoncement, mur en biais…),
      // et non sur le rectangle qui l'entoure ; un petit renfoncement (niche, placard) est ignoré : on prend la valeur
      // valeur courante de plusieurs mesures, sinon une ligne peut tomber contre un mur
      const corde = (b, lelong) => {
        // morceau le plus long, dans la pièce, de la droite à la distance b (le long de x si lelong)
        const cut = [];
        P.forEach((q, i) => {
          const r = P[(i + 1) % P.length],
            qa = lelong ? q.y - y0 : q.x - x0,
            ra = lelong ? r.y - y0 : r.x - x0;
          if (qa > b !== ra > b) {
            const t = (b - qa) / (ra - qa);
            cut.push(lelong ? q.x + t * (r.x - q.x) - x0 : q.y + t * (r.y - q.y) - y0);
          }
        });
        cut.sort((u, v) => u - v);
        let best = null;
        for (let i = 0; i + 1 < cut.length; i += 2) if (!best || cut[i + 1] - cut[i] > best[1] - best[0]) best = [cut[i], cut[i + 1]];
        return best;
      };
      // (début et fin retenus sans le quart des mesures qui dépassent le plus : la niche est ignorée, une aile de pièce en L non)
      const cordeMediane = (deb, fin, lelong) => {
        const c = [];
        for (let k = 0; k < 9; k++) {
          const v = corde(deb + ((fin - deb) * (k + 0.5)) / 9, lelong);
          if (v) c.push(v);
        }
        if (!c.length) return null;
        const d0 = c.map(v => v[0]).sort((u, v) => u - v),
          d1 = c.map(v => v[1]).sort((u, v) => u - v);
        return [d0[Math.floor(c.length * 0.25)], d1[Math.ceil(c.length * 0.75) - 1]];
      };
      const cb = cordeMediane(0, A, !leLong) || [0, B]; // largeur « principale » de la pièce, à travers les lignes
      const pb = pos(o.lignes, cb[1] - cb[0]).map(b => b + cb[0]),
        pts = [],
        bande = (cb[1] - cb[0]) / o.lignes / 2;
      let pa = pos(o.parLigne, A),
        margeA = null;
      pb.forEach((b, r) => {
        const c = cordeMediane(b - bande * 0.8, b + bande * 0.8, leLong);
        if (!c) return;
        const pl = pos(o.parLigne, c[1] - c[0]).map(a => a + c[0]);
        if (r === 0) {
          pa = pl;
          margeA = pl[0] - c[0];
        }
        const ligne = pl.map(a => (leLong ? { x: x0 + a, y: y0 + b } : { x: x0 + b, y: y0 + a }));
        pts.push(...(r % 2 ? ligne.reverse() : ligne)); // (en serpentin, pour les liaisons)
      });
      const dedans = pts.filter(q => dansPolygone(q, P));
      return {
        pts: dedans,
        horsPiece: o.lignes * o.parLigne - dedans.length,
        entraxeA: pa.length > 1 ? pa[1] - pa[0] : null,
        entraxeB: pb.length > 1 ? pb[1] - pb[0] : null,
        margeA: margeA ?? pa[0],
        margeB: pb[0] - cb[0],
      };
    };
    const dessinerApercu = () => {
      const o = lire(),
        r = calculer(o);
      apercu.replaceChildren(
        svgEl("polygon", {
          points: P.map(q => q.x + "," + q.y).join(" "),
          fill: "#fff",
          stroke: "#374151",
          "stroke-width": Math.max(w, ht) / 150,
        }),
        ...r.pts.map(q =>
          svgEl("circle", {
            cx: q.x,
            cy: q.y,
            r: Math.max(w, ht) / 45,
            fill: "#f59e0b",
            stroke: "#92400e",
            "stroke-width": Math.max(w, ht) / 300,
          })
        )
      );
      info.textContent =
        r.pts.length +
        " point(s) lumineux" +
        (r.entraxeA ? " · entraxe " + plMetres(r.entraxeA) : "") +
        (r.entraxeB ? " × " + plMetres(r.entraxeB) : "") +
        " · à " +
        plMetres(r.margeA) +
        (o.lignes > 1 || r.margeB !== r.margeA ? " / " + plMetres(r.margeB) : "") +
        " des murs" +
        (r.horsPiece ? " · " + r.horsPiece + " hors de la pièce, non posé(s)" : "");
    };
    [type, lignes, parLigne, sens, marge].forEach(el => el.addEventListener("input", dessinerApercu));
    dessinerApercu();
    const champ = (lib, el, aide) =>
      h("label", { class: "champ" }, h("span", {}, lib), el, aide ? h("span", { class: "sous" }, aide) : null);
    return new Promise(ok => {
      let fini = false;
      const fin = v => {
        if (!fini) {
          fini = true;
          ok(v);
        }
      };
      const corps = h(
        "div",
        { class: "pile" },
        h(
          "div",
          { style: "display:grid;grid-template-columns:1fr 1fr;gap:8px 14px" },
          champ("Luminaire", type),
          champ("Sens des lignes", sens),
          champ("Nombre de lignes", avecFleches(lignes)),
          champ("Points par ligne", avecFleches(parLigne)),
          champ("Distance aux murs (cm)", marge, "vide : répartition égale (moitié de l'entraxe)"),
          champ(
            "Commandes",
            avecFleches(nc),
            (lits.length
              ? "1 à la porte, la 2e en tête de lit, la 3e de l'autre côté du lit, les suivantes aux autres portes"
              : "1 à la porte, les suivantes aux autres portes") + " · 1 simple, 2 va-et-vient, 3 ou plus : poussoirs"
          ),
          champ("Départ du tableau (disjoncteur)", depart, "Plusieurs circuits lumière peuvent partager un départ")
        ),
        apercu,
        info
      );
      ouvrirModale(
        "Éclairage de « " + (pc.nom || "la pièce") + " »",
        corps,
        [
          h(
            "button",
            {
              class: "btn",
              onclick: () => {
                fin(null);
                fermerModale();
              },
            },
            "Annuler"
          ),
          h(
            "button",
            {
              class: "btn principal",
              onclick: () => {
                const o = lire();
                etat.optEclairage = { type: o.type, lignes: o.lignes, parLigne: o.parLigne, sens: o.sens, marge: o.marge ?? "" };
                fin({ ...o, pts: calculer(o).pts });
                fermerModale();
              },
            },
            "Poser"
          ),
        ],
        { largeur: "min(560px, 96vw)" }
      );
      const obs = new MutationObserver(() => {
        if (!corps.isConnected)
          setTimeout(() => {
            if (!corps.isConnected) {
              obs.disconnect();
              fin(null);
            }
          }, 0);
      });
      obs.observe($("#modale-boite"), { childList: true });
    });
  }
  async function poserEclairage(pc) {
    const portes = portesDe(pc);
    const o = await optionsEclairage(pc, portes);
    if (!o || !o.pts.length) {
      if (o) toast("Aucun point dans la pièce avec ces réglages.", true);
      return;
    }
    const nl = o.pts.length,
      P = pc.pts,
      // (toujours une commande à la porte ; avec un lit, les deux suivantes en tête de lit)
      tetes = positionsTeteDeLit(pc, Math.min(2, o.nc - 1)).slice(0, Math.min(2, o.nc - 1)),
      nc = o.nc,
      nPortes = nc - tetes.length; // (commandes près des portes)
    const circuit = (o.depart && circuitDe(o.depart)) || nouveauCircuit("Éclairage", 16),
      lum = [];
    for (const q of o.pts) {
      const ob = { id: plId(), genre: "symbole", type: o.type, x: Math.round(q.x), y: Math.round(q.y), rot: 0, circuit: circuit.id };
      d.objets.push(ob);
      lum.push(ob);
    }
    // commandes : près des portes, côté poignée, dans la pièce
    const type = nc === 1 ? "inter" : nc === 2 ? "inter_va" : "poussoir",
      cmd = [];
    for (let j = 0; j < nPortes; j++) {
      let q,
        sp = null;
      if (portes.length && portes.length < nPortes && j >= portes.length && j - portes.length < 2) {
        // (plus de commandes que de portes : la commande en plus va à l'opposé, au milieu du mur le plus loin des portes)
        const cx = P.reduce((t, p) => t + p.x, 0) / P.length,
          cy = P.reduce((t, p) => t + p.y, 0) / P.length;
        const mils = P.map((a, i) => {
          const b = P[(i + 1) % P.length],
            m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
            L = Math.hypot(cx - m.x, cy - m.y) || 1;
          return { x: m.x + ((cx - m.x) / L) * 15, y: m.y + ((cy - m.y) / L) * 15, loin: Math.min(...portes.map(pt => dist(pt.g.c, m))) };
        })
          .filter(m => dansPolygone(m, P))
          .sort((a, b) => b.loin - a.loin);
        if (mils[j - portes.length]) q = mils[j - portes.length];
      }
      if (!q && portes.length) {
        const pt = portes[j % portes.length],
          tour = Math.floor(j / portes.length),
          g = pt.g;
        const cote0 = (pt.o.charniere === "d" ? -1 : 1) * (tour % 2 ? -1 : 1),
          ecart0 = pt.demi + 20 + 25 * Math.floor(tour / 2);
        // (côté poignée d'abord ; si ça tombe hors de la pièce, dans un autre mur ou de l'autre côté d'un mur : l'autre côté de la porte, plus près)
        for (const [cote, ecart] of [
          [cote0, ecart0],
          [-cote0, ecart0],
          [cote0, pt.demi + 12],
          [-cote0, pt.demi + 12],
        ]) {
          const q1 = { x: g.c.x + g.ux * cote * ecart + pt.nx * (g.ep / 2 + 8), y: g.c.y + g.uy * cote * ecart + pt.ny * (g.ep / 2 + 8) };
          if (!dansPolygone(q1, P)) continue;
          const s1 = placerSymbole(q1, type);
          if (dist(s1, q1) < 20) {
            q = q1;
            sp = s1;
            break;
          } // (collé à la face du mur, côté pièce)
          if (!q) q = q1;
        }
        if (!q) q = { x: g.c.x + pt.nx * (g.ep / 2 + 25), y: g.c.y + pt.ny * (g.ep / 2 + 25) };
      } else {
        const a = P[0],
          b = P[1 % P.length];
        q = { x: (a.x + b.x) / 2 + 30 * j, y: (a.y + b.y) / 2 };
      }
      if (!sp) {
        sp = placerSymbole(q, type);
        if (dist(sp, q) >= 20) sp = { x: q.x, y: q.y, rot: sp.rot };
      } // (jamais dehors ni dans la pièce voisine)
      for (let k = 0; k < 6 && cmd.some(c => dist(c, sp) < 25); k++)
        sp = { ...sp, x: sp.x + 30 * Math.cos((sp.rot * Math.PI) / 180 || 0), y: sp.y + 30 * Math.sin((sp.rot * Math.PI) / 180 || 0) }; // (jamais l'une sur l'autre)
      const ob = { id: plId(), genre: "symbole", type, x: sp.x, y: sp.y, rot: sp.rot, circuit: circuit.id };
      d.objets.push(ob);
      cmd.push(ob);
    }
    // tête de lit : contre le mur du lit, juste à côté
    for (const q of tetes) {
      let sp = placerSymbole(q, type);
      if (dist(sp, q) >= 30) sp = { x: q.x, y: q.y, rot: sp.rot };
      const ob = { id: plId(), genre: "symbole", type, x: sp.x, y: sp.y, rot: sp.rot, circuit: circuit.id };
      d.objets.push(ob);
      cmd.push(ob);
    }
    // liaisons : chaque commande vers le 1er point lumineux, puis les points lumineux entre eux
    cmd.forEach(c => d.liaisons.push({ id: plId(), de: c.id, vers: lum[0].id }));
    for (let i = 1; i < lum.length; i++) d.liaisons.push({ id: plId(), de: lum[i - 1].id, vers: lum[i].id });
    etat.sel = new Set([...lum, ...cmd].map(o => o.id));
    choisirOutil("selection");
    valider();
    toast(
      nl +
        " point(s) lumineux, " +
        nc +
        " commande(s)" +
        (nc >= 3 ? " (poussoirs : prévoir un télérupteur)" : nc === 2 ? " (va-et-vient)" : "") +
        " : ajustez-les à la souris."
    );
  }
  /** coin opposé d'après les dimensions tapées (« 4,5x3 »), du côté où est la souris */
  function rectTape(souris) {
    const m = /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/.exec(etat.tape || "");
    if (!m || !etat.rect) return null;
    const sx = souris && souris.x < etat.rect.x ? -1 : 1,
      sy = souris && souris.y < etat.rect.y ? -1 : 1;
    return { x: etat.rect.x + sx * parseFloat(m[1]) * 100, y: etat.rect.y + sy * parseFloat(m[2]) * 100 };
  }
  /** quatre murs (sans doubler ceux qui sont déjà là), puis la pièce */
  function creerRectangle(a, b) {
    const x0 = Math.min(a.x, b.x),
      x1 = Math.max(a.x, b.x),
      y0 = Math.min(a.y, b.y),
      y1 = Math.max(a.y, b.y);
    etat.rect = null;
    etat.tape = "";
    if (x1 - x0 < 20 || y1 - y0 < 20) {
      toast("Rectangle trop petit.", true);
      dessiner();
      return;
    }
    creerContour(
      [
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: y1 },
        { x: x0, y: y1 },
      ],
      true
    );
  }
  /** murs le long d'un contour (fermé : puis la pièce, si on lui donne un nom) */
  function creerContour(coins, ferme, sansValider) {
    const nb = ferme ? coins.length : coins.length - 1;
    for (let i = 0; i < nb; i++) {
      const p1 = coins[i],
        p2 = coins[(i + 1) % coins.length],
        L = dist(p1, p2),
        ux = (p2.x - p1.x) / L,
        uy = (p2.y - p1.y) / L;
      if (!(L > 2)) continue;
      // parties du côté déjà couvertes par un mur existant dans le même alignement
      const couverts = [];
      for (const m of d.murs) {
        const da = Math.abs((m.a.x - p1.x) * uy - (m.a.y - p1.y) * ux),
          db = Math.abs((m.b.x - p1.x) * uy - (m.b.y - p1.y) * ux);
        if (da > 1 || db > 1) continue;
        const ta = (m.a.x - p1.x) * ux + (m.a.y - p1.y) * uy,
          tb = (m.b.x - p1.x) * ux + (m.b.y - p1.y) * uy;
        const lo = Math.max(0, Math.min(ta, tb)),
          hi = Math.min(L, Math.max(ta, tb));
        if (hi - lo > 1) couverts.push([lo, hi]);
      }
      couverts.sort((u, v) => u[0] - v[0]);
      let t = 0;
      const ajouter = (t1, t2) => {
        if (t2 - t1 > 2)
          d.murs.push({ id: plId(), a: { x: p1.x + ux * t1, y: p1.y + uy * t1 }, b: { x: p1.x + ux * t2, y: p1.y + uy * t2 } });
      };
      for (const [lo, hi] of couverts) {
        if (lo > t) ajouter(t, lo);
        t = Math.max(t, hi);
      }
      if (t < L) ajouter(t, L);
    }
    if (!ferme) {
      if (!sansValider) valider();
      return;
    }
    const centre = pointInterieur(coins),
      contour = centre && contourPiece(centre);
    if (!contour) {
      if (!sansValider) valider();
      return;
    }
    if (!sansValider) valider();
    demanderTexte("Nom de la pièce (vide : pas de pièce, seulement les murs) :", "").then(nomP => {
      if (nomP && nomP.trim()) {
        const pc = { id: plId(), nom: nomP.trim(), auto: true, germe: centre, pts: contour };
        d.pieces.push(pc);
        etat.sel = new Set([pc.id]);
        valider();
      }
    });
  }
  const dansPoly = (q, pts) => {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i],
        b = pts[j];
      if (a.y > q.y !== b.y > q.y && q.x < ((b.x - a.x) * (q.y - a.y)) / (b.y - a.y) + a.x) c = !c;
    }
    return c;
  };
  /** un point bien à l'intérieur d'un contour (le centre, sauf pour une pièce en L…) */
  function pointInterieur(pts) {
    const c = { x: pts.reduce((s, q) => s + q.x, 0) / pts.length, y: pts.reduce((s, q) => s + q.y, 0) / pts.length };
    if (dansPoly(c, pts)) return c;
    const e = (d.epaisseur || 20) * 2;
    for (const q of pts)
      for (const [sx, sy] of [
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
      ]) {
        const r = { x: q.x + sx * e, y: q.y + sy * e };
        if (dansPoly(r, pts)) return r;
      }
    return null;
  }
  /** fin d'un dessin à main levée : grand → murs ; petit → symbole électrique ou porte */
  function analyserDessin() {
    const traits = etat.traits || [];
    etat.traits = null;
    if (!traits.length || etat.outil !== "main") {
      dessiner();
      return;
    }
    const tous = traits.flat(),
      xs = tous.map(q => q.x),
      ys = tous.map(q => q.y);
    const diag = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    if (diag * etat.vue.z < 8) {
      dessiner();
      return;
    } // (simple touche)
    if (etat.modeMain === "gaines") {
      // chaque trait d'un objet à un autre : une gaine qui suit le trait
      let n = 0;
      for (const tr of traits) {
        const tol = (etat.tablette ? 34 : 22) / etat.vue.z,
          de = symboleProche(tr[0], tol),
          vers = symboleProche(tr[tr.length - 1], tol);
        if (!de || !vers || de.id === vers.id) continue;
        const [a, b] = estNoeud(vers) && !estNoeud(de) ? [vers, de] : [de, vers]; // (de la boîte vers l'appareil)
        if (d.gaines.some(g => (g.de === a.id && g.vers === b.id) || (g.de === b.id && g.vers === a.id))) continue;
        const ng = { id: plId(), de: a.id, vers: b.id, pts: [] },
          dc = courbePar(a, b, milieuTrace(tr), 8);
        if (dc) ng.dc = dc;
        ajouterGaine(ng);
        n++;
      }
      if (n) valider();
      else {
        dessiner();
        toast("Tracez de la boîte (ou du tableau) jusqu'à l'appareil : le trait doit partir et arriver sur eux.", true);
      }
      return;
    }
    if (etat.modeMain !== "symboles") {
      // mode murs : un petit dessin contre un mur (quart de cercle, avec ou sans battant) = une porte ; le reste = des murs
      const xs0 = traits.flat().map(q => q.x),
        ys0 = traits.flat().map(q => q.y),
        dg = Math.hypot(Math.max(...xs0) - Math.min(...xs0), Math.max(...ys0) - Math.min(...ys0));
      const c0 = { x: (Math.min(...xs0) + Math.max(...xs0)) / 2, y: (Math.min(...ys0) + Math.max(...ys0)) / 2 };
      // (petit dessin : petit sur le plan, ou petit à l'écran — sans zoomer, un quart de cercle au doigt fait vite 2 m)
      const petit = dg < 170 || dg * etat.vue.z < 160,
        tolMur = Math.max(50, Math.min(dg * 0.6, 150), 30 / etat.vue.z);
      // un rectangle étroit tracé sur un mur : une fenêtre de cette largeur
      if (traits.length === 1 && poserFenetreDessinee(traits[0])) return;
      const mp0 = petit ? murProche(c0, tolMur) : null;
      if (mp0) {
        const r0 = reconnaitre(traits, t => t === "@porte" || t === "dcl" || t === "prise" || t === "inter")[0];
        if (r0 && r0.type === "@porte") {
          poserPorteDessinee(c0, tolMur);
          return;
        }
      }
      traits.forEach(tr => murDessine(tr, true));
      valider();
      return;
    }
    // un tracé fermé autour de plusieurs appareillages (le rectangle du symbole de bloc) : ils deviennent un bloc
    if (
      traits.length === 1 &&
      traits[0].length > 8 &&
      dist(traits[0][0], traits[0][traits[0].length - 1]) < Math.max(25 / etat.vue.z, diag * 0.3)
    ) {
      const dedans = d.objets.filter(o => o.genre === "symbole" && !estNoeud(o) && !estDecor(o) && dansPolygone(o, traits[0]));
      if (dedans.length >= 2) {
        const ids = dedans.map(o => o.id);
        d.blocs = (d.blocs || []).map(b => ({ ...b, membres: b.membres.filter(x => !ids.includes(x)) }));
        d.blocs.push({ id: plId(), membres: ids });
        valider();
        toast("Bloc de " + ids.length + " appareillages (même boîtier, même plaque).");
        return;
      }
    }
    if (traits.length === 1) {
      const tr = traits[0],
        de = symboleProche(tr[0]),
        vers = symboleProche(tr[tr.length - 1]);
      if (de && vers && de.id !== vers.id) {
        lier(de, vers);
        valider();
        toast("Liaison ajoutée.");
        return;
      }
    }
    const centre = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
    const masques = new Set(optPlans().symboles_masques || []);
    const choix = reconnaitre(traits, t => t !== "@porte" && !masques.has(t)).slice(0, 6);
    if (!choix.length) {
      dessiner();
      return;
    }
    let cree = null,
      circuitCree = null;
    const oterCircuit = () => {
      if (circuitCree) {
        d.circuits = d.circuits.filter(c => c !== circuitCree);
        circuitCree = null;
      }
    };
    const poser = type => {
      if (cree) {
        d.objets = d.objets.filter(o => o.id !== cree);
        d.ouvertures = d.ouvertures.filter(o => o.id !== cree);
        oterCircuit();
      }
      if (type === "@porte") {
        const mp = murProche(centre, Math.max(50, diag * 0.6));
        const ouv = { id: plId(), genre: "porte", mur: mp.m.id, t: mp.t, largeur: optPlans().largeur_porte, sens: 1, charniere: "g" };
        d.ouvertures.push(ouv);
        cree = ouv.id;
      } else {
        const [ty, texte] = type.split("|"); // (rep_libre|CONG : cercle avec « CONG » écrit dedans)
        const sy = placerSymbole(centre, ty);
        const ob = { id: plId(), genre: "symbole", type: ty, x: sy.x, y: sy.y, rot: sy.rot, circuit: etat.circuitVu || null };
        if (texte) ob.texte = texte;
        d.objets.push(ob);
        cree = ob.id;
        circuitCree = circuitALaPose(ob);
        marquerRecent("objet", ob.id);
      }
      etat.sel = new Set([cree]);
      valider();
      montrerReco(choix, type, poser, () => {
        d.objets = d.objets.filter(o => o.id !== cree);
        d.ouvertures = d.ouvertures.filter(o => o.id !== cree);
        cree = null;
        oterCircuit();
        etat.sel.clear();
        valider();
        fermerReco();
      });
    };
    poser(choix[0].type);
  }
  let minuterieReco = null;
  const libReco = t =>
    t === "@porte" ? "Porte" : t.startsWith("rep_libre|") ? "Cercle « " + t.slice(10) + " »" : (SYMB[t] || {}).libelle || t;
  function montrerReco(choix, actuel, poser, effacer) {
    clearTimeout(minuterieReco);
    barreReco.replaceChildren(
      h("span", {}, "Reconnu : ", h("b", {}, libReco(actuel)), " · sinon :"),
      ...choix
        .filter(c => c.type !== actuel)
        .slice(0, 4)
        .map(c =>
          h(
            "button",
            {
              class: "btn petit",
              type: "button",
              onclick: e => {
                e.stopPropagation();
                poser(c.type);
              },
            },
            libReco(c.type)
          )
        ),
      h(
        "button",
        {
          class: "btn petit danger",
          type: "button",
          title: "Effacer ce dessin",
          onclick: e => {
            e.stopPropagation();
            effacer();
          },
        },
        "✕"
      )
    );
    barreReco.style.display = "";
    minuterieReco = setTimeout(fermerReco, 10000);
  }
  // (pendant la vérification des murs reconnus sur une photo, sa barre Valider / Annuler reste affichée)
  function fermerReco() {
    clearTimeout(minuterieReco);
    if (etat.detect) {
      majBarreDetect();
      return;
    }
    barreReco.style.display = "none";
  }
  /** dessin à main levée → murs droits (horizontaux et verticaux), aimantés à la grille et aux murs voisins ;
      un tracé fermé donne une pièce (carré, rectangle, pièce en L…), un tracé ouvert un ou plusieurs murs */
  function murDessine(trace, sansValider) {
    const xs = trace.map(q => q.x),
      ys = trace.map(q => q.y);
    const bx0 = Math.min(...xs),
      bx1 = Math.max(...xs),
      by0 = Math.min(...ys),
      by1 = Math.max(...ys),
      diag = Math.hypot(bx1 - bx0, by1 - by0);
    if (trace.length < 3 || diag < 30) {
      dessiner();
      return;
    }
    const ferme = dist(trace[0], trace[trace.length - 1]) < Math.max(40, diag * 0.25);
    // 1. simplifier le trait (Douglas-Peucker)
    const eps = Math.max(12, diag * 0.07);
    const simplifier = pts => {
      if (pts.length < 3) return pts;
      const a = pts[0],
        b = pts[pts.length - 1],
        L = dist(a, b) || 1;
      let im = 0,
        dm = 0;
      for (let i = 1; i < pts.length - 1; i++) {
        const q = pts[i],
          dd = L > 1 ? Math.abs((b.x - a.x) * (a.y - q.y) - (a.x - q.x) * (b.y - a.y)) / L : dist(a, q);
        if (dd > dm) {
          dm = dd;
          im = i;
        }
      }
      return dm > eps ? [...simplifier(pts.slice(0, im + 1)).slice(0, -1), ...simplifier(pts.slice(im))] : [a, b];
    };
    let pts = simplifier(trace);
    if (ferme) {
      pts = pts.slice(0, -1);
      pts.push(pts[0]);
    }
    // 2. chaque segment devient horizontal ou vertical ; les segments voisins de même sens se regroupent
    let runs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i],
        b = pts[i + 1],
        L = dist(a, b);
      if (L < 1) continue;
      const hz = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y),
        der = runs[runs.length - 1];
      if (der && der.hz === hz) {
        der.L += L;
        der.v += (hz ? (a.y + b.y) / 2 : (a.x + b.x) / 2) * L;
        der.fin = b;
      } else runs.push({ hz, L, v: (hz ? (a.y + b.y) / 2 : (a.x + b.x) / 2) * L, deb: a, fin: b });
    }
    if (ferme && runs.length > 1 && runs[0].hz === runs[runs.length - 1].hz) {
      const r = runs.pop();
      runs[0].L += r.L;
      runs[0].v += r.v;
      runs[0].deb = r.deb;
    }
    runs = runs.filter(r => r.L > eps * 0.6 || runs.length <= 2);
    // (après le tri, deux segments voisins peuvent être de même sens : on les refond)
    const fondus = [];
    for (const r of runs) {
      const der = fondus[fondus.length - 1];
      if (der && der.hz === r.hz) {
        der.L += r.L;
        der.v += r.v;
        der.fin = r.fin;
      } else fondus.push(r);
    }
    if (ferme && fondus.length > 1 && fondus[0].hz === fondus[fondus.length - 1].hz) {
      const r = fondus.pop();
      fondus[0].L += r.L;
      fondus[0].v += r.v;
    }
    runs = fondus;
    // 3. position de chaque mur : moyenne du trait, aimantée aux murs existants (30 cm) puis à la grille
    const axes = { x: [], y: [] };
    d.murs.forEach(m => {
      axes.x.push(m.a.x, m.b.x);
      axes.y.push(m.a.y, m.b.y);
    });
    const caler = (v, liste) => {
      let best = null;
      for (const w of liste) if (Math.abs(w - v) < 30 && (best === null || Math.abs(w - v) < Math.abs(best - v))) best = w;
      return best !== null ? best : grille(v);
    };
    runs.forEach(r => {
      r.c = caler(r.v / r.L, r.hz ? axes.y : axes.x);
    });
    let coins;
    if (ferme) {
      if (runs.length < 4 || runs.length % 2) {
        const x0 = caler(bx0, axes.x),
          x1 = caler(bx1, axes.x),
          y0 = caler(by0, axes.y),
          y1 = caler(by1, axes.y);
        coins = [
          { x: x0, y: y0 },
          { x: x1, y: y0 },
          { x: x1, y: y1 },
          { x: x0, y: y1 },
        ];
      } else
        coins = runs.map((r, i) => {
          const s = runs[(i + 1) % runs.length];
          return r.hz ? { x: s.c, y: r.c } : { x: r.c, y: s.c };
        });
    } else {
      const bout = (r, q) => (r.hz ? { x: caler(q.x, axes.x), y: r.c } : { x: r.c, y: caler(q.y, axes.y) });
      coins = [bout(runs[0], runs[0].deb)];
      for (let i = 0; i < runs.length - 1; i++) {
        const r = runs[i],
          s = runs[i + 1];
        coins.push(r.hz ? { x: s.c, y: r.c } : { x: r.c, y: s.c });
      }
      coins.push(bout(runs[runs.length - 1], runs[runs.length - 1].fin));
    }
    // 4. sans coins en double ni points alignés
    coins = coins.filter((q, i) => {
      const r = coins[(i + 1) % coins.length];
      return (!ferme && i === coins.length - 1) || dist(q, r) > 2;
    });
    if (ferme)
      coins = coins.filter((q, i) => {
        const a = coins[(i + coins.length - 1) % coins.length],
          b = coins[(i + 1) % coins.length];
        return Math.abs((q.x - a.x) * (b.y - a.y) - (q.y - a.y) * (b.x - a.x)) > 1;
      });
    if (ferme ? coins.length < 4 : coins.length < 2) {
      toast("Dessin non reconnu : tracez le tour de la pièce d'un seul trait.", true);
      dessiner();
      return;
    }
    creerContour(coins, ferme, sansValider);
  }
  /** bornes du morceau gommé (fractions du mur) : longueurs calées sur la grille, collées au bout si on en est tout près */
  /** note à main levée sous le point (à la distance d'un doigt) */
  function noteSous(pt) {
    const r = 12 / etat.vue.z;
    const dS = (q, a, b) => {
      const L2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2 || 1e-9,
        t = Math.max(0, Math.min(1, ((q.x - a.x) * (b.x - a.x) + (q.y - a.y) * (b.y - a.y)) / L2));
      return Math.hypot(q.x - a.x - t * (b.x - a.x), q.y - a.y - t * (b.y - a.y));
    };
    return (d.notes || []).filter(n => (n.pts || []).some((q, i, a) => i && dS(pt, a[i - 1], q) < r + (n.ep || 4) / 2));
  }
  /** gomme : efface les notes à main levée touchées ; renvoie leur nombre */
  function gommerNotes(pt) {
    const t = new Set(noteSous(pt).map(n => n.id));
    if (!t.size) return 0;
    d.notes = d.notes.filter(n => !t.has(n.id));
    t.forEach(id => etat.sel.delete(id));
    return t.size;
  }
  function bornesGomme(m, t0, t1) {
    const L = dist(m.a, m.b) || 1;
    let s0 = grille(t0 * L),
      s1 = grille(t1 * L);
    if (s0 < 10) s0 = 0;
    if (L - s1 < 10) s1 = L;
    return [Math.max(0, s0 / L), Math.min(1, s1 / L)];
  }
  /** gomme : le morceau [t0, t1] du mur est enlevé ; les portes et fenêtres hors du morceau restent à leur place */
  function couperMur(m, t0, t1, vraiment) {
    const [u0, u1] = bornesGomme(m, t0, t1),
      L = dist(m.a, m.b);
    if ((u1 - u0) * L < 5) {
      toast("Glissez le long du mur pour effacer un morceau.", true);
      dessiner();
      return;
    }
    if (!vraiment && u0 > 0 && u1 < 1) {
      // au milieu : un passage, le mur reste entier pour délimiter les pièces
      const ouv = {
        id: plId(),
        genre: "passage",
        mur: m.id,
        t: (u0 + u1) / 2,
        largeur: Math.round((u1 - u0) * L),
        sens: 1,
        charniere: "g",
      };
      d.ouvertures.push(ouv);
      etat.sel = new Set([ouv.id]);
      valider();
      toast(
        "Ouverture libre de " +
          plMetres((u1 - u0) * L) +
          " faite (les pièces restent séparées). Pour enlever vraiment ce morceau de mur : bouton dans le panneau de droite."
      );
      return;
    }
    const point = u => ({ x: m.a.x + (m.b.x - m.a.x) * u, y: m.a.y + (m.b.y - m.a.y) * u });
    const p0 = point(u0),
      p1 = point(u1),
      b0 = { ...m.b };
    let neuf = null;
    if (u1 < 1 && (1 - u1) * L > 2) {
      neuf = { ...JSON.parse(JSON.stringify(m)), id: plId(), a: p1, b: b0 };
      d.murs.push(neuf);
    }
    const garde = u0 > 0 && u0 * L > 2;
    for (const o of [...d.ouvertures.filter(x => x.mur === m.id)]) {
      if (o.t < u0 && garde) o.t = o.t / u0;
      else if (o.t > u1 && neuf) {
        o.mur = neuf.id;
        o.t = (o.t - u1) / (1 - u1);
      } else d.ouvertures = d.ouvertures.filter(x => x !== o);
    }
    if (garde) m.b = p0;
    else d.murs = d.murs.filter(x => x !== m);
    etat.sel.clear();
    valider();
    toast("Ouverture de " + plMetres(dist(p0, p1)) + " faite dans le mur.");
  }
  /** appareil le plus proche d'un point (au doigt, on vise mal : jusqu'à 26 points d'écran) */
  function symboleProche(pt, tol) {
    let best = null,
      bd = tol ?? Math.max(TAILLE_SYMBOLE * 0.7, 26 / etat.vue.z);
    for (const o of d.objets)
      if (o.genre === "symbole" && !estDecor(o) && symboleVu(o)) {
        const dd = dist(o, pt);
        if (dd < bd) {
          bd = dd;
          best = o;
        }
      }
    return best;
  }
  /* -- tracer à main levée, courber juste après la pose -- */
  /** point au milieu (en longueur) d'un tracé */
  function milieuTrace(tr) {
    let L = 0;
    for (let i = 1; i < tr.length; i++) L += dist(tr[i - 1], tr[i]);
    let acc = 0;
    for (let i = 1; i < tr.length; i++) {
      const l = dist(tr[i - 1], tr[i]);
      if (acc + l >= L / 2) {
        const t = l ? (L / 2 - acc) / l : 0;
        return { x: tr[i - 1].x + (tr[i].x - tr[i - 1].x) * t, y: tr[i - 1].y + (tr[i].y - tr[i - 1].y) * t };
      }
      acc += l;
    }
    return tr[tr.length - 1];
  }
  /** décalage de courbe pour qu'un trait de a à b passe par m (null : presque droit) */
  function courbePar(a, b, m, seuilPx) {
    const L = dist(a, b) || 1,
      ecart = Math.abs((m.x - a.x) * (b.y - a.y) - (m.y - a.y) * (b.x - a.x)) / L;
    if (ecart * etat.vue.z < (seuilPx ?? 10)) return null;
    return { x: 2 * (m.x - (a.x + b.x) / 2), y: 2 * (m.y - (a.y + b.y) / 2) };
  }
  /** pliage (souris) : la gaine ou la liaison qu'on vient de poser suit le pointeur jusqu'au clic suivant */
  const pliageActif = () => !etat.tablette && optPlans().courber_apres_pose !== false;
  function plier(pt) {
    const x = etat.pli;
    if (!x) return false;
    const el = x.genre === "gaine" ? (d.gaines || []).find(g => g.id === x.id) : d.liaisons.find(l => l.id === x.id);
    const a = el && objetDe(el.de),
      b = el && objetDe(el.vers);
    if (!a || !b) {
      etat.pli = null;
      return false;
    }
    const dc = courbePar(a, b, pt);
    if (dc) el.dc = dc;
    else if (x.genre === "gaine") delete el.dc;
    else delete el.dc;
    dessiner();
    return true;
  }
  /* -- plan → tableau électrique (module Tableaux) -- */
  /** pictogramme du tableau d'après les appareils du circuit (le premier qui parle) */
  const PICTOS_TQ = [
    [/^(lave_linge|rep_ll)$|^LL$/, "swb_ll.svg", "Lave Linge"],
    [/^(lave_vaisselle|rep_lv)$|^LV$/, "swb_lv.svg", "Lave Vaisselle"],
    [/^(seche_linge|rep_sl)$|^SL$/, "swb_dryer.svg", "Seche Linge"],
    [/^(cuisiniere|prise32|rep_32a)$|^32A$|^PLAQUE/, "swb_induction.svg", "Cuisson"],
    [/^(four|rep_four)$|^FOUR$/, "swb_four.svg", "Four"],
    [/^(micro_ondes|rep_mo)$|^MO$/, "swb_microonde.svg", "Micro-ondes"],
    [/^(congelateur)$|^CONG/, "swb_froid.svg", "Congél."],
    [/^(refrigerateur|rep_frigo)$|^FRIGO$/, "swb_frigo.svg", "Frigo"],
    [/^(chauffe_eau|rep_ce)$|^CE$|^BEC$/, "swb_bec.svg", "BEC"],
    [/^(borne_ve)$|^IRVE$|^VE$/, "swb_voitureelectrique.svg", "Chargeur"],
    [/^(vmc|rep_vmc)$|^VMC$/, "swb_vmc.svg", "Ventilation"],
    [/^(volet|cmd_volet)$|^VR$/, "swb_volet.svg", "Volet"],
    [/^seche_serviettes$|^SS$/, "swb_twldryer.svg", "Chauffage"],
    [/^radiateur$|^RAD$/, "swb_chauffage.svg", "Chauffage"],
    [/^(clim_int|clim_ext)$|^CLIM$/, "swb_froid.svg", "Climatisation"],
    [/^exterieur$/, "swb_eclext.svg", "Eclairage"],
    [/^(dcl|point|applique|spot|reglette|projecteur|baes)$/, "swb_ecl.svg", "Eclairage"],
    [/^(prise|prise2|prise_cmd|prise_etanche)$|^PC$/, "swb_pc.svg", "Prises"],
    [/^(rj45|tv|rep_rj45|rep_tv)$/, "swb_telephonie.svg", "Média"],
    [/^sonnette$/, "swb_bell.svg", "Alarme"],
  ];
  /** différentiel 30 mA de type A imposé (NF C 15-100) : circuit de cuisson (plaque, cuisinière, 32 A) et lave-linge ;
   *  la borne de recharge a son propre différentiel (type selon la notice de la borne : A, F ou B) */
  const TYPE_A_TQ = /^(swb_induction|swb_ll)\.svg$/,
    IRVE_TQ = "swb_voitureelectrique.svg";
  function circuitsTableau() {
    const tous = [...d.objets, ...Object.values(d.etages || {}).flatMap(e => e.objets || [])].filter(
      o => o.genre === "symbole" && !estDecor(o)
    );
    return d.circuits.map((c, i) => {
      const app = tous.filter(o => o.circuit === c.id),
        cles = app.map(o => (o.type === "rep_libre" ? String(o.texte || "").toUpperCase() : o.type));
      const cal = Number(c.calibre) || 16,
        pictos = PICTOS_TQ.find(([re]) => cles.some(k => re.test(k)));
      const nbLum = app.filter(o => LUMIERES.includes(o.type)).length,
        nbPc = app.filter(o => PRISES.includes(o.type)).length;
      const picto =
        pictos ||
        (nbLum >= nbPc && nbLum ? PICTOS_TQ.find(x => x[1] === "swb_ecl.svg") : nbPc ? PICTOS_TQ.find(x => x[1] === "swb_pc.svg") : null);
      const sections = app.map(o => {
        const l = lotAppareil(o);
        return l && l.section ? parseFloat(l.section.replace(",", ".")) : 0;
      });
      const sec = Math.max(0, ...sections) || (cal <= 16 ? 1.5 : cal <= 20 ? 2.5 : cal <= 25 ? 4 : cal <= 32 ? 6 : 10);
      const pieces = [...new Set(app.map(o => o.piece).filter(Boolean))];
      // (récepteurs du circuit, pour les annotations : « 6 PC, 1 LL » — sans les commandes ni les boîtes)
      const nbRep = {};
      for (const o of app) {
        if (COMMANDES.includes(o.type) || estNoeud(o) || o.type === "compteur") continue;
        const k = LUMIERES.includes(o.type) && o.type !== "prise_cmd" ? "PL" : repereDe(o) || "?";
        nbRep[k] = (nbRep[k] || 0) + 1;
      }
      const recepteurs = Object.entries(nbRep)
        .sort((a, b) => b[1] - a[1])
        .map(([k, n]) => n + " " + k)
        .join(", ");
      // (éclairage et prises : le pictogramme dit déjà que c'est de la lumière ou des prises ; l'étiquette garde la place pour les pièces)
      const lum = !!(picto && /^swb_(ecl|eclext|pc)\.svg$/.test(picto[1])) && pieces.length;
      return {
        c,
        rep: repDe(c), // (repère du disjoncteur : le même dans le tableau)
        circuit: c.nom || "",
        nom: lum ? pieces.join(", ") : c.nom || "Circuit " + (i + 1),
        note: lum ? c.nom || (picto[1] === "swb_pc.svg" ? "Prises" : "Éclairage") : "",
        cal,
        sec,
        pieces,
        icone: picto ? picto[1] : null,
        // (circuit mixte, prises et éclairage : son type de circuit est le nom écrit dans le plan)
        mixte: !pictos && nbLum > 0 && nbPc > 0,
        modtype: picto ? picto[2] : "",
        typeA: !!(picto && TYPE_A_TQ.test(picto[1])),
        irve: !!(picto && picto[1] === IRVE_TQ),
        recepteurs,
        nbRecepteurs: Object.values(nbRep).reduce((t, n) => t + n, 0),
      };
    });
  }
  /** répartition sous les différentiels 30 mA (8 circuits au plus chacun) : ceux qui demandent un type A sur un type A ;
   *  puis l'éclairage réparti sur tous les différentiels (un circuit lumière par différentiel), de même les prises,
   *  pour qu'un déclenchement ne coupe pas toute la lumière ni toutes les prises ; le reste là où il y a de la place */
  function repartirDifferentiels(lignes) {
    const bornes = lignes.filter(x => x.irve).map(x => ({ typeA: true, irve: true, l: [x] })); // (borne de recharge : un différentiel à elle)
    lignes = lignes.filter(x => !x.irve);
    const estLum = x => /swb_ecl/.test(x.icone || ""),
      estPc = x => x.icone === "swb_pc.svg";
    const nA = lignes.filter(x => x.typeA).length,
      nIdA = Math.ceil(nA / 8);
    const nId = Math.max(2, Math.ceil(lignes.length / 8), nIdA + (lignes.length > nA ? 1 : 0));
    const groupes = Array.from({ length: nId }, (_, k) => ({ typeA: k < nIdA, l: [] }));
    const plusLibre = (liste, f) => liste.filter(g => g.l.length < 8).sort((a, b) => f(a) - f(b) || a.l.length - b.l.length)[0];
    for (const x of lignes.filter(x => x.typeA))
      plusLibre(
        groupes.filter(g => g.typeA),
        g => g.l.length
      ).l.push(x);
    for (const [test] of [[estLum], [estPc]])
      for (const x of lignes.filter(x => !x.typeA && test(x))) (plusLibre(groupes, g => g.l.filter(test).length) || groupes[0]).l.push(x);
    for (const x of lignes.filter(x => !x.typeA && !estLum(x) && !estPc(x))) (plusLibre(groupes, g => g.l.length) || groupes[0]).l.push(x);
    const ordre = x => lignes.indexOf(x);
    groupes.forEach(g => g.l.sort((a, b) => ordre(a) - ordre(b)));
    return [...groupes, ...bornes];
  }
  /** tableau électrique (étiquettes) d'après les circuits : un différentiel puis ses départs, rangés comme pour
   *  le tableau (8 circuits au plus par différentiel) ; une rangée par différentiel tant qu'elle tient. Plusieurs
   *  armoires dans le plan : un tableau par armoire, l'armoire mère avec un départ « Alim … » pour chacune, reliés en
   *  installation (synoptique). Aperçu, puis nouveau tableau ou remplacement du précédent. */
  /** les circuits du plan prennent les repères du tableau (Q1, Q2… de gauche à droite) et son ordre */
  function repsDuTableau(cpt) {
    for (const c of d.circuits) if (cpt.reps.has(c.id)) c.rep = cpt.reps.get(c.id);
    const num = c => parseInt(String(c.rep || "").replace(/\D/g, ""), 10) || 9999;
    d.circuits.sort((a, b) => num(a) - num(b));
  }
  function rangeesEtiquettes(lignes, filles, cpt) {
    const picto = x => (typeof etPictoDepuis === "function" ? etPictoDepuis(x.icone) : "");
    const PAS = 13,
      rangees = [],
      groupes = repartirDifferentiels(lignes).filter(g => g.l.length);
    // (repères Q1, Q2… dans l'ordre du tableau, de gauche à droite — suite d'un tableau à l'autre d'une installation ;
    //  les circuits du plan les reprennent ensuite)
    cpt = cpt || { n: 0, reps: new Map() };
    let cur = [],
      pris = 0;
    const ajouter = (mods, largeur) => {
      if (cur.length && pris + largeur > PAS) {
        rangees.push({ modules: cur });
        cur = [];
        pris = 0;
      }
      cur.push(...mods);
      pris += largeur;
    };
    // (alimentation des armoires divisionnaires : un disjoncteur par armoire, en tête)
    for (const f of filles || []) {
      const rep = "Q" + ++cpt.n;
      f._depart = rep;
      ajouter(
        [
          {
            genre: "disj",
            rep,
            texte: "Alim " + nomArmoire(f),
            calibre: (f.alim_cal || 32) + " A",
            courbe: "C",
            poles: "1P+N",
            section: String(f.alim_sec || "10").replace(".", ","),
            alimente: nomArmoire(f),
          },
        ],
        1
      );
    }
    groupes.forEach((g, k) => {
      const mods = [
        {
          genre: "diff",
          rep: "ID" + (k + 1),
          texte: g.irve ? "Différentiel borne" : "Différentiel",
          desc: g.irve ? "Type selon la notice de la borne (A, F ou B)" : "",
          calibre: "40 A",
          sens: "30 mA",
          type: g.irve ? "" : g.typeA ? "A" : "AC",
          poles: "2P",
          picto: "differentiel",
        },
        ...g.l.map(x => {
          // (type de circuit en texte, d'après le pictogramme — « Prises », « Éclairage », « Four »… —, sinon le nom du
          //  circuit ; les pièces en annotation)
          const pg = picto(x),
            type = pg && typeof ET_PICTOS !== "undefined" && ET_PICTOS[pg] ? ET_PICTOS[pg][0] : "",
            nomC = x.circuit || x.nom,
            pieces = x.pieces.join(", ");
          const rep = "Q" + ++cpt.n;
          cpt.reps.set(x.c.id, rep);
          return {
            genre: "disj",
            rep,
            texte: x.mixte && x.circuit ? x.circuit : type || nomC,
            texte_auto: type && !(x.mixte && x.circuit) ? true : "",
            desc: pieces || (type && nomC !== type && !(x.mixte && x.circuit) ? nomC : ""),
            calibre: x.cal + " A",
            courbe: "C",
            poles: "1P+N",
            section: String(x.sec).replace(".", ","),
            picto: pg,
            recepteurs: x.nbRecepteurs || "",
          };
        }),
      ];
      for (const m of mods) for (const c of Object.keys(m)) if (m[c] === "") delete m[c];
      ajouter(mods, 2 + g.l.length);
    });
    if (cur.length) rangees.push({ modules: cur });
    if (!rangees.length) rangees.push({ modules: [] });
    return rangees;
  }
  async function versEtiquettes() {
    const lignes = circuitsTableau();
    if (!lignes.length) return toast("Aucun circuit dans ce plan.", true);
    const ts = tableauxPlan(),
      plusieurs = ts.length > 1,
      tete = plusieurs ? teteArmoires() : null;
    const mere = t => (t === tete ? null : ts.find(x => x.id === t.alim && x !== t) || tete);
    const filles = t => ts.filter(x => x !== tete && x !== t && mere(x) === t);
    const ordre = [];
    if (plusieurs) {
      const aj = t => {
        if (ordre.includes(t)) return;
        ordre.push(t);
        filles(t).forEach(aj);
      };
      aj(tete);
      ts.forEach(aj);
    }
    const de = new Map(lignes.map(x => [x, plusieurs ? armoireDuCircuit(x.c) : null]));
    // (déjà faits depuis ce plan : à remplacer, ou nouveaux)
    const deja = plusieurs ? d.etiquettes_armoires || {} : d.etiquettes_id ? { un: d.etiquettes_id } : {};
    const existants = {};
    for (const [k, id] of Object.entries(deja)) {
      const q = await api("GET", "/api/plans/" + id).catch(() => null);
      if (q && q.genre === "etiquettes") existants[k] = q;
    }
    const nbDeja = Object.keys(existants).length;
    const nomT = h("input", {
      type: "text",
      value: (existants.un && existants.un.nom) || "Tableau — " + (nom.value || "Plan"),
      style: "width:100%",
    });
    const choix = h(
      "select",
      {},
      nbDeja
        ? h(
            "option",
            { value: "remplacer" },
            nbDeja > 1
              ? "Remplacer les " + nbDeja + " tableaux déjà faits depuis ce plan"
              : "Remplacer le tableau « " + (Object.values(existants)[0].nom || "Tableau") + " »"
          )
        : null,
      h("option", { value: "nouveau" }, plusieurs ? "Nouveaux tableaux" : "Nouveau tableau")
    );
    // (repères qu'auront les disjoncteurs : dans l'ordre du tableau ; un essai à blanc pour l'aperçu)
    const numeroter = cpt => {
      if (!plusieurs) return [rangeesEtiquettes(lignes, [], cpt)];
      return ordre.map(t =>
        rangeesEtiquettes(
          lignes.filter(x => de.get(x) === t),
          filles(t),
          cpt
        )
      );
    };
    const essai = { n: 0, reps: new Map() };
    numeroter(essai);
    // aperçu : les circuits, par armoire
    const groupes = repartirDifferentiels(lignes).filter(g => g.l.length);
    const idDe = x => {
      const k = groupes.findIndex(g => g.l.includes(x));
      return k < 0 ? "" : "ID" + (k + 1) + " · " + (groupes[k].irve ? "à elle seule" : "type " + (groupes[k].typeA ? "A" : "AC"));
    };
    const corps = h("tbody", {});
    const ligne = x =>
      h(
        "tr",
        {},
        h(
          "td",
          {},
          h("b", {}, essai.reps.get(x.c.id) || x.rep),
          x.rep !== essai.reps.get(x.c.id) ? h("span", { class: "sous" }, " (" + x.rep + ")") : null
        ),
        h(
          "td",
          {},
          (() => {
            const pg = typeof etPictoDepuis === "function" ? etPictoDepuis(x.icone) : "";
            return pg && typeof ET_PICTOS !== "undefined" && ET_PICTOS[pg] ? ET_PICTOS[pg][0] : x.circuit || x.nom;
          })()
        ),
        h("td", { class: "sous" }, x.pieces.join(", ") || "—"),
        h("td", {}, x.cal + " A"),
        h("td", {}, String(x.sec).replace(".", ",") + " mm²"),
        h("td", { class: "sous" }, x.nbRecepteurs ? String(x.nbRecepteurs) : ""),
        h("td", { class: "sous" }, plusieurs ? "" : idDe(x))
      );
    if (plusieurs)
      for (const t of ordre) {
        const m = mere(t);
        corps.append(
          h(
            "tr",
            {},
            h(
              "td",
              { colspan: 7, style: "background:var(--fond-doux, #f1f5f9)" },
              h("b", {}, "⚡ " + nomArmoire(t)),
              t.batiment ? " — " + t.batiment : "",
              h("span", { class: "sous" }, m ? "  ← " + nomArmoire(m) + " (" + (t.alim_cal || 32) + " A)" : "  tête de l'installation")
            )
          )
        );
        for (const f of filles(t))
          corps.append(
            h(
              "tr",
              {},
              h("td", {}, ""),
              h("td", {}, "Alim " + nomArmoire(f)),
              h("td", { class: "sous" }, "→ " + nomArmoire(f)),
              h("td", {}, (f.alim_cal || 32) + " A"),
              h("td", {}, String(f.alim_sec || "10").replace(".", ",") + " mm²"),
              h("td"),
              h("td")
            )
          );
        lignes.filter(x => de.get(x) === t).forEach(x => corps.append(ligne(x)));
      }
    else lignes.forEach(x => corps.append(ligne(x)));
    ouvrirModale(
      plusieurs ? "Plan → tableaux (" + ts.length + " armoires)" : "Plan → tableau électrique",
      h(
        "div",
        { class: "pile" },
        h(
          "p",
          { class: "aide", style: "margin:0" },
          "Un disjoncteur par circuit du plan, numéroté Q1, Q2… dans l'ordre du tableau (de gauche à droite) ; le plan reprend ces repères et cet ordre (ancien repère entre parenthèses) : type de circuit, pièces (annotation), calibre (courbe C), section, nombre de récepteurs ; rangés sous des interrupteurs différentiels 30 mA (8 circuits au plus chacun, type A pour la cuisson et le lave-linge, un à elle pour la borne de recharge ; éclairage et prises répartis)." +
            (plusieurs
              ? " Un tableau par armoire du plan, l'armoire mère avec un disjoncteur « Alim … » pour chaque armoire qu'elle alimente : ils forment une installation (onglets, synoptique)."
              : "")
        ),
        h(
          "div",
          { style: "max-height:46vh;overflow:auto" },
          h(
            "table",
            { class: "resultats" },
            h(
              "thead",
              {},
              h(
                "tr",
                {},
                ["", "Type de circuit", "Pièces", "Disj.", "Section", "Récept.", plusieurs ? "" : "Différentiel"].map(t => h("th", {}, t))
              )
            ),
            corps
          )
        ),
        plusieurs ? null : h("label", { class: "champ" }, h("span", {}, "Nom du tableau"), nomT),
        h("label", { class: "champ" }, h("span", {}, plusieurs ? "Tableaux" : "Tableau"), choix)
      ),
      [
        h("button", { class: "btn", onclick: fermerModale }, "Annuler"),
        h(
          "button",
          {
            class: "btn principal",
            onclick: async () => {
              try {
                const remplacer = choix.value === "remplacer";
                if (
                  remplacer &&
                  !(await demanderOui(
                    (plusieurs ? "Remplacer les tableaux" : "Remplacer le tableau") +
                      " par ce que donne le plan ? Ce qui y a été fait à la main (textes, couleurs, appareils ajoutés…) sera perdu."
                  ))
                )
                  return;
                const base = {
                  format: { pas: 18, hauteur: 30, modules: 13 },
                  theme: (PARAMS.etiquettes || {}).theme_defaut || "classique",
                  installation: "mono",
                };
                const ecrireEt = async (cle, nomE, donnees) => {
                  const ex = remplacer ? existants[cle] : null;
                  if (ex) {
                    const dd = ex.donnees || {};
                    await api("PUT", "/api/plans/" + ex.id, {
                      nom: nomE,
                      donnees: { ...base, ...dd, ...donnees, format: dd.format || base.format, theme: dd.theme || base.theme },
                    });
                    return ex.id;
                  }
                  return (
                    await api("POST", "/api/plans", {
                      genre: "etiquettes",
                      nom: nomE,
                      client_id: p.client_id || null,
                      document_id: p.document_id || null,
                      adresse: p.adresse || "",
                      donnees: { ...base, ...donnees },
                    })
                  ).id;
                };
                let premier = null;
                const cpt = { n: 0, reps: new Map() };
                if (!plusieurs) {
                  premier = await ecrireEt("un", nomT.value.trim() || "Tableau", { rangees: rangeesEtiquettes(lignes, [], cpt) });
                  d.etiquettes_id = premier;
                } else {
                  const groupeA = "plan-" + p.id + "-" + Date.now().toString(36),
                    ids = {};
                  for (const t of ordre) {
                    const rangees = rangeesEtiquettes(
                      lignes.filter(x => de.get(x) === t),
                      filles(t),
                      cpt
                    );
                    const m = mere(t),
                      ex = remplacer ? existants[t.id] : null;
                    const armoire = {
                      parent: m ? ids[m.id] : null,
                      depart: m ? t._depart || "" : "",
                      libelle: m && t._depart ? t._depart + " " + (t.alim_cal || 32) + " A" : "",
                      batiment: t.batiment || "",
                      groupe: (ex && (ex.donnees || {}).armoire && ex.donnees.armoire.groupe) || groupeA,
                    };
                    ids[t.id] = await ecrireEt(t.id, nomArmoire(t), { rangees, armoire, multi_tableaux: true });
                    if (!premier) premier = ids[t.id];
                  }
                  ts.forEach(t => delete t._depart);
                  d.etiquettes_armoires = ids;
                }
                // (les circuits du plan prennent les repères du tableau, et son ordre : plan, schéma et tableau
                //  restent cohérents, lus de gauche à droite)
                repsDuTableau(cpt);
                d.etiquettes_le = new Date().toISOString().slice(0, 10);
                fermerModale();
                await enregistrer();
                toast(
                  plusieurs
                    ? ts.length + " tableaux créés d'après le plan."
                    : "Tableau créé d'après les " + lignes.length + " circuits du plan."
                );
                aller("etiquettes", { id: premier });
              } catch (e) {
                erreur(e);
              }
            },
          },
          plusieurs ? "Créer les tableaux" : "Créer le tableau"
        ),
      ],
      { largeur: "min(760px, 96vw)" }
    );
  }
  /* -- gaines -- */
  /** texte d'une gaine : toujours horizontal (le plan se lit dans un seul sens), détouré de blanc (lisible sur un mur),
   *  posé à « k » du trait du côté de la normale (nx, ny) */
  function texteGaine(gg, cx, cy, nx, ny, k, lib, taille, gras, coul, ancreImposee) {
    const sx = Math.sign(k) * nx,
      sy = Math.sign(k) * ny,
      x = cx + nx * k,
      y = cy + ny * k;
    const ancre = ancreImposee || (Math.abs(sx) > 0.6 ? (sx > 0 ? "start" : "end") : "middle");
    const dy = Math.abs(sy) > 0.4 ? (sy > 0 ? taille * 0.8 : -taille * 0.15) : taille * 0.35;
    gg.append(
      svgEl(
        "text",
        {
          x: x - (ancre === "middle" ? 0 : sx * Math.abs(k) * 0.35),
          y: y + dy,
          "font-size": taille,
          "font-weight": gras ? 700 : 400,
          fill: coul || "#1e293b",
          "text-anchor": ancre,
          stroke: "#fff",
          "stroke-width": taille * 0.28,
          "paint-order": "stroke",
          "stroke-linejoin": "round",
        },
        document.createTextNode(lib)
      )
    );
  }
  /** nom d'une gaine (A, B…) : petite étiquette blanche posée sur le trait */
  function etiquetteGaine(gg, x, y, nomG, z) {
    const t = String(nomG).slice(0, 8),
      fs = 10 / z,
      l = (t.length * 6.4 + 8) / z,
      ht = 14 / z;
    gg.append(
      svgEl("rect", {
        x: x - l / 2,
        y: y - ht / 2,
        width: l,
        height: ht,
        rx: 3 / z,
        fill: "#fff",
        stroke: "#475569",
        "stroke-width": 1 / z,
      }),
      svgEl(
        "text",
        { x, y: y + fs * 0.35, "font-size": fs, "font-weight": 700, fill: "#1e293b", "text-anchor": "middle" },
        document.createTextNode(t)
      )
    );
  }
  /** nom libre suivant pour une nouvelle gaine : A, B… Z, AA, AB… (⚙ Options > Gaines : nommer ou non) */
  function nomGaineLibre() {
    const pris = new Set(
      [...(d.gaines || []), ...Object.values(d.etages || {}).flatMap(e => e.gaines || [])].map(g => g.nom).filter(Boolean)
    );
    const lettres = n => {
      let t = "";
      n++;
      while (n > 0) {
        const r = (n - 1) % 26;
        t = String.fromCharCode(65 + r) + t;
        n = Math.floor((n - 1) / 26);
      }
      return t;
    };
    for (let i = 0; ; i++) if (!pris.has(lettres(i))) return lettres(i);
  }
  /** ajoute une gaine au plan (nommée d'office, sauf option contraire) */
  /** gaine nommée : celles qui partent du tableau ou d'une boîte (pas les repiquages d'appareil à appareil) */
  const gaineANommer = g => estNoeud(objetDe(g.de)) || estNoeud(objetDe(g.vers));
  function ajouterGaine(ng) {
    if (etat.conduitOutil !== "gaine" && CONDUITS[etat.conduitOutil] && !ng.conduit) ng.conduit = etat.conduitOutil;
    if (conduitDe(ng) === "moulure") delete ng.dc; // (une moulure, une goulotte est droite : pas de courbe)
    if (!ng.nom && optPlans().gaines_nommees !== false && gaineANommer(ng)) {
      ng.nom = nomGaineLibre();
      ng.nomAuto = true;
    }
    d.gaines.push(ng);
    marquerRecent("gaine", ng.id);
    return ng;
  }
  /** lettres données d'office : remises dans l'ordre, du tableau puis de boîte en boîte, autour de chacune dans le sens
   *  des aiguilles d'une montre en partant de midi (pour retrouver vite une gaine du plan imprimé) ; les noms tapés restent */
  function numeroterGaines() {
    const gs = d.gaines || [];
    for (const g of gs)
      if (g.nomAuto && !gaineANommer(g)) {
        delete g.nom;
        delete g.nomAuto;
      } // (repiquage : pas de lettre)
    if (!gs.some(g => g.nomAuto)) return;
    const angle = (g, depuis) => {
      const ch = cheminGaine(g);
      if (!ch) return 0;
      let q = g.de === depuis.id ? ch[1] : ch[ch.length - 2];
      if (ch.length === 2) q = controleGaine(g, ch[0], ch[1]);
      if (Math.hypot(q.x - depuis.x, q.y - depuis.y) < 1) q = g.de === depuis.id ? ch[ch.length - 1] : ch[0];
      return (Math.atan2(q.x - depuis.x, -(q.y - depuis.y)) + 2 * Math.PI) % (2 * Math.PI);
    };
    const bouts = [...new Set(gs.flatMap(g => [g.de, g.vers]))].map(objetDe).filter(Boolean);
    const racines = [
      ...bouts.filter(o => o.type === "tableau"),
      ...bouts
        .filter(o => o.type === "boite")
        .sort((a, b) => String(a.num || "").localeCompare(String(b.num || ""), "fr", { numeric: true }) || a.y - b.y || a.x - b.x),
      ...bouts.filter(o => !estNoeud(o)).sort((a, b) => a.y - b.y || a.x - b.x),
    ];
    const ordre = [],
      faites = new Set(),
      vus = new Set();
    for (const r of racines) {
      if (vus.has(r.id)) continue;
      const file = [r];
      vus.add(r.id);
      while (file.length) {
        const o = file.shift();
        const siennes = gs.filter(g => !faites.has(g) && (g.de === o.id || g.vers === o.id)).sort((a, b) => angle(a, o) - angle(b, o));
        for (const g of siennes) {
          faites.add(g);
          ordre.push(g);
          const y = objetDe(g.de === o.id ? g.vers : g.de);
          if (y && !vus.has(y.id)) {
            vus.add(y.id);
            file.push(y);
          }
        }
      }
    }
    const pris = new Set(
      [
        ...gs.filter(g => !g.nomAuto).map(g => g.nom),
        ...Object.values(d.etages || {}).flatMap(e => (e.gaines || []).map(g => g.nom)),
      ].filter(Boolean)
    );
    const lettres = n => {
      let t = "";
      n++;
      while (n > 0) {
        const r = (n - 1) % 26;
        t = String.fromCharCode(65 + r) + t;
        n = Math.floor((n - 1) / 26);
      }
      return t;
    };
    let n = 0;
    for (const g of ordre)
      if (g.nomAuto) {
        while (pris.has(lettres(n))) n++;
        g.nom = lettres(n++);
      }
  }
  /** départ de la gaine suivante : la boîte d'arrivée, sinon la même boîte, sinon l'appareil d'arrivée (repiquage de prise en prise) */
  const suiteGaine = (dep, ob) =>
    ob.type === "boite" ? { de: ob.id, pts: [] } : estNoeud(dep) ? { de: dep.id, pts: [] } : { de: ob.id, pts: [] };
  /** panneau de la gaine choisie : contenu (calculé ou tapé), diamètre, coudes */
  function panneauGaine(g) {
    const A = objetDe(g.de),
      B = objetDe(g.vers),
      lots = lotsTries(g),
      conseil = diametreConseille(lots);
    const nom = o =>
      !o ? "?" : estNoeud(o) ? (o.type === "boite" && o.num ? "boîte " + o.num : nomNoeud(o)) : repereDe(o) || (SYMB[o.type] || {}).libelle;
    const z = h("div", { class: "pile", style: "gap:6px" }, h("div", {}, h("b", {}, nomConduit(g) + " "), nom(A) + " → " + nom(B)));
    const moul = conduitDe(g) === "moulure",
      conseilM = moulureConseillee(lots, estGoulotte(g));
    const listeM = [...new Set([...moulures(estGoulotte(g)), ...(dimsMoulure(g.moulure) ? [g.moulure] : [])])];
    const diam = moul
      ? h(
          "select",
          {},
          h("option", { value: "" }, conseilM.replace("x", "×") + " mm (conseillée)"),
          listeM.map(v => h("option", { value: v }, v.replace("x", "×") + " mm"))
        )
      : h(
          "select",
          {},
          h("option", { value: "" }, "Ø " + conseil + " mm (conseillé)"),
          [16, 20, 25, 32, 40].map(v => h("option", { value: v }, "Ø " + v + " mm"))
        );
    diam.value = moul ? (dimsMoulure(g.moulure) ? g.moulure : "") : g.diam ? String(g.diam) : "";
    diam.addEventListener("change", () => {
      if (moul) {
        if (diam.value) g.moulure = diam.value;
        else delete g.moulure;
      } else if (diam.value) g.diam = Number(diam.value);
      else delete g.diam;
      valider();
    });
    const cond = h(
      "select",
      { title: "Gaine ICTA (encastrée), moulure ou goulotte (apparentes, collées au mur)" },
      Object.entries(CONDUITS).map(([k, l]) => h("option", { value: k }, l))
    );
    cond.value = CONDUITS[g.conduit] ? g.conduit : "gaine";
    cond.addEventListener("change", () => {
      if (cond.value !== "gaine") g.conduit = cond.value;
      else delete g.conduit;
      delete g.moulure; // (la taille choisie ne vaut que pour l'ancien conduit)
      if (conduitDe(g) === "moulure") delete g.dc;
      valider();
    });
    const nomG = h("input", { type: "text", value: g.nom || "", maxlength: 8, placeholder: "A", style: "width:70px;font-weight:700" });
    nomG.addEventListener("change", () => {
      const v = nomG.value.trim();
      delete g.nomAuto;
      if (v) g.nom = v;
      else delete g.nom;
      valider();
    });
    nomG.title = g.nomAuto
      ? "Lettre donnée d'office (sens des aiguilles d'une montre) ; tapée à la main, elle ne bouge plus"
      : "Nom tapé à la main";
    z.append(
      h(
        "div",
        { style: "display:flex;gap:8px;align-items:end" },
        h("label", { class: "champ", style: "flex:none" }, h("span", {}, "Nom"), nomG),
        h("label", { class: "champ", style: "flex:1;min-width:0" }, h("span", {}, moul ? "Taille" : "Diamètre"), diam)
      ),
      h("label", { class: "champ" }, h("span", {}, "Conduit"), cond)
    );
    if (moul) {
      // (hauteur de pose de la moulure : partie basse ou haute du mur)
      const H = hauteurs(),
        auto = hauteurMoulure({ ...g, pose: null });
      const ps = h(
        "select",
        {},
        h("option", { value: "" }, "Auto (" + (auto >= 150 ? "haute" : "basse") + ")"),
        h("option", { value: "basse" }, "Partie basse (" + H.moulure_basse + " cm)"),
        h("option", { value: "haute" }, "Partie haute (" + H.moulure_haute + " cm)"),
        h("option", { value: "plafond" }, "Au plafond (" + H.plafond + " cm)"),
        h("option", { value: "combles" }, "Dans les combles (câble, pas de moulure)"),
        h("option", { value: "cm" }, "Autre hauteur…")
      );
      const pcm = h("input", { type: "number", min: 0, max: 400, step: 5, value: Number(g.pose) > 0 ? g.pose : "", style: "width:70px" });
      ps.value = Number(g.pose) > 0 ? "cm" : ["basse", "haute", "plafond", "combles"].includes(g.pose) ? g.pose : "";
      const maj = () => {
        pcm.style.display = ps.value === "cm" ? "" : "none";
      };
      ps.addEventListener("change", () => {
        maj();
        if (ps.value === "cm") {
          pcm.focus();
          return;
        }
        if (ps.value) g.pose = ps.value;
        else delete g.pose;
        valider();
      });
      pcm.addEventListener("change", () => {
        const v = nombre(pcm.value);
        if (v > 0) g.pose = v;
        else delete g.pose;
        valider();
      });
      maj();
      z.append(
        h(
          "label",
          {
            class: "champ",
            title: "La moulure descend ou remonte à chaque appareil (flèche ↑ ↓ sur le plan) ; comptée dans les longueurs",
          },
          h("span", {}, "Pose au départ (" + nom(A) + ")"),
          h("div", { style: "display:flex;gap:6px" }, ps, pcm)
        )
      );
      // (le long du parcours : à chaque angle ou coude, elle peut descendre ou remonter — ex. descendre du plafond dans l'angle jusqu'à la plinthe)
      const ch = cheminGaine(g) || [];
      if (ch.length > 2) {
        const lignes = [];
        for (let i = 1; i < ch.length - 1; i++) {
          const v = (g.changements || {})[i],
            lib =
              i === 1 && dist(ch[0], ch[1]) < 60
                ? "Près de " + nom(A)
                : i === ch.length - 2 && dist(ch[i], ch[i + 1]) < 60
                  ? "Près de " + nom(B)
                  : (g.pts || []).length
                    ? "Coude " + i
                    : "Angle";
          const sc = h(
            "select",
            { style: "width:auto;font-size:12px" },
            h("option", { value: "" }, "continue"),
            h("option", { value: "basse" }, "↓ descend en partie basse"),
            h("option", { value: "haute" }, "↑ remonte en partie haute"),
            h("option", { value: "plafond" }, "↑ monte au plafond"),
            h("option", { value: "combles" }, "↑ passe dans les combles (câble)"),
            h("option", { value: "cm" }, "à une hauteur…")
          );
          const ic = h("input", { type: "number", min: 0, max: 400, step: 5, value: Number(v) > 0 ? v : "", style: "width:62px" });
          sc.value = Number(v) > 0 ? "cm" : ["basse", "haute", "plafond", "combles"].includes(v) ? v : "";
          const mj = () => {
            ic.style.display = sc.value === "cm" ? "" : "none";
          };
          mj();
          const ecrire = val => {
            g.changements = { ...(g.changements || {}) };
            if (val) g.changements[i] = val;
            else delete g.changements[i];
            if (!Object.keys(g.changements).length) delete g.changements;
            valider();
          };
          sc.addEventListener("change", () => {
            mj();
            if (sc.value === "cm") {
              ic.focus();
              return;
            }
            ecrire(sc.value || null);
          });
          ic.addEventListener("change", () => {
            const n = nombre(ic.value);
            ecrire(n > 0 ? n : null);
          });
          lignes.push(
            h(
              "div",
              { style: "display:flex;gap:6px;align-items:center;font-size:12.5px" },
              h("span", { style: "min-width:90px" }, lib),
              sc,
              ic
            )
          );
        }
        z.append(
          h("div", { class: "sous", style: "margin-top:2px" }, "Le long du parcours (descendre du plafond dans un angle, remonter…) :"),
          ...lignes
        );
      } else z.append(h("div", { class: "sous" }, "Pour descendre ou remonter en route : ajoutez un coude là où elle change de hauteur."));
      z.append(
        (g.pts || []).length || g.dc || routeMoulure(objetDe(g.de) || {}, objetDe(g.vers) || {})
          ? ""
          : h("div", { class: "sous" }, "Pas de mur commun aux deux bouts : ajoutez des coudes pour qu'elle suive les murs.")
      );
    }
    const alertesOk = optPlans().alertes_nfc; // (⚙ Options > Circuits : toutes les alertes NF C 15-100)
    if (alertesOk && moul && tropPetite(g))
      z.append(
        h(
          "div",
          { class: "plan-alerte" },
          "⚠ Plus petite que la moulure " + conseilM.replace("x", "×") + " conseillée : à vérifier sur place."
        )
      );
    if (alertesOk && !moul && g.diam && g.diam < conseil)
      z.append(
        h(
          "div",
          { class: "plan-alerte" },
          "⚠ Plus petit que le Ø " +
            conseil +
            " conseillé (fils > " +
            String(reglesGaines().taux).replace(".", ",") +
            " % de la section intérieure) : à vérifier sur place."
        )
      );
    // petits traits de couleur : un clic pour changer la couleur du fil
    const tick = (l, k, i) => {
      const cf = couleurFil(g, k, l, i),
        coul = hexFil(cf);
      return h("span", {
        title: (COULEURS_FIL[cf] || [cf])[0] + " (clic : changer la couleur)",
        role: "button",
        style: `display:inline-block;width:5px;height:16px;margin-right:3px;cursor:pointer;transform:skewX(-25deg);background:${cf === "vj" ? "repeating-linear-gradient(#16a34a 0 3px,#facc15 3px 6px)" : coul}`,
        onclick: e => menuCouleurFil(e, g, l, k, i),
      });
    };
    const parCouleur = optPlans().lettres_fils === "couleur";
    const aideLettres = parCouleur
      ? "Fils par leur couleur, séparés par un espace : " +
        Object.entries(CODES_COULEUR)
          .map(([c, k]) => k + " " + COULEURS_FIL[c][0].toLowerCase())
          .join(", ")
      : "Fils séparés par un espace : " +
        Object.entries(FILS)
          .map(([k, v]) => k + " " + v[0].toLowerCase())
          .join(", ");
    /** une ligne de lot à taper : couleurs, repère, fils (lettres de fonction ou de couleur), section, ✕ */
    const ligneLot = (l, k, liste, idx) => {
      const pt = "padding:2px 4px;font-size:12px;height:26px";
      const r = h("input", {
        type: "text",
        value: l.rep || "",
        style: pt + ";width:42px;font-weight:700",
        placeholder: "SA",
        title: "Repère",
      });
      const lettres = parCouleur ? l.fils.map((_, n) => CODES_COULEUR[couleurFil(g, k, l, n)] || "N").join(" ") : l.fils.join(" ");
      const f = h("input", {
        type: "text",
        value: lettres,
        style: pt + ";flex:1;min-width:52px;text-transform:uppercase",
        placeholder: parCouleur ? "R B VJ" : "P N T",
        title: aideLettres,
      });
      const sc = h(
        "select",
        { style: pt + ";width:58px;flex:none", title: "Section (mm²)" },
        ["", "1,5", "2,5", "4", "6", "10"].map(v => h("option", { value: v }, v || "—"))
      );
      sc.value = l.section || "";
      const maj = () => {
        const av = l.fils.join(),
          toks = f.value
            .toUpperCase()
            .split(/[\s,;]+/)
            .filter(Boolean);
        l.rep = r.value.trim();
        l.section = sc.value;
        if (parCouleur) {
          // (couleurs tapées : gardées fil par fil ; la fonction suit la couleur, ou « fil »)
          const inv = Object.fromEntries(Object.entries(CODES_COULEUR).map(([c, code]) => [code, c]));
          const coul = toks.map(t => inv[t]).filter(Boolean);
          l.fils = coul.map(c => FONCTION_COULEUR[c] || "F");
          l.couleurs = coul;
        } else {
          l.fils = toks.filter(x => FILS[x]);
          if (l.couleurs && l.fils.join() !== av) delete l.couleurs;
        }
        valider();
      };
      r.addEventListener("change", maj);
      f.addEventListener("change", maj);
      sc.addEventListener("change", maj);
      return h(
        "div",
        { style: "display:flex;align-items:center;gap:3px;flex-wrap:wrap" },
        h("span", { style: "flex:none" }, ...l.fils.map((_, n) => tick(l, k, n))),
        r,
        f,
        sc,
        h(
          "button",
          {
            class: "icone",
            style: "flex:none",
            title: "Retirer ce lot",
            onclick: () => {
              liste.splice(idx, 1);
              valider();
            },
          },
          "✕"
        )
      );
    };
    const nouveauLot = () =>
      parCouleur
        ? { rep: "", fils: ["P", "F"], couleurs: ["rouge", "violet"], section: "1,5" }
        : { rep: "", fils: ["P", "N", "T"], section: "2,5" };
    const auto = h("input", { type: "checkbox", checked: !g.lots });
    auto.addEventListener("change", () => {
      if (auto.checked) delete g.lots;
      else {
        g.lots = JSON.parse(JSON.stringify(lotsGaine(g)));
        delete g.ajouts;
      }
      valider();
    });
    if (optPlans().longueurs_actif) {
      const L = longueurGaine(g);
      if (L) {
        z.append(
          h(
            "div",
            {
              class: "sous",
              title:
                "Parcours sur le plan + différence de hauteur des deux bouts ; fils : + réserve à chaque bout (⚙ Options > Hauteurs et réserves)",
            },
            "Longueur : ",
            h("b", {}, metres(L.total)),
            L.impose ? " (imposée)" : " (plan " + metres(L.plan) + " + hauteur " + metres(L.vertical) + ")",
            " · fils : ",
            h("b", {}, metres(L.fil))
          )
        );
        const sm = h(
          "select",
          { style: "width:auto" },
          h("option", { value: "" }, "Mesure : comme les options (" + MESURES_GAINE[mesureDe({})].toLowerCase() + ")"),
          Object.entries(MESURES_GAINE).map(([k, l]) => h("option", { value: k }, l))
        );
        sm.value = MESURES_GAINE[g.mesure] ? g.mesure : "";
        sm.addEventListener("change", () => {
          if (sm.value) g.mesure = sm.value;
          else delete g.mesure;
          valider();
        });
        const li = h("input", {
          type: "number",
          min: 0,
          step: 0.1,
          value: g.long > 0 ? g.long : "",
          placeholder: "auto",
          style: "width:70px",
        });
        li.addEventListener("change", () => {
          const v = nombre(li.value);
          if (v > 0) g.long = v;
          else delete g.long;
          valider();
        });
        z.append(
          h(
            "div",
            { style: "display:flex;gap:6px;align-items:center;flex-wrap:wrap" },
            moul ? "" : sm, // (moulure : longueur du tracé le long des murs, pas de choix)
            h(
              "label",
              { class: "case", title: "Longueur réelle de la gaine, hauteurs comprises (passage par un autre chemin…)" },
              "Imposée (m)",
              li
            )
          )
        );
      }
    }
    z.append(
      h(
        "label",
        { class: "case", title: "Décoché : tout le contenu à taper (repère, fils, section de chaque lot)" },
        auto,
        "Fils calculés d'après les appareils"
      )
    );
    if (!g.lots) {
      const ajouts = g.ajouts || [];
      const calcules = lots.filter(l => !ajouts.includes(l));
      if (!calcules.length)
        z.append(h("div", { class: "sous" }, "Aucun fil calculé (appareil sans fils, ou boîtes sans appareil au-delà)."));
      calcules.forEach(l => {
        const k = lots.indexOf(l),
          cle = cleSection(l);
        const sc = h(
          "select",
          {
            style: "padding:2px 4px;font-size:12px;height:26px;width:58px;flex:none",
            title: "Section de ce lot dans cette gaine (sinon : celle du circuit)",
          },
          ["1,5", "2,5", "4", "6", "10"].map(v => h("option", { value: v }, v))
        );
        sc.value = l.section || "2,5";
        sc.addEventListener("change", () => {
          g.sections = { ...(g.sections || {}), [cle]: sc.value };
          valider();
        });
        z.append(
          h(
            "div",
            { style: "display:flex;align-items:center;gap:6px;flex-wrap:wrap" },
            h("span", {}, ...l.fils.map((_, i) => tick(l, k, i))),
            h("b", {}, l.rep || ""),
            h(
              "span",
              { class: "sous", style: "flex:1" },
              parCouleur ? l.fils.map((_, i) => CODES_COULEUR[couleurFil(g, k, l, i)]).join(" ") : l.fils.join(" ")
            ),
            l.fils.includes("C") ? null : sc
          )
        );
      });
      if (g.sections)
        z.append(
          h(
            "button",
            {
              class: "btn petit",
              style: "align-self:flex-start",
              onclick: () => {
                delete g.sections;
                valider();
              },
            },
            "Sections d'après les circuits"
          )
        );
      ajouts.forEach((l, i) => z.append(ligneLot(l, lots.indexOf(l), ajouts, i)));
      z.append(
        h(
          "button",
          {
            class: "btn petit",
            style: "align-self:flex-start",
            title: "Fils en plus de ceux calculés (ex. un retour de plus, une navette)",
            onclick: () => {
              g.ajouts = [
                ...ajouts,
                parCouleur ? { rep: "", fils: ["F"], couleurs: ["violet"], section: "1,5" } : { rep: "", fils: ["R"], section: "1,5" },
              ];
              valider();
            },
          },
          "+ Fils en plus"
        )
      );
    } else {
      g.lots.forEach((l, i) => z.append(ligneLot(l, i, g.lots, i)));
      z.append(
        h(
          "button",
          {
            class: "btn petit",
            style: "align-self:flex-start",
            onclick: () => {
              g.lots.push(nouveauLot());
              valider();
            },
          },
          "+ Lot de fils"
        )
      );
    }
    z.append(h("div", { class: "sous" }, aideLettres + " (⚙ Options > Gaines : lettres de fonction ou de couleur)."));
    z.append(h("div", { class: "sous" }, "Cliquez un petit trait de couleur pour changer la couleur du fil."));
    z.append(
      h(
        "button",
        {
          class: "btn petit",
          style: "align-self:flex-start",
          title:
            "Toutes les gaines de ce niveau, y compris celles nommées à la main : A, B, C… du tableau puis de boîte en boîte, dans le sens des aiguilles d'une montre",
          onclick: async () => {
            if (
              (d.gaines || []).some(x => x.nom && !x.nomAuto) &&
              !(await demanderOui(
                "Renommer toutes les gaines dans le sens des aiguilles d'une montre, y compris celles nommées à la main ?"
              ))
            )
              return;
            for (const x of d.gaines) {
              if (gaineANommer(x)) {
                x.nom = "?";
                x.nomAuto = true;
              } else {
                delete x.nom;
                delete x.nomAuto;
              }
            }
            valider();
            toast("Gaines renommées.");
          },
        },
        "↻ Renommer les gaines (sens horaire)"
      )
    );
    // (fils dessinés sur un autre morceau du parcours que le plus long : ◀ ▶)
    {
      const ch = cheminGaine(g);
      if (ch && ch.length > 2) {
        const n = ch.length - 1,
          plusLong = (() => {
            let k = 1;
            for (let i = 2; i <= n; i++) if (dist(ch[i - 1], ch[i]) > dist(ch[k - 1], ch[k])) k = i;
            return k;
          })(),
          ici = g.morceauFils > 0 && g.morceauFils <= n ? g.morceauFils : plusLong;
        const aller = dk => {
          let k = ici;
          do k = ((k - 1 + dk + n) % n) + 1;
          while (dist(ch[k - 1], ch[k]) < 3 && k !== ici); // (pas le petit bout entre l'appareil et le mur)
          if (k === plusLong) delete g.morceauFils;
          else g.morceauFils = k;
          valider();
        };
        z.append(
          h(
            "div",
            { style: "display:flex;gap:6px;align-items:center" },
            h("span", { class: "sous" }, "Fils dessinés sur le morceau " + ici + " / " + n + (ici === plusLong ? " (le plus long)" : "")),
            h("button", { class: "btn petit", title: "Morceau précédent", onclick: () => aller(-1) }, "◀"),
            h("button", { class: "btn petit", title: "Morceau suivant", onclick: () => aller(1) }, "▶")
          )
        );
      }
    }
    if ((g.pts || []).length)
      z.append(
        h("div", { class: "sous" }, "Glissez les ronds pour déplacer les coudes, les petits ronds bleus pour en ajouter."),
        h(
          "button",
          {
            class: "btn petit",
            style: "align-self:flex-start",
            onclick: () => {
              g.pts = [];
              valider();
            },
          },
          "Enlever les coudes (trait direct)"
        )
      );
    else if (!moul)
      z.append(
        h("div", { class: "sous" }, "Glissez la poignée ronde pour courber la gaine."),
        ...(g.dc
          ? [
              h(
                "button",
                {
                  class: "btn petit",
                  style: "align-self:flex-start",
                  onclick: () => {
                    delete g.dc;
                    valider();
                  },
                },
                "Trait droit"
              ),
            ]
          : [])
      );
    return z;
  }
  /** menu des 9 couleurs pour un fil d'une gaine */
  function menuCouleurFil(e, g, l, k, i) {
    e.stopPropagation();
    const f = l.fils[i],
      c = l.cid && circuitDe(l.cid),
      main = !!g.lots || (g.ajouts || []).includes(l);
    const poser = v => {
      if (main) {
        l.couleurs = l.couleurs || [];
        if (v) l.couleurs[i] = v;
        else delete l.couleurs[i];
      } else {
        g.couleurs = g.couleurs || {};
        if (v) g.couleurs[cleFil(l, k, i)] = v;
        else delete g.couleurs[cleFil(l, k, i)];
        if (!Object.keys(g.couleurs).length) delete g.couleurs;
      }
    };
    const actuel = couleurFil(g, k, l, i);
    const pastille = cf =>
      h("span", {
        style: `display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px;vertical-align:-1px;background:${cf === "vj" ? "repeating-linear-gradient(90deg,#16a34a 0 3px,#facc15 3px 6px)" : hexFil(cf)}`,
      });
    const entrees = Object.entries(COULEURS_FIL).map(([cf, [lib]]) => ({
      libelle: h("span", {}, pastille(cf), lib + (cf === "blanc" ? " (dessiné en rose)" : "")),
      coche: cf === actuel,
      action: () => {
        poser(cf);
        valider();
      },
    }));
    entrees.push("-", {
      libelle: "Couleur d'origine",
      action: () => {
        poser(null);
        valider();
      },
    });
    if (c)
      entrees.push({
        libelle: "Tous les « " + f + " » du circuit " + (c.nom || "") + "…",
        aide: "Même couleur pour ce fil dans toutes les gaines du circuit (ex. retour du bouton et de la lampe)",
        sous: Object.entries(COULEURS_FIL).map(([cf, [lib]]) => ({
          libelle: h("span", {}, pastille(cf), lib),
          coche: (c.couleurs || {})[f] === cf,
          action: () => {
            c.couleurs = { ...(c.couleurs || {}), [f]: cf };
            for (const g2 of d.gaines) {
              if (g2.couleurs)
                for (const kk of Object.keys(g2.couleurs)) {
                  const [rep2, n] = kk.split(":");
                  const l2 = lotsTries(g2).find((x, j) => (x.rep || "#" + j) === rep2);
                  if (l2 && l2.cid === c.id && l2.fils[n] === f) delete g2.couleurs[kk];
                }
            }
            poser(null);
            valider();
            toast("Fils « " + f + " » du circuit en " + lib.toLowerCase() + ".");
          },
        })),
      });
    ouvrirMenuContextuel(e.clientX, e.clientY, entrees);
  }
  /* -- métrés : longueurs des gaines et des fils -- */
  const hauteurs = () => ({ ...HAUTEURS, ...(optPlans().hauteurs || {}) });
  /** hauteur de pose d'un objet (cm du sol) : la sienne, sinon d'après son genre */
  function hauteurDe(o) {
    if (o.h != null && o.h !== "") return Number(o.h);
    const H = hauteurs(),
      cat = (SYMB[o.type] || {}).categorie || "";
    if (o.type === "boite") return H.boite;
    if (o.type === "traversee") return o.cote === "sol" ? 0 : H.plafond;
    if (o.type === "tableau" || o.type === "compteur") return H.tableau;
    if (cat === "Commandes") return H.commande;
    if (o.haute && PRISES.includes(o.type)) return H.prise_haute;
    if (cat === "Éclairage") return ["applique", "baes"].includes(o.type) ? H.applique : H.plafond;
    if (o.type === "vmc" || o.type === "detecteur" || o.type === "daaf") return H.plafond;
    return H.prise;
  }
  /** longueur d'une gaine (cm) : son tracé sur le plan + la différence de hauteur entre ses deux bouts */
  /** mesure du parcours sur le plan : ligne droite entre les deux bouts (par défaut : la courbe du dessin sert à la
   *  lisibilité, la gaine ne la suit pas), d'équerre (le long des murs et du plafond), ou le tracé dessiné ; imposée */
  const MESURES_GAINE = {
    droit: "En ligne droite d'un bout à l'autre",
    equerre: "D'équerre (le long des murs, du plafond)",
    trace: "Le tracé dessiné (courbe comprise)",
  };
  const mesureDe = g =>
    g.de && conduitDe(g) === "moulure"
      ? "trace" // (moulure : sa longueur est celle de son tracé, le long des murs ; pas de choix)
      : MESURES_GAINE[g.mesure]
        ? g.mesure
        : MESURES_GAINE[optPlans().mesure_gaines]
          ? optPlans().mesure_gaines
          : "droit";
  function longueurGaine(g) {
    const A = objetDe(g.de),
      B = objetDe(g.vers),
      ch = cheminGaine(g);
    if (!A || !B || !ch) return null;
    let plan = 0;
    const mes = mesureDe(g);
    if (g.long > 0) plan = g.long * 100;
    else if (mes === "droit") plan = dist(ch[0], ch[ch.length - 1]);
    else if (mes === "equerre") plan = Math.abs(ch[ch.length - 1].x - ch[0].x) + Math.abs(ch[ch.length - 1].y - ch[0].y);
    else if (ch.length === 2) {
      const c = controleGaine(g, ch[0], ch[1]);
      let pr = ch[0];
      for (let i = 1; i <= 24; i++) {
        const t = i / 24,
          q = {
            x: (1 - t) ** 2 * ch[0].x + 2 * (1 - t) * t * c.x + t * t * ch[1].x,
            y: (1 - t) ** 2 * ch[0].y + 2 * (1 - t) * t * c.y + t * t * ch[1].y,
          };
        plan += dist(pr, q);
        pr = q;
      }
    } else for (let i = 1; i < ch.length; i++) plan += dist(ch[i - 1], ch[i]);
    // (moulure : elle descend ou remonte à chaque appareil depuis sa hauteur de pose)
    let vertical = Math.abs(hauteurDe(A) - hauteurDe(B));
    if (conduitDe(g) === "moulure") {
      // (descentes et montées le long du parcours : aux appareils, aux angles…)
      const hs = hauteursMoulure(g, ch);
      vertical = Math.abs(ecartMoulure(A, hs[0])) + Math.abs(ecartMoulure(B, hs[hs.length - 1]));
      for (let i = 1; i < hs.length; i++) vertical += Math.abs(hs[i] - hs[i - 1]);
      // (portes contournées par-dessus : montée et descente le long du cadre)
      for (const pc of portesContournees(g, ch, hs)) vertical += 2 * (hauteurs().passage_porte - pc.h);
    }
    const H = hauteurs();
    const res = o => (estNoeud(o) ? H.reserve_boite : H.reserve_app);
    if (g.long > 0) return { plan, vertical: 0, total: plan, fil: plan + res(A) + res(B), impose: true };
    return { plan, vertical, total: plan + vertical, fil: plan + vertical + res(A) + res(B), mesure: mes };
  }
  const metres = cm => (Math.ceil(cm / 10) / 10).toFixed(1).replace(".", ",") + " m";
  /** métré des moulures à commander : une portion de mur où passent plusieurs moulures (deux prises desservies depuis la
   *  même boîte, le long du même mur) est comptée une fois, dans la plus grande taille ; idem pour une montée ou une
   *  descente commune. Angles : entrant (coin rentrant de deux murs), sortant (coin saillant), plat (passage de
   *  l'horizontale à la verticale sur un même mur, ou changement de direction au plafond).
   *  → { taille: { cm, entrant, sortant, plat } } */
  function metreMoulures(gs) {
    const surf = k => surfM(String(k).split("|")[1]) || 0, // (clé : « moulure|22x12 » ou « goulotte|60x40 »)
      segs = [],
      verts = new Map(),
      coins = new Map();
    const r = (v, p) => Math.round(v / p) * p;
    for (const g of gs) {
      if (conduitDe(g) !== "moulure" || g.long > 0) continue;
      const A = objetDe(g.de),
        B = objetDe(g.vers),
        ch = cheminGaine(g);
      if (!A || !B || !ch) continue;
      const tl = (estGoulotte(g) ? "goulotte|" : "moulure|") + tailleGaine(g),
        hs = hauteursMoulure(g, ch),
        cb = morceauxCombles(g, ch);
      for (let i = 1; i < ch.length; i++) if (!cb[i - 1]) segs.push({ a: ch[i - 1], b: ch[i], h: hs[i - 1], tl });
      // (montées et descentes : aux deux bouts et aux changements de hauteur en route)
      const vert = (q, h0, h1, angles) => {
        if (Math.abs(h1 - h0) < 1) return;
        const k = r(q.x, 4) + "|" + r(q.y, 4) + "|" + r(Math.min(h0, h1), 5) + "|" + r(Math.max(h0, h1), 5);
        const v = verts.get(k);
        if (!v || surf(tl) > surf(v.tl)) verts.set(k, { cm: Math.abs(h1 - h0), tl, plat: angles });
      };
      vert(ch[0], hauteurDe(A), hauteurDe(A) - ecartMoulure(A, hs[0]), 1);
      vert(ch[ch.length - 1], hauteurDe(B), hauteurDe(B) - ecartMoulure(B, hs[hs.length - 1]), 1);
      for (let i = 1; i < hs.length; i++) vert(ch[i], hs[i - 1], hs[i], 2);
      for (const pc of portesContournees(g, ch, hs)) {
        const k = "porte|" + pc.id + "|" + r(pc.h, 5),
          v = verts.get(k),
          Hp = hauteurs().passage_porte;
        if (!v || surf(tl) > surf(v.tl)) verts.set(k, { cm: 2 * (Hp - pc.h), tl, plat: 4 });
      }
      // (coins en plan : entre deux tronçons assez longs — le petit bout entre l'appareil et le mur ne compte pas)
      for (let i = 1; i < ch.length - 1; i++) {
        const p = ch[i - 1],
          q = ch[i],
          s = ch[i + 1],
          l1 = dist(p, q),
          l2 = dist(q, s);
        if (l1 < 15 || l2 < 15) continue;
        const d1 = { x: (q.x - p.x) / l1, y: (q.y - p.y) / l1 },
          d2 = { x: (s.x - q.x) / l2, y: (s.y - q.y) / l2 };
        if (d1.x * d2.x + d1.y * d2.y > 0.87) continue; // (moins de 30° : pas un angle)
        let genre = "plat";
        const mp = murProche({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }, 40);
        if (mp) {
          // (côté de la pièce où passe la moulure : on tourne vers lui = coin rentrant)
          const m = mp.m,
            L = dist(m.a, m.b) || 1,
            nx = -(m.b.y - m.a.y) / L,
            ny = (m.b.x - m.a.x) / L,
            cote = ((p.x + q.x) / 2 - mp.q.x) * nx + ((p.y + q.y) / 2 - mp.q.y) * ny >= 0 ? 1 : -1;
          genre = (d2.x * nx + d2.y * ny) * cote > 0 ? "entrant" : "sortant";
        }
        const k = r(q.x, 4) + "|" + r(q.y, 4) + "|" + r(hs[i - 1], 5);
        const c = coins.get(k);
        if (!c || surf(tl) > surf(c.tl)) coins.set(k, { genre, tl });
      }
    }
    const res = {};
    const tot = tl => (res[tl] = res[tl] || { cm: 0, entrant: 0, sortant: 0, plat: 0 });
    // (tronçons sur une même ligne et à la même hauteur : réunis, chaque morceau compté une fois dans la plus grande taille)
    const groupes = new Map();
    for (const sg of segs) {
      const L = dist(sg.a, sg.b);
      if (L < 0.5) continue;
      let ux = (sg.b.x - sg.a.x) / L,
        uy = (sg.b.y - sg.a.y) / L;
      if (ux < -1e-6 || (Math.abs(ux) < 1e-6 && uy < 0)) {
        ux = -ux;
        uy = -uy;
      }
      const ang = r((Math.atan2(uy, ux) * 180) / Math.PI, 1),
        off = r(-uy * sg.a.x + ux * sg.a.y, 3),
        k = ang + "|" + off + "|" + r(sg.h, 5);
      const t0 = ux * sg.a.x + uy * sg.a.y,
        t1 = ux * sg.b.x + uy * sg.b.y;
      (groupes.get(k) || groupes.set(k, []).get(k)).push({ t0: Math.min(t0, t1), t1: Math.max(t0, t1), tl: sg.tl });
    }
    for (const iv of groupes.values()) {
      const bornes = [...new Set(iv.flatMap(x => [x.t0, x.t1]))].sort((a, b) => a - b);
      for (let i = 1; i < bornes.length; i++) {
        const m = (bornes[i - 1] + bornes[i]) / 2,
          dedans = iv.filter(x => x.t0 <= m && m <= x.t1);
        if (!dedans.length) continue;
        const tl = dedans.reduce((a, x) => (surf(x.tl) > surf(a) ? x.tl : a), dedans[0].tl);
        tot(tl).cm += bornes[i] - bornes[i - 1];
      }
    }
    for (const v of verts.values()) {
      tot(v.tl).cm += v.cm;
      tot(v.tl).plat += v.plat;
    }
    for (const c of coins.values()) tot(c.tl)[c.genre]++;
    // (longueur imposée à la main : comptée telle quelle)
    for (const g of gs)
      if (conduitDe(g) === "moulure" && g.long > 0) tot((estGoulotte(g) ? "goulotte|" : "moulure|") + tailleGaine(g)).cm += g.long * 100;
    return res;
  }
  function fenetreHauteurs() {
    const H = hauteurs(),
      champs = {};
    const ch = (k, lib, aide) => {
      const i = h("input", { type: "number", min: 0, max: 600, step: 5, value: H[k], style: "width:80px" });
      champs[k] = i;
      return h("label", { class: "champ" }, h("span", {}, lib), i, aide ? h("span", { class: "aide" }, aide) : null);
    };
    ouvrirModale(
      "Hauteurs et réserves",
      h(
        "div",
        { class: "pile" },
        h(
          "p",
          { class: "aide", style: "margin:0" },
          "Longueur d'une gaine = son parcours sur le plan (ligne droite, d'équerre ou tracé : ⚙ Options > Devis et métrés) + la différence de hauteur entre ses deux bouts. Longueur des fils = longueur de la gaine + la réserve à chaque bout. Hauteurs en cm depuis le sol ; une boîte ou un appareil peut avoir la sienne (panneau de droite)."
        ),
        h(
          "div",
          { class: "deux" },
          ch("plafond", "Plafond (points lumineux, VMC, détecteurs)"),
          ch("boite", "Boîtes de dérivation", "Dans les combles : au-dessus du plafond")
        ),
        h("div", { class: "deux" }, ch("tableau", "Tableau (arrivée des gaines)"), ch("commande", "Interrupteurs, poussoirs, thermostats")),
        h("div", { class: "deux" }, ch("prise", "Prises et autres appareils"), ch("applique", "Appliques, BAES")),
        h("div", { class: "deux" }, ch("prise_haute", "Prises hautes (marquées H)", "Case « Prise haute » de la prise"), h("span", {})),
        h("div", { class: "deux" }, ch("moulure_basse", "Moulures en partie basse"), ch("moulure_haute", "Moulures en partie haute")),
        h(
          "div",
          { class: "deux" },
          ch(
            "passage_porte",
            "Moulures : passage au-dessus des portes",
            "Porte (2,04 m) + chambranle ; la moulure monte, passe et redescend"
          ),
          h("span", {})
        ),
        h(
          "div",
          { class: "deux" },
          ch("reserve_app", "Réserve de fil côté appareillage"),
          ch("reserve_boite", "Réserve de fil côté boîte ou tableau")
        )
      ),
      [
        h(
          "button",
          {
            class: "btn",
            onclick: async () => {
              try {
                await enregistrerPlans({ hauteurs: null });
                fermerModale();
                majPanneau();
              } catch (e) {
                erreur(e);
              }
            },
          },
          "Valeurs d'origine"
        ),
        h("button", { class: "btn", onclick: fermerModale }, "Annuler"),
        h(
          "button",
          {
            class: "btn principal",
            onclick: async () => {
              try {
                await enregistrerPlans({ hauteurs: Object.fromEntries(Object.entries(champs).map(([k, i]) => [k, nombre(i.value) || 0])) });
                fermerModale();
                majPanneau();
                toast("Hauteurs enregistrées.");
              } catch (e) {
                erreur(e);
              }
            },
          },
          "Enregistrer"
        ),
      ],
      { largeur: "min(600px, 94vw)" }
    );
  }
  /** registre des gaines et moulures (pieuvre) imprimable : chaque gaine, ses fils, ses longueurs ; totaux à commander */
  function registreGaines() {
    const tous = [...d.gaines].filter(g => objetDe(g.de) && objetDe(g.vers));
    if (!tous.length) {
      toast("Aucune gaine dans ce niveau.", true);
      return;
    }
    const nomO = o =>
      estNoeud(o) ? nomNoeud(o) : (repereDe(o) || (SYMB[o.type] || {}).libelle || "?") + (o.piece ? " (" + o.piece + ")" : "");
    const cle = g => (g.nom ? [0, g.nom.length, g.nom] : [1, 0, ""]);
    tous.sort((a, b) => {
      const x = cle(a),
        y = cle(b);
      return x[0] - y[0] || x[1] - y[1] || x[2].localeCompare(y[2], "fr", { numeric: true });
    });
    const parDiam = {},
      parFil = {};
    const lignes = tous.map(g => {
      const lots = lotsTries(g),
        L = longueurGaine(g),
        tl = tailleGaine(g),
        cle = conduitDe(g) + "|" + tl,
        dm =
          (conduitDe(g) === "moulure" ? nomConduit(g) + " " : "") +
          libTaille(g, tl) +
          (conduitDe(g) === "moulure" ? " (" + libPoses(g) + ")" : "");
      if (conduitDe(g) !== "moulure") parDiam[cle] = (parDiam[cle] || 0) + L.total; // (moulures : métré à part, plus bas)
      lots.forEach((l, k) =>
        l.fils.forEach((f, i) => {
          const cf = couleurFil(g, k, l, i),
            sec = f === "C" ? "câble" : l.section || "2,5",
            kk = cf + "|" + sec;
          parFil[kk] = (parFil[kk] || 0) + L.fil;
        })
      );
      const fils = lots
        .map(
          (l, k) =>
            `<span class="lot">${l.fils
              .map((_, i) => {
                const cf = couleurFil(g, k, l, i);
                return `<i style="display:inline-block;width:4px;height:13px;margin-right:2px;transform:skewX(-25deg);background:${cf === "vj" ? "repeating-linear-gradient(#16a34a 0 3px,#facc15 3px 6px)" : hexFil(cf)}"></i>`;
              })
              .join("")} <b>${echapper(l.rep || "")}</b> ${echapper(l.section || "")}</span>`
        )
        .join(" ");
      return `<tr><td><b>${echapper(g.nom || "—")}</b></td><td>${echapper(nomO(objetDe(g.de)))} → ${echapper(nomO(objetDe(g.vers)))}</td><td>${echapper(dm)}</td><td style="text-align:right">${metres(L.total)}</td><td>${fils}</td><td style="text-align:right">${metres(L.fil)}</td><td style="width:18px;border-left:1px solid #999"></td></tr>`;
    });
    const tDiam = Object.entries(parDiam)
      .sort((a, b) => a[0].localeCompare(b[0], "fr", { numeric: true }))
      .map(([k, cm]) => {
        const [c, t] = k.split("|");
        return `<tr><td>${CONDUITS[c]} Ø${t}</td><td style="text-align:right"><b>${metres(cm)}</b></td><td></td></tr>`;
      })
      .join("");
    const mm = metreMoulures(tous),
      angles = x =>
        [
          [x.entrant, "angle entrant", "angles entrants"],
          [x.sortant, "angle sortant", "angles sortants"],
          [x.plat, "angle plat", "angles plats"],
        ]
          .filter(([n]) => n)
          .map(([n, a, b]) => n + " " + (n > 1 ? b : a))
          .join(", ");
    const tMoul = Object.entries(mm)
      .sort((a, b) => a[0].localeCompare(b[0]) || surfM(a[0].split("|")[1]) - surfM(b[0].split("|")[1]))
      .map(
        ([t, x]) =>
          `<tr><td>${t.startsWith("goulotte") ? "Goulotte" : "Moulure"} ${t.split("|")[1].replace("x", "×")}</td><td style="text-align:right"><b>${metres(x.cm)}</b></td><td>${angles(x) || "—"}</td></tr>`
      )
      .join("");
    const tFil = Object.entries(parFil)
      .sort()
      .map(([k, cm]) => {
        const [cf, sec] = k.split("|");
        return `<tr><td>${sec === "câble" ? "Câble courant faible" : "Fil " + sec + " mm² " + (COULEURS_FIL[cf] || [cf])[0].toLowerCase()}</td><td style="text-align:right"><b>${metres(cm)}</b></td></tr>`;
      })
      .join("");
    const H = hauteurs(),
      niv = d.niveaux.length > 1 ? " — " + ((d.niveaux.find(n => n.id === d.niveau) || {}).nom || "") : "";
    const w = window.open("", "_blank");
    if (!w) {
      toast("La fenêtre d'impression a été bloquée par le navigateur.", true);
      return;
    }
    w.document.write(`<!doctype html><meta charset="utf-8"><title>Registre des gaines et moulures — ${echapper(nom.value || "Plan")}</title>
<style>@page{size:A4 portrait;margin:10mm}body{font-family:Arial,sans-serif;font-size:12px;margin:14mm;color:#000}h1{font-size:17px;margin:0 0 2px}h3{font-size:13px;margin:12px 0 0}
table{border-collapse:collapse;width:100%;margin-top:8px}td,th{border-bottom:1px solid #bbb;padding:4px 6px;vertical-align:middle}th{text-align:left;background:#f1f5f9}thead{display:table-header-group}tr{break-inside:avoid}
.reg td:nth-child(2){max-width:42mm}.lot{display:inline-block;white-space:nowrap;margin:1px 8px 1px 0}.sous{color:#444}.deux{display:flex;gap:30px;break-inside:avoid}.deux>div{flex:1}
@media print{button{display:none}body{margin:0;font-size:9.5px}h1{font-size:14px}td,th{padding:2px 4px}th{-webkit-print-color-adjust:exact;print-color-adjust:exact}i{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
<h1>Registre des gaines et moulures — ${echapper(nom.value || "Plan")}${echapper(niv)}</h1><div class="sous">${echapper([p.client_nom, (p.adresse || "").replace(/\n/g, ", "), new Date().toLocaleDateString("fr-FR")].filter(Boolean).join(" · "))}</div>
<div class="sous">Hauteurs : plafond ${H.plafond} cm, boîtes ${H.boite} cm, tableau ${H.tableau} cm, commandes ${H.commande} cm, prises ${H.prise} cm · réserve des fils ${H.reserve_app} cm côté appareillage, ${H.reserve_boite} cm côté boîte</div>
<button onclick="print()" style="margin:8px 0">Imprimer</button>
<table class="reg"><thead><tr><th>Gaine</th><th>De → vers</th><th>Conduit</th><th>Longueur</th><th>Fils</th><th>Fils (chacun)</th><th>✓</th></tr></thead><tbody>${lignes.join("")}</tbody></table>
<div class="deux"><div><h3>Gaines et moulures à prévoir</h3><table>${tDiam}${tMoul}</table>${tMoul ? `<div class="sous" style="margin-top:4px">Moulures et goulottes : une portion où passent plusieurs moulures est comptée une fois, dans la plus grande taille (vérifiez que tous les fils y tiennent) ; montées et descentes comprises.</div>` : ""}</div><div><h3>Fils à prévoir</h3><table>${tFil}</table></div></div>`);
    w.document.close();
  }
  /** liste du matériel imprimable : le total du plan (niveau affiché), puis pièce par pièce, et les blocs */
  function imprimerMateriel() {
    const symbs = d.objets.filter(o => o.genre === "symbole" && !estDecor(o));
    const cle = cleMateriel;
    const lib = libMateriel;
    const table = liste => {
      const c = {};
      liste.forEach(o => (c[cle(o)] = (c[cle(o)] || 0) + 1));
      const l = Object.entries(c).sort((a, b) => b[1] - a[1] || lib(a[0]).localeCompare(lib(b[0])));
      return l.length
        ? `<table>${l.map(([t, n]) => `<tr><td>${echapper(lib(t))}</td><td class="n">${n}</td><td class="c">☐</td></tr>`).join("")}</table>`
        : `<p class="sous">Aucun appareil.</p>`;
    };
    const vus = new Set();
    const parPiece = d.pieces
      .map(pc => {
        const l = symbs.filter(o => !vus.has(o.id) && dansPolygone(o, pc.pts));
        l.forEach(o => vus.add(o.id));
        return l.length ? `<div class="bloc"><h3>${echapper(pc.nom || "Pièce sans nom")} · ${l.length}</h3>${table(l)}</div>` : "";
      })
      .join("");
    const hors = symbs.filter(o => !vus.has(o.id));
    const cb = {};
    for (const b of d.blocs || []) {
      const ms = b.membres.map(objetDe).filter(Boolean);
      if (ms.length < 2) continue;
      const k =
        ms.length +
        " postes : " +
        ms
          .map(o => lib(cle(o)))
          .sort()
          .join(" + ");
      cb[k] = (cb[k] || 0) + 1;
    }
    const blocs = Object.keys(cb).length
      ? `<h2>Blocs (même boîtier, même plaque)</h2><table>${Object.entries(cb)
          .sort()
          .map(([k, n]) => `<tr><td>${echapper(k)}</td><td class="n">${n}</td><td class="c">☐</td></tr>`)
          .join("")}</table>`
      : "";
    const niv = d.niveaux.length > 1 ? " — " + ((d.niveaux.find(n => n.id === d.niveau) || {}).nom || "") : "";
    const w = window.open("", "_blank");
    if (!w) {
      toast("La fenêtre d'impression a été bloquée par le navigateur.", true);
      return;
    }
    w.document.write(`<!doctype html><meta charset="utf-8"><title>Matériel — ${echapper(nom.value || "Plan")}</title>
<style>@page{size:A4 portrait;margin:10mm}body{font-family:Arial,sans-serif;font-size:12px;margin:14mm;color:#000}h1{font-size:17px;margin:0 0 2px}
h2{font-size:14px;margin:14px 0 4px}h3{font-size:12.5px;margin:0 0 2px}table{border-collapse:collapse;width:100%}td{border-bottom:1px solid #ccc;padding:3px 6px}
td.n{text-align:right;font-weight:700;width:12mm}td.c{width:6mm;text-align:center}.sous{color:#444}.pieces{columns:2;column-gap:10mm}.bloc{break-inside:avoid;margin-bottom:10px}
@media print{button{display:none}body{margin:0}}</style>
<h1>Matériel — ${echapper(nom.value || "Plan")}${echapper(niv)}</h1><div class="sous">${echapper([p.client_nom, (p.adresse || "").replace(/\n/g, ", "), new Date().toLocaleDateString("fr-FR")].filter(Boolean).join(" · "))}</div>
<button onclick="print()" style="margin:8px 0">Imprimer</button>
<div style="max-width:120mm"><h2>Tout le plan · ${symbs.length} appareil(s)</h2>${table(symbs)}${blocs}</div>
${parPiece || hors.length ? `<h2>Par pièce</h2><div class="pieces">${parPiece}${hors.length ? `<div class="bloc"><h3>Hors des pièces · ${hors.length}</h3>${table(hors)}</div>` : ""}</div>` : ""}
<p class="sous" style="margin-top:12px">Appareils posés sur le plan (sanitaires et mobilier non comptés). Gaines, moulures et fils : registre des gaines et moulures.</p>`);
    w.document.close();
  }
  /* -- devis : ouvrages du catalogue d'après les appareils du plan -- */
  /* ensembles d'appareils (personnalisables) : plusieurs appareils reliés par des liaisons, chiffrés par un seul ouvrage
   * (ex. 1 interrupteur + 1 point lumineux = « simple allumage », 2 va-et-vient + 1 point = « va-et-vient »).
   * Composition : genres d'appareils, ou « n'importe quelle lumière / commande / prise ». Le reste : à l'unité. */
  const GENRES_LARGES = {
    "@lumiere": ["N'importe quel point lumineux", o => LUMIERES.includes(o.type) && o.type !== "prise_cmd"],
    "@commande": ["N'importe quelle commande", o => COMMANDES.includes(o.type)],
    "@prise": ["N'importe quelle prise", o => PRISES.includes(o.type)],
  };
  const ENSEMBLES_DEFAUT = [
    [
      "Simple allumage",
      [
        ["inter", 1],
        ["@lumiere", 1],
      ],
      "@sa",
    ],
    [
      "Double allumage",
      [
        ["inter_double", 1],
        ["@lumiere", 2],
      ],
      "@double",
    ],
    [
      "Va-et-vient",
      [
        ["inter_va", 2],
        ["@lumiere", 1],
      ],
      "@vv",
    ],
    [
      "Télérupteur",
      [
        ["poussoir", 1],
        ["@lumiere", 1],
      ],
      "@tl",
    ],
  ];
  /** ensembles enregistrés ; la première fois : ceux d'exemple (avec les ouvrages des anciens forfaits s'il y en avait) */
  function ensemblesPlan() {
    const o = optPlans();
    if (Array.isArray(o.ensembles)) return JSON.parse(JSON.stringify(o.ensembles));
    const anciens = o.ouvrages_plan || {};
    return ENSEMBLES_DEFAUT.map(([nom, compo, cle], k) => ({
      id: "e" + k,
      nom,
      compo,
      ouvrages: Object.fromEntries(
        Object.keys(TYPES_CHANTIER)
          .map(tc => [tc, (anciens[tc] || {})[cle] || null])
          .filter(x => x[1])
      ),
    }));
  }
  const libGenre = t => (GENRES_LARGES[t] ? GENRES_LARGES[t][0] : (SYMB[t] || {}).libelle || t);
  /** appareils reliés par les liaisons (tous niveaux, liens entre niveaux compris), groupe par groupe */
  function groupesLies() {
    const objs = objetsPartout().filter(o => o.genre === "symbole" && SYMB[o.type] && !estNoeud(o) && !estDecor(o)),
      parId = new Map(objs.map(o => [o.id, o]));
    const lis = [
      ...d.liaisons,
      ...autresNiveaux().flatMap(([, e]) => (e && e.liaisons) || []),
      ...(d.liens_niveaux || []).map(l => ({ de: l.a, vers: l.b })),
    ];
    const vus = new Set(),
      res = [];
    for (const o of objs) {
      if (vus.has(o.id)) continue;
      const comp = [],
        file = [o.id];
      vus.add(o.id);
      while (file.length) {
        const x = file.shift();
        comp.push(parId.get(x));
        for (const l of lis) {
          const y = l.de === x ? l.vers : l.vers === x ? l.de : null;
          if (y && !vus.has(y) && parId.has(y)) {
            vus.add(y);
            file.push(y);
          }
        }
      }
      res.push(comp);
    }
    return res;
  }
  /** ensembles trouvés dans le plan : [{ ens, objets }], les plus gros d'abord, autant de fois qu'ils sont dans un groupe */
  function ensemblesTrouves(ensembles, accepte) {
    const tries = ensembles
      .filter(e => (e.compo || []).length && (!accepte || accepte(e)))
      .sort((a, b) => b.compo.reduce((t, [, n]) => t + n, 0) - a.compo.reduce((t, [, n]) => t + n, 0));
    const res = [];
    for (const groupe of groupesLies()) {
      const libres = [...groupe];
      for (const e of tries)
        for (;;) {
          // (genres précis d'abord, puis « n'importe quel… »)
          const compo = [...e.compo].sort((a, b) => !!GENRES_LARGES[a[0]] - !!GENRES_LARGES[b[0]]),
            pris = [];
          let ok = true;
          for (const [t, n] of compo) {
            const test = GENRES_LARGES[t] ? GENRES_LARGES[t][1] : o => o.type === t;
            const dispo = libres.filter(o => !pris.includes(o) && test(o));
            if (dispo.length < n) {
              ok = false;
              break;
            }
            pris.push(...dispo.slice(0, n));
          }
          if (!ok) break;
          pris.forEach(o => libres.splice(libres.indexOf(o), 1));
          res.push({ ens: e, objets: pris });
        }
    }
    return res;
  }
  async function fenetreOuvragesPlan() {
    const liste = await api("GET", "/api/catalogue/recherche?genre=ouvrage&q=");
    const parId = new Map(liste.map(o => [o.id, o])),
      lib = o => o.ref + " — " + texteBrut(o.designation || "").split("\n")[0];
    const parLib = new Map(liste.map(o => [lib(o), o])),
      libs = liste.map(lib);
    const dl = h(
      "datalist",
      { id: "ouvrages-plan-liste" },
      liste.map(o => h("option", { value: lib(o) }))
    );
    const choix = JSON.parse(JSON.stringify(optPlans().ouvrages_plan || {}));
    const types = SYMBOLES.filter(x => !MASQUES.includes(x[0]) && x[0] !== "rep_libre");
    const ensembles = ensemblesPlan();
    const champOuvrage = (val, surChange) => {
      const i = listeDeroulante(
        h("input", {
          type: "text",
          value: val && parId.get(val) ? lib(parId.get(val)) : "",
          placeholder: "—",
          style: "width:100%;min-width:150px;font-size:12px",
        }),
        libs
      );
      i.addEventListener("change", () => {
        const o = parLib.get(i.value.trim());
        if (!o && i.value.trim()) {
          i.value = "";
          toast("Choisissez un ouvrage de la liste.", true);
        }
        surChange(o ? o.id : null);
      });
      return i;
    };
    // (ensembles : nom, composition modifiable, un ouvrage par type de chantier)
    const corpsEns = h("tbody");
    const optionsGenres = () => [
      ...Object.entries(GENRES_LARGES).map(([t, [l]]) => h("option", { value: t }, l)),
      ...[...types].sort(parNom).map(([t, l]) => h("option", { value: t }, l + " (" + catVue(t) + ")")),
    ];
    const majEns = () =>
      corpsEns.replaceChildren(
        ...ensembles.map(e => {
          const nomE = h("input", { type: "text", value: e.nom || "", style: "width:100%;font-weight:600" });
          nomE.addEventListener("change", () => {
            e.nom = nomE.value.trim();
          });
          const puces = h(
            "div",
            { style: "display:flex;gap:4px;flex-wrap:wrap" },
            (e.compo || []).map((c, k) =>
              h(
                "span",
                { class: "puce-compo" },
                c[1] + " × " + libGenre(c[0]),
                h(
                  "button",
                  {
                    class: "icone",
                    title: "Retirer",
                    onclick: () => {
                      e.compo.splice(k, 1);
                      majEns();
                    },
                  },
                  "✕"
                )
              )
            )
          );
          const sg = h("select", { style: "width:auto;max-width:200px;font-size:12px" }, optionsGenres()),
            nq = h("input", { type: "number", min: 1, max: 20, value: 1, style: "width:48px" });
          const ajout = h(
            "div",
            { style: "display:flex;gap:4px;align-items:center;margin-top:3px" },
            nq,
            sg,
            h(
              "button",
              {
                class: "btn petit",
                onclick: () => {
                  e.compo = e.compo || [];
                  const n = Math.max(1, parseInt(nq.value, 10) || 1),
                    x = e.compo.find(c => c[0] === sg.value);
                  if (x) x[1] += n;
                  else e.compo.push([sg.value, n]);
                  majEns();
                },
              },
              "+"
            )
          );
          return h(
            "tr",
            {},
            h("td", { style: "min-width:150px" }, nomE),
            h("td", { style: "min-width:240px" }, puces, ajout),
            ...Object.keys(TYPES_CHANTIER).map(tc =>
              h(
                "td",
                {},
                champOuvrage((e.ouvrages || {})[tc], v => {
                  e.ouvrages = e.ouvrages || {};
                  if (v) e.ouvrages[tc] = v;
                  else delete e.ouvrages[tc];
                })
              )
            ),
            h(
              "td",
              {},
              h(
                "button",
                {
                  class: "icone",
                  title: "Supprimer cet ensemble",
                  onclick: () => {
                    ensembles.splice(ensembles.indexOf(e), 1);
                    majEns();
                  },
                },
                "✕"
              )
            )
          );
        })
      );
    majEns();
    // (lignes retirées de ce tableau, remises à la demande ; catégories renommées : comme dans « Symboles de la liste »)
    const retirees = new Set(optPlans().ouvrages_lignes_retirees || []),
      categories = { ...(optPlans().categories || {}) },
      catIci = t => categories[t] || (SYMB[t] || {}).categorie || "Divers";
    let champs = [];
    const corpsApp = h("tbody"),
      remettre = h("select", { style: "max-width:320px" });
    remettre.addEventListener("change", () => {
      if (remettre.value === "@toutes") retirees.clear();
      else if (remettre.value) retirees.delete(remettre.value);
      majApp();
    });
    const majApp = () => {
      champs = [];
      const vis = types.filter(x => !retirees.has(x[0])),
        cats = [...new Set(vis.map(x => catIci(x[0])))];
      corpsApp.replaceChildren(
        ...cats.flatMap(cat => [
          h(
            "tr",
            {},
            h(
              "td",
              { colspan: Object.keys(TYPES_CHANTIER).length + 2, style: "font-weight:700;background:#f8fafc" },
              cat,
              h(
                "button",
                {
                  class: "btn petit",
                  style: "margin-left:8px",
                  title: "Renommer cette catégorie (aussi dans la liste des symboles)",
                  onclick: async () => {
                    const n = await demanderTexte("Nouveau nom de la catégorie « " + cat + " » :", cat);
                    if (!n || !n.trim() || n.trim() === cat) return;
                    for (const [t] of types.filter(x => catIci(x[0]) === cat))
                      if (n.trim() === (SYMB[t] || {}).categorie) delete categories[t];
                      else categories[t] = n.trim();
                    majApp();
                  },
                },
                "✎"
              )
            )
          ),
          ...vis
            .filter(x => catIci(x[0]) === cat)
            .map(([t, libT]) =>
              h(
                "tr",
                {},
                h("td", { style: "white-space:nowrap" }, libT),
                ...Object.keys(TYPES_CHANTIER).map(tc => cellule(t, tc)),
                h(
                  "td",
                  {},
                  h(
                    "button",
                    {
                      class: "icone",
                      title: "Retirer cette ligne du tableau (« Remettre une ligne » la reprend)",
                      onclick: () => {
                        retirees.add(t);
                        majApp();
                      },
                    },
                    "✕"
                  )
                )
              )
            ),
        ])
      );
      remettre.replaceChildren(
        h(
          "option",
          { value: "" },
          retirees.size ? "+ Remettre une ligne de la liste d'origine (" + retirees.size + ")…" : "Aucune ligne retirée"
        ),
        ...types
          .filter(x => retirees.has(x[0]))
          .sort(parNom)
          .map(([t, l]) => h("option", { value: t }, l)),
        retirees.size > 1 ? h("option", { value: "@toutes" }, "Toutes les lignes") : ""
      );
      remettre.disabled = !retirees.size;
    };
    const cellule = (t, tc) => {
      const id = (choix[tc] || {})[t],
        i = listeDeroulante(
          h("input", {
            type: "text",
            value: id && parId.get(id) ? lib(parId.get(id)) : "",
            placeholder: "—",
            style: "width:100%;min-width:150px;font-size:12px",
          }),
          libs
        );
      i.addEventListener("change", () => {
        const o = parLib.get(i.value.trim());
        choix[tc] = choix[tc] || {};
        if (o) choix[tc][t] = o.id;
        else {
          delete choix[tc][t];
          if (i.value.trim()) {
            i.value = "";
            toast("Choisissez un ouvrage de la liste.", true);
          }
        }
      });
      champs.push({ t, tc, i });
      return h("td", {}, i);
    };
    const copier = tc => {
      for (const c of champs.filter(c => c.tc === tc)) {
        const src = champs.find(x => x.tc === "neuf" && x.t === c.t);
        c.i.value = src.i.value;
        c.i.dispatchEvent(new Event("change"));
      }
    };
    majApp();
    ouvrirModale(
      "Ouvrages des appareils du plan",
      h(
        "div",
        { class: "pile" },
        dl,
        h(
          "p",
          { class: "aide", style: "margin:0" },
          "Ouvrage du catalogue mis dans le devis selon le type de chantier (une ligne par pièce ; tapez une référence ou un mot pour chercher ; vide : pas repris). Ensembles : des appareils reliés par des liaisons (ex. 1 interrupteur + 1 point lumineux) chiffrés par un seul ouvrage — composez-les comme vous chiffrez ; les plus gros sont cherchés d'abord, autant de fois qu'ils sont dans le plan. Ce qui reste (point lumineux en plus…) : l'ouvrage de son genre d'appareil, à l'unité."
        ),
        h(
          "div",
          { style: "max-height:62vh;overflow:auto" },
          h("h4", { style: "margin:4px 0" }, "Ensembles d'appareils"),
          h(
            "table",
            { class: "resultats", style: "width:100%" },
            h(
              "thead",
              {},
              h(
                "tr",
                {},
                h("th", {}, "Ensemble"),
                h("th", {}, "Composition (appareils reliés)"),
                ...Object.values(TYPES_CHANTIER).map(l => h("th", {}, l)),
                h("th", {})
              )
            ),
            corpsEns
          ),
          h(
            "button",
            {
              class: "btn petit",
              style: "margin:4px 0 10px",
              onclick: () => {
                ensembles.push({ id: plId(), nom: "Nouvel ensemble", compo: [], ouvrages: {} });
                majEns();
              },
            },
            "+ Ensemble"
          ),
          h("h4", { style: "margin:4px 0" }, "Appareils à l'unité"),
          h(
            "table",
            { class: "resultats", style: "width:100%" },
            h(
              "thead",
              {},
              h(
                "tr",
                {},
                h("th", {}, "Appareil"),
                ...Object.entries(TYPES_CHANTIER).map(([tc, l]) =>
                  h(
                    "th",
                    {},
                    l,
                    tc !== "neuf"
                      ? h(
                          "button",
                          {
                            class: "btn petit",
                            style: "margin-left:6px",
                            title: "Reprendre les ouvrages de la colonne Maison neuve",
                            onclick: () => copier(tc),
                          },
                          "= neuf"
                        )
                      : null
                  )
                ),
                h("th", {})
              )
            ),
            corpsApp
          ),
          h("div", { style: "margin-top:6px" }, remettre)
        )
      ),
      [
        h("button", { class: "btn", onclick: fermerModale }, "Annuler"),
        h(
          "button",
          {
            class: "btn principal",
            onclick: async () => {
              try {
                await enregistrerPlans({
                  ouvrages_plan: choix,
                  ensembles: ensembles.filter(e => (e.compo || []).length),
                  ouvrages_lignes_retirees: [...retirees],
                  categories,
                });
                fermerModale();
                toast("Ouvrages des appareils enregistrés.");
              } catch (e) {
                erreur(e);
              }
            },
          },
          "Enregistrer"
        ),
      ],
      { largeur: "min(1100px, 97vw)" }
    );
  }
  /** plan → devis : un lot « plan » dans le devis rattaché, une partie par pièce, un ouvrage par genre d'appareil */
  async function versDevis() {
    if (!p.document_id) {
      ouvrirModale(
        "Plan → devis",
        h("p", {}, "Ce plan n'est rattaché à aucun devis. Rattachez-le d'abord (bouton « Client, devis, adresse… » en haut du plan)."),
        [
          h("button", { class: "btn", onclick: fermerModale }, "Fermer"),
          h(
            "button",
            {
              class: "btn principal",
              onclick: () => {
                fermerModale();
                rattacher().catch(erreur);
              },
            },
            "Rattacher à un devis…"
          ),
        ]
      );
      return;
    }
    const tous = [...d.objets, ...Object.values(d.etages || {}).flatMap(e => e.objets || [])].filter(
      o => o.genre === "symbole" && SYMB[o.type] && !estDecor(o)
    );
    const choix = optPlans().ouvrages_plan || {};
    const tc = h(
      "select",
      {},
      Object.entries(TYPES_CHANTIER).map(([v, l]) => h("option", { value: v }, l))
    );
    tc.value = TYPES_CHANTIER[d.type_chantier]
      ? d.type_chantier
      : TYPES_CHANTIER[optPlans().chantier_defaut]
        ? optPlans().chantier_defaut
        : "neuf";
    const zone = h("div");
    // (appareils au bout d'une moulure ou d'une goulotte : chiffrés avec la colonne « Sous moulure / apparent »)
    const surMoul = new Set(
      gainesPartout()
        .filter(g => conduitDe(g) === "moulure")
        .flatMap(g => [g.de, g.vers])
    );
    const auto = h("input", { type: "checkbox", checked: surMoul.size > 0 });
    let parPiece = {},
      manquants = {};
    const calculer = () => {
      parPiece = {};
      manquants = {};
      // (lignes retirées du tableau des ouvrages : pas reprises)
      const retirees = new Set(optPlans().ouvrages_lignes_retirees || []),
        colonne = o => (auto.checked && tc.value !== "moulure" && surMoul.has(o.id) ? "moulure" : tc.value),
        chDe = col => Object.fromEntries(Object.entries(choix[col] || {}).filter(([t]) => !retirees.has(t)));
      const pieceDe = o => o.piece || "Sans pièce",
        ajout = (pc, id, n) => {
          parPiece[pc] = parPiece[pc] || {};
          parPiece[pc][id] = (parPiece[pc][id] || 0) + (n || 1);
        };
      // ensembles d'appareils reliés, chiffrés par leur ouvrage (pièce : celle de la lumière, sinon du premier appareil) ; le reste à l'unité
      const comptes = new Set();
      const avecMoul = e => (e.ouvrages || {})[tc.value] || (auto.checked && (e.ouvrages || {}).moulure);
      for (const { ens, objets } of ensemblesTrouves(ensemblesPlan(), avecMoul)) {
        const col = objets.some(o => colonne(o) === "moulure") && ens.ouvrages.moulure ? "moulure" : tc.value,
          id = ens.ouvrages[col];
        if (!id) continue;
        const pc = pieceDe(objets.find(o => LUMIERES.includes(o.type)) || objets[0]);
        ajout(pc, id);
        objets.forEach(o => comptes.add(o.id));
      }
      const parCol = {};
      for (const o of tous) {
        if (comptes.has(o.id)) continue;
        const col = colonne(o),
          id = (parCol[col] = parCol[col] || chDe(col))[o.type];
        if (!id) {
          manquants[o.type] = (manquants[o.type] || 0) + 1;
          continue;
        }
        const pc = o.piece || "Sans pièce";
        parPiece[pc] = parPiece[pc] || {};
        parPiece[pc][id] = (parPiece[pc][id] || 0) + 1;
      }
    };
    let ouvrages = new Map();
    const montrer = async () => {
      calculer();
      const ids = [...new Set(Object.values(parPiece).flatMap(x => Object.keys(x)))].map(Number).filter(id => !ouvrages.has(id));
      for (const id of ids) {
        try {
          ouvrages.set(id, await api("GET", "/api/ouvrages/" + id));
        } catch (e) {
          ouvrages.set(id, null);
        }
      }
      const pieces = Object.keys(parPiece).sort((a, b) => (a === "Sans pièce") - (b === "Sans pièce") || a.localeCompare(b, "fr"));
      zone.replaceChildren(
        pieces.length
          ? h(
              "table",
              { class: "resultats" },
              h(
                "tbody",
                {},
                pieces.flatMap(pc => [
                  h("tr", {}, h("td", { colspan: 3, style: "font-weight:700;background:#f8fafc" }, pc)),
                  ...Object.entries(parPiece[pc]).map(([id, n]) => {
                    const o = ouvrages.get(Number(id));
                    return h(
                      "tr",
                      {},
                      h("td", {}, o ? o.ref : "?"),
                      h("td", {}, o ? texteBrut(o.designation || "").split("\n")[0] : "Ouvrage introuvable"),
                      h("td", { style: "text-align:right;font-weight:600" }, String(n))
                    );
                  }),
                ])
              )
            )
          : h("p", { class: "sous" }, "Aucun appareil associé à un ouvrage pour ce type de chantier."),
        Object.keys(manquants).length
          ? h(
              "div",
              { class: "plan-alerte" },
              "Sans ouvrage associé (non repris) : " +
                Object.entries(manquants)
                  .map(([t, n]) => (SYMB[t] || {}).libelle + " × " + n)
                  .join(", ")
            )
          : ""
      );
    };
    tc.addEventListener("change", () => montrer().catch(erreur));
    auto.addEventListener("change", () => montrer().catch(erreur));
    const doc = await api("GET", "/api/documents/" + p.document_id);
    const ref = "PLAN-" + p.id,
      deja = (doc.lignes || []).some(l => l.type === "lot" && l.ref === ref);
    ouvrirModale(
      "Plan → devis " + (doc.numero || ""),
      h(
        "div",
        { class: "pile" },
        h(
          "p",
          { class: "aide", style: "margin:0" },
          "Un lot « " +
            (nom.value || "Plan") +
            " » est ajouté à la fin du devis, avec une partie par pièce et, dans chacune, un ouvrage par genre d'appareil (quantité = nombre d'appareils) ; les allumages (commande et point lumineux reliés) au forfait s'il y en a un." +
            (deja ? " Ce lot existe déjà dans le devis : il sera remplacé." : "") +
            " Associations : ⚙ Options > Ouvrages des appareils."
        ),
        h("label", { class: "champ" }, h("span", {}, "Type de chantier"), tc),
        surMoul.size
          ? h(
              "label",
              { class: "case" },
              auto,
              "Appareils sur une moulure ou une goulotte : ouvrages de la colonne « Sous moulure / apparent »"
            )
          : "",
        zone
      ),
      [
        h("button", { class: "btn", onclick: fermerModale }, "Annuler"),
        h(
          "button",
          {
            class: "btn principal",
            onclick: async () => {
              try {
                if (!Object.keys(parPiece).length) {
                  toast("Rien à ajouter : associez des ouvrages aux appareils (⚙ Options).", true);
                  return;
                }
                if (doc.statut === "accepte" && !(await demanderOui("Ce devis est accepté. Le modifier quand même ?"))) return;
                const L = [...(doc.lignes || [])],
                  i = L.findIndex(l => l.type === "lot" && l.ref === ref);
                if (i >= 0) {
                  let j = i + 1;
                  while (j < L.length && (L[j].niveau || 0) > (L[i].niveau || 0)) j++;
                  L.splice(i, j - i);
                }
                const nv = [{ type: "lot", niveau: 0, ref, designation: "Électricité — " + (nom.value || "plan") }];
                const pieces = Object.keys(parPiece).sort(
                  (a, b) => (a === "Sans pièce") - (b === "Sans pièce") || a.localeCompare(b, "fr")
                );
                for (const pc of pieces) {
                  nv.push({ type: "lot", niveau: 1, designation: pc });
                  for (const [id, n] of Object.entries(parPiece[pc])) {
                    const o = ouvrages.get(Number(id));
                    if (!o) continue;
                    nv.push({
                      type: "tache",
                      niveau: 2,
                      ref: o.ref,
                      designation: "**" + o.designation + "**" + (o.description ? "\n" + o.description : ""),
                      unite: o.unite,
                      quantite: n,
                      prix_unitaire: o.prix,
                      tva: o.tva,
                      ouvrage_id: o.id,
                      composition: JSON.parse(JSON.stringify(o.composition || [])),
                      prix_impose: o.prix_force != null ? 1 : 0,
                    });
                  }
                }
                await api("PUT", "/api/documents/" + doc.id, { lignes: [...L, ...nv] });
                d.type_chantier = tc.value;
                d.devis_le = new Date().toISOString().slice(0, 10);
                fermerModale();
                await enregistrer();
                toast("Lot ajouté au devis " + (doc.numero || "") + ".");
                if (await demanderOui("Ouvrir le devis " + (doc.numero || "") + " ?")) aller("devis", doc.id);
              } catch (e) {
                erreur(e);
              }
            },
          },
          deja ? "Remplacer dans le devis" : "Ajouter au devis"
        ),
      ],
      { largeur: "min(760px, 96vw)" }
    );
    await montrer();
  }
  /** appareils qui reçoivent leur circuit spécialisé dès la pose, et son calibre (⚙ Options) */
  function fenetreSpeciaux() {
    const reg = reglageSpeciaux(),
      vus = new Set();
    const lignes = Object.entries(SPECIAUX)
      .filter(([t]) => SYMB[t])
      .map(([t, [nomC, calD]]) => {
        const c = h("input", { type: "checkbox", checked: reg[t] > 0 });
        const cal = h(
          "select",
          { style: "width:80px" },
          ["2", "10", "16", "20", "25", "32", "40"].map(v => h("option", { value: v }, v + " A"))
        );
        cal.value = String(reg[t] || calD);
        vus.add(t);
        return {
          t,
          c,
          cal,
          el: h(
            "tr",
            {},
            h("td", {}, h("label", { class: "case" }, c, (SYMB[t] || {}).libelle || t)),
            h("td", { class: "sous" }, nomC),
            h("td", {}, cal)
          ),
        };
      });
    ouvrirModale(
      "Circuits spécialisés",
      h(
        "div",
        { class: "pile" },
        h(
          "p",
          { class: "aide", style: "margin:0" },
          "Cochés : à la pose du symbole, un circuit à part est créé (nom de l'appareil et de sa pièce, calibre choisi ici). Pour les autres, ou après coup : choisissez l'appareil, bouton « ⚡ Circuit spécialisé » dans le panneau."
        ),
        h(
          "table",
          { class: "resultats" },
          h("thead", {}, h("tr", {}, h("th", {}, "Symbole"), h("th", {}, "Circuit"), h("th", {}, "Calibre"))),
          h(
            "tbody",
            {},
            lignes.map(x => x.el)
          )
        )
      ),
      [
        h(
          "button",
          {
            class: "btn",
            onclick: async () => {
              try {
                await enregistrerPlans({ circuits_speciaux: null });
                fermerModale();
                toast("Circuits spécialisés : réglage d'origine.");
              } catch (e) {
                erreur(e);
              }
            },
          },
          "Valeurs d'origine"
        ),
        h("button", { class: "btn", onclick: fermerModale }, "Annuler"),
        h(
          "button",
          {
            class: "btn principal",
            onclick: async () => {
              try {
                await enregistrerPlans({
                  circuits_speciaux: Object.fromEntries(lignes.map(x => [x.t, x.c.checked ? Number(x.cal.value) : 0])),
                });
                fermerModale();
                toast("Circuits spécialisés enregistrés.");
              } catch (e) {
                erreur(e);
              }
            },
          },
          "Enregistrer"
        ),
      ],
      { largeur: "min(560px, 94vw)" }
    );
  }
  /** couleur d'origine de chaque fonction de fil (⚙ Options) */
  function fenetreCouleursFils() {
    const choix = { ...COULEUR_FONCTION, ...(optPlans().couleurs_fils || {}) };
    const lignes = Object.entries(FILS)
      .filter(([f]) => f !== "F")
      .map(([f, [lib]]) => {
        const sel = h(
          "select",
          {},
          Object.entries(COULEURS_FIL).map(([cf, [l]]) => h("option", { value: cf }, l + (cf === "blanc" ? " (dessiné en rose)" : "")))
        );
        sel.value = choix[f] || "noir";
        const pas = h("span", { style: "display:inline-block;width:14px;height:14px;border-radius:3px" });
        const maj = () => {
          choix[f] = sel.value;
          pas.style.background = sel.value === "vj" ? "repeating-linear-gradient(90deg,#16a34a 0 3px,#facc15 3px 6px)" : hexFil(sel.value);
        };
        sel.addEventListener("change", maj);
        maj();
        return h(
          "label",
          { class: "champ", style: "flex-direction:row;align-items:center;gap:8px" },
          h("span", { style: "width:190px" }, h("b", {}, f), " · " + lib),
          pas,
          sel
        );
      });
    ouvrirModale(
      "Couleurs des fils",
      h(
        "div",
        { class: "pile" },
        h(
          "p",
          { class: "aide", style: "margin:0" },
          "Couleur dessinée pour chaque fonction de fil dans les gaines. Pour un fil précis, ou tous les fils d'une fonction dans un circuit (ex. le retour du bouton et de la lampe d'une pièce) : cliquez son petit trait de couleur dans le panneau de la gaine."
        ),
        ...lignes
      ),
      [
        h(
          "button",
          {
            class: "btn",
            onclick: async () => {
              try {
                await enregistrerPlans({ couleurs_fils: null });
                fermerModale();
                dessiner();
                majPanneau();
              } catch (e) {
                erreur(e);
              }
            },
          },
          "Valeurs d'origine"
        ),
        h("button", { class: "btn", onclick: fermerModale }, "Annuler"),
        h(
          "button",
          {
            class: "btn principal",
            onclick: async () => {
              try {
                await enregistrerPlans({ couleurs_fils: choix });
                fermerModale();
                dessiner();
                majPanneau();
                toast("Couleurs des fils enregistrées.");
              } catch (e) {
                erreur(e);
              }
            },
          },
          "Enregistrer"
        ),
      ],
      { largeur: "min(460px, 94vw)" }
    );
  }
  /** règle de remplissage des gaines (⚙ Options) : taux, diamètres intérieurs des gaines, diamètres extérieurs des fils */
  function fenetreDiametres() {
    const r0 = reglesGaines(),
      r = { taux: r0.taux, int: { ...r0.int }, ext: { ...r0.ext } };
    const num = (v, f, pas) => {
      const i = h("input", { type: "number", min: 0, step: pas || 0.1, value: v, style: "width:64px" });
      i.addEventListener("input", () => {
        f(nombre(i.value) || 0);
        apercu();
      });
      return i;
    };
    const taux = num(
      r.taux,
      v => {
        r.taux = v;
      },
      0.1
    );
    const tbInt = h("tbody", {}),
      tbExt = h("tr", {}),
      tbMax = h("tbody", {});
    const maxFils = (dm, k) =>
      Math.floor(((((Math.PI * Number(r.int[dm]) ** 2) / 4) * r.taux) / 100 + 0.01) / ((Math.PI * (Number(r.ext[k]) || 3.6) ** 2) / 4));
    const apercu = () =>
      tbMax.replaceChildren(
        ...Object.keys(r.int)
          .map(Number)
          .sort((a, b) => a - b)
          .map(dm =>
            h(
              "tr",
              {},
              h("td", {}, h("b", {}, "Ø " + dm)),
              ...SECTIONS_GAINE.map(k => h("td", { style: "text-align:center" }, String(maxFils(dm, k))))
            )
          )
      );
    const remplir = () => {
      tbInt.replaceChildren(
        h(
          "tr",
          {},
          ...Object.keys(r.int)
            .map(Number)
            .sort((a, b) => a - b)
            .map(dm =>
              h(
                "td",
                {},
                h("div", { class: "sous" }, "Ø " + dm),
                num(r.int[dm], v => {
                  r.int[dm] = v;
                })
              )
            )
        )
      );
      tbExt.replaceChildren(
        ...SECTIONS_GAINE.map(k =>
          h(
            "td",
            {},
            h("div", { class: "sous" }, k === "C" ? "Câble" : k + " mm²"),
            num(r.ext[k], v => {
              r.ext[k] = v;
            })
          )
        )
      );
      taux.value = r.taux;
      apercu();
    };
    remplir();
    ouvrirModale(
      "Diamètres des gaines",
      h(
        "div",
        { class: "pile" },
        h(
          "p",
          { class: "aide", style: "margin:0" },
          "La section des fils (isolant compris) ne doit pas dépasser une part de la section intérieure de la gaine : 1/3 (33,3 %) quand les fils sont tirés dans la gaine déjà posée (NF C 15-100). Le diamètre conseillé est le plus petit qui respecte ce taux, sections mélangées comprises. Pour une gaine pré-filée, le taux peut être plus haut."
        ),
        h("label", { class: "champ" }, h("span", {}, "Taux de remplissage maximal (%)"), taux),
        h(
          "div",
          {},
          h("b", {}, "Diamètre intérieur des gaines (mm)"),
          h("div", { class: "sous" }, "ICTA : valeurs courantes, à adapter à votre marque")
        ),
        h("table", {}, tbInt),
        h(
          "div",
          {},
          h("b", {}, "Diamètre extérieur des fils (mm)"),
          h("div", { class: "sous" }, "Fil rigide H07V-U ; C : câble courant faible (RJ45, TV)")
        ),
        h("table", {}, h("tbody", {}, tbExt)),
        h("div", {}, h("b", {}, "Nombre maximal de fils d'une seule section (calculé)")),
        h(
          "table",
          { class: "resultats" },
          h("thead", {}, h("tr", {}, h("th", {}, "Gaine"), ...SECTIONS_GAINE.map(k => h("th", {}, k === "C" ? "Câbles" : k)))),
          tbMax
        )
      ),
      [
        h(
          "button",
          {
            class: "btn",
            onclick: () => {
              Object.assign(r, { taux: 33.3, int: { ...GAINES_INT }, ext: { ...FILS_EXT } });
              remplir();
            },
          },
          "Valeurs d'origine"
        ),
        h("button", { class: "btn", onclick: fermerModale }, "Annuler"),
        h(
          "button",
          {
            class: "btn principal",
            onclick: async () => {
              try {
                await enregistrerPlans({ remplissage_gaines: r });
                fermerModale();
                dessiner();
                majPanneau();
                toast("Règle de remplissage des gaines enregistrée.");
              } catch (e) {
                erreur(e);
              }
            },
          },
          "Enregistrer"
        ),
      ],
      { largeur: "min(640px, 96vw)" }
    );
  }
  /** repères et fils des gaines, par symbole (⚙ Options) */
  function fenetreReperesGaines() {
    const o = optPlans(),
      reps = { ...(o.reperes_gaines || {}) },
      fils = { ...(o.fils_gaines || {}) };
    const types = SYMBOLES.filter(x => !MASQUES.includes(x[0]) && !NOEUDS_GAINE.includes(x[0]) && !["tableau", "compteur"].includes(x[0]));
    const lignes = types.map(([t, lib]) => {
      const defF = FILS_APPAREIL[t],
        [f0, s0] = Array.isArray(defF) ? defF : [defF === undefined ? "P N T" : defF, ""];
      const [fP, sP] = fils[t] !== undefined ? fils[t].split("|") : [f0, s0 || ""];
      const r = h("input", { type: "text", value: reps[t] ?? REPERES_GAINE[t] ?? "", style: "width:62px;font-weight:700" });
      const f = h("input", { type: "text", value: fP, style: "width:100px;text-transform:uppercase", placeholder: "aucun fil" });
      const sc = h(
        "select",
        {},
        h("option", { value: "" }, "du circuit"),
        ["1,5", "2,5", "4", "6", "10"].map(v => h("option", { value: v }, v + " mm²"))
      );
      sc.value = sP || "";
      const ic = svgEl("svg", { viewBox: "-20 -20 40 40", width: 22, height: 22 });
      ic.innerHTML = '<g stroke="currentColor" fill="none" stroke-width="1.6">' + (SYMB[t] ? SYMB[t].dessin : "") + "</g>";
      const l = h("tr", {}, h("td", {}, ic), h("td", {}, lib), h("td", {}, r), h("td", {}, f), h("td", {}, sc));
      l.lire = () => [
        t,
        r.value.trim(),
        f.value
          .toUpperCase()
          .split(/[\s,;]+/)
          .filter(x => FILS[x])
          .join(" "),
        sc.value,
        f0,
        s0 || "",
      ];
      return l;
    });
    ouvrirModale(
      "Repères et fils des gaines",
      h(
        "div",
        { class: "pile" },
        h(
          "p",
          { class: "aide", style: "margin:0" },
          "Pour chaque appareil : le repère écrit à côté des fils (SA, PC…), les fils de la gaine qui y arrive (",
          Object.entries(FILS)
            .map(([k, v]) => k + " " + v[0].toLowerCase())
            .join(", "),
          ") et leur section (« du circuit » : d'après son disjoncteur)."
        ),
        h(
          "div",
          { style: "max-height:56vh;overflow:auto" },
          h(
            "table",
            { class: "resultats" },
            h(
              "thead",
              {},
              h(
                "tr",
                {},
                ["", "Appareil", "Repère", "Fils", "Section"].map(x => h("th", {}, x))
              )
            ),
            h("tbody", {}, lignes)
          )
        )
      ),
      [
        h(
          "button",
          {
            class: "btn",
            onclick: () => {
              lignes.forEach(l => {
                const [t] = l.lire();
                delete reps[t];
                delete fils[t];
              });
              enregistrerPlans({ reperes_gaines: {}, fils_gaines: {} })
                .then(() => {
                  fermerModale();
                  dessiner();
                })
                .catch(erreur);
            },
          },
          "Revenir aux réglages d'origine"
        ),
        h("button", { class: "btn", onclick: fermerModale }, "Annuler"),
        h(
          "button",
          {
            class: "btn principal",
            onclick: async () => {
              const R = {},
                F = {};
              for (const l of lignes) {
                const [t, r, f, sc, f0, s0] = l.lire();
                if (r !== (REPERES_GAINE[t] ?? "")) R[t] = r;
                if (f !== f0 || sc !== s0) F[t] = f + "|" + sc;
              }
              try {
                await enregistrerPlans({ reperes_gaines: R, fils_gaines: F });
                fermerModale();
                dessiner();
                majPanneau();
                toast("Repères et fils des gaines enregistrés.");
              } catch (e) {
                erreur(e);
              }
            },
          },
          "Enregistrer"
        ),
      ],
      { largeur: "min(720px, 96vw)" }
    );
  }
  const estNoeud = o => o && NOEUDS_GAINE.includes(o.type);
  /** prise commandée : une prise reliée (liaison, ou lien vers un autre niveau) à un interrupteur, un poussoir… */
  const estCommandee = o =>
    !!o &&
    (o.type === "prise_cmd" ||
      (PRISES.includes(o.type) &&
        [
          ...d.liaisons.filter(li => li.de === o.id || li.vers === o.id).map(li => (li.de === o.id ? li.vers : li.de)),
          ...liensDe(o.id).map(l => (l.a === o.id ? l.b : l.a)),
        ].some(id => COMMANDES.includes((objetPartout(id) || {}).type))));
  /** allumé par une commande : lumière, ou prise commandée */
  const allumee = o => LUMIERES.includes(o.type) || estCommandee(o);
  const repereDe = o =>
    !o
      ? ""
      : o.type === "rep_libre" || o.type === "rep_rect"
        ? o.texte || ""
        : ((optPlans().reperes_gaines || {})[o.type] ??
          REPERES_GAINE[o.type] ??
          ((SYMB[o.type] || {}).libelle || "").slice(0, 4).toUpperCase());
  /** section des fils d'un appareil : donnée par le genre d'appareil, sinon par le disjoncteur de son circuit */
  function sectionDe(o, fils, imposee) {
    const c = o.circuit && circuitDe(o.circuit),
      cal = c && Number(c.calibre);
    if (c && c.section) return c.section; // (section choisie pour le circuit : prime)
    if (imposee) return imposee;
    if (cal) return cal <= 16 ? "1,5" : cal <= 20 ? "2,5" : cal <= 25 ? "4" : cal <= 32 ? "6" : "10";
    return /R|V/.test(fils) ? "1,5" : "2,5";
  }
  /** lot de fils d'une gaine qui arrive à cet appareil, ou null (pas de fils : DAAF à pile…) */
  function lotAppareil(o) {
    if (!o || o.genre !== "symbole") return null;
    const perso = (optPlans().fils_gaines || {})[o.type]; // (⚙ Options > Repères et fils des gaines : « P N T|2,5 »)
    let def = perso !== undefined ? perso.split("|") : FILS_APPAREIL[o.type];
    if (perso === undefined && estCommandee(o) && def === "P N T") def = "R N T"; // (prise reliée à une commande : la phase arrive par le retour)
    const [fils, sec] = Array.isArray(def) ? [def[0], def[1] || null] : [def === undefined ? "P N T" : def, null];
    if (!fils) return null;
    const c = o.circuit && circuitDe(o.circuit);
    return {
      rep: repereDe(o),
      fils: fils.split(" "),
      section: fils === "C" ? "" : sectionDe(o, fils, sec),
      circuit: c ? c.nom : "",
      cid: c ? c.id : null,
      type: o.type,
    };
  }
  /** appareils alimentés au-delà de l'objet « depuis », par les gaines (sans repasser par la gaine g) */
  /** autres appareillages du même bloc (double prise…) : leurs fils arrivent par la même gaine */
  const blocDe = id => [...(d.blocs || []), ...autresNiveaux().flatMap(([, e]) => (e && e.blocs) || [])].find(b => b.membres.includes(id));
  const partenaires = id => {
    const b = blocDe(id);
    return b ? b.membres.filter(x => x !== id) : [];
  };
  function auDela(g, depuis, armoires) {
    const vus = new Set([depuis.id, g.de === depuis.id ? g.vers : g.de]),
      file = [depuis.id],
      out = [],
      gs = gainesPartout();
    for (const y of partenaires(depuis.id))
      if (!vus.has(y)) {
        vus.add(y);
        const o = objetPartout(y);
        if (o) {
          out.push(o);
          file.push(y);
        }
      }
    while (file.length) {
      const x = file.shift();
      for (const y of partenaires(x))
        if (!vus.has(y)) {
          vus.add(y);
          const o = objetPartout(y);
          if (o) {
            out.push(o);
            file.push(y);
          }
        }
      for (const y of voisinsGaine(x, gs, g)) {
        if (vus.has(y)) continue;
        vus.add(y);
        const o = objetPartout(y);
        if (!o) continue;
        if (o.type === "tableau") {
          if (armoires) armoires.push(o);
          continue;
        } // (une autre armoire : ses circuits partent d'elle)
        if (!estNoeud(o)) out.push(o);
        file.push(y);
      }
    }
    return out;
  }
  /** rang d'une armoire : 0 pour la tête, 1 pour celle qu'elle alimente… */
  function rangArmoire(t) {
    let n = 0,
      x = t;
    const ts = tableauxPlan();
    while (x && x.alim && n < 20) {
      x = ts.find(y => y.id === x.alim);
      n++;
    }
    return n;
  }
  /** au-delà de X (sans la gaine g) : l'armoire la plus haute qu'on atteint (Infinity : aucune) — le courant vient de ce côté */
  function versArmoire(g, X) {
    if (X.type === "tableau") return rangArmoire(X);
    const vus = new Set([X.id, g.de === X.id ? g.vers : g.de]),
      file = [X.id],
      gs = gainesPartout();
    let r = Infinity;
    while (file.length) {
      const x = file.shift();
      for (const y of voisinsGaine(x, gs, g)) {
        if (vus.has(y)) continue;
        vus.add(y);
        const o = objetPartout(y);
        if (!o) continue;
        if (o.type === "tableau") {
          r = Math.min(r, rangArmoire(o));
          continue;
        }
        file.push(y);
      }
    }
    return r;
  }
  const ORDRE_LOTS = ["PC", "32A", "SC", "SA", "DA", "VV", "BP", "PL"];
  /** contenu d'une gaine : ses lots de fils (calculés, ou tapés à la main dans le panneau) */
  function lotsGaine(g) {
    if (g.lots) return g.lots;
    const A = objetDe(g.de),
      B = objetDe(g.vers);
    if (!A || !B) return [];
    if (!estNoeud(A) || !estNoeud(B)) {
      // une boîte (ou un appareil) et un appareil : les fils de l'appareil
      const app = !estNoeud(B) ? B : A,
        autre = app === B ? A : B,
        l = lotAppareil(app);
      const mode = optPlans().gaine_repere_mode || "arrivee";
      if (l && mode === "depart" && !estNoeud(autre)) l.rep = repereDe(autre);
      if (l && mode === "circuit" && l.circuit) l.rep = l.circuit;
      // appareils repiqués plus loin (ex. BP derrière la cloison, gainé depuis l'interrupteur) : leurs fils passent aussi ici ;
      // même circuit : phase, neutre, terre et fil pilote communs (repiquage), seuls les autres fils s'ajoutent
      // lumières repiquées entre elles, allumées par les mêmes commandes : le retour aussi est commun
      const cmdDe = o =>
        new Set(
          [
            ...d.liaisons.filter(li => li.de === o.id || li.vers === o.id).map(li => (li.de === o.id ? li.vers : li.de)),
            ...liensDe(o.id).map(l => (l.a === o.id ? l.b : l.a)),
          ].filter(id => !allumee(objetPartout(id) || {}))
        );
      const memes = (a, b) => {
        const x = cmdDe(a),
          y = cmdDe(b);
        return !x.size || !y.size || (x.size === y.size && [...x].every(v => y.has(v)));
      };
      const res = l ? [l] : [],
        objs = l ? [app] : [];
      for (const o of plusLoin(g, app)) {
        const l2 = lotAppareil(o);
        if (!l2) continue;
        const partage = ["P", "N", "T", "FP"];
        const memeC = res.map((x, i) => [x, objs[i]]).filter(([x]) => x.cid && x.cid === l2.cid);
        const communs = l2.fils.includes("C")
          ? new Set()
          : new Set(
              memeC.flatMap(([x, ob]) =>
                x.fils.filter(f => partage.includes(f) || (f === "R" && allumee(o) && allumee(ob) && memes(o, ob)))
              )
            );
        const reste = l2.fils.filter(f => !communs.has(f));
        if (reste.length) {
          res.push({ ...l2, fils: reste });
          objs.push(o);
        }
      }
      return finirLots(g, res);
    }
    // entre deux armoires : l'alimentation de l'armoire divisionnaire (P N T, section de son départ)
    if (A.type === "tableau" && B.type === "tableau") {
      const fille = A.alim === B.id ? A : B;
      return finirLots(g, [
        {
          rep: "Alim " + nomArmoire(fille),
          fils: ["P", "N", "T"],
          section: String(fille.alim_sec || "10").replace(".", ","),
          circuit: "",
          cid: null,
        },
      ]);
    }
    // entre deux boîtes (ou tableau → boîte) : l'alimentation de chaque circuit qui va plus loin (P N T) ;
    // le côté « loin » : celui qui ne mène pas à une armoire (traversées de plancher : les gaines continuent à l'autre niveau)
    const rA = versArmoire(g, A),
      rB = versArmoire(g, B);
    const loin = rA < rB ? B : rB < rA ? A : A.type === "tableau" ? B : B.type === "tableau" ? A : B;
    const parCircuit = new Map(),
      filles = [];
    for (const o of loin.type === "tableau" ? [] : auDela(g, loin, filles)) {
      const l = lotAppareil(o);
      if (!l || l.fils.includes("C")) continue;
      const k = o.circuit || "?",
        sec = l.section,
        c = parCircuit.get(k);
      const ic = d.circuits.findIndex(x => x.id === o.circuit);
      if (!c)
        parCircuit.set(k, {
          rep: ic >= 0 ? reperesAlim()[o.circuit] || repDe(d.circuits[ic]) : "?",
          coulRep: ic >= 0 && optPlans().repere_alim !== "numero" ? d.circuits[ic].couleur : null,
          fils: ["P", "N", "T"],
          section: sec,
          circuit: l.circuit,
          cid: l.cid,
        });
      else if (parseFloat(sec.replace(",", ".")) > parseFloat(c.section.replace(",", "."))) c.section = sec;
    }
    // armoires divisionnaires alimentées plus loin (par les boîtes, une traversée de plancher…) : leur alimentation passe aussi
    const loinT = loin.type === "tableau" ? [loin] : filles;
    for (const t of [...new Set(loinT)])
      if (t.alim)
        parCircuit.set("arm:" + t.id, {
          rep: "Alim " + nomArmoire(t),
          fils: ["P", "N", "T"],
          section: String(t.alim_sec || "10").replace(".", ","),
          circuit: "",
          cid: null,
        });
    // une seule terre pour toute la gaine (pas une par circuit), à la plus grosse section de phase des circuits
    const alims = [...parCircuit.values()];
    if (alims.length > 1) {
      const num = v => parseFloat(String(v || "0").replace(",", ".")) || 0;
      const maxi = alims.reduce((m, l) => (num(l.section) > num(m) ? l.section : m), alims[0].section);
      alims.forEach(l => {
        l.fils = ["P", "N"];
      });
      alims.push({ rep: "Terre", fils: ["T"], section: maxi, circuit: "", cid: null });
    }
    return finirLots(g, alims);
  }
  const cleSection = l => l.rep || "#" + (l.cid || "") + ":" + l.fils.join("");
  /** section changée à la main pour un lot calculé (g.sections), puis les fils ajoutés à la main (g.ajouts) */
  function finirLots(g, lots) {
    if (g.sections)
      lots.forEach(l => {
        const v = g.sections[cleSection(l)];
        if (v) l.section = v;
      });
    return [...lots, ...(g.ajouts || [])];
  }
  /** repère des alimentations entre boîtes : « Alim PC », « Alim LUM », « Alim RAD »… d'après les appareils du circuit
   *  (écrit à la couleur du circuit ; deux circuits du même genre : « Alim PC », « Alim PC 2 ») ; ou Q1, Q2… (⚙ Options) */
  function reperesAlim() {
    const res = {};
    if (optPlans().repere_alim === "numero") {
      d.circuits.forEach((c, i) => {
        res[c.id] = repDe(c);
      });
      return res;
    }
    const tous = [...d.objets, ...Object.values(d.etages || {}).flatMap(e => e.objets || [])].filter(
      o => o.genre === "symbole" && o.circuit && (SYMB[o.type] || {}).categorie !== "Commandes"
    );
    const vus = {};
    d.circuits.forEach((c, i) => {
      const n = {};
      for (const o of tous)
        if (o.circuit === c.id) {
          const k = LUMIERES.includes(o.type) && o.type !== "prise_cmd" ? "LUM" : repereDe(o);
          if (k) n[k] = (n[k] || 0) + 1;
        }
      const top = Object.entries(n).sort((a, b) => b[1] - a[1])[0];
      const base = top ? "Alim " + top[0] : repDe(c);
      vus[base] = (vus[base] || 0) + 1;
      res[c.id] = vus[base] > 1 ? base + " " + vus[base] : base;
    });
    return res;
  }
  /** appareils repiqués au-delà de l'appareil « app » (sans passer par une boîte, ni par la gaine g) */
  function plusLoin(g, app) {
    const vus = new Set([app.id, g.de === app.id ? g.vers : g.de]),
      file = [app.id],
      out = [],
      gs = gainesPartout();
    while (file.length) {
      const x = file.shift();
      for (const y of partenaires(x))
        if (!vus.has(y)) {
          vus.add(y);
          const o = objetPartout(y);
          if (o && !estNoeud(o)) {
            out.push(o);
            file.push(y);
          }
        }
      for (const y of voisinsGaine(x, gs, g)) {
        if (vus.has(y)) continue;
        vus.add(y);
        const o = objetPartout(y);
        if (!o || estNoeud(o)) continue;
        out.push(o);
        file.push(y);
      }
    }
    return out;
  }
  const lotsTries = g =>
    lotsGaine(g)
      .slice()
      .sort((a, b) => {
        const i = x => {
          const k = ORDRE_LOTS.indexOf(x.rep);
          return k < 0 ? 99 : k;
        };
        return i(a) - i(b);
      });
  /** diamètre de gaine conseillé (ICTA) d'après le nombre et la section des fils */
  const reglesGaines = () => {
    const o = optPlans().remplissage_gaines || {};
    return {
      taux: Number(o.taux) > 0 ? Number(o.taux) : 33.3,
      int: { ...GAINES_INT, ...(o.int || {}) },
      ext: { ...FILS_EXT, ...(o.ext || {}) },
    };
  };
  /** section occupée par des fils (mm²) */
  const sectionFils = (n, ext) => Object.entries(n).reduce((t, [k, v]) => t + (v * Math.PI * (Number(ext[k]) || 3.6) ** 2) / 4, 0);
  /** conduit d'une gaine : le sien, sinon celui du plan (⚙ Options > Dessin : « Conduit des gaines ») */
  const conduitDe = g => (g.conduit === "moulure" || g.conduit === "goulotte" ? "moulure" : "gaine"); // (goulotte : posée comme une moulure)
  const estGoulotte = g => g.conduit === "goulotte";
  const nomConduit = g => (estGoulotte(g) ? "Goulotte" : conduitDe(g) === "moulure" ? "Moulure" : "Gaine");
  const couleurConduit = g => (estGoulotte(g) ? optPlans().couleur_goulotte || "#7c3aed" : optPlans().couleur_moulure || "#0d9488");
  /** moulure : posée en partie basse (au-dessus de la plinthe) ou haute (sous le plafond), ou à une hauteur donnée ;
   *  « auto » : haute si ses deux bouts sont en moyenne au-dessus de 1,50 m, sinon basse */
  /** hauteurs d'une moulure le long de son parcours : hs[i] = hauteur du morceau qui part du point i du chemin ;
   *  g.changements = { indice du point : "basse" | "haute" | cm } : elle descend ou remonte là (angle, coude…) */
  // (« plafond » : la moulure longe le plafond ; « combles » : elle monte au plafond et le câble passe dans les combles —
  //  ce morceau ne compte pas en moulure, seulement en fils)
  const valeurHauteur = (v, H) =>
    Number(v) > 0
      ? Number(v)
      : v === "haute"
        ? H.moulure_haute
        : v === "basse"
          ? H.moulure_basse
          : v === "plafond" || v === "combles"
            ? H.plafond
            : null;
  /** portes (et ouvertures libres) qu'une moulure longe plus bas que le dessus de leur cadre : elle les contourne par
   *  au-dessus (monte le long du cadre, passe, redescend). → [{ i (morceau), a, b (bords de la porte sur le morceau),
   *  h (hauteur de la moulure), id (porte) }] */
  function portesContournees(g, ch, hs) {
    const out = [],
      H = hauteurs(),
      cb = morceauxCombles(g, ch);
    for (let i = 1; i < ch.length; i++) {
      const p = ch[i - 1],
        q = ch[i],
        L = dist(p, q),
        h0 = hs[i - 1];
      if (L < 20 || cb[i - 1] || h0 >= H.passage_porte) continue;
      const mp = murProche({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }, 60);
      if (!mp) continue;
      const m = mp.m,
        Lm = dist(m.a, m.b) || 1,
        ux = (m.b.x - m.a.x) / Lm,
        uy = (m.b.y - m.a.y) / Lm;
      if (Math.abs(((q.x - p.x) * uy - (q.y - p.y) * ux) / L) > 0.1) continue; // (pas le long de ce mur)
      const tp = (p.x - m.a.x) * ux + (p.y - m.a.y) * uy,
        tq = (q.x - m.a.x) * ux + (q.y - m.a.y) * uy,
        t0 = Math.min(tp, tq),
        t1 = Math.max(tp, tq);
      for (const o of d.ouvertures || []) {
        if (o.mur !== m.id || (o.genre !== "porte" && o.genre !== "passage")) continue;
        const tc = o.t * Lm,
          w = (o.largeur || 80) / 2 + 5; // (+ le chambranle)
        if (tc - w < t0 - 1 || tc + w > t1 + 1) continue; // (la porte n'est pas entre les deux bouts du morceau)
        const sur = t => {
          const k = (t - tp) / (tq - tp || 1);
          return { x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k };
        };
        out.push({ i, a: sur(tc - w), b: sur(tc + w), h: h0, id: o.id });
      }
    }
    return out;
  }
  /** morceaux d'une moulure passés dans les combles (vrai/faux pour chaque morceau du chemin) */
  function morceauxCombles(g, ch) {
    const out = [];
    let c = g.pose === "combles";
    for (let i = 0; i < ch.length - 1; i++) {
      const v = i > 0 ? (g.changements || {})[i] : undefined;
      if (v !== undefined && v !== "") c = v === "combles";
      out.push(c);
    }
    return out;
  }
  /** montée ou descente entre la moulure et l'appareil ; prise basse sur une moulure en partie basse : branchée dessus, rien */
  const ecartMoulure = (o, hm) => (hm <= 50 && hauteurDe(o) <= 50 ? 0 : hauteurDe(o) - hm);
  function hauteursMoulure(g, ch) {
    const H = hauteurs(),
      hs = [];
    let hc = hauteurMoulure(g);
    for (let i = 0; i < ch.length - 1; i++) {
      const v = i > 0 ? valeurHauteur((g.changements || {})[i], H) : null;
      if (v !== null) hc = v;
      hs.push(hc);
    }
    return hs;
  }
  /** « bas », « haut », ou « haut → bas » si elle change de hauteur en route */
  function libPoses(g) {
    const ch = cheminGaine(g);
    if (!ch) return "";
    const cb = morceauxCombles(g, ch),
      H = hauteurs();
    const l = [
      ...new Set(hauteursMoulure(g, ch).map((x, i) => (cb[i] ? "combles" : x >= H.plafond - 1 ? "plafond" : x >= 150 ? "haut" : "bas"))),
    ];
    return l.join(" → ");
  }
  function hauteurMoulure(g) {
    const H = hauteurs();
    if (Number(g.pose) > 0) return Number(g.pose);
    if (g.pose === "plafond" || g.pose === "combles") return H.plafond;
    if (g.pose === "haute") return H.moulure_haute;
    if (g.pose === "basse") return H.moulure_basse;
    const A = objetPartout(g.de),
      B = objetPartout(g.vers);
    return A && B && (hauteurDe(A) + hauteurDe(B)) / 2 >= 150 ? H.moulure_haute : H.moulure_basse;
  }
  /** parcours d'une moulure sans coude : collée au mur (face côté pièce), le long du mur des deux appareils ; deux murs
   *  qui se touchent : par l'angle ; sinon : null (trait direct, coudes à ajouter à la main) */
  function routeMoulure(A, B) {
    const face = o => {
      const mp = murProche(o, 90);
      if (!mp) return null;
      const m = mp.m,
        L = dist(m.a, m.b) || 1,
        ux = (m.b.x - m.a.x) / L,
        uy = (m.b.y - m.a.y) / L,
        nx = -uy,
        ny = ux;
      const cote = (o.x - mp.q.x) * nx + (o.y - mp.q.y) * ny >= 0 ? 1 : -1,
        off = (m.ep || d.epaisseur) / 2 + 2;
      return { m, L, ux, uy, nx: nx * cote, ny: ny * cote, P: { x: mp.q.x + nx * cote * off, y: mp.q.y + ny * cote * off } };
    };
    const fa = face(A),
      fb = face(B);
    if (!fa || !fb) return null;
    const net = pts => pts.filter((q, i) => i === 0 || dist(q, pts[i - 1]) > 0.5);
    if (fa.m === fb.m && fa.nx * fb.nx + fa.ny * fb.ny > 0) return net([{ x: A.x, y: A.y }, fa.P, fb.P, { x: B.x, y: B.y }]);
    const det = fa.ux * fb.uy - fa.uy * fb.ux;
    if (Math.abs(det) < 0.2) return routePiece(A, B); // (murs parallèles, ex. face à face : le tour de la pièce)
    const t = ((fb.P.x - fa.P.x) * fb.uy - (fb.P.y - fa.P.y) * fb.ux) / det,
      C = { x: fa.P.x + fa.ux * t, y: fa.P.y + fa.uy * t };
    const dansMur = f => {
      const k = (C.x - f.m.a.x) * f.ux + (C.y - f.m.a.y) * f.uy,
        ep = f.m.ep || d.epaisseur;
      return k > -ep - 5 && k < f.L + ep + 5;
    };
    if (!dansMur(fa) || !dansMur(fb)) return routePiece(A, B);
    return net([{ x: A.x, y: A.y }, fa.P, C, fb.P, { x: B.x, y: B.y }]);
  }
  /** moulure entre deux appareils de la même pièce qui ne sont ni sur le même mur, ni sur deux murs qui se touchent :
   *  elle fait le tour de la pièce le long des murs, par le côté le plus court (coins compris) */
  function routePiece(A, B) {
    const pc = (d.pieces || []).find(p => (p.pts || []).length >= 3 && dansPolygone(A, p.pts) && dansPolygone(B, p.pts));
    if (!pc) return null;
    const P = pc.pts,
      n = P.length;
    // (chaque côté décalé vers l'intérieur : 2 cm devant la face du mur, que le contour soit sur la face ou au milieu du mur)
    const cotes = P.map((a, i) => {
      const b = P[(i + 1) % n],
        L = dist(a, b) || 1,
        ux = (b.x - a.x) / L,
        uy = (b.y - a.y) / L,
        mi = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      let nx = -uy,
        ny = ux;
      if (!dansPolygone({ x: mi.x + nx * 3, y: mi.y + ny * 3 }, P)) {
        nx = -nx;
        ny = -ny;
      }
      const mp = murProche(mi, 80),
        ep = mp ? mp.m.ep || d.epaisseur : 0,
        off = mp ? Math.max(2, ep / 2 + 2 - mp.d) : 2;
      return { a: { x: a.x + nx * off, y: a.y + ny * off }, ux, uy, L };
    });
    const coin = j => {
      const c1 = cotes[(j - 1 + n) % n],
        c2 = cotes[j],
        det = c1.ux * c2.uy - c1.uy * c2.ux;
      if (Math.abs(det) < 1e-6) return c2.a;
      const t = ((c2.a.x - c1.a.x) * c2.uy - (c2.a.y - c1.a.y) * c2.ux) / det;
      return { x: c1.a.x + c1.ux * t, y: c1.a.y + c1.uy * t };
    };
    const coins = P.map((_, j) => coin(j));
    const projete = o => {
      let best = null;
      for (let i = 0; i < n; i++) {
        const a = coins[i],
          b = coins[(i + 1) % n],
          L2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2 || 1,
          t = Math.max(0, Math.min(1, ((o.x - a.x) * (b.x - a.x) + (o.y - a.y) * (b.y - a.y)) / L2)),
          q = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t },
          dd = dist(o, q);
        if (!best || dd < best.d) best = { i, q, d: dd };
      }
      return best;
    };
    const pa = projete(A),
      pb = projete(B);
    if (!pa || !pb) return null;
    const longueur = pts => pts.reduce((s, q, i) => (i ? s + dist(pts[i - 1], q) : 0), 0);
    // (dans le sens du contour, et dans l'autre)
    const avant = [pa.q];
    for (let i = pa.i; i !== pb.i; i = (i + 1) % n) avant.push(coins[(i + 1) % n]);
    avant.push(pb.q);
    const arriere = [pa.q];
    for (let i = pa.i; i !== pb.i; i = (i - 1 + n) % n) arriere.push(coins[i]);
    arriere.push(pb.q);
    const ch = pa.i === pb.i ? [pa.q, pb.q] : longueur(avant) <= longueur(arriere) ? avant : arriere;
    const net = pts => pts.filter((q, i) => i === 0 || dist(q, pts[i - 1]) > 0.5);
    return net([{ x: A.x, y: A.y }, ...ch, { x: B.x, y: B.y }]);
  }
  /** moulure conseillée : la plus petite dont la section utile (≈ intérieur, parois de 1,5 mm) garde la même règle de remplissage */
  function moulureConseillee(lots, goul) {
    const n = {};
    for (const l of lots)
      for (const f of l.fils) {
        const k = f === "C" ? "C" : l.section || "2,5";
        n[k] = (n[k] || 0) + 1;
      }
    const r = reglesGaines(),
      occupe = sectionFils(n, r.ext);
    const ms = moulures(goul)
      .map(k => [k, dimsMoulure(k)])
      .sort((a, b) => a[1][0] * a[1][1] - b[1][0] * b[1][1]);
    for (const [k, [l, hh]] of ms) if (occupe <= ((l - 3) * (hh - 3) * r.taux) / 100 + 0.01) return k;
    return ms.length ? ms[ms.length - 1][0] : "32x12";
  }
  /** tailles de moulures de la liste (⚙ Options > Gaines : « 22x12, 32x12… ») */
  const moulures = goul =>
    String((goul ? optPlans().goulottes || GOULOTTES_DEFAUT : optPlans().moulures) || MOULURES_DEFAUT)
      .split(/[,;\s]+(?=\d)/)
      .map(x => x.trim().toLowerCase().replace("×", "x").replace(/\s/g, ""))
      .filter(dimsMoulure);
  /** taille du conduit : choisie, sinon conseillée ; texte (« Ø20 », « 12×20 ») ; trop petit ? */
  const tailleGaine = g =>
    conduitDe(g) === "moulure"
      ? dimsMoulure(g.moulure)
        ? g.moulure
        : moulureConseillee(lotsTries(g), estGoulotte(g))
      : g.diam || diametreConseille(lotsTries(g));
  const libTaille = (g, t) => (conduitDe(g) === "moulure" ? String(t).replace("x", "×") : "Ø" + t);
  const surfM = k => {
    const x = dimsMoulure(k);
    return x ? x[0] * x[1] : 0;
  };
  const tropPetite = g =>
    conduitDe(g) === "moulure"
      ? !!(dimsMoulure(g.moulure) && surfM(g.moulure) < surfM(moulureConseillee(lotsTries(g), estGoulotte(g))))
      : !!(g.diam && g.diam < diametreConseille(lotsTries(g)));
  function diametreConseille(lots) {
    const n = {};
    for (const l of lots)
      for (const f of l.fils) {
        const k = f === "C" ? "C" : l.section || "2,5";
        n[k] = (n[k] || 0) + 1;
      }
    const r = reglesGaines(),
      occupe = sectionFils(n, r.ext);
    const diams = Object.keys(r.int)
      .map(Number)
      .sort((a, b) => a - b);
    for (const dm of diams) if (occupe <= (((Math.PI * Number(r.int[dm]) ** 2) / 4) * r.taux) / 100 + 0.01) return dm;
    return diams[diams.length - 1] || 40;
  }
  /** couleur d'un fil : choisie à la main pour ce fil, sinon celle de sa fonction */
  /** couleur d'un fil, de la plus précise à la plus générale : ce fil (lot tapé à la main, ou gaine calculée),
   *  la fonction dans son circuit (ex. tous les retours d'un circuit lumière en violet), la fonction (⚙ Options) */
  const cleFil = (l, k, i) => (l.rep || "#" + k) + ":" + i;
  const couleurFil = (g, k, l, i) => {
    const f = l.fils[i],
      c = l.cid && circuitDe(l.cid);
    return (
      (l.couleurs && l.couleurs[i]) ||
      (g.couleurs && g.couleurs[cleFil(l, k, i)]) ||
      (c && c.couleurs && c.couleurs[f]) ||
      (optPlans().couleurs_fils || {})[f] ||
      COULEUR_FONCTION[f] ||
      "noir"
    );
  };
  const hexFil = c => (COULEURS_FIL[c] || COULEURS_FIL.noir)[1];
  /** points de la gaine : départ, coudes, arrivée */
  const cheminGaine = g => {
    const A = objetDe(g.de),
      B = objetDe(g.vers);
    if (!A || !B) return null;
    if (conduitDe(g) === "moulure" && !(g.pts || []).length) {
      const r = routeMoulure(A, B);
      if (r) return r;
    } // (moulure : collée au mur)
    return [{ x: A.x, y: A.y }, ...(g.pts || []), { x: B.x, y: B.y }];
  };
  /** gaine sans coude : trait direct, courbé par sa poignée (comme une liaison) ; point de contrôle de la courbe */
  const controleGaine = (g, a, b) => {
    const dc = g.dc && conduitDe(g) !== "moulure" ? g.dc : null; // (moulure, goulotte : toujours droite)
    return { x: (a.x + b.x) / 2 + (dc ? dc.x : 0), y: (a.y + b.y) / 2 + (dc ? dc.y : 0) };
  };
  const surCourbe = (a, c, b, t) => ({
    x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
    y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
    tx: 2 * (1 - t) * (c.x - a.x) + 2 * t * (b.x - c.x),
    ty: 2 * (1 - t) * (c.y - a.y) + 2 * t * (b.y - c.y),
  });

  /** liaison entre deux appareils ; le circuit passe dans les deux sens, à tout le groupe qui n'en a pas encore */
  function lier(de, ob) {
    if (!de || !ob || de.id === ob.id) return;
    if (!d.liaisons.some(l => (l.de === de.id && l.vers === ob.id) || (l.de === ob.id && l.vers === de.id))) {
      const li = { id: plId(), de: de.id, vers: ob.id };
      d.liaisons.push(li);
      marquerRecent("liaison", li.id);
    }
    const ci = de.circuit || ob.circuit;
    if (ci)
      groupe(ob.id).forEach(x => {
        if (!x.circuit) x.circuit = ci;
      });
  }
  function choisirGroupe(id) {
    const gr = groupe(id);
    etat.sel = new Set(gr.map(o => o.id));
    dessiner();
    majPanneau();
    if (gr.length > 1) toast(gr.length + " appareils reliés choisis : « ← Affecter » sur un circuit pour les y mettre.");
  }
  async function finirPiece() {
    const pts = etat.piece || [];
    etat.piece = null;
    etat.apercu = {};
    if (pts.length < 3) {
      dessiner();
      return;
    }
    const nomP = await demanderTexte("Nom de la pièce (ex. Cuisine, Chambre 1) :", "");
    if (nomP === null) {
      dessiner();
      return;
    }
    const pc = { id: plId(), nom: nomP.trim(), auto: false, pts };
    d.pieces.push(pc);
    etat.sel = new Set([pc.id]);
    valider();
  }
  svg.addEventListener("contextmenu", e => e.preventDefault());
  svg.addEventListener(
    "wheel",
    e => {
      e.preventDefault();
      const avant = versMonde(e.clientX, e.clientY);
      const z = Math.min(8, Math.max(0.1, etat.vue.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
      const r = svg.getBoundingClientRect();
      etat.vue = { z, x: avant.x - (e.clientX - r.left) / z, y: avant.y - (e.clientY - r.top) / z };
      dessiner();
      enregistrer();
    },
    { passive: false }
  );

  /* -- aide -- */
  /** tout le dessin (fond, murs, appareils, pièces, notes) grandit ou rétrécit autour du point c :
   * le fond et les murs dessinés par-dessus restent superposés, seules les cotes changent */
  function mettreAEchelle(k, c) {
    const P = q => {
      if (q) {
        q.x = c.x + (q.x - c.x) * k;
        q.y = c.y + (q.y - c.y) * k;
      }
    };
    if (d.fond) {
      const f = d.fond;
      f.x = c.x + (f.x - c.x) * k;
      f.y = c.y + (f.y - c.y) * k;
      f.l *= k;
      f.h *= k;
    }
    d.murs.forEach(m => {
      P(m.a);
      P(m.b);
    });
    d.objets.forEach(P);
    (d.pieces || []).forEach(pc => {
      P(pc.germe);
      (pc.pts || []).forEach(P);
      if (pc.etiquette) {
        pc.etiquette.dx *= k;
        pc.etiquette.dy *= k;
      }
    });
    (d.notes || []).forEach(n => (n.pts || []).forEach(P));
    (d.liaisons || []).forEach(l => {
      if (l.dc) {
        l.dc.x *= k;
        l.dc.y *= k;
      }
    });
    (d.gaines || []).forEach(g => {
      (g.pts || []).forEach(P);
      if (g.dc) {
        g.dc.x *= k;
        g.dc.y *= k;
      }
    });
  }
  function barreCalibrage() {
    const cb = etat.calib;
    if (!cb || !cb.b) return;
    const champ = h("input", {
      type: "text",
      inputmode: "decimal",
      placeholder: "ex. 4,20",
      style: "width:90px;font-size:16px",
      value: etat.calibValeur || "",
    });
    const valider_ = () => {
      const reel = nombre(champ.value),
        mesure = dist(cb.a, cb.b);
      if (!(reel > 0)) {
        toast("Tapez la distance réelle entre les deux bouts de la ligne, en mètres.", true);
        champ.focus();
        return;
      }
      if (mesure < 1) {
        toast("La ligne est trop courte.", true);
        return;
      }
      etat.calibValeur = champ.value;
      const avecMurs = d.murs.length > 0;
      mettreAEchelle((reel * 100) / mesure, cb.a);
      barreReco.style.display = "none";
      etat.calib = null;
      choisirOutil("selection");
      valider();
      toast(
        avecMurs
          ? "Mis à l'échelle : le fond et le dessin ont suivi ensemble (seules les cotes changent)."
          : "Fond de plan mis à l'échelle."
      );
      if (d.fond && !avecMurs) setTimeout(() => lancerDetection(1), 50);
    };
    champ.addEventListener("keydown", e => {
      e.stopPropagation();
      if (e.key === "Enter") valider_();
      if (e.key === "Escape") choisirOutil("selection");
    });
    barreReco.replaceChildren(
      h("span", {}, h("b", {}, "Mise à l'échelle"), " · déplacez les bouts ronds si besoin · distance réelle :"),
      champ,
      h("span", {}, "m"),
      h("button", { class: "btn principal petit", type: "button", onclick: valider_ }, "✓ Valider"),
      h("button", { class: "btn petit", type: "button", onclick: () => choisirOutil("selection") }, "✕ Annuler")
    );
    barreReco.style.display = "";
    if (!etat.tablette) setTimeout(() => champ.focus(), 30);
  }

  function aidePlan() {
    // (trois onglets : au doigt, au clavier et à la souris — les outils dans le même ordre, chacun avec ses astuces —,
    //  et ce qui ne dépend pas de l'appareil : circuits, niveaux, gaines, impression…)
    const ligne = (icone, touche, nom, txt, astuces) =>
      h(
        "tr",
        {},
        h(
          "td",
          { style: "white-space:nowrap;padding:4px 10px 4px 0;vertical-align:top" },
          icone ? h("span", { style: "display:inline-block;min-width:28px;font-size:18px;text-align:center" }, icone) : null,
          touche ? h("kbd", { class: "rc" }, touche) : null
        ),
        h(
          "td",
          { style: "padding:4px 0" },
          nom ? h("b", {}, nom + " — ") : null,
          txt,
          astuces && astuces.length
            ? h(
                "ul",
                { style: "margin:2px 0 0;padding-left:18px;color:#4b5563" },
                astuces.map(a => h("li", {}, a))
              )
            : null
        )
      );
    const titre = t => h("h4", { style: "margin:12px 0 4px" }, t);
    const table = lignes => h("table", {}, h("tbody", {}, ...lignes));
    const icPorte = h("span", { html: ICONES_SVG.porte + " " + ICONES_SVG.passage + " ▤" });
    const icPiece = () => h("span", { html: ICONES_SVG.piece });
    // (outils : [icône, touche, nom, au doigt, au clavier et à la souris, astuces communes])
    const OUTILS = [
      [
        "↖",
        "V",
        "Sélection",
        "un appui choisit (près d'un appareil, l'appareil plutôt que le mur derrière) ; ⇧ Maj puis appuis : en ajouter ou en retirer ; la poignée ✥ décalée sous l'appareil (ou à côté du mur, de la porte) se glisse pour le déplacer en le voyant.",
        "clic ; Ctrl+clic ou Maj+clic pour ajouter ; cadre dans le vide ; Ctrl+A : tout ; glisser pour déplacer ; double-clic sur un appareil (ou G) : tout son groupe de liaisons ; Suppr ; Échap ou clic droit revient toujours ici.",
        [
          "Agrandir une pièce : glissez un mur ; il reste d'équerre, les murs reliés s'allongent, les appareils contre lui suivent.",
          "Appareil choisi seul : carré en haut à droite (ou poignées carrées) pour l'agrandir ou l'élargir (radiateur…) ; il reste collé au mur.",
          "Mur choisi seul : bouts A et B marqués, le panneau dit lequel bouge quand on tape la longueur ; 🔒 Longueur figée : il garde sa longueur.",
          "Une porte se choisit d'un appui dans l'arc de son battant ; elle glisse le long de son mur.",
        ],
      ],
      [
        "▭",
        "M",
        "Murs",
        "un appui à chaque angle, angles droits automatiques ; ⇧ Maj (barre du bas) : angle libre, le mur peut pencher ; ✓ Terminer pour finir ; longueur exacte : dans le panneau du mur, une fois tracé.",
        "un clic à chaque angle, angles droits automatiques ; Maj : angle libre ; longueur tapée au clavier (ex. 3,45 puis Entrée) ; double-clic ou clic droit pour finir ; Alt maintenue : hors grille.",
        [
          "Aimantation aux bouts des murs et aux alignements (trait vert).",
          "◠ Arrondi (2e appui sur le bouton Mur, ou M de nouveau) : touchez les deux murs sur leur moitié côté arrondi (pas besoin de viser le bout), puis le rayon ; angle ou murs parallèles ; l'arrondi choisi : rayon à changer, ou l'enlever.",
          "Deux murs choisis : A et B sur le plan, angle entre eux dans le panneau (et lequel bouge) ; plusieurs murs : ⊾ Tout d'équerre.",
        ],
      ],
      [
        "⬚",
        "E",
        "Rectangle",
        "appui sur un angle puis sur l'angle opposé (ou glisser) ; dimensions exactes : dans le panneau des murs, une fois tracé.",
        "clic sur un angle puis sur l'angle opposé (ou glisser), ou dimensions tapées (ex. 4,5x3 puis Entrée).",
        ["4 murs sans doubler ceux déjà là, et la pièce avec son nom."],
      ],
      [
        "✍",
        "H",
        "Main levée",
        "un appui prend l'outil, un 2e appui ouvre le menu des modes (lettre orange : M murs, S symboles, G gaines, N notes).",
        "un clic prend l'outil, un 2e clic ouvre le menu ; la touche H passe au mode suivant.",
        [
          "Murs : le tour d'une pièce d'un seul trait devient des murs droits puis la pièce ; un petit quart de cercle contre un mur : une porte ; un rectangle étroit sur un mur : une fenêtre.",
          "Symboles : le dessin devient le symbole reconnu (tableau : rectangle et ses deux diagonales) ; un rond avec une abréviation (PC, LL, RAD…) : le repère rond ; un trait d'un appareil à un autre : une liaison ; un trait fermé autour de plusieurs appareillages : un bloc.",
          "Gaines : un trait de la boîte à l'appareil devient la gaine (ou la moulure).",
          "Notes : dessin libre, trait droit, cercle, rectangle, flèche, en couleur ; ⌫ pour en effacer ; calque « Notes à main levée » pour les cacher.",
          "↶ si le résultat ne convient pas.",
        ],
      ],
      [
        "⌫",
        "X",
        "Gomme",
        "appuyez sur un mur et glissez le long de lui ; ou glissez sur les notes à effacer.",
        "cliquez sur un mur et glissez le long de lui ; ou glissez sur les notes à effacer.",
        ["Au milieu d'un mur : un passage (les pièces restent séparées) ; jusqu'au bout : le mur est raccourci."],
      ],
      [
        icPorte,
        "P / F",
        "Porte, ouverture libre, fenêtre",
        "un appui sur un mur ; 2e appui sur le bouton Porte : Porte (P), Libre (L), coulissante à Galandage (G) ou en Applique (A).",
        "un clic sur un mur ; P de nouveau : porte → libre → galandage → applique ; F : fenêtre.",
        [
          "Type, largeur, sens d'ouverture et charnières dans le panneau de droite.",
          "Coulissante : à galandage, elle rentre dans la cloison ; en applique, elle glisse le long du mur. Un appareil posé là où elle s'efface est marqué ⚠ porte.",
        ],
      ],
      [
        icPiece(),
        "S",
        "Pièce",
        "un appui dans une pièce fermée ; contour à la main : ⇧ Maj, un appui à chaque angle, puis ✓ Terminer.",
        "un clic dans une pièce fermée ; contour à la main : Maj+clic à chaque angle, puis Entrée.",
        ["Nom et surface en m², même en L ; une pièce trouvée par clic suit les murs ; son nom se glisse."],
      ],
      [
        "⤳",
        "L",
        "Liaison",
        "appuyez sur un appareil et glissez jusqu'à l'autre (ou deux appuis).",
        "clic sur un appareil, puis sur le suivant ; chaque liaison repart du dernier.",
        ["Le circuit suit dans les deux sens ; poignée ronde pour courber une liaison choisie."],
      ],
      [
        "⌇",
        "U",
        "Gaine, moulure, goulotte",
        "glissez de la boîte (ou du tableau) à l'appareil ; 2e appui sur le bouton : Gaine / Moulure / Goulotte ; poignée bleue sur ce qu'on vient de poser : glissez-la pour courber.",
        "clic sur la boîte, puis sur l'appareil ; clic dans le vide avant : un coude (Maj : libre) ; U de nouveau : gaine → moulure → goulotte ; à la souris, la gaine peut se tracer à main levée.",
        [
          "Une gaine par appareil, jamais de dérivation en T ; la suivante repart de la même boîte. À ne pas confondre avec les liaisons (qui commande quoi).",
          "Fils en traits obliques de couleur, un lot par appareil, avec repère, section et diamètre ; couleur d'un fil : son petit trait dans le panneau.",
          "Moulure : collée au mur, toujours droite, une porte contournée par-dessus ; appui (clic) dans le vide près du mur : départ du plafond.",
        ],
      ],
      [
        "◎",
        "W",
        "Roue des symboles",
        "un appui là où poser, puis choix dans la roue (un appui : les autres symboles) ; un appui sur un appareil posé le glisse.",
        "clic là où poser, puis choix dans la roue (survol : les autres) ; Échap ou clic droit : fermer.",
        ["On reste dans l'outil pour le suivant ; à votre goût (outils de tracé compris) : ⚙ Options > Roue des symboles."],
      ],
      [
        "T",
        "T",
        "Texte",
        "un appui là où écrire ; sur un appareil : texte attaché qui le suit.",
        "clic là où écrire ; sur un appareil : texte attaché qui le suit.",
        ["Taille, couleur, gras dans le panneau."],
      ],
      [
        "⚡",
        "C / I / D / A",
        "Appareils",
        "liste des symboles à gauche (◧ pour l'afficher), puis un appui pour poser ; l'appareil qu'on vient de poser se glisse aussitôt.",
        "C prise, I interrupteur, D DCL, A applique (les autres : liste de gauche) ; R : tourner.",
        [
          "Ils s'aimantent au mur le plus proche ; au plafond, ils se centrent dans la pièce ; ils ne s'alignent que sur ceux de la même pièce.",
          "Double prise, interrupteur + prise : choisissez-les, « ▭ Mettre en bloc ».",
          "Arrivée des combles et boîte posées près d'un coin : dans l'angle.",
          "Un élément sans symbole (pompe, portail, spa…) : « Rectangle + texte libre… » (Divers), il se relie à une gaine comme un appareil.",
          "Climatisation : split intérieur et groupe extérieur (Chauffage).",
        ],
      ],
    ];
    const outilsDe = col =>
      table(OUTILS.map(o => ligne(o[0] instanceof Node ? o[0].cloneNode(true) : o[0], col === 3 ? "" : o[1], o[2], o[col], o[5])));
    const tablette = h(
      "div",
      {},
      titre("Outils, au doigt"),
      outilsDe(3),
      titre("Barre du bas (mode ✋ Tablette)"),
      table([
        ligne("↶ ↷", "", "", "Annuler / rétablir"),
        ligne("✋", "", "", "Déplacer : un doigt fait glisser la vue au lieu de dessiner (deux doigts : déplacer et zoomer, toujours)"),
        ligne("⇧", "", "", "Maj : comme la touche Maj — sélection de plusieurs objets, mur penché, contour de pièce point par point"),
        ligne("✓", "", "", "Terminer : la pièce dessinée point par point ou la suite de murs (comme Entrée)"),
        ligne("⟳", "", "", "Pivoter les appareils choisis d'un quart de tour"),
        ligne("🗑", "", "", "Supprimer ce qui est choisi"),
        ligne("Échap", "", "", "Quitter l'outil en cours"),
        ligne("＋ －", "", "", "Zoomer / dézoomer (ou pincer à deux doigts)"),
      ]),
      titre("Écran"),
      table([
        ligne("◧ ◨", "", "", "Afficher ou cacher la liste des symboles (gauche) / le panneau de droite"),
        ligne(
          "☰",
          "",
          "",
          "Fond de plan, options, imprimer, dupliquer, supprimer le plan ; boutons à droite (droitier) ou à gauche (gaucher)"
        ),
        ligne("⛶", "", "", "Plein écran (colonne bleue de gauche)"),
        ligne("", "", "", "Appui long sur un bouton : son nom"),
      ])
    );
    const clavier = h(
      "div",
      {},
      titre("Outils, au clavier et à la souris"),
      outilsDe(4),
      titre("Souris"),
      table([
        ligne("", "Molette", "", "Zoomer / dézoomer, autour du pointeur"),
        ligne("", "Clic du milieu + glisser", "", "Déplacer la vue ; aussi : Espace + glisser"),
        ligne("", "Clic droit", "", "Murs : finit la suite de murs ; autres outils : retour à la sélection, comme Échap"),
      ]),
      titre("Clavier"),
      table([
        ligne("", "Échap", "", "Quitter l'outil en cours et revenir à la sélection (2e appui : ne plus rien choisir)"),
        ligne("", "R", "", "Tourner les appareils choisis d'un quart de tour"),
        ligne("", "G", "", "Choisir tout le groupe relié à l'appareil choisi"),
        ligne("", "Suppr", "", "Effacer ce qui est choisi"),
        ligne("", "Ctrl+Z / Ctrl+Y", "", "Annuler / rétablir"),
        ligne("", "Alt (maintenue)", "", "Poser ou déplacer hors grille, au centimètre"),
        ligne("", "?", "", "Cette aide"),
      ]),
      h(
        "p",
        { class: "sous", style: "margin:8px 0 0" },
        "Sur PC, ◂ (avant Sélection) et ▸ (après Texte) replient la liste des symboles et le panneau de droite."
      )
    );
    const general = h(
      "div",
      {},
      h(
        "ul",
        { style: "margin:6px 0 0;padding-left:18px" },
        ...[
          "Circuits : « + Circuit » à droite, puis choisissez des appareils et « ← Affecter » ; « ⚡ Circuit spécialisé » pour un appareil seul ; alertes NF C 15-100 désactivables (⚙ Options > Circuits).",
          "Pièce choisie : « Lot de prises… » répartit des prises le long des murs ; « Circuit lumière… » pose les points lumineux et les commandes (avec un lit : la 2e en tête de lit), avec liaisons et circuit.",
          "Cotes (bloc Cotes du panneau) : murs extérieurs (largeur et profondeur), murs extérieurs détaillés (chaque façade, au bord extérieur), murs intérieurs (cotes intérieures), ou tout masquer ; une cote intérieure se change d'un appui (clic) dessus, ou dans le panneau du mur choisi, 🔒 pour la garder.",
          "Niveaux (bloc Affichage) : ajouter, renommer, placer plus bas ou plus haut, supprimer ; circuits communs ; Calques : le niveau du dessous en transparence. Traversée de plancher : posée aussi sur le niveau du dessus.",
          "Fond de plan (☰) : image ou PDF, mis à l'échelle par une ligne de longueur connue, puis dessiner par-dessus ; « Garder ce fond en vue sur les autres niveaux » ; photo d'un croquis : 🔍 Reconnaître murs et portes.",
          "Calques (sous les circuits) : ce qui est affiché et imprimé ; « Plan seul » cache toute l'électricité.",
          "Sanitaires et mobilier : à leur taille réelle, ne comptent nulle part ; douche et baignoire : volumes V1 et V2.",
          "Plusieurs armoires : un symbole Tableau par armoire, « Alimentée par » dans son panneau ; chaque circuit choisit son armoire.",
          "Options « Devis et métrés » : ouvrages repris dans le devis (« → Devis »), longueurs des gaines et des fils, registre des gaines et moulures (☰). Liste des plans → « → Tableau » : le tableau électrique.",
          "Imprimer… : A4, A3 ou A3 en deux A4, échelle, contenu, cartouche et légende à glisser dans l'aperçu.",
          "⚙ Options : taille du texte et des symboles, épaisseur des murs, symboles de la liste (cacher, ranger, importer les vôtres).",
          "Le plan s'enregistre tout seul.",
        ].map(t => h("li", { style: "margin:3px 0" }, t))
      )
    );
    const ONGLETS = [
      ["tablette", "✋ Tablette", tablette],
      ["clavier", "⌨ Clavier et souris", clavier],
      ["general", "Plan et réglages", general],
    ];
    let actif = etat.tablette ? "tablette" : "clavier";
    try {
      actif = localStorage.getItem("dfa_plan_aide") || actif;
    } catch {
      /* (stockage indisponible) */
    }
    const zone = h("div", { class: "aide-plan-zone", style: "max-height:62vh;overflow:auto;font-size:13.5px;line-height:1.45" });
    const barre = h("div", { class: "sous-onglets", style: "margin-bottom:6px" });
    const montrer = cle => {
      actif = ONGLETS.some(o => o[0] === cle) ? cle : "clavier";
      try {
        localStorage.setItem("dfa_plan_aide", actif);
      } catch {
        /* (stockage indisponible) */
      }
      barre.querySelectorAll("button").forEach(b => b.classList.toggle("actif", b.dataset.o === actif));
      zone.replaceChildren(ONGLETS.find(o => o[0] === actif)[2]);
      zone.scrollTop = 0;
    };
    barre.append(...ONGLETS.map(([k, lib]) => h("button", { type: "button", "data-o": k, onclick: () => montrer(k) }, lib)));
    montrer(actif);
    // (recherche : les lignes et astuces des trois onglets qui contiennent les mots, avec le nom de leur onglet)
    const sans = t =>
      String(t || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, "");
    const cherche = h("input", {
      type: "search",
      class: "aide-plan-cherche",
      placeholder: "Chercher dans l'aide (ex. porte, longueur, fond)…",
      style: "width:100%;margin-bottom:6px",
    });
    cherche.addEventListener("input", () => {
      const mots = sans(cherche.value).split(/\s+/).filter(Boolean);
      if (!mots.length) {
        barre.style.display = "";
        ONGLETS.forEach(([, , el]) => el.querySelectorAll(".cache-aide").forEach(x => x.classList.remove("cache-aide")));
        montrer(actif);
        return;
      }
      barre.style.display = "none";
      const vus = [];
      for (const [, lib, el] of ONGLETS) {
        el.querySelectorAll(".cache-aide").forEach(x => x.classList.remove("cache-aide"));
        let n = 0;
        el.querySelectorAll("tbody > tr, ul > li").forEach(x => {
          if (x.tagName === "LI" && x.closest("tr")) return; // (astuce d'un outil : avec son outil)
          const ok = mots.every(m => sans(x.textContent).includes(m));
          x.classList.toggle("cache-aide", !ok);
          if (ok) n++;
        });
        el.querySelectorAll("table, ul").forEach(t => {
          if (t.closest("tr")) return;
          t.classList.toggle("cache-aide", !t.querySelector("tr:not(.cache-aide), li:not(.cache-aide)"));
        });
        el.querySelectorAll("h4").forEach(t => {
          const suite = t.nextElementSibling;
          t.classList.toggle("cache-aide", !suite || suite.classList.contains("cache-aide"));
        });
        if (n) vus.push(h("h4", { style: "margin:12px 0 2px;color:var(--accent)" }, lib), el);
      }
      zone.replaceChildren(...(vus.length ? vus : [h("p", { class: "sous" }, "Rien trouvé.")]));
    });
    ouvrirModale(
      "Plans électriques : mode d'emploi",
      h(
        "div",
        {},
        cherche,
        barre,
        zone,
        h(
          "p",
          { style: "margin:8px 0 0" },
          h(
            "a",
            { href: "aide/index.html#plans-électriques-module-électricien", target: "_blank" },
            "📖 Documentation complète du module Plans"
          )
        )
      ),
      [h("button", { class: "btn principal", onclick: fermerModale }, "Fermer")],
      { largeur: "min(780px, 94vw)" }
    );
  }

  /* -- fond de plan : image ou PDF d'un plan existant -- */
  const boiteMurs = () => {
    if (!d.murs.length) return null;
    const xs = d.murs.flatMap(m => [m.a.x, m.b.x]),
      ys = d.murs.flatMap(m => [m.a.y, m.b.y]);
    return { x: Math.min(...xs), y: Math.min(...ys), l: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  };
  function reduireImage(src) {
    // (une image de plus de 3000 points est réduite : le plan reste léger)
    return new Promise((ok, ko) => {
      const im = new Image();
      im.onload = () => {
        const k = Math.min(1, 3000 / Math.max(im.width, im.height));
        if (k >= 1) {
          ok({ src, l: im.width, h: im.height });
          return;
        }
        const cv = document.createElement("canvas");
        cv.width = Math.round(im.width * k);
        cv.height = Math.round(im.height * k);
        const cx = cv.getContext("2d");
        cx.fillStyle = "#fff";
        cx.fillRect(0, 0, cv.width, cv.height);
        cx.drawImage(im, 0, 0, cv.width, cv.height);
        ok({ src: cv.toDataURL("image/jpeg", 0.88), l: cv.width, h: cv.height });
      };
      im.onerror = () => ko(new Error("Image illisible."));
      im.src = src;
    });
  }
  async function pdfVersImage(fichier) {
    if (location.protocol === "file:")
      throw new Error(
        "Fond de plan en PDF : pas possible quand la page est ouverte par un double-clic (le navigateur l'interdit). Utilisez une image (photo, capture), ou la page en ligne."
      );
    const pdfjs = await import(new URL("vendor/pdfjs/pdf.mjs", document.baseURI).href);
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("vendor/pdfjs/pdf.worker.mjs", document.baseURI).href;
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await fichier.arrayBuffer()) }).promise;
    let n = 1;
    if (doc.numPages > 1) {
      n = parseInt(await demanderTexte(`Ce PDF a ${doc.numPages} pages : numéro de la page du plan ?`, "1"), 10) || 1;
      n = Math.min(Math.max(1, n), doc.numPages);
    }
    const pg = await doc.getPage(n);
    const v1 = pg.getViewport({ scale: 1 }),
      vp = pg.getViewport({ scale: Math.min(5, 3000 / Math.max(v1.width, v1.height)) });
    const cv = document.createElement("canvas");
    cv.width = Math.round(vp.width);
    cv.height = Math.round(vp.height);
    const cx = cv.getContext("2d");
    cx.fillStyle = "#fff";
    cx.fillRect(0, 0, cv.width, cv.height);
    await pg.render({ canvasContext: cx, viewport: vp }).promise;
    return { src: cv.toDataURL("image/jpeg", 0.88), l: cv.width, h: cv.height };
  }
  function fenetreFond() {
    const fichier = h("input", { type: "file", accept: "image/*,.pdf,application/pdf" });
    const etatTxt = h("span", { class: "sous" });
    fichier.addEventListener("change", async () => {
      const f = fichier.files[0];
      if (!f) return;
      etatTxt.textContent = "Lecture…";
      try {
        const img =
          /\.pdf$/i.test(f.name) || f.type === "application/pdf"
            ? await pdfVersImage(f)
            : await reduireImage(
                await new Promise((ok, ko) => {
                  const r = new FileReader();
                  r.onload = () => ok(r.result);
                  r.onerror = () => ko(new Error("Fichier illisible."));
                  r.readAsDataURL(f);
                })
              );
        const bm = boiteMurs(),
          l = bm && bm.l > 100 ? bm.l : 1200;
        const t = taille();
        d.fond = {
          src: img.src,
          l,
          h: (l * img.h) / img.l,
          x: bm ? bm.x : etat.vue.x + 40 / etat.vue.z,
          y: bm ? bm.y : etat.vue.y + 40 / etat.vue.z,
          op: d.fond ? (d.fond.op ?? 0.5) : 0.5,
        };
        if (!bm) etat.vue = { x: d.fond.x - 40, y: d.fond.y - 40, z: Math.min(t.l / (d.fond.l + 80), t.h / (d.fond.h + 80)) };
        etat.fondSrc = d.fond.src;
        fermerModale();
        valider();
        toast("Fond importé : mettez-le à l'échelle (tracez une ligne de longueur connue).");
        choisirOutil("calibrer");
      } catch (e) {
        etatTxt.textContent = "";
        erreur(e);
      }
    });
    const blocs = [
      h(
        "label",
        { class: "champ" },
        h("span", {}, d.fond ? "Remplacer par une image ou un PDF" : "Image (JPG, PNG…) ou PDF du plan existant"),
        fichier,
        etatTxt
      ),
    ];
    if (d.fond) {
      const op = h("input", { type: "range", min: 5, max: 100, step: 5, value: Math.round((d.fond.op ?? 0.5) * 100) });
      op.addEventListener("input", () => {
        d.fond.op = op.value / 100;
        dessiner();
      });
      op.addEventListener("change", () => valider());
      const larg = h("input", { type: "number", min: 1, step: 0.01, value: (d.fond.l / 100).toFixed(2), style: "width:100px" });
      larg.addEventListener("change", () => {
        const l = nombre(larg.value) * 100;
        if (l > 0) {
          mettreAEchelle(l / d.fond.l, { x: d.fond.x, y: d.fond.y });
          valider();
        }
      });
      const tous = h("input", { type: "checkbox", checked: !!d.fond.tous });
      tous.addEventListener("change", () => {
        if (tous.checked) {
          // (un seul fond gardé sur tous les niveaux)
          for (const e of Object.values(d.etages || {})) if (e && e.fond) delete e.fond.tous;
          d.fond.tous = true;
        } else delete d.fond.tous;
        valider();
      });
      blocs.push(
        h("label", { class: "champ" }, h("span", {}, "Visibilité du fond"), op),
        d.niveaux && d.niveaux.length > 1
          ? h(
              "label",
              { class: "case", title: "Les niveaux qui n'ont pas leur propre fond montrent celui-ci (pour caler les murs d'un étage)" },
              tous,
              "Garder ce fond en vue sur les autres niveaux"
            )
          : null,
        h("label", { class: "champ" }, h("span", {}, "Largeur réelle de l'image (m)"), larg),
        h(
          "div",
          { style: "display:flex;gap:6px;flex-wrap:wrap" },
          h(
            "button",
            {
              class: "btn",
              onclick: () => {
                fermerModale();
                choisirOutil("calibrer");
              },
            },
            "📏 Mettre à l'échelle (ligne de longueur connue)"
          ),
          h(
            "button",
            {
              class: "btn",
              onclick: () => {
                fermerModale();
                choisirOutil("fond");
              },
            },
            "Déplacer le fond"
          ),
          h(
            "button",
            {
              class: "btn principal",
              title:
                "Croquis photographié ou plan scanné : les murs et les portes sont reconnus, à vérifier avant de valider (mettez d'abord le fond à l'échelle)",
              onclick: () => {
                fermerModale();
                lancerDetection(1);
              },
            },
            "🔍 Reconnaître murs et portes"
          ),
          h(
            "button",
            {
              class: "btn danger",
              onclick: () => {
                d.fond = null;
                etat.fondSrc = null;
                fermerModale();
                valider();
              },
            },
            "Retirer le fond"
          )
        )
      );
    }
    blocs.push(
      h(
        "p",
        { class: "aide" },
        "Le fond sert de modèle pour dessiner les murs par-dessus ; il est enregistré avec le plan et peut être imprimé ou non."
      )
    );
    ouvrirModale("Fond de plan", h("div", { class: "pile" }, ...blocs), [h("button", { class: "btn", onclick: fermerModale }, "Fermer")], {
      largeur: "min(560px, 94vw)",
    });
  }

  /* -- reconnaissance des murs et des portes sur le fond (photo d'un croquis, scan) : voir plan_photo.js -- */
  // 1. encadrer le plan sur la photo (le bord de la feuille, la table, la date de la photo… restent dehors)
  function lancerDetection(sens) {
    if (!d.fond || !d.fond.src) {
      toast("Importez d'abord la photo du croquis (Fond de plan…).", true);
      return;
    }
    choisirOutil("selection");
    etat.detect = null;
    etat.cadrage = { sens };
    etat.zoneDetect = null;
    clearTimeout(minuterieReco);
    barreReco.replaceChildren(
      h(
        "span",
        {},
        h("b", {}, "Encadrez le plan sur la photo"),
        " : glissez d'un coin à l'autre, juste autour du dessin (sans le bord de la feuille)"
      ),
      h(
        "button",
        {
          class: "btn petit",
          type: "button",
          onclick: () => {
            etat.cadrage = null;
            analyserPhoto(sens, null);
          },
        },
        "Toute la photo"
      ),
      h(
        "button",
        {
          class: "btn petit",
          type: "button",
          onclick: () => {
            etat.cadrage = null;
            etat.zoneDetect = null;
            barreReco.style.display = "none";
            dessiner();
          },
        },
        "✕ Annuler"
      )
    );
    barreReco.style.display = "";
    dessiner();
  }
  // 2. reconnaissance dans la zone encadrée
  async function analyserPhoto(sens, zone) {
    const img = new Image();
    img.src = d.fond.src;
    try {
      await img.decode();
    } catch (e) {
      toast("Image du fond illisible.", true);
      return;
    }
    const f = d.fond,
      kx = f.l / img.naturalWidth,
      ky = f.h / img.naturalHeight;
    let source = img,
      ox = 0,
      oy = 0;
    if (zone) {
      // (morceau de la photo, en pixels de l'image)
      const x0 = Math.max(0, Math.floor((Math.min(zone.a.x, zone.b.x) - f.x) / kx)),
        y0 = Math.max(0, Math.floor((Math.min(zone.a.y, zone.b.y) - f.y) / ky));
      const x1 = Math.min(img.naturalWidth, Math.ceil((Math.max(zone.a.x, zone.b.x) - f.x) / kx)),
        y1 = Math.min(img.naturalHeight, Math.ceil((Math.max(zone.a.y, zone.b.y) - f.y) / ky));
      if (x1 - x0 < 20 || y1 - y0 < 20) {
        toast("Zone trop petite, ou hors de la photo.", true);
        lancerDetection(sens);
        return;
      }
      source = document.createElement("canvas");
      source.width = x1 - x0;
      source.height = y1 - y0;
      source.getContext("2d").drawImage(img, x0, y0, x1 - x0, y1 - y0, 0, 0, x1 - x0, y1 - y0);
      ox = x0;
      oy = y0;
    }
    let r;
    try {
      r = detecterMurs(source, sens);
    } catch (e) {
      erreur(e);
      return;
    }
    const monde = q => ({ x: grille(f.x + (q.x + ox) * kx), y: grille(f.y + (q.y + oy) * ky) });
    const murs = r.murs.map(m => ({ a: monde(m.a), b: monde(m.b), ok: true })).filter(m => dist(m.a, m.b) >= 20);
    // portes : arc contre un mur (deux murs possibles dans un angle : un appui passe à l'autre), ou vide de 55 cm à 1,30 m
    const portes = r.portes
      .map(m => ({
        alt: (m.alt || [m]).map(q => ({ a: monde(q.a), b: monde(q.b) })),
        i: 0,
        ok: true,
        vide: m.vide,
        charn: m.charn && monde(m.charn),
        libre: m.libre && monde(m.libre),
      }))
      .map(p => {
        p.alt = p.alt.filter(q => {
          const L = dist(q.a, q.b);
          return L >= 45 && L <= 140;
        });
        return p;
      })
      .filter(p => p.alt.length)
      .map(p => Object.assign(p, p.alt[0]));
    etat.detect = { murs, portes, sens, angle: r.angle, zone };
    dessiner();
    majBarreDetect();
  }
  function majBarreDetect() {
    const dt = etat.detect;
    if (!dt) return;
    clearTimeout(minuterieReco);
    const nm = dt.murs.filter(m => m.ok).length,
      np = dt.portes.filter(m => m.ok).length;
    const sens = h(
      "select",
      {
        title:
          "Sensibilité : plus haute si des murs au crayon léger manquent, plus basse si des traits parasites (texte, ombres) sont pris pour des murs",
      },
      [
        ["0", "Sensibilité basse"],
        ["1", "Sensibilité normale"],
        ["2", "Sensibilité haute"],
      ].map(([v, l]) => h("option", { value: v }, l))
    );
    sens.value = String(dt.sens);
    sens.addEventListener("change", () => analyserPhoto(Number(sens.value), dt.zone));
    barreReco.replaceChildren(
      h(
        "span",
        {},
        h("b", {}, nm + " mur(s), " + np + " porte(s)"),
        " reconnus" +
          (dt.angle ? ` (photo penchée de ${Math.abs(dt.angle).toString().replace(".", ",")}° : plan remis d'équerre)` : "") +
          " · touchez un mur pour l'enlever ou le remettre, une porte pour la passer sur l'autre mur puis l'enlever"
      ),
      sens,
      h(
        "button",
        { class: "btn petit", type: "button", title: "Encadrer de nouveau le plan sur la photo", onclick: () => lancerDetection(dt.sens) },
        "⬚ Recadrer"
      ),
      h("button", { class: "btn petit principal", type: "button", onclick: validerDetection }, "✓ Valider"),
      h(
        "button",
        {
          class: "btn petit",
          type: "button",
          onclick: () => {
            etat.detect = null;
            fermerReco();
            dessiner();
          },
        },
        "✕ Annuler"
      )
    );
    barreReco.style.display = "";
  }
  function validerDetection() {
    const dt = etat.detect;
    if (!dt) return;
    etat.detect = null;
    fermerReco();
    const portes = dt.portes.filter(m => m.ok);
    // murs (ceux déjà dessinés ne sont pas doublés), y compris le morceau de mur où va chaque porte
    for (const m of [...dt.murs.filter(x => x.ok), ...portes]) creerContour([m.a, m.b], false, true);
    for (const m of portes) {
      const c = { x: (m.a.x + m.b.x) / 2, y: (m.a.y + m.b.y) / 2 },
        mp = murProche(c, 10);
      // (arc dessiné : porte ; mur simplement interrompu : passage sans porte)
      if (!mp) continue;
      // porte : largeur standard la plus proche (63, 73, 83 ou 93 cm), charnière gardée à sa place ; passage : largeur mesurée
      const mesure = dist(m.a, m.b),
        std = m.vide ? Math.round(mesure) : [63, 73, 83, 93].reduce((p, v) => (Math.abs(v - mesure) < Math.abs(p - mesure) ? v : p));
      const o = { id: plId(), genre: m.vide ? "passage" : "porte", mur: mp.m.id, t: mp.t, largeur: std, sens: 1, charniere: "g" };
      if (!m.vide && m.charn && m.i === 0) {
        const L = dist(mp.m.a, mp.m.b) || 1,
          ux = (mp.m.b.x - mp.m.a.x) / L,
          uy = (mp.m.b.y - mp.m.a.y) / L;
        const tc = ((m.charn.x - mp.m.a.x) * ux + (m.charn.y - mp.m.a.y) * uy) / L,
          dir = Math.sign(mp.t - tc) || 1;
        o.t = Math.max(0, Math.min(1, tc + (dir * std) / 2 / L));
      }
      // battant dessiné : côté des charnières et sens d'ouverture comme sur le croquis
      if (m.charn && m.libre && m.i === 0) {
        const g = geomOuverture(o),
          w = o.largeur / 2,
          pa = { x: g.c.x - g.ux * w, y: g.c.y - g.uy * w },
          pb = { x: g.c.x + g.ux * w, y: g.c.y + g.uy * w };
        o.charniere = dist(m.charn, pb) < dist(m.charn, pa) ? "d" : "g";
        o.sens = (m.libre.x - m.charn.x) * g.nx + (m.libre.y - m.charn.y) * g.ny >= 0 ? 1 : -1;
      }
      d.ouvertures.push(o);
    }
    valider();
    toast(
      "Murs et portes ajoutés : corrigez à la main ce qui manque (outils Mur, Porte, Main levée), puis « Pièce » pour nommer les pièces."
    );
  }

  /* -- impression : format, échelle, position du plan sur la feuille -- */
  const FORMATS = { a4: [297, 210], a3: [420, 297], a3x2: [390, 287] }; // (A3 en 2 A4 : surface imprimable de deux A4, 1 cm collé)
  function boiteDessin(avecFond) {
    const pts = [
      ...d.murs.flatMap(m => [m.a, m.b]),
      ...d.objets.map(o => ({ x: o.x, y: o.y })),
      ...(d.pieces || []).flatMap(pc => pc.pts || []),
    ];
    if (avecFond && d.fond) pts.push({ x: d.fond.x, y: d.fond.y }, { x: d.fond.x + d.fond.l, y: d.fond.y + d.fond.h });
    if (!pts.length) return null;
    const m = 60,
      x0 = Math.min(...pts.map(q => q.x)) - m,
      y0 = Math.min(...pts.map(q => q.y)) - m;
    return { x: x0, y: y0, l: Math.max(...pts.map(q => q.x)) + m - x0, h: Math.max(...pts.map(q => q.y)) + m - y0 };
  }
  /** le dessin du plan (coordonnées en cm), tracé pour le papier : traits et textes à la bonne taille */
  /** ce qui est imprimé : tout, symboles + liaisons (sans gaines), pieuvre (symboles + gaines, sans liaisons), bâti seul */
  const CONTENUS_IMP = { tout: [], symboles: ["gaines"], pieuvre: ["liaisons"], bati: ["electricite", "liaisons", "gaines"] };
  const contenuImp = o => {
    const m = o.masques;
    if (m) return m.electricite ? "bati" : m.liaisons && !m.gaines ? "pieuvre" : "tout";
    return CONTENUS_IMP[o.contenu] ? o.contenu : o.sansElec ? "bati" : "tout";
  };
  const legendeImp = o => (o.legende === true || o.legende === undefined ? "droite" : o.legende || "");
  function contenuImpression(mmParCm, avecFond, bb, symbMm, texteMm, masques) {
    const sauve = { vue: etat.vue, sel: etat.sel, ap: etat.apercu, cv: etat.circuitVu, masques: d.masques };
    d.masques = { ...(masques || {}) }; // (calques choisis pour l'impression)
    // textes et cotes : texteMm sur la feuille (les cotes font 11 points d'écran) ; traits en proportion
    etat.vue = { x: bb.x, y: bb.y, z: texteMm ? (mmParCm * 11) / texteMm : mmParCm / 0.25 };
    etat.imp = { texteCm: (texteMm || 2.75) / mmParCm };
    etat.sel = new Set();
    etat.apercu = {};
    etat.circuitVu = null;
    // symboles : symbMm sur la feuille ; les appareils muraux reculent d'autant pour toucher encore le mur
    const T0 = TAILLE_SYMBOLE,
      T1 = symbMm ? symbMm / mmParCm : T0,
      positions = d.objets.map(o => [o, o.x, o.y]);
    if (T1 !== T0)
      for (const o of d.objets) {
        const def = SYMB[o.type];
        if (o.genre !== "symbole" || !def || def.pose !== "mur") continue;
        const mp = murProche(o, 200);
        if (!mp || mp.d > (mp.m.ep || d.epaisseur) / 2 + (def.prof * T0) / 40 + 3) continue;
        const a = (((o.rot || 0) - 90) * Math.PI) / 180,
          k = (def.prof * (T1 - T0)) / 40;
        o.x += Math.cos(a) * k;
        o.y += Math.sin(a) * k;
      }
    TAILLE_SYMBOLE = T1;
    try {
      dessiner();
    } finally {
      TAILLE_SYMBOLE = T0;
      positions.forEach(([o, x, y]) => {
        o.x = x;
        o.y = y;
      });
      etat.imp = null;
    }
    const morceaux = [...svg.children].filter(
      n => n.getAttribute("stroke") !== "#e5e7eb" && (n.hasAttribute("data-fond") ? avecFond : n.getAttribute("pointer-events") !== "none")
    );
    const html = morceaux.map(n => n.outerHTML).join("");
    Object.assign(etat, { vue: sauve.vue, sel: sauve.sel, apercu: sauve.ap, circuitVu: sauve.cv });
    d.masques = sauve.masques;
    dessiner();
    return html;
  }
  const CART = { l: 96, h: 30 }; // cartouche (mm)
  function miseEnPage(o, bb) {
    let [W, H] = FORMATS[o.format] || FORMATS.a4;
    if (o.portrait) [W, H] = [H, W];
    const leg = contenuImp(o) === "bati" ? "" : legendeImp(o),
      cart = o.cartouche !== false;
    const mg = o.format === "a3x2" ? 3 : 10,
      haut = cart ? 0 : 17,
      larLeg = leg === "droite" ? 58 : 0,
      hautLeg = leg === "bas" ? CART.h + 2 : 0;
    const zone = {
      x: mg + 2,
      y: mg + haut + 2,
      l: W - 2 * mg - 4 - (larLeg ? larLeg + 3 : 0),
      h: H - 2 * mg - haut - 4 - (hautLeg ? hautLeg + 1 : 0),
    };
    const mmParCm = o.echelle === "ajuster" ? Math.min(zone.l / bb.l, zone.h / bb.h) : 10 / Number(o.echelle);
    // cartouche : en bas à droite, déplaçable (glissé dans l'aperçu) ; gardé dans la feuille
    const c = o.cart || {},
      cx = Math.min(W - mg - CART.l, Math.max(mg, W - mg - CART.l + (c.dx || 0))),
      cy = Math.min(H - mg - CART.h, Math.max(mg, H - mg - CART.h + (c.dy || 0)));
    return {
      W,
      H,
      mg,
      haut,
      larLeg,
      hautLeg,
      leg,
      zone,
      mmParCm,
      N: Math.round(10 / mmParCm),
      cart: cart ? { x: cx, y: cy, l: CART.l, h: CART.h, place: !c.dx && !c.dy } : null,
    };
  }
  const echapper = t =>
    String(t ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;");
  const coupe = (t, n) => {
    t = String(t || "");
    return t.length > n ? t.slice(0, n - 1) + "…" : t;
  };
  /** éléments de la légende : symboles, circuits, couleurs des fils ; chacun se dessine à (x, y) sur une largeur l */
  function elementsLegende(o) {
    o = o || {};
    const el = [],
      titre = t =>
        el.push({
          h: 6,
          titre: true,
          w: String(t).length * 1.9 + 2,
          svg: (x, y) => `<text x="${x}" y="${y + 4.3}" font-size="3.4" font-weight="700">${echapper(t)}</text>`,
        });
    const comptes = {};
    d.objets
      .filter(ob => ob.genre === "symbole" && symboleVu(ob) && !estDecor(ob))
      .forEach(ob => {
        const k = cleMateriel(ob);
        comptes[k] = (comptes[k] || 0) + 1;
      });
    if (o.leg_symboles === false) for (const k of Object.keys(comptes)) delete comptes[k];
    if (Object.keys(comptes).length) titre("Légende");
    for (const [t, n] of Object.entries(comptes)) {
      const dessin = SYMB[t]
        ? dessinTrait(SYMB[t].dessin)
        : t.startsWith("rep:")
          ? dessinRepere(t.slice(4))
          : t.startsWith("rect:")
            ? dessinRepere(t.slice(5), true)
            : "";
      const lib = (SYMB[t] || {}).libelle || (t.startsWith("rep:") ? "Repère " + t.slice(4) : t.startsWith("rect:") ? t.slice(5) : t);
      el.push({
        h: 6.4,
        w: 8 + lib.length * 1.45 + 7,
        svg: (x, y, l) =>
          `<svg x="${x}" y="${y}" width="6" height="6" viewBox="-20 -20 40 40"><g style="color:#111" stroke="currentColor" fill="currentColor" stroke-width="${traitSymb()}">${dessin}</g></svg>` +
          `<text x="${x + 8}" y="${y + 4}" font-size="2.8">${echapper(coupe(lib, Math.round((l - 14) / 1.45)))}</text><text x="${x + l - 3}" y="${y + 4}" font-size="2.8" text-anchor="end">${n}</text>`,
      });
    }
    if (o.leg_circuits !== false && vu("electricite") && d.circuits.length) {
      titre(`Circuits (${d.circuits.length} départs)`);
      for (const c of d.circuits) {
        const n = d.objets.filter(ob => ob.circuit === c.id && (SYMB[ob.type] || {}).categorie !== "Commandes").length;
        el.push({
          h: 5.6,
          w: 8 + `${repDe(c)} · ${c.nom || "Circuit"} · ${c.calibre || ""} A`.length * 1.45 + 7,
          svg: (x, y, l) =>
            `<rect x="${x + 1}" y="${y + 1.2}" width="3.6" height="3.6" rx="0.6" fill="${c.couleur}"/><text x="${x + 8}" y="${y + 4}" font-size="2.8">${echapper(coupe(`${repDe(c)} · ${c.nom || "Circuit"} · ${c.calibre || ""} A`, Math.round((l - 14) / 1.45)))}</text>` +
            `<text x="${x + l - 3}" y="${y + 4}" font-size="2.8" text-anchor="end">${n}</text>`,
        });
      }
    }
    // gaines (plan de pieuvre) : nom, de → vers, diamètre, et les fils de chaque lot
    const ga =
      o.leg_gaines !== false && vu("gaines")
        ? (d.gaines || []).filter(g => g.nom && objetDe(g.de) && objetDe(g.vers) && symboleVu(objetDe(g.de)) && symboleVu(objetDe(g.vers)))
        : [];
    if (ga.length) {
      titre(`Gaines (${ga.length})`);
      const cle = g => (g.nom ? [0, g.nom.length, g.nom] : [1, 0, ""]);
      for (const g of ga.slice().sort((a, b) => {
        const x = cle(a),
          y = cle(b);
        return x[0] - y[0] || x[1] - y[1] || x[2].localeCompare(y[2], "fr", { numeric: true });
      })) {
        const lots = lotsTries(g);
        el.push({
          h: 0,
          gaine: true,
          svg: null,
          nom: g.nom || "—",
          lots: lots.map((l, k) => ({
            cols: l.fils.map((_, i) => couleurFil(g, k, l, i)),
            txt: [l.rep, l.section].filter(Boolean).join(" "),
            coul: l.coulRep || null,
          })),
        });
      }
    }
    return el;
  }
  /** une gaine dans la légende : sa lettre, puis chaque lot en traits de couleur, repère et section (« A ⫽⫽⫽ PC 2,5  ⫽⫽ SA 1,5 ») ;
   *  les lots à la suite sur la même ligne tant qu'il y a la place */
  function ligneGaineLegende(it, l) {
    const lignes = [[]],
      xNom = 1.9 * String(it.nom).length + 2.5;
    let x = xNom;
    for (const lot of it.lots) {
      const lg = lot.cols.length * 1.15 + 1 + lot.txt.length * 1.35 + 2.6;
      if (x + lg > l - 1 && lignes[lignes.length - 1].length) {
        lignes.push([]);
        x = xNom;
      }
      lignes[lignes.length - 1].push({ x, lot });
      x += lg;
    }
    const ht = lignes.length * 3.6 + 1.6;
    const w = Math.max(
      xNom + 4,
      ...lignes.map(li =>
        li.length ? li[li.length - 1].x + li[li.length - 1].lot.cols.length * 1.15 + 1 + li[li.length - 1].lot.txt.length * 1.35 + 1 : 0
      )
    );
    return {
      h: ht,
      w,
      gaine: true,
      svg: (x0, y0) => {
        let t = `<text x="${x0 + 1}" y="${y0 + 3.4}" font-size="2.9" font-weight="700">${echapper(it.nom)}</text>`;
        lignes.forEach((li, n) =>
          li.forEach(({ x: dx, lot }) => {
            const y = y0 + 3.4 + n * 3.6;
            lot.cols.forEach((c, i) => {
              const xx = x0 + dx + i * 1.15;
              t +=
                `<line x1="${xx}" y1="${y + 0.5}" x2="${xx + 1.1}" y2="${y - 2.4}" stroke="${hexFil(c)}" stroke-width="0.5" stroke-linecap="round"/>` +
                (c === "vj"
                  ? `<line x1="${xx}" y1="${y + 0.5}" x2="${xx + 1.1}" y2="${y - 2.4}" stroke="#facc15" stroke-width="0.5" stroke-dasharray="0.5 0.5"/>`
                  : "");
            });
            if (lot.txt)
              t += `<text x="${x0 + dx + lot.cols.length * 1.15 + 1}" y="${y}" font-size="2.6" font-weight="${lot.coul ? 700 : 600}" fill="${lot.coul || "#000"}">${echapper(lot.txt)}</text>`; // (noir : lisible sur un chantier mal éclairé)
          })
        );
        return t;
      },
    };
  }
  /** cartouche conventionnel : entreprise, plan, client, adresse, date, échelle, format */
  function cartoucheSvg(c, o, N) {
    // (version web autonome : ce qui a été tapé dans la fenêtre Imprimer ; DF artisan prend ses propres données)
    const cm = (PLANS_AUTONOMES && d.cartouche_manuel) || {};
    const e = (PARAMS && PARAMS.entreprise) || {},
      { x, y, l, h: ht } = c;
    const niv = d.niveaux.length > 1 ? (d.niveaux.find(n => n.id === d.niveau) || {}).nom || "" : "";
    const fmt = { a4: "A4", a3: "A3", a3x2: "A3 (2 × A4)" }[o.format] || "A4";
    const t = (tx, ty, txt, taille, gras, ancre, n) =>
      `<text x="${tx}" y="${ty}" font-size="${taille}"${gras ? ' font-weight="700"' : ""}${ancre ? ` text-anchor="${ancre}"` : ""}>${echapper(coupe(txt, n || 60))}</text>`;
    const g1 = x + 34,
      r1 = y + 9,
      r2 = y + 17,
      r3 = y + 23.5;
    let s = `<g font-family="Arial, sans-serif" fill="#111"><rect x="${x}" y="${y}" width="${l}" height="${ht}" fill="#fff" stroke="#111" stroke-width="0.4"/>`;
    s += `<line x1="${g1}" y1="${y}" x2="${g1}" y2="${r3}" stroke="#111" stroke-width="0.25"/>`;
    for (const yy of [r1, r2, r3])
      s += `<line x1="${yy === r3 ? x : g1}" y1="${yy}" x2="${x + l}" y2="${yy}" stroke="#111" stroke-width="0.25"/>`;
    s += `<line x1="${x}" y1="${r3}" x2="${x + l}" y2="${r3}" stroke="#111" stroke-width="0.25"/>`;
    // colonne de gauche : l'entreprise
    // (logo de l'entreprise à la place de son nom, s'il y en a un : même place, coordonnées dessous)
    const logo = o.cart_logo !== false && e.logo && /^data:image\//.test(e.logo);
    if (logo)
      s += `<image href="${String(e.logo).replace(/"/g, "&quot;")}" x="${x + 2}" y="${y + 1.3}" width="${30}" height="${8.4}" preserveAspectRatio="xMinYMid meet"/>`;
    else s += t(x + 2, y + 5, e.nom_commercial || e.raison_sociale || cm.entreprise || "", 3.2, true, "", 18);
    const y1 = logo ? y + 13 : y + 9.5;
    const adrE = [e.adresse, [e.cp, e.ville].filter(Boolean).join(" ")].filter(Boolean);
    adrE.slice(0, 2).forEach((a, i) => {
      s += t(x + 2, y1 + i * 3.4, String(a).split("\n")[0], 2.3, false, "", 26);
    });
    if (e.telephone) s += t(x + 2, y1 + Math.min(2, adrE.length) * 3.4, e.telephone, 2.3, false, "", 26);
    // à droite : titre, client, adresse du chantier
    const titre = (nom.value || "Plan") + (niv ? " — " + niv : "");
    s +=
      t(
        g1 + 2,
        y + 3.4,
        o.titre_cartouche || (contenuImp(o) === "pieuvre" ? "PLAN DE PIEUVRE" : "PLAN D'IMPLANTATION ÉLECTRIQUE"),
        2.1,
        false,
        "",
        60
      ) + t(g1 + 2, y + 7.6, titre, 3.6, true, "", 34);
    s +=
      t(g1 + 2, r1 + 2.6, "Client", 1.9) +
      t(
        g1 + 2,
        r1 + 6.4,
        [p.client_nom || cm.client, p.document_numero && "Devis " + p.document_numero].filter(Boolean).join(" · "),
        2.8,
        false,
        "",
        42
      );
    s +=
      t(g1 + 2, r2 + 2.4, "Chantier", 1.9) + t(g1 + 2, r2 + 5.6, (p.adresse || cm.chantier || "").replace(/\n/g, ", "), 2.6, false, "", 46);
    // bas : date, échelle, format
    const cases = [
        ["Date", new Date().toLocaleDateString("fr-FR")],
        ["Échelle", "1:" + N],
        ["Format", fmt],
        ["Indice", o.indice || "A"],
      ],
      lc = l / cases.length;
    cases.forEach(([lib, v], i) => {
      const cx = x + i * lc;
      if (i) s += `<line x1="${cx}" y1="${r3}" x2="${cx}" y2="${y + ht}" stroke="#111" stroke-width="0.25"/>`;
      s += t(cx + 1.5, r3 + 2.3, lib, 1.8) + t(cx + 1.5, r3 + 5.6, v, 2.7, true);
    });
    return s + "</g>";
  }
  function feuilleSvg(o, mp, bb, contenu) {
    const { W, H, mg, haut, larLeg, hautLeg, zone, mmParCm, N } = mp;
    const vw = zone.l / mmParCm,
      vh = zone.h / mmParCm,
      cx = bb.x + bb.l / 2 - (o.dx || 0) / mmParCm,
      cy = bb.y + bb.h / 2 - (o.dy || 0) / mmParCm;
    const e = (PARAMS && PARAMS.entreprise) || {};
    let s = `<rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/><rect x="${mg}" y="${mg}" width="${W - 2 * mg}" height="${H - 2 * mg}" fill="none" stroke="#9ca3af" stroke-width="0.3"/>`;
    if (!mp.cart) {
      // (sans cartouche : bandeau en haut, comme avant)
      s += `<g font-family="Arial, sans-serif" fill="#111"><text x="${mg + 3}" y="${mg + 6.5}" font-size="4.5" font-weight="700">${echapper((nom.value || "Plan") + (d.niveaux.length > 1 ? " — " + ((d.niveaux.find(n => n.id === d.niveau) || {}).nom || "") : ""))}</text>`;
      s += `<text x="${mg + 3}" y="${mg + 11}" font-size="3">${echapper([p.client_nom, p.document_numero && "Devis " + p.document_numero].filter(Boolean).join(" · "))}</text>`;
      s += `<text x="${mg + 3}" y="${mg + 14.5}" font-size="3">${echapper((p.adresse || "").replace(/\n/g, ", "))}</text>`;
      s += `<text x="${W - mg - 3}" y="${mg + 6.5}" font-size="3.5" font-weight="700" text-anchor="end">${echapper(e.nom_commercial || e.raison_sociale || "")}</text>`;
      s += `<text x="${W - mg - 3}" y="${mg + 11}" font-size="3" text-anchor="end">${new Date().toLocaleDateString("fr-FR")}</text>`;
      s += `<text x="${W - mg - 3}" y="${mg + 14.5}" font-size="3" text-anchor="end">Échelle 1:${N}</text></g>`;
      s += `<line x1="${mg}" y1="${mg + haut - 0.5}" x2="${W - mg}" y2="${mg + haut - 0.5}" stroke="#9ca3af" stroke-width="0.3"/>`;
    }
    s += `<svg x="${zone.x}" y="${zone.y}" width="${zone.l}" height="${zone.h}" viewBox="${cx - vw / 2} ${cy - vh / 2} ${vw} ${vh}" overflow="hidden" font-family="Arial, sans-serif">${contenu}</svg>`;
    mp.manque = null;
    // (légende trop longue : ce qui ne tient pas est dit sur la feuille et dans la fenêtre d'impression)
    const manque = (reste, x, y, ancre) => {
      const n = reste.filter(it => !it.titre).length,
        ng = reste.filter(it => it.gaine).length;
      mp.manque = { n, ng };
      return `<text x="${x}" y="${y}" font-size="2.6" font-weight="700" fill="#c2410c"${ancre ? ` text-anchor="${ancre}"` : ""}>… ${n} de plus non imprimé${n > 1 ? "s" : ""}${ng ? " (dont " + ng + " gaine" + (ng > 1 ? "s" : "") + ")" : ""}</text>`;
    };
    let el = [];
    if (mp.leg) {
      const sauve = d.masques;
      d.masques = o.masques || d.masques;
      try {
        el = elementsLegende(o);
      } finally {
        d.masques = sauve;
      }
    }
    el = el.map(it => (it.gaine ? ligneGaineLegende(it, larLeg ? larLeg - 1 : 70) : it));
    if (el.length && larLeg) {
      // légende à droite, en colonne (au-dessus du cartouche s'il est à sa place)
      const x = W - mg - larLeg,
        l = larLeg - 1,
        bas = mp.cart && mp.cart.place ? mp.cart.y - 2 : H - mg - 2;
      let y = zone.y + 1;
      s += `<line x1="${x - 1.5}" y1="${mg + haut}" x2="${x - 1.5}" y2="${mp.cart && mp.cart.place ? mp.cart.y : H - mg}" stroke="#9ca3af" stroke-width="0.3"/><g font-family="Arial, sans-serif" fill="#111">`;
      for (let i = 0; i < el.length; i++) {
        const it = el[i];
        if (y + it.h > bas - 4) {
          s += manque(el.slice(i), x, Math.min(y + 3, bas));
          break;
        }
        if (it.titre && y > zone.y + 1) y += 2;
        s += it.svg(x, y, l);
        y += it.h;
      }
      s += "</g>";
    } else if (el.length && hautLeg) {
      // légende en bas, à l'horizontale : colonnes côte à côte, à gauche du cartouche
      const y0 = H - mg - hautLeg,
        droite = mp.cart && mp.cart.place ? mp.cart.x - 2 : W - mg - 2,
        lc = 52;
      s += `<line x1="${mg}" y1="${y0}" x2="${mp.cart && mp.cart.place ? mp.cart.x : W - mg}" y2="${y0}" stroke="#9ca3af" stroke-width="0.3"/><g font-family="Arial, sans-serif" fill="#111">`;
      // colonnes à la largeur de leur contenu (pas de place perdue entre elles), 70 mm au plus
      const cols = [];
      let cur = [],
        y = y0 + 1;
      el.forEach((it, i) => {
        if (cur.length && (y + it.h > H - mg - 0.5 || (it.titre && y + it.h + 5.2 > H - mg - 0.5))) {
          cols.push(cur);
          cur = [];
          y = y0 + 1;
        }
        cur.push({ it, y, i });
        y += it.h;
      });
      if (cur.length) cols.push(cur);
      let x = mg + 2;
      for (const col of cols) {
        const lw = Math.min(70, Math.max(24, ...col.map(c => c.it.w || lc - 2)));
        if (x + lw > droite + 1) {
          s += manque(el.slice(col[0].i), droite - 1, y0 - 0.6, "end");
          break;
        } // (juste au-dessus du trait de la légende)
        if (x > mg + 2)
          s += `<line x1="${x - 1.5}" y1="${y0 + 1.5}" x2="${x - 1.5}" y2="${H - mg - 1.5}" stroke="#cbd5e1" stroke-width="0.25"/>`; // (trait entre deux colonnes)
        for (const c of col) s += c.it.svg(x, c.y, lw);
        x += lw + 3;
      }
      s += "</g>";
    }
    if (mp.cart) s += cartoucheSvg(mp.cart, o, N);
    return s;
  }
  function dialogueImpression() {
    const op = optPlans();
    const o = Object.assign(
      {
        format: "a4",
        portrait: false,
        echelle: "ajuster",
        legende: "droite",
        fond: false,
        dx: 0,
        dy: 0,
        symb: op.imp_symb ?? 6,
        texte: op.imp_texte ?? 3,
        cartouche: true,
      },
      d.impression || {}
    );
    o.legende = legendeImp(o);
    // calques imprimés : ceux de l'écran au départ (ou ceux de la dernière impression), réglables ici
    if (!o.masques) {
      o.masques = { ...(d.masques || {}) };
      for (const k of CONTENUS_IMP[contenuImp(o)] || []) o.masques[k] = true;
    }
    delete o.sansElec;
    delete o.contenu;
    if (!boiteDessin(true)) {
      toast("Le plan est vide.", true);
      return;
    }
    const cache = {};
    const contenu = (mmParCm, bb) => {
      const k = [mmParCm.toFixed(4), o.fond, o.symb, o.texte, JSON.stringify(o.masques)].join("|");
      return cache[k] || (cache[k] = contenuImpression(mmParCm, o.fond, bb, o.symb, o.texte, o.masques));
    };
    const selSy = h(
      "select",
      {},
      h("option", { value: 0 }, "Comme à l'écran"),
      [4, 5, 6, 7, 8, 10, 12].map(v => h("option", { value: v }, v + " mm"))
    );
    const selTx = h(
      "select",
      {},
      h("option", { value: 0 }, "Comme à l'écran"),
      [2, 2.5, 3, 3.5, 4, 5].map(v => h("option", { value: v }, String(v).replace(".", ",") + " mm"))
    );
    selSy.value = String(o.symb);
    selTx.value = String(o.texte);
    // (tailles gardées pour tous les plans : ⚙ Options, ou ce bouton)
    const parDefaut = h(
      "button",
      {
        class: "btn petit",
        title: "Ces deux tailles deviennent celles proposées pour tous les plans (⚙ Options des plans)",
        onclick: async () => {
          try {
            await enregistrerPlans({ imp_symb: o.symb, imp_texte: o.texte });
            toast("Tailles gardées pour tous les plans.");
          } catch (e) {
            erreur(e);
          }
        },
      },
      "Garder ces tailles pour tous les plans"
    );
    const selF = h(
      "select",
      {},
      h("option", { value: "a4" }, "A4"),
      h("option", { value: "a3" }, "A3"),
      h("option", { value: "a3x2" }, "A3 en 2 feuilles A4 (à coller)")
    );
    const selO = h("select", {}, h("option", { value: "paysage" }, "Paysage"), h("option", { value: "portrait" }, "Portrait"));
    const selE = h(
      "select",
      {},
      h("option", { value: "ajuster" }, "Ajusté à la feuille"),
      ...[20, 25, 50, 75, 100, 125, 150, 200].map(n => h("option", { value: n }, "1:" + n))
    );
    const cFond = h("input", { type: "checkbox" }),
      cCart = h("input", { type: "checkbox", checked: o.cartouche !== false });
    const cLeg = h(
      "select",
      {},
      h("option", { value: "droite" }, "À droite"),
      h("option", { value: "bas" }, "En bas, à l'horizontale"),
      h("option", { value: "" }, "Aucune")
    );
    const selC = h(
      "select",
      {},
      h("option", { value: "" }, "Choisir…"),
      h("option", { value: "tout" }, "Tout : symboles, liaisons et gaines"),
      h("option", { value: "symboles" }, "Symboles et liaisons (sans les gaines)"),
      h("option", { value: "pieuvre" }, "Plan de pieuvre : symboles et gaines"),
      h("option", { value: "bati" }, "Murs et cotes seulement")
    );
    // calques à imprimer (comme ceux du panneau de droite, mais pour cette impression seulement)
    const cats = [...new Set(d.objets.filter(x => x.genre === "symbole" && SYMB[x.type]).map(x => catVue(x.type)))];
    const casesCalques = [
      ...CALQUES_FIXES.map(([k, l]) => [k, l, false]),
      ...cats.map(c => ["cat:" + c, c, true]),
      ...CALQUES_FIN.filter(([k]) => k !== "fond").map(([k, l]) => [k, l, false]),
    ].map(([k, lib, retrait]) => {
      const c = h("input", { type: "checkbox" });
      c.addEventListener("change", () => {
        if (c.checked) delete o.masques[k];
        else o.masques[k] = true;
        selC.value = "";
        rendre();
      });
      return { k, c, el: h("label", { class: "case", style: "font-size:12.5px;" + (retrait ? "padding-left:16px" : "") }, c, lib) };
    });
    const majCases = () =>
      casesCalques.forEach(x => {
        x.c.checked = !o.masques[x.k];
      });
    selC.addEventListener("change", () => {
      if (!selC.value) return;
      const m = {};
      for (const k of CONTENUS_IMP[selC.value] || []) m[k] = true;
      o.masques = m;
      majCases();
      rendre();
    });
    const cLegCase = (cle, lib) => {
      const c = h("input", { type: "checkbox", checked: o[cle] !== false });
      c.addEventListener("change", () => {
        o[cle] = c.checked;
        rendre();
      });
      return h("label", { class: "case", style: "font-size:12.5px" }, c, lib);
    };
    const indice = h("input", { type: "text", value: o.indice || "A", maxlength: 4, style: "width:60px" });
    // (titre du cartouche, au-dessus du nom du plan : à votre goût ; vide : le titre d'office)
    const titreCart = h("input", {
      type: "text",
      value: o.titre_cartouche || "",
      maxlength: 60,
      placeholder: "PLAN D'IMPLANTATION ÉLECTRIQUE",
      title: "Vide : « Plan d'implantation électrique » (ou « Plan de pieuvre »)",
    });
    const avecLogo = !!((PARAMS && PARAMS.entreprise) || {}).logo;
    const cLogo = h("input", { type: "checkbox", checked: o.cart_logo !== false });
    cLogo.addEventListener("change", () => {
      o.cart_logo = cLogo.checked;
      rendre();
    });
    const info = h("div", { class: "sous" });
    const apercu = svgEl("svg", {
      style:
        "width:100%;height:auto;display:block;background:#e5e7eb;border-radius:6px;cursor:move;touch-action:none;user-select:none;-webkit-user-select:none",
    });
    selF.value = o.format;
    selO.value = o.portrait ? "portrait" : "paysage";
    selE.value = String(o.echelle);
    cLeg.value = o.legende;
    cFond.checked = !!o.fond;
    selC.value = "";
    majCases();
    let mp = null,
      bb = null;
    const rendre = () => {
      bb = boiteDessin(o.fond);
      mp = miseEnPage(o, bb);
      const { W, H } = mp;
      let plus = "";
      if (o.format === "a3x2")
        plus = o.portrait
          ? `<rect x="0" y="190" width="${W}" height="10" fill="rgba(220,38,38,.12)"/><line x1="0" y1="195" x2="${W}" y2="195" stroke="#dc2626" stroke-width="0.6" stroke-dasharray="3 2"/>`
          : `<rect x="190" y="0" width="10" height="${H}" fill="rgba(220,38,38,.12)"/><line x1="195" y1="0" x2="195" y2="${H}" stroke="#dc2626" stroke-width="0.6" stroke-dasharray="3 2"/>`;
      // zoom de l'aperçu (molette, boutons) : la feuille entière par défaut
      const vw = (W + 8) / vueA.z,
        vh = (H + 8) / vueA.z;
      if (vueA.cx === null) {
        vueA.cx = W / 2;
        vueA.cy = H / 2;
      }
      vueA.cx = Math.min(W + 4 - vw / 2, Math.max(vw / 2 - 4, vueA.cx));
      vueA.cy = Math.min(H + 4 - vh / 2, Math.max(vh / 2 - 4, vueA.cy));
      if (vueA.z <= 1) {
        vueA.cx = W / 2;
        vueA.cy = H / 2;
      }
      apercu.setAttribute("viewBox", `${vueA.cx - vw / 2} ${vueA.cy - vh / 2} ${vw} ${vh}`);
      apercu.innerHTML =
        `<rect x="-1" y="-1" width="${W + 2}" height="${H + 2}" fill="#9ca3af"/>` + feuilleSvg(o, mp, bb, contenu(mp.mmParCm, bb)) + plus;
      info.replaceChildren(
        `Feuille ${mp.W} × ${mp.H} mm · échelle 1:${mp.N}` +
          (o.echelle === "ajuster" ? " (ajustée)" : "") +
          " · glissez le plan (ou le cartouche) dans l'aperçu pour le placer.",
        mp.manque
          ? h(
              "div",
              { style: "color:#c2410c;font-weight:600;margin-top:4px" },
              `⚠ Légende incomplète : ${mp.manque.n} élément${mp.manque.n > 1 ? "s" : ""} ne tien${mp.manque.n > 1 ? "nent" : "t"} pas` +
                (mp.manque.ng ? ` (dont ${mp.manque.ng} gaine${mp.manque.ng > 1 ? "s" : ""})` : "") +
                ". Essayez la légende à droite ou en bas, le format A3, ou décochez une partie de la légende (symboles, départs)."
            )
          : ""
      );
    };
    const lire = () => {
      o.format = selF.value;
      o.portrait = selO.value === "portrait";
      o.echelle = selE.value === "ajuster" ? "ajuster" : Number(selE.value);
      o.legende = cLeg.value;
      o.fond = cFond.checked;
      o.symb = Number(selSy.value);
      o.texte = Number(selTx.value);
      o.cartouche = cCart.checked;
      o.indice = indice.value.trim();
      o.titre_cartouche = titreCart.value.trim();
      rendre();
    };
    [selF, selO, selE, selSy, selTx, cLeg, cFond, cCart, indice, titreCart].forEach(el => el.addEventListener("change", lire));
    // (version web autonome : cartouche rempli à la main — entreprise, client, chantier —, gardé avec le plan ; DF
    //  artisan ne s'en sert pas, il prend ses propres coordonnées, client et adresse)
    const champsCart = PLANS_AUTONOMES
      ? [
          ["entreprise", "Entreprise (nom, téléphone…)"],
          ["client", "Client"],
          ["chantier", "Adresse du chantier"],
        ].map(([k, lib]) => {
          const c = h("input", { type: "text", value: (d.cartouche_manuel || {})[k] || "", placeholder: lib });
          c.addEventListener("change", () => {
            d.cartouche_manuel = { ...(d.cartouche_manuel || {}), [k]: c.value.trim() };
            valider();
            rendre();
          });
          return h("label", { class: "champ" }, h("span", {}, lib), c);
        })
      : [];
    const vueA = { z: 1, cx: null, cy: null };
    const zoomA = (f, cx, cy) => {
      const z0 = vueA.z;
      vueA.z = Math.min(8, Math.max(1, vueA.z * f));
      if (cx !== undefined) {
        const k = 1 - z0 / vueA.z;
        vueA.cx += (cx - vueA.cx) * k;
        vueA.cy += (cy - vueA.cy) * k;
      }
      rendre();
    };
    const versFeuille = e => {
      const r = apercu.getBoundingClientRect(),
        vb = apercu.viewBox.baseVal;
      return { x: vb.x + ((e.clientX - r.left) / r.width) * vb.width, y: vb.y + ((e.clientY - r.top) / r.height) * vb.height };
    };
    apercu.addEventListener(
      "wheel",
      e => {
        e.preventDefault();
        const q = versFeuille(e);
        zoomA(e.deltaY < 0 ? 1.25 : 0.8, q.x, q.y);
      },
      { passive: false }
    );
    let glisse = null;
    // glisser : déplace le plan sur la feuille (ou le cartouche, pris par lui-même) ; clic du milieu ou Ctrl+glisser : déplace la vue zoomée
    apercu.addEventListener("pointerdown", e => {
      apercu.setPointerCapture(e.pointerId);
      const q = versFeuille(e),
        c = mp && mp.cart,
        surCart = c && q.x >= c.x && q.x <= c.x + c.l && q.y >= c.y && q.y <= c.y + c.h;
      glisse = {
        x: e.clientX,
        y: e.clientY,
        dx: o.dx,
        dy: o.dy,
        vue: e.button === 1 || e.ctrlKey,
        cx: vueA.cx,
        cy: vueA.cy,
        cart: surCart && !(e.button === 1 || e.ctrlKey) ? { ...(o.cart || {}), x0: c.x, y0: c.y } : null,
      };
      e.preventDefault();
    });
    apercu.addEventListener("pointermove", e => {
      if (!glisse) return;
      const k = apercu.viewBox.baseVal.width / (apercu.getBoundingClientRect().width || 1);
      if (glisse.cart) {
        // (gardé dans la feuille ; aimanté à sa place d'origine, en bas à droite)
        let dx = (glisse.cart.dx || 0) + (e.clientX - glisse.x) * k,
          dy = (glisse.cart.dy || 0) + (e.clientY - glisse.y) * k;
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) dx = dy = 0;
        const { W, H, mg } = mp;
        dx = Math.max(-(W - 2 * mg - CART.l), Math.min(0, dx));
        dy = Math.max(-(H - 2 * mg - CART.h), Math.min(0, dy));
        o.cart = { dx: Math.round(dx), dy: Math.round(dy) };
        rendre();
        return;
      }
      if (glisse.vue) {
        vueA.cx = glisse.cx - (e.clientX - glisse.x) * k;
        vueA.cy = glisse.cy - (e.clientY - glisse.y) * k;
        rendre();
        return;
      }
      o.dx = Math.round(glisse.dx + (e.clientX - glisse.x) * k);
      o.dy = Math.round(glisse.dy + (e.clientY - glisse.y) * k);
      rendre();
    });
    apercu.addEventListener("pointerup", () => {
      glisse = null;
    });
    const ligne = (lib, el) => h("label", { class: "champ" }, h("span", {}, lib), el);
    ouvrirModale(
      "Imprimer le plan",
      h(
        "div",
        { style: "display:flex;gap:14px;flex-wrap:wrap" },
        h(
          "div",
          { class: "pile", style: "flex:0 0 220px" },
          ligne("Format", selF),
          ligne("Orientation", selO),
          ligne("Échelle", selE),
          ligne("Taille des symboles", selSy),
          ligne("Taille des textes et cotes", selTx),
          parDefaut,
          ligne("Contenu (préréglage)", selC),
          h(
            "details",
            {},
            h("summary", { style: "cursor:pointer;font-size:13px" }, "Calques imprimés"),
            h(
              "div",
              { style: "display:flex;flex-direction:column;gap:1px;margin:4px 0" },
              casesCalques.map(x => x.el)
            )
          ),
          ligne("Légende", cLeg),
          h(
            "div",
            { style: "display:flex;flex-direction:column;gap:1px" },
            cLegCase("leg_symboles", "Symboles"),
            cLegCase("leg_circuits", "Départs (circuits)"),
            cLegCase("leg_gaines", "Gaines et leurs fils")
          ),
          h("label", { class: "case", title: "Glissez le cartouche dans l'aperçu pour le déplacer" }, cCart, "Cartouche (en bas à droite)"),
          avecLogo
            ? h("label", { class: "case", title: "Logo de Paramètres > Coordonnées" }, cLogo, "Logo à la place du nom de l'entreprise")
            : null,
          ligne("Titre du cartouche", titreCart),
          ...champsCart,
          ligne("Indice du plan", indice),
          h("label", { class: "case" }, cFond, "Imprimer le fond de plan"),
          h(
            "div",
            { style: "display:flex;gap:6px;flex-wrap:wrap" },
            h(
              "button",
              {
                class: "btn petit",
                onclick: () => {
                  o.dx = 0;
                  o.dy = 0;
                  rendre();
                },
              },
              "Recentrer le plan"
            ),
            h(
              "button",
              {
                class: "btn petit",
                onclick: () => {
                  delete o.cart;
                  rendre();
                },
              },
              "Cartouche à sa place"
            )
          ),
          h(
            "p",
            { class: "aide" },
            "Pour respecter l'échelle : dans la fenêtre d'impression, échelle 100 % (pas « ajuster »), marges : aucune."
          )
        ),
        h(
          "div",
          { style: "flex:1 1 380px;min-width:280px" },
          apercu,
          h(
            "div",
            { style: "display:flex;gap:6px;align-items:center;margin-top:6px" },
            h("button", { class: "btn petit", title: "Zoom arrière (molette)", onclick: () => zoomA(0.8) }, "−"),
            h("button", { class: "btn petit", title: "Zoom avant (molette)", onclick: () => zoomA(1.25) }, "+"),
            h(
              "button",
              {
                class: "btn petit",
                onclick: () => {
                  vueA.z = 1;
                  rendre();
                },
              },
              "Page entière"
            ),
            h("span", { class: "sous" }, "molette : zoom · Ctrl+glisser : déplacer la vue")
          ),
          info
        )
      ),
      [
        h("button", { class: "btn", onclick: fermerModale }, "Annuler"),
        h(
          "button",
          {
            class: "btn principal",
            onclick: () => {
              d.impression = { ...o };
              enregistrer();
              imprimerFeuilles(o, mp, feuilleSvg(o, mp, bb, contenu(mp.mmParCm, bb)));
              fermerModale();
            },
          },
          "Imprimer"
        ),
      ],
      { largeur: "min(980px, 96vw)" }
    );
    rendre();
  }
  function imprimerFeuilles(o, mp, contenu) {
    const { W, H } = mp;
    const svgPage = (vb, l, ht, plus) =>
      `<svg xmlns="${ns}" viewBox="${vb}" style="width:${l}mm;height:${ht}mm;display:block">${contenu}${plus || ""}</svg>`;
    let pages, taillePage;
    if (o.format !== "a3x2") {
      taillePage = `${W}mm ${H}mm`;
      pages = [`<div class="page">${svgPage(`0 0 ${W} ${H}`, W, H)}</div>`];
    } else if (!o.portrait) {
      // deux A4 en portrait, côte à côte
      taillePage = "210mm 297mm";
      const coupe = `<line x1="199.8" y1="0" x2="199.8" y2="${H}" stroke="#666" stroke-width="0.3" stroke-dasharray="2 1.5"/><text x="198.5" y="${H - 2}" font-size="2.5" text-anchor="end" font-family="Arial">✂ couper ici</text>`;
      const colle = `<line x1="200" y1="0" x2="200" y2="${H}" stroke="#dc2626" stroke-width="0.3" stroke-dasharray="2 1.5"/><text x="201" y="${H - 2}" font-size="2.5" font-family="Arial" fill="#dc2626">← bord de la feuille 1 ici</text>`;
      pages = [
        `<div class="page a4p">${svgPage(`0 0 200 ${H}`, 200, H, coupe)}</div>`,
        `<div class="page a4p">${svgPage(`190 0 200 ${H}`, 200, H, colle)}</div>`,
      ];
    } else {
      // deux A4 en paysage, l'un sous l'autre
      taillePage = "297mm 210mm";
      const coupe = `<line x1="0" y1="199.8" x2="${W}" y2="199.8" stroke="#666" stroke-width="0.3" stroke-dasharray="2 1.5"/><text x="${W - 2}" y="198.5" font-size="2.5" text-anchor="end" font-family="Arial">✂ couper ici</text>`;
      const colle = `<line x1="0" y1="200" x2="${W}" y2="200" stroke="#dc2626" stroke-width="0.3" stroke-dasharray="2 1.5"/><text x="${W - 2}" y="203" font-size="2.5" text-anchor="end" font-family="Arial" fill="#dc2626">↑ bord de la feuille 1 ici</text>`;
      pages = [
        `<div class="page a4l">${svgPage(`0 0 ${W} 200`, W, 200, coupe)}</div>`,
        `<div class="page a4l">${svgPage(`0 190 ${W} 200`, W, 200, colle)}</div>`,
      ];
    }
    const w = window.open("", "_blank");
    if (!w) {
      toast("Autorisez l'ouverture des fenêtres pour imprimer.", true);
      return;
    }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${echapper(nom.value || "Plan")}</title><style>
      @page { size: ${taillePage}; margin: 0; } html, body { margin: 0; padding: 0; background: #fff; }
      .page { overflow: hidden; page-break-after: always; break-after: page; } .page:last-child { page-break-after: auto; break-after: auto; }
      .a4p { width: 210mm; height: 296mm; padding: 5mm; box-sizing: border-box; } .a4l { width: 297mm; height: 209mm; padding: 5mm; box-sizing: border-box; }
      @media screen { body { background: #9ca3af; } .page { background: #fff; margin: 10px auto; box-shadow: 0 2px 8px rgba(0,0,0,.3); } }
    </style></head><body>${pages.join("")}<script>setTimeout(() => window.print(), 400);<\/script></body></html>`);
    w.document.close();
  }

  function supprimerSelection() {
    const ids = etat.sel;
    if (!ids.size) return;
    const murs = new Set(d.murs.filter(m => ids.has(m.id)).map(m => m.id));
    d.murs = d.murs.filter(m => !ids.has(m.id));
    d.ouvertures = d.ouvertures.filter(o => !ids.has(o.id) && !murs.has(o.mur));
    d.objets = d.objets.filter(o => !ids.has(o.id));
    d.liaisons = d.liaisons.filter(l => !ids.has(l.id) && !ids.has(l.de) && !ids.has(l.vers));
    d.gaines = (d.gaines || []).filter(g => !ids.has(g.id) && !ids.has(g.de) && !ids.has(g.vers));
    d.pieces = (d.pieces || []).filter(x => !ids.has(x.id));
    d.notes = (d.notes || []).filter(x => !ids.has(x.id));
    d.objets.forEach(o => {
      if (o.lie && !d.objets.some(x => x.id === o.lie)) delete o.lie;
    });
    etat.sel = new Set();
    valider();
  }
  const clavier = e => {
    if (!page.isConnected) {
      document.removeEventListener("keydown", clavier, true);
      window.removeEventListener("keydown", clavierFenetre, true);
      return;
    }
    if (e.__plan) return;
    e.__plan = true; // (reçu une seule fois : fenêtre et document)
    // (fenêtre ouverte : ses touches à elle ; fenêtre fermée mais bouton encore « actif » — Firefox — : on le libère)
    if (e.target.closest && e.target.closest(".modale, #modale")) {
      const m = document.getElementById("modale");
      if (m && !m.classList.contains("cache")) return;
      e.target.blur && e.target.blur();
    } else if (e.target.closest && e.target.closest("input, textarea, select")) {
      if (e.key !== "Escape" || !page.contains(e.target)) return;
      e.target.blur(); // Échap rend la main au plan (et revient à la sélection, ci-dessous)
    }
    const k = e.key,
      ctrl = e.ctrlKey || e.metaKey;
    if (k === " " && e.target.tagName === "BUTTON") e.target.blur();
    if (ctrl && k.toLowerCase() === "z") {
      e.preventDefault();
      annuler();
      return;
    }
    if (ctrl && k.toLowerCase() === "y") {
      e.preventDefault();
      retablir();
      return;
    }
    if (ctrl && k.toLowerCase() === "a") {
      e.preventDefault();
      choisirOutil("selection");
      toutChoisir();
      return;
    }
    if (k === " ") {
      espace = true;
      e.preventDefault();
      return;
    }
    if (etat.outil === "mur" && etat.mur && /^[0-9.,]$/.test(k)) {
      etat.tape += k === "," ? "." : k;
      e.preventDefault();
      dessiner();
      return;
    }
    if (etat.outil === "mur" && etat.mur && k === "Backspace" && etat.tape) {
      etat.tape = etat.tape.slice(0, -1);
      e.preventDefault();
      dessiner();
      return;
    }
    if (etat.outil === "mur" && etat.mur && k === "Enter" && etat.tape) {
      // longueur tapée : dans la direction de la souris (angle droit)
      const L = parseFloat(etat.tape) * 100,
        ap = (etat.apercu || {}).point;
      if (L > 0 && ap) {
        const dd = dist(etat.mur, ap) || 1,
          q = { x: etat.mur.x + ((ap.x - etat.mur.x) / dd) * L, y: etat.mur.y + ((ap.y - etat.mur.y) / dd) * L };
        d.murs.push({ id: plId(), a: { x: etat.mur.x, y: etat.mur.y }, b: q });
        etat.mur = { ...q };
        etat.tape = "";
        valider();
      }
      e.preventDefault();
      return;
    }
    if (etat.outil === "piece" && etat.piece && k === "Enter") {
      e.preventDefault();
      finirPiece();
      return;
    }
    // rectangle : dimensions tapées (ex. 4,5x3) puis Entrée
    if (etat.outil === "rectangle" && etat.rect) {
      if (/^[0-9.,xX*]$/.test(k)) {
        etat.tape += k === "," ? "." : k === "X" || k === "*" ? "x" : k;
        e.preventDefault();
        dessiner();
        return;
      }
      if (k === "Backspace" && etat.tape) {
        etat.tape = etat.tape.slice(0, -1);
        e.preventDefault();
        dessiner();
        return;
      }
      if (k === "Enter") {
        e.preventDefault();
        const b = rectTape((etat.apercu || {}).point);
        if (b) creerRectangle(etat.rect, b);
        else toast("Tapez largeur x profondeur en mètres, ex. 4,5x3", true);
        return;
      }
    }
    // Échap : quitte l'outil en cours (mur, liaison…) et revient tout de suite à la sélection
    if (k === "Escape" && (etat.detect || etat.cadrage)) {
      e.preventDefault();
      etat.detect = null;
      etat.cadrage = null;
      barreReco.style.display = "none";
      dessiner();
      return;
    }
    if (k === "Escape" && roue) {
      e.preventDefault();
      fermerRoue();
      return;
    }
    if (k === "Escape") {
      e.preventDefault();
      if (etat.outil !== "selection") choisirOutil("selection");
      else {
        etat.sel.clear();
        dessiner();
        majPanneau();
      }
      return;
    }
    if (k === "Delete" || (k === "Backspace" && etat.sel.size)) {
      e.preventDefault();
      supprimerSelection();
      return;
    }
    if (ctrl) return;
    const t = k.toLowerCase();
    if (t === "r" && etat.sel.size) {
      [...etat.sel]
        .map(objetDe)
        .filter(o => o && o.genre === "symbole")
        .forEach(o => {
          o.rot = ((o.rot || 0) + 90) % 360;
        });
      valider();
      return;
    }
    if (k === "?" || k === "F1") {
      e.preventDefault();
      aidePlan();
      return;
    }
    if (e.altKey) return;
    if (t === "g" && etat.sel.size === 1) {
      const ob = objetDe([...etat.sel][0]);
      if (ob && ob.genre === "symbole") choisirGroupe(ob.id);
      return;
    }
    if (TOUCHES_SYMBOLES[t]) {
      e.preventDefault();
      etat.symbole = TOUCHES_SYMBOLES[t];
      choisirOutil("symbole");
      return;
    }
    const o = TOUCHES_OUTILS[t];
    if (o === "main") {
      e.preventDefault();
      choisirMain(
        etat.outil === "main" ? { murs: "symboles", symboles: "gaines", gaines: "notes", notes: "murs" }[etat.modeMain] : etat.modeMain
      );
      return;
    } // (H de nouveau : mode suivant)
    // (outils à plusieurs choix : la même touche passe au choix suivant)
    if (o === "gaine" && etat.outil === "gaine") {
      e.preventDefault();
      const suiv = { gaine: "moulure", moulure: "goulotte", goulotte: "gaine" }[etat.conduitOutil || "gaine"] || "gaine";
      choisirConduit(suiv);
      toast({ gaine: "⌇ Gaine", moulure: "▬ Moulure", goulotte: "▭ Goulotte" }[suiv] + " (U : choix suivant)");
      return;
    }
    if (o === "mur" && etat.outil === "mur") {
      e.preventDefault();
      choisirGenreMur(etat.genreMur === "arrondi" ? "droit" : "arrondi");
      toast((etat.genreMur === "arrondi" ? "◠ Arrondi entre deux murs" : "▭ Murs droits") + " (M : choix suivant)");
      return;
    }
    if (o === "porte" && etat.outil === "porte") {
      e.preventDefault();
      const ks = Object.keys(GENRES_PORTE);
      etat.genrePorte = ks[(ks.indexOf(etat.genrePorte) + 1) % ks.length];
      majBoutonsOptions();
      choisirOutil("porte");
      toast(GENRES_PORTE[etat.genrePorte][2] + " (P : choix suivant)");
      return;
    }
    if (o) {
      e.preventDefault();
      choisirOutil(o);
    }
  };
  /* -- mode tablette : barre de grands boutons à la place du clavier, du clic droit et des touches Ctrl / Maj -- */
  const touche = (key, plus) =>
    clavier(
      Object.assign(
        { key, target: document.body, preventDefault() {}, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false },
        plus
      )
    );
  // (pictogramme + libellé ; le libellé se cache quand la place manque, pour garder une seule ligne)
  const btT = (txt, titre, action, cls) => {
    const i = txt.indexOf(" ");
    return h(
      "button",
      {
        class: "btn" + (cls ? " " + cls : ""),
        type: "button",
        title: titre,
        onclick: e => {
          e.currentTarget.blur();
          action(e.currentTarget);
        },
      },
      ...(i > 0 ? [h("span", {}, txt.slice(0, i)), h("span", { class: "lib-tact" }, " " + txt.slice(i + 1))] : [txt])
    );
  };
  const btVue = btT("✋ Déplacer", "Un doigt fait glisser la vue (au lieu de dessiner). Deux doigts : déplacer et zoomer, toujours.", b => {
    etat.tabVue = !etat.tabVue;
    b.classList.toggle("actif", etat.tabVue);
  });
  const btMaj = btT(
    "⇧ Maj",
    "Comme la touche Maj : Sélection — ajoute ou retire chaque objet touché (comme Ctrl+clic) ; Mur — angle libre, le mur peut pencher (plus d'aimant à 90° et 45°) ; Pièce — contour point par point.",
    b => {
      etat.tabMaj = !etat.tabMaj;
      b.classList.toggle("actif", etat.tabMaj);
    }
  );
  const zoom = f => {
    const r = svg.getBoundingClientRect();
    const c = versMonde(r.left + r.width / 2, r.top + r.height / 2);
    const z = Math.min(8, Math.max(0.1, etat.vue.z * f));
    etat.vue = { z, x: c.x - r.width / 2 / z, y: c.y - r.height / 2 / z };
    dessiner();
    enregistrer();
  };
  const barreTactile = h(
    "div",
    { class: "plan-barre-tactile" },
    btT("↶", "Annuler (Ctrl+Z)", () => annuler()),
    btT("↷", "Rétablir (Ctrl+Y)", () => retablir()),
    btVue,
    btMaj,
    btT("✓ Terminer", "Finir la pièce dessinée point par point, ou la suite de murs (comme Entrée ou le clic droit)", () => {
      if (etat.piece) finirPiece();
      else if (etat.mur) {
        etat.mur = null;
        etat.apercu = {};
        valider();
      } else touche("Enter");
    }),
    btT("⟳ Pivoter", "Tourner les symboles choisis d'un quart de tour (touche R)", () => touche("r")),
    btT("🗑 Supprimer", "Supprimer ce qui est choisi (touche Suppr)", () => touche("Delete")),
    btT("Échap", "Quitter l'outil en cours et revenir à la sélection (touche Échap)", () => touche("Escape")),
    btT("＋", "Zoomer", () => zoom(1.3)),
    btT("－", "Dézoomer", () => zoom(1 / 1.3))
  ); // (plein écran : bouton ⛶ de la colonne de gauche)
  cadre.append(barreTactile);
  // une seule ligne : pictogrammes seuls si le plan est étroit (colonnes affichées, tablette en hauteur)
  new ResizeObserver(() => {
    barreTactile.classList.toggle("etroit", cadre.clientWidth < 820);
  }).observe(cadre);
  /* tablette : les outils en colonne d'icônes à gauche du plan, Niveau et Cotes dans la barre du haut (plus de hauteur pour le plan) */
  const colonneOutils = h("div", { class: "plan-outils-col" });
  page.querySelector(".plan-corps").prepend(colonneOutils);
  // (colonne bleue de DF artisan repliée : les icônes vont dedans, à la place du vide)
  const majColonneOutils = () => {
    if (!page.isConnected) {
      colonneOutils.remove();
      document.body.classList.remove("plan-tablette", "plan-droitier");
      majBoutonReplier();
      obsCorps.disconnect();
      obsGauche.disconnect();
      return;
    }
    document.body.classList.toggle("plan-tablette", !!etat.tablette); // (messages en haut : le bas est pris par la barre tactile)
    // (droitier : colonne bleue et boutons d'outils à droite ; symboles et panneau des circuits restent à leur place)
    document.body.classList.toggle("plan-droitier", !!etat.tablette && mainDroite());
    majBoutonReplier();
    const dansGauche = etat.tablette && document.body.classList.contains("gauche-repliee");
    colonneOutils.classList.toggle("dans-gauche", dansGauche);
    if (dansGauche) {
      const m = document.querySelector(".barre-gauche .marque");
      if (m && colonneOutils.previousElementSibling !== m) m.after(colonneOutils);
    } else if (colonneOutils.parentNode !== page.querySelector(".plan-corps")) page.querySelector(".plan-corps").prepend(colonneOutils);
    majNavIcones(); // (outils dans la colonne bleue : reste-t-il la place pour les icônes des menus ?)
  };
  // (seulement quand la colonne bleue est repliée ou dépliée : les autres classes du body changent aussi ici)
  let repliee = null;
  const obsGauche = new MutationObserver(() => {
    const r = document.body.classList.contains("gauche-repliee");
    if (r === repliee && page.isConnected) return;
    repliee = r;
    majColonneOutils();
  });
  obsGauche.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  const obsCorps = new MutationObserver(() => {
    if (!page.isConnected) majColonneOutils();
  });
  obsCorps.observe(document.getElementById("contenu") || document.body, { childList: true });
  function placerOutils() {
    majColonneOutils();
    if (etat.tablette) {
      colonneOutils.append(btPalette, ...boutonsOutils, btPanneau);
      majPanneau();
    } else {
      barreOutils.replaceChildren(btPalette, ...boutonsOutils, btPanneau);
      majPanneau();
    }
    majColonnes();
  }
  /** tablette : boutons du côté de la main qui dessine (réglage de l'appareil, gardé dans le navigateur) */
  function mainDroite() {
    try {
      return localStorage.getItem("dfa_plan_lateralite") === "droitier";
    } catch (e) {
      return false;
    }
  }
  function basculerMain() {
    try {
      localStorage.setItem("dfa_plan_lateralite", mainDroite() ? "gaucher" : "droitier");
    } catch (e) {
      /* */
    }
    majColonneOutils();
    dessiner();
  }
  function basculerTablette(force) {
    etat.tablette = force === undefined ? !etat.tablette : !!force;
    page.classList.toggle("tablette", etat.tablette);
    placerOutils();
    try {
      localStorage.setItem("dfa_plan_tablette", etat.tablette ? "1" : "0");
    } catch (e) {
      /* */
    }
    if (!etat.tablette) {
      etat.tabVue = etat.tabMaj = false;
      btVue.classList.remove("actif");
      btMaj.classList.remove("actif");
    }
    const b = page.querySelector(".bouton-tablette");
    if (b) b.classList.toggle("actif", etat.tablette);
    majPalette();
    dessiner();
  }
  {
    let mem = null;
    try {
      mem = localStorage.getItem("dfa_plan_tablette");
    } catch (e) {
      /* */
    }
    basculerTablette(mem === null ? matchMedia("(pointer: coarse)").matches : mem === "1");
  } // (écran tactile : mode tablette d'office)
  // (en capture, sur la fenêtre et sur le document : avant les autres raccourcis de la page)
  const clavierFenetre = e => clavier(e);
  window.addEventListener("keydown", clavierFenetre, true);
  document.addEventListener("keydown", clavier, true);
  document.addEventListener("keyup", e => {
    if (e.key === " ") espace = false;
  });
  new ResizeObserver(() => {
    if (page.isConnected) dessiner();
  }).observe(cadre);
  choisirOutil("selection");
  majPanneau();
  if (arg && arg.rattacher) rattacher().catch(erreur);
  if (arg && arg.etiquettes) setTimeout(() => versEtiquettes().catch(erreur), 300);
  if (arg && arg.devis) setTimeout(() => versDevis().catch(erreur), 300); // (bouton « → Devis » de la liste des plans)   // (bouton « Tableau » de la liste des plans)
}
function nom_client_js(c) {
  return c.societe || [c.civilite, c.nom, c.prenom].filter(Boolean).join(" ") || "Client " + c.id;
}

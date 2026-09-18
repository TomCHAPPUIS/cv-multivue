# Contribuer

Merci de vouloir contribuer à cv-multivue. Quelques repères avant d'ouvrir
une issue ou une pull request.

## Périmètre du projet

cv-multivue est volontairement **statique et sans backend** (voir le
README) : tout tourne dans le navigateur, aucun compte, aucune base de
données, chaque personne héberge sa propre instance. Les propositions qui
introduisent un serveur, une base de données partagée ou un compte
utilisateur ne correspondent pas à l'esprit du projet et seront
probablement refusées — sauf si elles restent strictement optionnelles et
n'imposent rien à qui veut rester 100% statique.

## Fichiers génériques vs données d'exemple

- `index.html`, `css/style.css`, `js/app.js`, `js/validate.js`,
  `editor.html`, `js/editor.js`, `css/editor.css`, `preview.html` : le
  moteur, générique — ne doivent jamais contenir de donnée personnelle.
- `js/data.js` : données d'exemple fictives ("Alex Dupont"), là pour
  illustrer le schéma. Une PR ne doit pas y glisser de vraies coordonnées.

## Avant d'ouvrir une PR

1. Vérifiez la syntaxe des fichiers JS modifiés : `node -c js/app.js` (idem
   pour les autres fichiers touchés).
2. S'il n'y a pas de navigateur disponible pour tester une interaction DOM,
   testez au moins la logique pure (fonctions sans dépendance au DOM) via
   Node, par exemple avec le module `vm` pour charger un fichier dans un
   contexte isolé et appeler ses fonctions directement. Décrivez dans la PR
   ce qui a été testé et ce qui ne l'a pas été.
3. Si vous touchez au schéma de `CV` (nouveaux champs, structure), mettez à
   jour `README.md` (section "Modèle de données") et les commentaires dans
   `js/data.js`.
4. Gardez le style existant : pas de dépendance externe (aucune librairie,
   aucun build step), pas de commentaire qui explique un COMMENT déjà
   lisible dans le code — seulement le POURQUOI quand ce n'est pas évident.

## Signaler un bug

Précisez : navigateur/version, ce que vous avez fait, ce qui était
attendu, ce qui s'est passé. Une capture d'écran ou un message d'erreur de
la console aide beaucoup.

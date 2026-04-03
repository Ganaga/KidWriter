# Plumigo

Application web éducative pour apprendre à écrire en français avec un correcteur d'orthographe et de grammaire ludique.

**https://ganaga.github.io/Plumigo/**

## Fonctionnalités

- **Écriture créative** : éditeur avec feedback en temps réel de la mascotte
- **Correction orthographe + grammaire** : détection des fautes d'accord, conjugaison, orthographe via LanguageTool (soulignement orange = orthographe, violet = grammaire)
- **Aide orale** : lecture à voix haute des explications d'erreurs (activable/désactivable via 🔊)
- **Gamification** : points, niveaux, badges, streaks journaliers, gamme de mots sans faute
- **5 mascottes** : hibou, dragon chinois, chat, robot, renard — chacune avec 3 attitudes
- **Zone parent** : statistiques détaillées protégées par une question de maths
- **PWA** : installable sur mobile et desktop

## Stack

- Vite + TypeScript vanilla
- LanguageTool API (gratuit, appels depuis le navigateur)
- Web Speech API (text-to-speech)
- 100% hébergé sur GitHub Pages

## Générer l'APK Android (Play Store)

L'app utilise TWA (Trusted Web Activity) via Bubblewrap pour être empaquetée en APK.

```bash
# Installer Bubblewrap
npm install -g @bubblewrap/cli

# Initialiser le projet TWA (première fois)
bubblewrap init --manifest="https://ganaga.github.io/Plumigo/manifest.json"

# Générer l'APK signé
bubblewrap build
# ou
npm run build:apk

# Récupérer le fingerprint SHA256 du certificat
keytool -printcert -jarfile app-release-signed.apk | grep SHA256
```

Après la première génération, mettre à jour `public/.well-known/assetlinks.json` avec le vrai fingerprint SHA256, puis push et redéployer.

Publication sur le Play Store : créer un compte Google Play Developer (25$ une fois), puis uploader le fichier `.aab` généré.

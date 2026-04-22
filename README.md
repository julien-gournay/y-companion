# Campus Companion Ynov

Application multi-plateforme pour accompagner les etudiants Ynov, avec une experience adaptee sur **mobile**, **web** et **desktop**.

---

## Vue d'ensemble

Ce depot contient 3 clients applicatifs :

- `mobile/` : application Flutter (Android/iOS)
- `web/` : application React (navigateur)
- `desktop/` : application Electron (Windows/macOS/Linux)
- 
L'objectif est de proposer une experience coherente selon le support utilise.


Autre dépôt backend :
- `https://github.com/mohammed-tahri24/ycompagnon-api` : API qui gére les réponses et l'IA

## Stack technique

- **Mobile** : Flutter (Dart)
- **Web** : React + TailwindCSS
- **Desktop** : Electron

## Arborescence

```text
campus_companion_ynov/
|- mobile/   # Flutter app
|- web/      # React app
|- desktop/  # Electron app
|- README.md
```

## Prerequis

Avant de commencer, installe :

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (LTS recommandee)
- [Flutter SDK](https://docs.flutter.dev/get-started/install)

## Installation rapide

```bash
git clone <url-du-repo>
cd campus_companion_ynov
```

## Lancer le projet

### 1) Mobile (Flutter)

```bash
cd mobile
flutter pub get
flutter run
```

### 2) Web (React)

```bash
cd web
npm install
npm start
```

Puis ouvre : [http://localhost:3000](http://localhost:3000)

### 3) Desktop (Electron)

```bash
cd desktop
npm install
npm run dev
```

## Scripts utiles

### `web/`

- `npm start` : demarrage en developpement
- `npm run build` : build de production
- `npm test` : tests

### `desktop/`

- `npm start` : lancement Electron
- `npm run dev` : lancement en mode developpement

### `mobile/`

- `flutter run` : lance l'application sur emulateur/appareil
- `flutter test` : execute les tests Flutter

## Bonnes pratiques

- Creer une branche par feature/correctif
- Commits clairs et atomiques
- Tester localement avant push

## Licence

A definir.

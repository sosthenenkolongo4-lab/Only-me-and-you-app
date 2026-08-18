# Only Me & You — LoveStory v2

Cette version ajoute un vrai espace partagé entre deux appareils avec Supabase Realtime.

## 1. Installation

```bash
npm install
```

Copie `.env.example` en `.env.local`, puis ajoute les clés de ton projet Supabase.

## 2. Base de données

Dans Supabase > SQL Editor, exécute `supabase.sql`.

## 3. Lancer

```bash
npm run dev
```

## 4. Couple

Une personne choisit **Créer**, obtient un code (ex. ABC123).
Elle partage ce code à son/sa partenaire.
La deuxième personne choisit **Rejoindre** avec le même code.

Les messages, notes, objectifs, agenda, finances et autres données sont stockés dans la même room et synchronisés en temps réel.

## Important

Le SQL fourni est un prototype rapide : l'accès est protégé par le code du couple côté application, mais les policies Supabase sont volontairement ouvertes pour faciliter le test.

Pour une version publique/production, il faut passer à une sécurité par utilisateur (`auth.uid()`) et une table `couple_members`.

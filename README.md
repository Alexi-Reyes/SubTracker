# SubTracker

Une application qui permet de suivre ses abonnements pour pouvoir les annuler facilement.

## MVP

- Liste des trackers
- Détail d'un tracker
- Ajouter/enlever/éditer un tracker
- Notifications avant la date de fin
- Connection à un compte

## Monétisation 

Application gratuite.

## Mise en place

```shell
cp .env.example .env.local
# Modifier les variables d'environnement
```

Le schéma de la base de données se trouve dans `supabase/schema.sql`.
Les edge functions sont dans `supabase/functions`.

### Android & Firebase
Pour recevoir des Push Notifications sur Android en dehors d'Expo Go, vous devez lier un projet Firebase :
1. Créez un projet sur la console Firebase.
2. Ajoutez une app Android avec le package `com.anonymous.SubTracker`.
3. Placez le fichier `google-services.json` à la racine de ce dossier.

## Monétisation 
Application gratuite.
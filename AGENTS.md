
# COOPECA — Instructions de développement

## 1. Objectif
Développer COOPECA, une application de collecte journalière destinée aux agents de terrain, avec une interface Web de gestion.

## 2. Architecture retenue
- Mobile Android : React Native, Expo, TypeScript, Expo Router.
- Stockage local mobile : SQLite avec expo-sqlite.
- Backend : NestJS et TypeScript.
- ORM : Prisma.
- Base de données : PostgreSQL.
- Déploiement : Docker Compose sur un VPS Linux.
- Interface Web : proposer une architecture cohérente avec les documents techniques avant de la créer.

## 3. Fonctionnalités essentielles
- Gestion multi-agences.
- Création de clients même sans connexion Internet.
- Un client créé hors ligne possède le statut PROVISOIRE.
- Enregistrement des collectes journalières hors ligne.
- Reçus numériques et impression Bluetooth.
- Synchronisation fiable, avec protection contre les doublons.
- Remise des paiements par l'agent au caissier.
- Confirmation distincte de la remise par le caissier.
- Clôture journalière obligatoire pour chaque agent, y compris hors ligne.
- Réouverture d'une clôture uniquement par un superviseur autorisé, avec motif et journal d'audit.

## 4. Règles métier non négociables
- Une opération enregistrée localement n'est pas automatiquement confirmée par le serveur.
- Un reçu en attente de synchronisation doit être clairement identifié.
- Une remise déclarée par un agent n'est pas une remise confirmée par le caissier.
- Une même collecte ne peut pas être affectée à plusieurs remises.
- Les montants sont stockés en nombres entiers de FCFA, jamais en nombres flottants.
- Les opérations synchronisées doivent être idempotentes.
- Toute opération sensible doit respecter les permissions et les règles d'audit.
- Les données d'une agence ne doivent pas être accessibles à une autre agence sans autorisation explicite.
- Toute nouvelle collecte est rattachée à un dossier précis ; le client est dérivé de ce dossier. Un éventuel lien client conservé pour compatibilité doit être cohérent.
- Un doublon client potentiel (téléphone normalisé et nom/prénom dans la même agence) déclenche une revue, jamais une fusion automatique. Seul un superviseur habilité décide la fusion ; la fiche source reste un alias audité et les liens financiers historiques ne sont pas réécrits.
- L'acceptation d'une collecte, l'allocation du numéro officiel de reçu et sa persistance sont atomiques côté serveur. Les reprises idempotentes rendent le même résultat et le même numéro.
- Après synchronisation, une remise déclarée n'est pas modifiée directement. Les erreurs passent par une annulation motivée/auditée ou une compensation autorisée ; le caissier constate un écart et un superviseur habilité en valide la résolution.
- Une clôture peut être déclarée localement hors ligne. Elle n'est pas rapprochée côté serveur tant que des opérations attendent la synchronisation ; le serveur ne confirme pas un total incomplet.
- Une collecte dont l'horloge est jugée incohérente est conservée pour revue humaine et n'est pas acceptée automatiquement. L'heure déclarée et l'instant de réception serveur restent distincts.
- La réouverture d'un dossier requiert une décision serveur ; aucun effet métier local hors ligne avant acceptation.

## 5. Documents de référence
Lire les documents disponibles dans docs/ avant toute implémentation. `docs/DECISIONS_METIER.md` est le registre canonique des règles métier : les autres documents doivent s'y aligner et toute contradiction doit être signalée avant de choisir une solution.
Le schéma SQL `docs/COOPECA_Backend_Schema_v1.1.sql` décrit le DDL de référence existant ; ce n'est pas le modèle cible lorsque les décisions métier et le DDL divergent. Toute évolution doit être conçue et validée explicitement avant changement du SQL ou création de migration.
Ne pas supprimer de contrainte SQL sans justification et validation.

## 6. Méthode de travail
- Procéder par petites étapes vérifiables.
- Avant chaque étape, expliquer brièvement le plan.
- Ne pas créer toutes les fonctionnalités en une seule fois.
- Écrire des tests pour les règles métier importantes.
- Exécuter les tests et corriger les erreurs avant de conclure une étape.
- Ne jamais prétendre qu'un test a réussi sans l'avoir exécuté.
- Mettre à jour le README et les instructions de lancement.
- Fournir un résumé des fichiers créés ou modifiés à chaque étape.

## 7. Sécurité
- Ne jamais écrire de mots de passe, secrets ou clés API en dur dans le code.
- Utiliser des variables d'environnement et fournir un .env.example sans secret réel.
- Ne jamais exposer publiquement le port PostgreSQL en production.
- Vérifier l'authentification, les rôles et les permissions côté serveur.
- Ne pas supprimer de données ni lancer de migration destructive sans accord explicite.

## 8. Limites d'intervention
Ne pas déployer en production, acheter des services, supprimer des données,
réinitialiser une base existante ou exécuter une commande destructive sans
expliquer le risque et obtenir mon accord.

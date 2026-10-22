
# COOPECA — Instructions de développement

## 1. Objectif
Développer COOPECA, une application de tontine destinée aux agents de terrain, avec une interface Web de gestion. Le parcours financier actif est le cycle à 31 versements décrit dans `docs/DECISIONS_METIER.md` §3.15. Les anciennes collectes journalières/remises sont conservées en historique et ne constituent plus le flux des nouvelles opérations.

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
- Gestion de marchés autonomes, distincts des agences ; l’accès aux marchés est global selon les rôles définis.
- Création de clients même sans connexion Internet.
- Un client créé hors ligne possède le statut PROVISOIRE.
- Affectation explicite du client à un marché et à un agent collecteur avant l’ouverture d’un cycle.
- Cycles successifs par dossier, au plus un cycle non clôturé à la fois ; montant fixe choisi à chaque ouverture.
- Enregistrement hors ligne des versements fixes, idempotents ; un cycle cible 31 versements comptabilisés, sans limite calendaire.
- Suspension/reprise sans perte de compteur ni solde.
- Retraits initiés par l’agent et approuvés par un superviseur ; commission égale à un versement, enregistrée une seule fois au premier retrait approuvé.
- Synchronisation fiable, avec protection contre les doublons.
- Historique append-only des versements, commissions, retraits et événements de cycle.
- Les collectes/remises/clôtures du modèle antérieur sont legacy : ne pas les réutiliser pour les nouvelles écritures de cycle.

## 4. Règles métier non négociables
- Les opérations legacy enregistrées localement ne sont pas automatiquement confirmées par le serveur ; les nouvelles écritures de cycle utilisent leur propre journal idempotent.
- Les reçus/collectes historiques en attente restent clairement identifiés et ne sont pas transformés en versements de cycle.
- Les anciennes remises restent consultables en historique ; elles ne représentent pas les retraits du nouveau produit.
- Les contraintes historiques sur l’affectation d’une collecte à une remise restent appliquées aux lignes legacy.
- Les montants sont stockés en nombres entiers de FCFA, jamais en nombres flottants.
- Les opérations synchronisées doivent être idempotentes.
- Toute opération sensible doit respecter les permissions et les règles d'audit.
- Les données d'une agence ne doivent pas être accessibles à une autre agence sans autorisation explicite.
- Les données de cycle ne sont accessibles aux agents que pour les clients qui leur sont affectés ; l’agence du client reste portée et auditée, mais le marché est autonome.
- Un cycle complet compte exactement 31 versements égaux au montant fixe du cycle ; plusieurs versements peuvent partager une date et chaque versement augmente le compteur d’une unité.
- La commission vaut un montant fixe du cycle, pas un pourcentage ; elle est un revenu de l’agence et son écriture immuable est atomique avec le premier retrait approuvé.
- Une demande de retrait est idempotente et vérifiée par transaction/ verrouillage ; le retrait plus commission due ne doit jamais dépasser le solde calculé depuis le journal.
- Un retrait marqué total clôt le cycle et doit épuiser exactement le solde net ; les cycles terminés permettent des retraits partiels successifs sans seconde commission.
- Les cycles fermés ne reçoivent ni versement ni retrait ; un nouveau cycle conserve l’historique précédent.
- Les collectes, reçus, remises et clôtures déjà enregistrés restent historiques et soumis à leurs contraintes d’origine ; ces flux ne sont pas la voie financière des nouveaux cycles.
- Les doublons client continuent de déclencher une revue auditable, jamais une fusion automatique ; les liens financiers legacy ne sont pas réécrits.
- Les versements hors ligne de cycle gardent l’instant client et l’instant serveur séparés, sont idempotents et sont acceptés seulement après validation serveur.
- La réouverture d'un dossier requiert une décision serveur ; aucun effet métier local hors ligne avant acceptation.

## 5. Documents de référence
Lire les documents disponibles dans docs/ avant toute implémentation. `docs/DECISIONS_METIER.md` est le registre canonique des règles métier ; §3.15 définit le produit financier de référence et remplace, pour les nouvelles opérations, les règles legacy de collecte journalière/remise/clôture. Les autres documents doivent s'y aligner et toute contradiction doit être signalée avant de choisir une solution.
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

/**
 * Fonctionnalité « dossiers » (dossiers de tontine) — NON IMPLÉMENTÉE.
 *
 * Décisions validées de principe (docs/DECISIONS_METIER.md §3.12,
 * D-LOT-001 à D-LOT-005) :
 * - création hors ligne par un agent autorisé, identifiant technique
 *   stable, création en attente du serveur (autorité pour l'unicité et
 *   l'acceptation), synchronisation idempotente ;
 * - un seul dossier ouvert par client et par agence ; dossiers
 *   successifs possibles dès lors qu'un seul est ouvert ;
 * - fermeture interdisant toute nouvelle collecte, historique
 *   consultable selon les droits, corrections autorisées et auditées ;
 * - états métier et de synchronisation distincts ; création concurrente
 *   incompatible = conflit explicite ; aucune suppression automatique
 *   d'opérations locales après conflit ou rejet ;
 * - chaque nouvelle collecte rattachée à un dossier précis ; aucun
 *   rattachement arbitraire des collectes historiques.
 *
 * Reste À VALIDER : champs obligatoires et numérotation, transitions et
 * motif/réouverture de fermeture, traitement des créations concurrentes,
 * collectes créées avant fermeture mais synchronisées après, stratégie de
 * rapprochement des collectes historiques. Aucune implémentation ici.
 */
export {};

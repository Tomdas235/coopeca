# ADR-004 : Cycle de tontine à 31 versements

## Statut
Accepté (§3.15 DECISIONS_METIER.md)

## Contexte
Le produit financier de référence est un cycle de tontine à 31 versements fixes, remplaçant l'ancien modèle de collecte journalière/remise/clôture.

## Décision
- Un cycle compte exactement 31 versements égaux au montant fixe
- Plusieurs versements peuvent partager une date
- Commission = 1 versement, perçue une seule fois au premier retrait approuvé
- Retrait total clôt le cycle et épuise le solde net
- Cycles fermés : pas de versement ni de retrait
- Historique append-only

## Conséquences
- Le compteur d'installments est incrémenté par versement, pas par jour
- Le solde est calculé depuis le journal des transactions
- Les anciennes collectes/remises sont conservées en historique uniquement
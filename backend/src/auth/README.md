# Authentification backend

Routes livrées : `POST /api/v1/auth/sessions`, `GET /api/v1/me` et `GET /api/v1/me/branches`.

Les mots de passe acceptés doivent suivre `scrypt$16384$8$1$<salt-hex>$<hash-hex>`. Aucun algorithme n'était défini pour les hash déjà stockés ; il faut les réinitialiser ou les migrer avant d'activer ces comptes. Ne jamais ajouter un endpoint de provisionnement public.

Les JWT HS256 durent 15 minutes et nécessitent un `JWT_SECRET` de 32 caractères minimum. Le guard recharge utilisateur actif et accès agence actif en base à chaque requête. Les routes métier doivent encore ajouter les contrôles de rôle et d'appartenance agence adaptés à chaque opération.

Pas de refresh token ni de révocation individuelle pour le moment. La désactivation d'un utilisateur bloque immédiatement les requêtes protégées ; un jeton d'un compte actif reste valable jusqu'à expiration. La limitation de débit et l'audit des échecs login sont requis avant exposition publique.

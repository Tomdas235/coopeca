import { z } from 'zod';

/**
 * Validation centralisée de la configuration d'environnement.
 *
 * Le démarrage de l'API échoue explicitement si une variable obligatoire
 * est absente ou mal formée, plutôt que de produire une erreur tardive.
 * Les valeurs validées ne sont jamais journalisées en clair.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL est obligatoire')
    .refine(
      (value) => /^postgresql(:\/\/|s:\/\/)/.test(value),
      'DATABASE_URL doit être une URL PostgreSQL (postgresql://...)',
    ),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET doit contenir au moins 32 caractères'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Analyse et valida l'objet environnement.
 * Retourne les erreurs formatées sans inclure les valeurs secrètes.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(' | ');
    throw new Error(`Configuration invalide — ${issues}`);
  }
  return result.data;
}

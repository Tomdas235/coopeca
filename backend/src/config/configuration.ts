import { registerAs } from '@nestjs/config';

/**
 * Configuration nominative de l'application.
 * Les valeurs secrètes ne sont jamais exposées dans les logs ni les erreurs.
 */
export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
}));

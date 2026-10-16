import * as fs from 'fs';
import * as path from 'path';

/**
 * Vérifie que la structure de navigation imposée pour COOPECA existe
 * telle quelle (Expo Router) — elle ne doit pas être remplacée par une
 * organisation générique différente (cf. consigne de structure de l'étape).
 */
const racineMobile = path.join(__dirname, '..');

const routesRequises = [
  'app/_layout.tsx',
  'app/(auth)/login.tsx',
  'app/(tabs)/_layout.tsx',
  'app/(tabs)/index.tsx',
  'app/(tabs)/clients.tsx',
  'app/(tabs)/collectes.tsx',
  'app/(tabs)/remises.tsx',
  'app/(tabs)/cloture.tsx',
  'app/(tabs)/dossiers.tsx',
  'app/recus/[id].tsx',
];

const modulesRequis = [
  'src/database/schema.ts',
  'src/services/api.ts',
  'src/services/printer.ts',
  'src/services/sync.ts',
  'src/components/ScreenPlaceholder.tsx',
  'src/components/AppScreen.tsx',
  'src/components/ActionCard.tsx',
  'src/components/MetricCard.tsx',
  'src/components/StatusPill.tsx',
  'src/components/FeatureScreen.tsx',
  'src/utils/montants.ts',
  'src/types/index.ts',
];

describe('Structure COOPECA (mobile/app + mobile/src, Expo Router)', () => {
  it.each(routesRequises)('la route %s existe', (route) => {
    expect(fs.existsSync(path.join(racineMobile, route))).toBe(true);
  });

  it.each(modulesRequis)('le module %s existe', (module) => {
    expect(fs.existsSync(path.join(racineMobile, module))).toBe(true);
  });

  it("l'entrée du projet pointe vers expo-router", () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(racineMobile, 'package.json'), 'utf8'),
    ) as { main?: string };
    expect(packageJson.main).toBe('expo-router/entry');
  });

  it('TypeScript est configuré en mode strict', () => {
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(racineMobile, 'tsconfig.json'), 'utf8'),
    ) as { compilerOptions?: { strict?: boolean } };
    expect(tsconfig.compilerOptions?.strict).toBe(true);
  });
});

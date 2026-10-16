import { FeatureScreen } from '../../src/components/FeatureScreen';

export default function DossiersScreen() {
  return (
    <FeatureScreen
      title="Dossiers"
      description="Consultez les dossiers de tontine et leur état."
      nextStep="La création, l’ouverture et la clôture de dossier ne sont pas encore disponibles. Chaque collecte devra être rattachée à un dossier précis."
    />
  );
}

import { render, fireEvent } from '@testing-library/react-native';
import { SelecteurDossier } from './SelecteurDossier';

const dossiersMock = [
  {
    id: 'dossier-1',
    referenceProvisoire: 'DOSS-20261019-001',
    clientNom: 'Jean Dupont',
    statut: 'OUVERT' as const,
    syncStatus: 'SYNCED' as const,
    agenceId: 'agence-centre',
    dateCreationDeclairee: '2026-10-19T08:00:00Z',
  },
  {
    id: 'dossier-2',
    referenceProvisoire: 'DOSS-20261019-002',
    clientNom: 'Jean Dupont',
    statut: 'OUVERT' as const,
    syncStatus: 'PENDING' as const,
    agenceId: 'agence-centre',
    dateCreationDeclairee: '2026-10-19T09:00:00Z',
  },
];

describe('SelecteurDossier (sélecteur de dossier COOPECA)', () => {
  it('render sans crash avec une valeur null', () => {
    const { getByText } = render(
      <SelecteurDossier
        label="Dossier"
        value={null}
        options={dossiersMock}
        onValueChange={jest.fn()}
      />,
    );
    expect(getByText('Sélectionner un dossier…')).toBeTruthy();
  });

  it('affiche la référence provisoire du dossier sélectionné', () => {
    const { getByText } = render(
      <SelecteurDossier
        label="Dossier"
        value="dossier-1"
        options={dossiersMock}
        onValueChange={jest.fn()}
      />,
    );
    expect(getByText('DOSS-20261019-001')).toBeTruthy();
  });

  it('appelle onValueChange quand un dossier est sélectionné', () => {
    const onValueChange = jest.fn();
    const { getByText } = render(
      <SelecteurDossier
        label="Dossier"
        value={null}
        options={dossiersMock}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.press(getByText('Sélectionner un dossier…'));
    fireEvent.press(getByText('DOSS-20261019-001'));
    expect(onValueChange).toHaveBeenCalledWith('dossier-1');
  });

  it('n’appelle pas onValueChange quand disabled est vrai', () => {
    const onValueChange = jest.fn();
    const { getByText, queryByText } = render(
      <SelecteurDossier
        label="Dossier"
        value={null}
        options={dossiersMock}
        onValueChange={onValueChange}
        disabled
      />,
    );
    fireEvent.press(getByText('Sélectionner un dossier…'));
    expect(queryByText('DOSS-20261019-001')).toBeNull();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('affiche un message d’erreur quand la prop error est fournie', () => {
    const { getByText } = render(
      <SelecteurDossier
        label="Dossier"
        value={null}
        options={dossiersMock}
        onValueChange={jest.fn()}
        error="Sélection obligatoire."
      />,
    );
    expect(getByText('Sélection obligatoire.')).toBeTruthy();
  });

  it('utilise le libellé au-dessus du champ', () => {
    const { getByText } = render(
      <SelecteurDossier
        label="Agence / Dossier"
        value={null}
        options={dossiersMock}
        onValueChange={jest.fn()}
      />,
    );
    expect(getByText('Agence / Dossier')).toBeTruthy();
  });

  it('ferme la liste après sélection d’un dossier', () => {
    const onValueChange = jest.fn();
    const { getByText, queryByText } = render(
      <SelecteurDossier
        label="Dossier"
        value={null}
        options={dossiersMock}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.press(getByText('Sélectionner un dossier…'));
    fireEvent.press(getByText('DOSS-20261019-001'));
    expect(onValueChange).toHaveBeenCalledWith('dossier-1');
    expect(queryByText('DOSS-20261019-002')).toBeNull();
  });
});

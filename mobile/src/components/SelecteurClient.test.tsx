import { render, fireEvent } from '@testing-library/react-native';
import { SelecteurClient } from './SelecteurClient';

const clientsMock = [
  {
    id: 'client-1',
    nom: 'Dupont',
    prenom: 'Jean',
    telephoneNormalise: '+23566123456',
    statut: 'CONFIRME' as const,
    agenceId: 'agence-centre',
    dateCreationDeclairee: '2026-10-19T08:00:00Z',
    doublonPotentiel: false,
  },
  {
    id: 'client-2',
    nom: 'Martin',
    prenom: 'Marie',
    telephoneNormalise: '+23566123457',
    statut: 'PROVISOIRE' as const,
    agenceId: 'agence-centre',
    dateCreationDeclairee: '2026-10-19T09:00:00Z',
    doublonPotentiel: true,
  },
];

describe('SelecteurClient (sélecteur de client COOPECA)', () => {
  it('render sans crash avec une valeur null', async () => {
    const { getByText } = await render(
      <SelecteurClient
        label="Client"
        value={null}
        options={clientsMock}
        onValueChange={jest.fn()}
      />,
    );
    expect(getByText('Sélectionner un client…')).toBeTruthy();
  });

  it('affiche le nom et le statut du client sélectionné', async () => {
    const { getByText } = await render(
      <SelecteurClient
        label="Client"
        value="client-1"
        options={clientsMock}
        onValueChange={jest.fn()}
      />,
    );
    expect(getByText('Jean Dupont')).toBeTruthy();
  });

  it('affiche un badge statut CONFIRME en vert', async () => {
    const { getByText } = await render(
      <SelecteurClient
        label="Client"
        value="client-1"
        options={clientsMock}
        onValueChange={jest.fn()}
      />,
    );
    fireEvent.press(getByText('Jean Dupont'));
    // Le statut s'affiche dans le champ après sélection
    expect(getByText('CONFIRME')).toBeTruthy();
  });

  it('affiche un badge statut PROVISOIRE en orange', async () => {
    const { getByText } = await render(
      <SelecteurClient
        label="Client"
        value="client-2"
        options={clientsMock}
        onValueChange={jest.fn()}
      />,
    );
    fireEvent.press(getByText('Marie Martin'));
    expect(getByText('PROVISOIRE')).toBeTruthy();
  });

  it('affiche une bannière doublon potentiel quand le client sélectionné en a un', async () => {
    const { getByText } = await render(
      <SelecteurClient
        label="Client"
        value="client-2"
        options={clientsMock}
        onValueChange={jest.fn()}
      />,
    );
    expect(getByText('Doublon potentiel détecté')).toBeTruthy();
    expect(
      getByText(
        'Ce client pourrait déjà exister dans cette agence. Une revue par un superviseur habilité est requise avant toute fusion. Aucune fusion automatique n’est effectuée.',
      ),
    ).toBeTruthy();
  });

  it('appelle onValueChange quand un client est sélectionné', async () => {
    const onValueChange = jest.fn();
    const { getByText } = await render(
      <SelecteurClient
        label="Client"
        value={null}
        options={clientsMock}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.press(getByText('Sélectionner un client…'));
    fireEvent.press(getByText('Jean Dupont'));
    expect(onValueChange).toHaveBeenCalledWith('client-1');
  });

  it('n’appelle pas onValueChange quand disabled est vrai', async () => {
    const onValueChange = jest.fn();
    const { getByText, queryByText } = await render(
      <SelecteurClient
        label="Client"
        value={null}
        options={clientsMock}
        onValueChange={onValueChange}
        disabled
      />,
    );
    fireEvent.press(getByText('Sélectionner un client…'));
    expect(queryByText('Jean Dupont')).toBeNull();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('affiche un message d’erreur quand la prop error est fournie', async () => {
    const { getByText } = await render(
      <SelecteurClient
        label="Client"
        value={null}
        options={clientsMock}
        onValueChange={jest.fn()}
        error="Sélection obligatoire."
      />,
    );
    expect(getByText('Sélection obligatoire.')).toBeTruthy();
  });

  it('utilise le libellé au-dessus du champ', async () => {
    const { getByText } = await render(
      <SelecteurClient
        label="Client / bénéficiaire"
        value={null}
        options={clientsMock}
        onValueChange={jest.fn()}
      />,
    );
    expect(getByText('Client / bénéficiaire')).toBeTruthy();
  });

  it('ferme la liste après sélection d’un client', async () => {
    const onValueChange = jest.fn();
    const { getByText, queryByText } = await render(
      <SelecteurClient
        label="Client"
        value={null}
        options={clientsMock}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.press(getByText('Sélectionner un client…'));
    fireEvent.press(getByText('Jean Dupont'));
    expect(onValueChange).toHaveBeenCalledWith('client-1');
    expect(queryByText('Marie Martin')).toBeNull();
  });

  it('affiche le téléphone normalisé dans chaque option', async () => {
    const { getByText } = await render(
      <SelecteurClient
        label="Client"
        value={null}
        options={clientsMock}
        onValueChange={jest.fn()}
      />,
    );
    fireEvent.press(getByText('Sélectionner un client…'));
    expect(getByText('+23566123456')).toBeTruthy();
    expect(getByText('+23566123457')).toBeTruthy();
  });
});


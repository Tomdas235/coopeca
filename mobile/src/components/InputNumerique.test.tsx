import { render } from '@testing-library/react-native';
import { InputNumerique } from './InputNumerique';

describe('InputNumerique (champ de saisie numérique COOPECA)', () => {
  it('render sans crash avec une valeur valide', async () => {
    const { getByLabelText } = await render(
      <InputNumerique
        label="Âge"
        value="25"
        onChangeText={jest.fn()}
      />,
    );
    expect(getByLabelText('Âge')).toBeTruthy();
  });

  it('n’affiche pas d’erreur quand le champ est rempli et non requis', async () => {
    const { queryByText } = await render(
      <InputNumerique label="Âge" value="25" onChangeText={jest.fn()} />,
    );
    expect(queryByText('Ce champ est requis.')).toBeNull();
    expect(queryByText('Valeur numérique invalide.')).toBeNull();
  });

  it('affiche une erreur quand le champ requis est vide', async () => {
    const { getByText } = await render(
      <InputNumerique label="Âge" value="" onChangeText={jest.fn()} required />,
    );
    expect(getByText('Ce champ est requis.')).toBeTruthy();
  });

  it('affiche une erreur quand la saisie n’est pas un nombre', async () => {
    const { getByText } = await render(
      <InputNumerique label="Âge" value="abc" onChangeText={jest.fn()} />,
    );
    expect(getByText('Valeur numérique invalide.')).toBeTruthy();
  });

  it('affiche une erreur quand integer et valeur décimale', async () => {
    const { getByText } = await render(
      <InputNumerique
        label="Quantité"
        value="2.5"
        onChangeText={jest.fn()}
        integer
      />,
    );
    expect(getByText('Nombre entier attendu.')).toBeTruthy();
  });

  it('affiche une erreur quand la valeur est inférieure à min', async () => {
    const { getByText } = await render(
      <InputNumerique
        label="Âge"
        value="5"
        onChangeText={jest.fn()}
        min={18}
      />,
    );
    expect(getByText('Minimum 18.')).toBeTruthy();
  });

  it('affiche une erreur quand la valeur est supérieure à max', async () => {
    const { getByText } = await render(
      <InputNumerique
        label="Âge"
        value="100"
        onChangeText={jest.fn()}
        max={99}
      />,
    );
    expect(getByText('Maximum 99.')).toBeTruthy();
  });

  it('utilise le message d’erreur personnalisé lorsqu’il est fourni', async () => {
    const { getByText } = await render(
      <InputNumerique
        label="Montant"
        value=""
        onChangeText={jest.fn()}
        required
        error="Merci de saisir un montant valide."
      />,
    );
    expect(getByText('Merci de saisir un montant valide.')).toBeTruthy();
  });

  it('accepte un entier quand integer est vrai', async () => {
    const { queryByText } = await render(
      <InputNumerique
        label="Quantité"
        value="42"
        onChangeText={jest.fn()}
        integer
      />,
    );
    expect(queryByText('Nombre entier attendu.')).toBeNull();
    expect(queryByText('Valeur numérique invalide.')).toBeNull();
  });
});


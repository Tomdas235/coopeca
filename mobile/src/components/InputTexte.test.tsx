import { render } from '@testing-library/react-native';
import { InputTexte } from './InputTexte';

describe('InputTexte (champ de saisie texte COOPECA)', () => {
  it('render sans crash avec une valeur valide', async () => {
    const { getByLabelText } = await render(
      <InputTexte
        label="Nom"
        value="Dupont"
        onChangeText={jest.fn()}
      />,
    );
    expect(getByLabelText('Nom')).toBeTruthy();
  });

  it('n’affiche pas d’erreur quand le champ est rempli et non requis', async () => {
    const { queryByText } = await render(
      <InputTexte label="Nom" value="Dupont" onChangeText={jest.fn()} />,
    );
    expect(queryByText('Ce champ est requis.')).toBeNull();
  });

  it('affiche une erreur quand le champ requis est vide', async () => {
    const { getByText } = await render(
      <InputTexte label="Nom" value="" onChangeText={jest.fn()} required />,
    );
    expect(getByText('Ce champ est requis.')).toBeTruthy();
  });

  it('affiche une erreur quand la longueur dépasse maxLength', async () => {
    const { getByText } = await render(
      <InputTexte
        label="Code"
        value="ABCDE"
        onChangeText={jest.fn()}
        maxLength={3}
      />,
    );
    expect(getByText('Maximum 3 caractères.')).toBeTruthy();
  });

  it('affiche le compteur de caractères quand maxLength est défini', async () => {
    const { getByText } = await render(
      <InputTexte
        label="Code"
        value="AB"
        onChangeText={jest.fn()}
        maxLength={5}
      />,
    );
    expect(getByText('2/5')).toBeTruthy();
  });

  it('utilise le message d’erreur personnalisé lorsqu’il est fourni', async () => {
    const { getByText } = await render(
      <InputTexte
        label="Email"
        value=""
        onChangeText={jest.fn()}
        required
        error="Merci de saisir une adresse email valide."
      />,
    );
    expect(getByText('Merci de saisir une adresse email valide.')).toBeTruthy();
  });

  it('affiche une astérisque quand le champ est requis', async () => {
    const { getByText } = await render(
      <InputTexte label="Nom" value="" onChangeText={jest.fn()} required />,
    );
    expect(getByText('*')).toBeTruthy();
  });
});


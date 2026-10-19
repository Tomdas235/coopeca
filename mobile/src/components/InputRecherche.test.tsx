import { render, fireEvent } from '@testing-library/react-native';
import { InputRecherche } from './InputRecherche';

describe('InputRecherche (champ de recherche COOPECA)', () => {
  it('render sans crash avec une valeur vide', () => {
    const { getByPlaceholderText } = render(
      <InputRecherche
        value=""
        onChangeText={jest.fn()}
      />,
    );
    expect(getByPlaceholderText('Rechercher…')).toBeTruthy();
  });

  it('affiche l’icône de recherche', () => {
    const { getByText } = render(
      <InputRecherche value="" onChangeText={jest.fn()} />,
    );
    expect(getByText('🔍')).toBeTruthy();
  });

  it('n’affiche pas le bouton effacer quand le champ est vide', () => {
    const { queryByText } = render(
      <InputRecherche value="" onChangeText={jest.fn()} />,
    );
    expect(queryByText('✕')).toBeNull();
  });

  it('affiche le bouton effacer quand il y a du texte', () => {
    const { getByText } = render(
      <InputRecherche value="Dupont" onChangeText={jest.fn()} />,
    );
    expect(getByText('✕')).toBeTruthy();
  });

  it('efface le texte quand on clique sur le bouton effacer', () => {
    const onChangeText = jest.fn();
    const { getByText } = render(
      <InputRecherche value="Dupont" onChangeText={onChangeText} />,
    );
    fireEvent.press(getByText('✕'));
    expect(onChangeText).toHaveBeenCalledWith('');
  });

  it('appelle onChangeText à la saisie', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <InputRecherche value="" onChangeText={onChangeText} />,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getByPlaceholderText('Rechercher…') as any).props.onChangeText('toto');
    expect(onChangeText).toHaveBeenCalledWith('toto');
  });

  it('désactive la saisie quand disabled est vrai', () => {
    const { getByPlaceholderText } = render(
      <InputRecherche value="" onChangeText={jest.fn()} disabled />,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getByPlaceholderText('Rechercher…') as any).props.disabled).toBe(true);
  });

  it('utilise le placeholder personnalisé lorsqu’il est fourni', () => {
    const { getByPlaceholderText } = render(
      <InputRecherche
        value=""
        onChangeText={jest.fn()}
        placeholder="Chercher un client…"
      />,
    );
    expect(getByPlaceholderText('Chercher un client…')).toBeTruthy();
  });
});

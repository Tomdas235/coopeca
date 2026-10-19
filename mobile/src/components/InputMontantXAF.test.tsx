import { render } from '@testing-library/react-native';
import { InputMontantXAF } from './InputMontantXAF';

describe('InputMontantXAF (règle COOPECA : entiers XAF, jamais de flottants)', () => {
  it('render sans crash avec une valeur valide', () => {
    const onChangeText = jest.fn();
    const { getByLabelText, getByText } = render(
      <InputMontantXAF
        label="Montant collecté"
        value="1500"
        onChangeText={onChangeText}
      />,
    );
    expect(getByLabelText('Montant collecté')).toBeTruthy();
    // Hint de formatage affiché : « 1 500 XAF »
    expect(getByText('1 500 XAF')).toBeTruthy();
  });

  it('n’affiche pas d’erreur quand le champ est vide', () => {
    const { queryByText } = render(
      <InputMontantXAF label="Montant" value="" onChangeText={jest.fn()} />,
    );
    expect(queryByText('Le montant doit être un nombre entier de XAF.')).toBeNull();
    expect(queryByText(/XAF/)).toBeNull();
  });

  it('affiche une erreur quand la valeur est un flottant', () => {
    const { getByText } = render(
      <InputMontantXAF label="Montant" value="1.5" onChangeText={jest.fn()} />,
    );
    expect(getByText('Le montant doit être un nombre entier de XAF.')).toBeTruthy();
  });

  it('affiche une erreur quand la valeur est NaN', () => {
    const { getByText } = render(
      <InputMontantXAF label="Montant" value="abc" onChangeText={jest.fn()} />,
    );
    expect(getByText('Le montant doit être un nombre entier de XAF.')).toBeTruthy();
  });

  it('appelle onChangeText à la saisie', () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = render(
      <InputMontantXAF label="Montant" value="" onChangeText={onChangeText} />,
    );
    // simulate user input via React Native TextInput prop
    // @testing-library/react-native expose changeText sur l'élément input
    const input = getByLabelText('Montant');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (input as any).props.onChangeText('2500');
    expect(onChangeText).toHaveBeenCalledWith('2500');
  });

  it('utilise le message d’erreur personnalisé lorsqu’il est fourni', () => {
    const { getByText } = render(
      <InputMontantXAF
        label="Montant"
        value="2.5"
        onChangeText={jest.fn()}
        error="Saisir un montant entier sans virgule."
      />,
    );
    expect(getByText('Saisir un montant entier sans virgule.')).toBeTruthy();
  });

  it('formate les milliers avec une espace dans le hint', () => {
    const { getByText } = render(
      <InputMontantXAF label="Montant" value="1234567" onChangeText={jest.fn()} />,
    );
    expect(getByText('1 234 567 XAF')).toBeTruthy();
  });
});

import { render, fireEvent } from '@testing-library/react-native';
import { SelecteurSimple } from './SelecteurSimple';

const options = [
  { label: 'Client A', value: 'a' },
  { label: 'Client B', value: 'b' },
  { label: 'Client C', value: 'c' },
];

describe('SelecteurSimple (sélecteur déroulant COOPECA)', () => {
  it('render sans crash avec une valeur null', () => {
    const { getByText } = render(
      <SelecteurSimple
        label="Client"
        value={null}
        options={options}
        onValueChange={jest.fn()}
      />,
    );
    expect(getByText('Sélectionner…')).toBeTruthy();
  });

  it('affiche le libellé de l’option sélectionnée', () => {
    const { getByText } = render(
      <SelecteurSimple
        label="Client"
        value="b"
        options={options}
        onValueChange={jest.fn()}
      />,
    );
    expect(getByText('Client B')).toBeTruthy();
  });

  it('appelle onValueChange quand une option est sélectionnée', () => {
    const onValueChange = jest.fn();
    const { getByText } = render(
      <SelecteurSimple
        label="Client"
        value={null}
        options={options}
        onValueChange={onValueChange}
      />,
    );
    // Ouvrir le sélecteur (le champ tactile affiche le placeholder)
    fireEvent.press(getByText('Sélectionner…'));
    // Sélectionner "Client B" dans le modal
    fireEvent.press(getByText('Client B'));
    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  it('affiche un message d’erreur quand la prop error est fournie', () => {
    const { getByText } = render(
      <SelecteurSimple
        label="Client"
        value={null}
        options={options}
        onValueChange={jest.fn()}
        error="Sélection obligatoire."
      />,
    );
    expect(getByText('Sélection obligatoire.')).toBeTruthy();
  });

  it('n’appelle pas onValueChange quand disabled est vrai', () => {
    const onValueChange = jest.fn();
    const { getByText, queryByText } = render(
      <SelecteurSimple
        label="Client"
        value={null}
        options={options}
        onValueChange={onValueChange}
        disabled
      />,
    );
    fireEvent.press(getByText('Sélectionner…'));
    expect(queryByText('Client B')).toBeNull();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('utilise le placeholder personnalisé lorsqu’il est fourni', () => {
    const { getByText } = render(
      <SelecteurSimple
        label="Dossier"
        value={null}
        options={options}
        onValueChange={jest.fn()}
        placeholder="Choisir un dossier…"
      />,
    );
    expect(getByText('Choisir un dossier…')).toBeTruthy();
  });

  it('affiche le libellé au-dessus du champ', () => {
    const { getByText } = render(
      <SelecteurSimple
        label="Agence"
        value={null}
        options={options}
        onValueChange={jest.fn()}
      />,
    );
    expect(getByText('Agence')).toBeTruthy();
  });
});

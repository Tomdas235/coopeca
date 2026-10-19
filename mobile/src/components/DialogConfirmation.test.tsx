import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Modal } from 'react-native';
import { DialogConfirmation } from './DialogConfirmation';

describe('DialogConfirmation (confirmation explicite des actions sensibles)', () => {
  it('ne rend rien quand visible est faux', () => {
    const { queryByText } = render(
      <DialogConfirmation
        visible={false}
        title="Confirmer ?"
        message="Voulez-vous continuer ?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(queryByText('Confirmer ?')).toBeNull();
    expect(queryByText('Voulez-vous continuer ?')).toBeNull();
  });

  it('affiche le titre, le message et les deux boutons quand visible est vrai', () => {
    const { getByText } = render(
      <DialogConfirmation
        visible={true}
        title="Clôturer la journée ?"
        message="Cette action est irréversible."
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(getByText('Clôturer la journée ?')).toBeTruthy();
    expect(getByText('Cette action est irréversible.')).toBeTruthy();
    expect(getByText('Confirmer')).toBeTruthy();
    expect(getByText('Annuler')).toBeTruthy();
  });

  it('appelle onConfirm quand on clique sur Confirmer', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByText } = render(
      <DialogConfirmation
        visible={true}
        title="Confirmer ?"
        message="Action"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.press(getByText('Confirmer'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('appelle onCancel quand on clique sur Annuler', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByText } = render(
      <DialogConfirmation
        visible={true}
        title="Confirmer ?"
        message="Action"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.press(getByText('Annuler'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('désactive le bouton Confirmer quand loading est vrai', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <DialogConfirmation
        visible={true}
        title="Confirmer ?"
        message="Action"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
        loading
      />,
    );
    const bouton = getByText('Confirmer');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((bouton as any).props.disabled).toBe(true);
    fireEvent.press(bouton);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('utilise les libellés personnalisés lorsqu’ils sont fournis', () => {
    const { getByText } = render(
      <DialogConfirmation
        visible={true}
        title="Supprimer ?"
        message="Cette collecte sera supprimée."
        confirmLabel="Oui, supprimer"
        cancelLabel="Non, garder"
        destructive
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(getByText('Oui, supprimer')).toBeTruthy();
    expect(getByText('Non, garder')).toBeTruthy();
  });
});

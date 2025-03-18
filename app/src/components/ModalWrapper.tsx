import React from 'react';
import EventModal from './EventModal';

interface ModalWrapperProps extends Omit<React.ComponentProps<typeof EventModal>, 'newEvent'> {
  modalMode: 'create' | 'edit' | string;
  newEvent: {
    title: string;
    isFullDay: boolean;
    summary: string;
    [key: string]: any;
  };
}

// Simplifier drastiquement le composant ModalWrapper
const ModalWrapper = (props: ModalWrapperProps) => {
  return <EventModal {...props} />;
};

export default ModalWrapper;
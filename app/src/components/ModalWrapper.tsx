import React, { useState, useEffect } from 'react';
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

// Ce composant n'existe que pour forcer la destruction et recréation complète de EventModal
const ModalWrapper = (props: ModalWrapperProps) => {
  // Utilisez un état local pour stocker une copie de newEvent
  const [localNewEvent, setLocalNewEvent] = useState(props.newEvent);

  // Mettez à jour localNewEvent uniquement lorsque le modal s'ouvre ou que l'ID change
  useEffect(() => {
    // N'écrasez la valeur isFullDay que lors de la création d'un nouvel événement
    if (props.modalMode === 'create' && !props.newEvent.id) {
      setLocalNewEvent({
        ...props.newEvent,
        isFullDay: false
      });
    } else {
      setLocalNewEvent(props.newEvent);
    }
  }, [props.isVisible, props.newEvent.id, props.modalMode]);

  // Synchronisez les changements directs dans newEvent
  useEffect(() => {
    setLocalNewEvent(prev => ({
      ...props.newEvent,
      // Préservez la valeur isFullDay de l'état local pour éviter qu'elle ne soit écrasée
      isFullDay: props.newEvent.isFullDay !== prev.isFullDay ? props.newEvent.isFullDay : prev.isFullDay
    }));
  }, [props.newEvent.title, props.newEvent.summary, props.newEvent.start, props.newEvent.end]);

  // Handler pour mettre à jour newEvent du parent et l'état local
  const handleSetNewEvent = (newEventData: any) => {
    setLocalNewEvent(newEventData);
    props.setNewEvent(newEventData);
  };

  return (
    <EventModal
      {...props}
      newEvent={localNewEvent}
      setNewEvent={handleSetNewEvent}
    />
  );
};

export default ModalWrapper;
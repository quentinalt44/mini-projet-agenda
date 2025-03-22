// App.tsx
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import CalendarScreen from './src/screens/CalendarScreen';
import ParamsScreen from './src/screens/params';
import MapScreen from './src/screens/MapScreen';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('calendar');
  const [mapLocation, setMapLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [eventToShow, setEventToShow] = useState<string | number | null>(null);
  const [eventId, setEventId] = useState<string | number | null>(null);
  const [showSingleEvent, setShowSingleEvent] = useState(false);

  const navigateToParams = () => {
    setCurrentScreen('params');
  };

  const navigateToCalendar = () => {
    setCurrentScreen('calendar');
  };

  const navigateToMap = (data: { location?: { latitude: number; longitude: number }, eventId?: string | number, showSingleEvent?: boolean }) => {
    console.log("navigateToMap appelé avec:", data);
    
    // Vérifier que data.location existe bien
    if (!data.location) {
      console.error("Erreur: location manquante dans les données de la carte");
      return;
    }
    
    // Stocker la position
    setMapLocation(data.location);
    
    // Définir explicitement eventId (peut être undefined)
    setEventId(data.eventId ?? null);
    
    // Définir explicitement showSingleEvent (doit être un booléen)
    setShowSingleEvent(Boolean(data.showSingleEvent));
    
    console.log("Paramètres définis:", {
      location: data.location,
      eventId: data.eventId,
      showSingleEvent: Boolean(data.showSingleEvent)
    });
    
    // Changer d'écran
    setCurrentScreen('map');
  };

  const navigateBack = () => {
    setCurrentScreen('calendar');
  };

  const handleEventPress = (eventId: string | number) => {
    // Fermer la carte
    setCurrentScreen('calendar');
    // Définir l'événement à afficher
    setEventToShow(eventId);
  };

  return (
    <SafeAreaView style={styles.container}>
      {currentScreen === 'calendar' ? (
        <CalendarScreen 
          onSettingsPress={navigateToParams}
          onMapPress={navigateToMap} 
        />
      ) : currentScreen === 'params' ? (
        <ParamsScreen onClose={navigateToCalendar} />
      ) : currentScreen === 'map' && mapLocation ? (
        <>
          <MapScreen 
            location={mapLocation} 
            onClose={navigateToCalendar}
            onEventPress={handleEventPress}
            eventId={eventId ?? undefined}
            showSingleEvent={showSingleEvent}
          />
        </>
      ) : (
        null
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;

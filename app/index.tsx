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

  const navigateToParams = () => {
    setCurrentScreen('params');
  };

  const navigateToCalendar = () => {
    setCurrentScreen('calendar');
  };

  const navigateToMap = (location: { latitude: number; longitude: number }) => {
    setMapLocation(location);
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
        <MapScreen 
          location={mapLocation} 
          onClose={navigateToCalendar}
          onEventPress={handleEventPress}
        />
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

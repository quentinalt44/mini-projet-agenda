// App.tsx
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import CalendarScreen from './src/screens/CalendarScreen';
import ParamsScreen from './src/screens/params';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('calendar');

  const navigateToParams = () => {
    setCurrentScreen('params');
  };

  const navigateToCalendar = () => {
    setCurrentScreen('calendar');
  };

  return (
    <SafeAreaView style={styles.container}>
      {currentScreen === 'calendar' ? (
        <CalendarScreen onSettingsPress={navigateToParams} />
      ) : (
        <ParamsScreen onClose={navigateToCalendar} />
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

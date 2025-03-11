// App.tsx
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import CalendarScreen from './src/screens/CalendarScreen';

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <CalendarScreen />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;

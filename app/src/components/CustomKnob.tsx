import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const CustomKnob = () => (
  <View style={styles.container}>
    <View style={styles.knob} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  knob: {
    width: 100,
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
  },
});

export default CustomKnob;

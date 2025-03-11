import React from 'react';
import { View, StyleSheet } from 'react-native';

const CustomKnob = () => <View style={styles.knob} />;

const styles = StyleSheet.create({
  knob: {
    width: 100,
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
  },
});

export default CustomKnob;

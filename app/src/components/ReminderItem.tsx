import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

interface ReminderItemProps {
  reminder: {
    id?: string | number;
    time: number;
    unit: 'minute' | 'hour' | 'day';
  };
  onUpdate: (id: string | number | undefined, updates: { time: number; unit: 'minute' | 'hour' | 'day' }) => void;
  onDelete: (id: string | number | undefined) => void;
}

const ReminderItem: React.FC<ReminderItemProps> = ({ reminder, onUpdate, onDelete }) => {
  const [isUnitPickerVisible, setIsUnitPickerVisible] = useState(false);
  
  const getUnitLabel = (unit: string) => {
    switch(unit) {
      case 'minute': return 'minutes avant';
      case 'hour': return 'heures avant';
      case 'day': return 'jours avant';
      default: return 'minutes avant';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.timeInput}
          value={reminder.time.toString()}
          keyboardType="numeric"
          onChangeText={(text) => {
            const value = parseInt(text) || 0;
            onUpdate(reminder.id, { time: value, unit: reminder.unit });
          }}
        />
        
        <TouchableOpacity
          style={styles.unitButton}
          onPress={() => setIsUnitPickerVisible(true)}
        >
          <Text style={styles.unitButtonText}>{getUnitLabel(reminder.unit)}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => onDelete(reminder.id)} style={styles.deleteButton}>
          <Ionicons name="close-circle" size={24} color="#f44336" />
        </TouchableOpacity>
      </View>
      
      {/* Modal pour le Picker d'unité de temps */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isUnitPickerVisible}
        onRequestClose={() => setIsUnitPickerVisible(false)}
      >
        <View style={styles.pickerModalContainer}>
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Choisir une unité</Text>
            <Picker
              selectedValue={reminder.unit}
              onValueChange={(value) => {
                onUpdate(reminder.id, { time: reminder.time, unit: value as 'minute' | 'hour' | 'day' });
              }}
              style={{ width: '100%', height: 200 }}
            >
              <Picker.Item label="Minutes avant" value="minute" />
              <Picker.Item label="Heures avant" value="hour" />
              <Picker.Item label="Jours avant" value="day" />
            </Picker>
            <TouchableOpacity
              style={styles.pickerCloseButton}
              onPress={() => setIsUnitPickerVisible(false)}
            >
              <Text style={styles.pickerCloseButtonText}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingVertical: 2,
  },
  labelText: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 4,
  },
  defaultText: {
    fontSize: 12,
    color: '#1a73e8',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    textAlign: 'center',
  },
  unitButton: {
    flex: 1,
    height: 40,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
  },
  unitButtonText: {
    fontSize: 16,
    color: '#2d4150',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  pickerModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxWidth: 500,
    alignItems: 'center',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1a73e8',
  },
  pickerCloseButton: {
    marginTop: 10,
    backgroundColor: '#1a73e8',
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  pickerCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ReminderItem;
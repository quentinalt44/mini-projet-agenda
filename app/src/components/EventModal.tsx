import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface EventModalProps {
  isVisible: boolean;
  newEvent: {
    title: string;
    summary: string;
    start: string;
    end: string;
  };
  setNewEvent: React.Dispatch<React.SetStateAction<{
    title: string;
    summary: string;
    start: string;
    end: string;
  }>>;
  handleAddNewEvent: () => void;
  setIsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  selectedStartTime: Date;
  selectedEndTime: Date;
  selectedEventDate: Date;
  showPicker: (type: 'date' | 'start' | 'end') => void;
  currentPicker: {
    show: boolean;
    mode: 'date' | 'time';
    current: 'date' | 'start' | 'end';
  };
  handlePickerChange: (event: any, selected?: Date) => void;
}

const EventModal: React.FC<EventModalProps> = ({
  isVisible,
  newEvent,
  setNewEvent,
  handleAddNewEvent,
  setIsModalVisible,
  selectedStartTime,
  selectedEndTime,
  selectedEventDate,
  showPicker,
  currentPicker,
  handlePickerChange,
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => setIsModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Nouvel événement</Text>

          <TextInput
            style={styles.input}
            placeholder="Titre"
            value={newEvent.title}
            onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
          />

          <View style={styles.pickerSection}>
            <Text style={styles.pickerLabel}>Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => showPicker('date')}
            >
              <Text style={styles.dateButtonText}>
                {formatDate(selectedEventDate)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timeContainer}>
            <View style={[styles.pickerSection, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.pickerLabel}>Début</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => showPicker('start')}
              >
                <Text style={styles.timeButtonText}>
                  {formatTime(selectedStartTime)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.pickerSection, { flex: 1 }]}>
              <Text style={styles.pickerLabel}>Fin</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => showPicker('end')}
              >
                <Text style={styles.timeButtonText}>
                  {formatTime(selectedEndTime)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Description"
            value={newEvent.summary}
            onChangeText={(text) => setNewEvent({ ...newEvent, summary: text })}
            multiline
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.buttonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddNewEvent}
            >
              <Text style={styles.buttonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>

          {currentPicker.show && (
            <DateTimePicker
              value={
                currentPicker.current === 'date'
                  ? selectedEventDate
                  : currentPicker.current === 'start'
                  ? selectedStartTime
                  : selectedEndTime
              }
              mode={currentPicker.mode}
              is24Hour={true}
              display="spinner"
              onChange={handlePickerChange}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1a73e8',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#5f6368',
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#1a73e8',
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  dateButton: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 15,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#2d4150',
  },
  timeContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  timeButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#2d4150',
  },
  pickerSection: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#2d4150',
    marginBottom: 8,
  },
});

export default EventModal;

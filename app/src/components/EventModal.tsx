import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Platform, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface EventModalProps {
  isVisible: boolean;
  mode: 'create' | 'edit';
  newEvent: {
    title: string;
    summary?: string;
    start: string;
    end: string;
    isFullDay?: boolean;
  };
  setNewEvent: (event: any) => void;
  handleAddNewEvent: () => void;
  setIsModalVisible: (visible: boolean) => void;
  selectedStartTime: Date;
  selectedEndTime: Date;
  selectedEventDate: Date;
  showPicker: (type: 'date' | 'start' | 'end' | 'start_date' | 'start_time' | 'end_date' | 'end_time') => void;
  currentPicker: {
    show: boolean;
    mode: 'date' | 'time';
    current: 'date' | 'start' | 'end' | 'start_date' | 'start_time' | 'end_date' | 'end_time';
  };
  setCurrentPicker: (picker: any) => void;
  handlePickerChange: (event: any, selected?: Date) => void;
}

const EventModal: React.FC<EventModalProps> = ({
  isVisible,
  mode,
  newEvent,
  setNewEvent,
  handleAddNewEvent,
  setIsModalVisible,
  selectedStartTime,
  selectedEndTime,
  selectedEventDate,
  showPicker,
  currentPicker,
  setCurrentPicker,
  handlePickerChange,
}) => {
  const formatTime = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return "Sélectionner";
    }
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
    });
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
          <Text style={styles.modalTitle}>
            {mode === 'create' ? "Ajoutez un évènement" : "Modifier l'évènement"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Titre"
            value={newEvent.title}
            onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
          />

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Journée entière</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={newEvent.isFullDay ? "#f5dd4b" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={(value) => {
                console.log('Switch value changed to:', value); // Pour debug
                setNewEvent({ ...newEvent, isFullDay: value });
              }}
              value={Boolean(newEvent.isFullDay)}
            />
          </View>

          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeSection}>
              <Text style={styles.sectionLabel}>Début</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => showPicker('start_date')}
              >
                <Text style={styles.pickerButtonText}>
                  {formatDate(selectedStartTime)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => showPicker('start_time')}
              >
                <Text style={styles.pickerButtonText}>
                  {formatTime(selectedStartTime)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateTimeSection}>
              <Text style={styles.sectionLabel}>Fin</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => showPicker('end_date')}
              >
                <Text style={styles.pickerButtonText}>
                  {formatDate(selectedEndTime)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => showPicker('end_time')}
              >
                <Text style={styles.pickerButtonText}>
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
            <Modal
              animationType="fade"
              transparent={true}
              visible={currentPicker.show}
            >
              <View style={styles.pickerModalContainer}>
                <View style={styles.pickerModalContent}>
                  <DateTimePicker
                    value={
                      currentPicker.current.startsWith('start') 
                        ? selectedStartTime 
                        : selectedEndTime
                    }
                    mode={currentPicker.current.endsWith('date') ? 'date' : 'time'}
                    is24Hour={true}
                    display="spinner"
                    onChange={handlePickerChange}
                    locale="fr-FR"
                    themeVariant="light"
                  />
                  <TouchableOpacity
                    style={styles.pickerCloseButton}
                    onPress={() => {
                      setCurrentPicker({ ...currentPicker, show: false });
                    }}
                  >
                    <Text style={styles.pickerCloseButtonText}>Valider</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
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
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  dateTimeSection: {
    flex: 1,
    marginHorizontal: 5,
  },
  sectionLabel: {
    fontSize: 16,
    color: '#2d4150',
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerButton: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginBottom: 10,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#2d4150',
    textAlign: 'center',
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#2d4150',
  },
});

export default EventModal;
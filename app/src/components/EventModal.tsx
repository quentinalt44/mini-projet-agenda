import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Platform, Switch, ScrollView, Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import ReminderItem from './ReminderItem';

// Ajoutez en haut du fichier pour obtenir les dimensions de l'écran
const { height: screenHeight } = Dimensions.get('window');

// Définir les catégories d'événements
const EVENT_CATEGORIES = [
  { id: 'default', label: 'Par défaut', color: '#1a73e8' },
  { id: 'work', label: 'Travail', color: '#d50000' },
  { id: 'personal', label: 'Personnel', color: '#33b679' },
  { id: 'family', label: 'Famille', color: '#f6bf26' },
  { id: 'health', label: 'Santé', color: '#8e24aa' },
  { id: 'other', label: 'Autre', color: '#616161' },
];

// Définir le type Reminder
interface Reminder {
  id: string | number;
  time: number;
  unit: 'minute' | 'hour' | 'day';
}

interface EventModalProps {
  isVisible: boolean;
  mode: 'create' | 'edit';
  newEvent: {
    title: string;
    isFullDay: boolean;
    summary: string;
    category?: string;
    [key: string]: any;
  };
  setNewEvent: (event: any) => void;
  handleAddNewEvent: () => void;
  setIsModalVisible: (visible: boolean) => void;
  selectedStartTime: Date;
  selectedEndTime: Date;
  setSelectedStartTime: (date: Date) => void;
  setSelectedEndTime: (date: Date) => void;
  selectedEventDate: Date;
  showPicker: (pickerType: 'date' | 'start_date' | 'start_time' | 'end_date' | 'end_time' | 'start' | 'end') => void;  
  currentPicker: {
    show: boolean;
    current?: string;
  };
  setCurrentPicker: (picker: any) => void;
  handlePickerChange: (event: any, selectedDate?: Date) => void;
  reminders?: Reminder[];
  onUpdateReminders?: (reminders: Reminder[]) => void;
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
  setSelectedStartTime,
  setSelectedEndTime,
  selectedEventDate,
  showPicker,
  currentPicker,
  setCurrentPicker,
  handlePickerChange,
  reminders = [],
  onUpdateReminders = () => {},
}) => {
  // État local pour conserver les heures avant/après toggle
  const [localTimes, setLocalTimes] = useState({
    regularStart: new Date(selectedStartTime),
    regularEnd: new Date(selectedEndTime)
  });

  // Ajouter cet état pour gérer la visibilité du picker de catégorie
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);

  // Nouvel état pour les rappels
  const [eventReminders, setEventReminders] = useState<Reminder[]>([]);

  // Synchroniser l'état local avec les props quand le modal devient visible
  useEffect(() => {
    if (isVisible) {
      setLocalTimes({
        regularStart: new Date(selectedStartTime),
        regularEnd: new Date(selectedEndTime)
      });
    }
  }, [isVisible, selectedStartTime, selectedEndTime]);

  // Modifier le useEffect pour ne pas ajouter automatiquement un rappel
  useEffect(() => {
    if (isVisible) {
      // Uniquement mettre à jour si différent pour éviter la boucle
      if (JSON.stringify(eventReminders) !== JSON.stringify(reminders)) {
        setEventReminders(reminders);
      }
    }
  }, [isVisible, reminders]);
  
  // Mise à jour des rappels dans le parent
  useEffect(() => {
    // Uniquement mettre à jour si différent des reminders actuels
    if (isVisible && onUpdateReminders && JSON.stringify(eventReminders) !== JSON.stringify(reminders)) {
      onUpdateReminders(eventReminders);
    }
  }, [eventReminders, isVisible]);

  const handleToggleChange = (value: boolean) => {
    console.log("Toggle changed to:", value);
    
    // Créer de nouvelles instances de Date
    let newStartTime, newEndTime;
    
    if (value) {
      // Si "journée entière" est activé
      // Sauvegarder d'abord les heures actuelles
      setLocalTimes({
        regularStart: new Date(selectedStartTime),
        regularEnd: new Date(selectedEndTime)
      });
      
      // Puis définir 00:00 et 23:59
      newStartTime = new Date(selectedEventDate);
      newStartTime.setHours(0, 0, 0, 0);
      
      newEndTime = new Date(selectedEventDate);
      newEndTime.setHours(23, 59, 0, 0);
    } else {
      // Si "journée entière" est désactivé, restaurer les heures par défaut
      newStartTime = new Date(selectedEventDate);
      newStartTime.setHours(9, 0, 0, 0);
      
      newEndTime = new Date(selectedEventDate);
      newEndTime.setHours(10, 0, 0, 0);
    }
    
    // Mise à jour des états dans le parent
    setSelectedStartTime(newStartTime);
    setSelectedEndTime(newEndTime);
    
    // Mise à jour de l'événement complet
    setNewEvent({
      ...newEvent,
      isFullDay: value,
      start: newStartTime.toISOString(),
      end: newEndTime.toISOString()
    });
  };

  // Fonction personnalisée pour formater l'heure
  const formatTime = (date: Date) => {
    // Si c'est un événement sur toute la journée, afficher des valeurs fixes
    if (newEvent.isFullDay) {
      return date.getHours() === 0 ? "00:00" : "23:59";
    }
    
    // Sinon afficher l'heure normale
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return "Sélectionner";
    }
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Formatage de la date
  const formatDate = (date: Date) => {
    const formattedDate = date.toLocaleDateString('fr-FR', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
    });
    
    // Mettre une majuscule au premier caractère
    return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  };

  // Fonction pour ajouter un nouveau rappel
  const addReminder = () => {
    const newReminder: Reminder = {
      id: `reminder-${Date.now()}`,
      time: 15,
      unit: 'minute'
    };
    setEventReminders([...eventReminders, newReminder]);
  };

  // Fonction pour mettre à jour un rappel
  const updateReminder = (id: string | number | undefined, updates: { time: number; unit: 'minute' | 'hour' | 'day' }) => {
    setEventReminders(
      eventReminders.map((reminder) => 
        reminder.id === id ? { ...reminder, ...updates } : reminder
      )
    );
  };

  // Modifiez la fonction deleteReminder
  const deleteReminder = (id: string | number | undefined) => {
    // Vérifier si c'est le seul rappel restant
    if (eventReminders.length <= 1) {
      // Au lieu de bloquer la suppression, on peut réinitialiser avec un tableau vide
      setEventReminders([]);
      return;
    }
    
    // Sinon, supprimer le rappel normalement
    setEventReminders(
      eventReminders.filter((reminder) => reminder.id !== id)
    );
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
            {mode === 'create' ? "Ajouter un évènement" : "Modifier l'évènement"}
          </Text>

          {/* Ajout du ScrollView ici */}
          <ScrollView 
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollViewContent}
          >
            <TextInput
              style={styles.input}
              placeholder="Titre"
              value={newEvent.title}
              onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
            />
            
            {/* Catégorie simplifiée sans label et sans bordures */}
            <TouchableOpacity
              style={styles.categorySelectButton}
              onPress={() => setIsCategoryPickerVisible(true)}
            >
              <View style={styles.categoryIndicator}>
                <View 
                  style={[
                    styles.categoryColor, 
                    {backgroundColor: EVENT_CATEGORIES.find(c => c.id === (newEvent.category || 'default'))?.color || '#1a73e8'}
                  ]} 
                />
                <Text style={styles.categoryButtonText}>
                  {EVENT_CATEGORIES.find(c => c.id === (newEvent.category || 'default'))?.label || 'Par défaut'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={16} color="#757575" />
            </TouchableOpacity>

            {/* Modal pour la sélection de catégorie avec boutons radio */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={isCategoryPickerVisible}
              onRequestClose={() => setIsCategoryPickerVisible(false)}
            >
              <View style={styles.pickerModalContainer}>
                <View style={styles.categoryModalContent}>
                  <Text style={styles.categoryModalTitle}>Choisir une catégorie</Text>
                  
                  {EVENT_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={styles.categoryOption}
                      onPress={() => {
                        setNewEvent({...newEvent, category: category.id});
                        setIsCategoryPickerVisible(false);
                      }}
                    >
                      <View style={styles.categoryRadioContainer}>
                        <View 
                          style={[
                            styles.categoryRadio, 
                            newEvent.category === category.id && {borderColor: category.color}
                          ]}
                        >
                          {newEvent.category === category.id && (
                            <View style={[styles.categoryRadioSelected, {backgroundColor: category.color}]} />
                          )}
                        </View>
                        <View style={[styles.categoryColorIndicator, {backgroundColor: category.color}]} />
                        <Text style={styles.categoryOptionText}>{category.label}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  
                  <TouchableOpacity
                    style={styles.categoryCloseButton}
                    onPress={() => setIsCategoryPickerVisible(false)}
                  >
                    <Text style={styles.pickerCloseButtonText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            
            {/* Séparateur au-dessus du toggle - réduire la marge en dessous */}
            <View style={[styles.separator, {marginBottom: 3}]} />

            {/* Bloc des dates/heures */}
            <View style={styles.dateTimeBlock}>
              {/* Toggle pour journée entière */}
              <View style={[styles.switchContainer, {paddingVertical: 8, marginBottom: 8}]}>
                <View style={styles.switchLabelContainer}>
                  <Text style={styles.switchLabel}>Journée entière</Text>
                </View>
                <Switch
                  key={`switch-${newEvent.id || 'new'}-${mode}`}
                  trackColor={{ false: "#e0e0e0", true: "#b3d1ff" }}
                  thumbColor={newEvent.isFullDay ? "#1a73e8": "#ffffff"}
                  ios_backgroundColor="#e0e0e0"
                  onValueChange={handleToggleChange}
                  value={Boolean(newEvent.isFullDay)}
                />
              </View>

              {/* Date de début avec marges réduites */}
              <View style={[styles.dateTimeContainer, {marginBottom: 8}]}>
                <View style={styles.dateTimeSection}>
                  <View style={[styles.dateTimeRow, {paddingBottom: 4}]}>
                    <TouchableOpacity
                      style={styles.datePickerText}
                      onPress={() => showPicker('start_date')}
                    >
                      <Text style={styles.dateText}>{formatDate(selectedStartTime)}</Text>
                    </TouchableOpacity>
                    
                    {!newEvent.isFullDay && (
                      <>
                        <TouchableOpacity
                          style={styles.timePickerText}
                          onPress={() => showPicker('start_time')}
                        >
                          <Text style={styles.timeText}>{formatTime(selectedStartTime)}</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </View>
              
              {/* Date de fin avec marges réduites */}
              <View style={[styles.dateTimeContainer, {marginBottom: 8}]}>
                <View style={styles.dateTimeSection}>
                  <View style={[styles.dateTimeRow, {paddingBottom: 4}]}>
                    <TouchableOpacity
                      style={styles.datePickerText}
                      onPress={() => showPicker('end_date')}
                    >
                      <Text style={styles.dateText}>{formatDate(selectedEndTime)}</Text>
                    </TouchableOpacity>
                    
                    {!newEvent.isFullDay && (
                      <>
                        <TouchableOpacity
                          style={styles.timePickerText}
                          onPress={() => showPicker('end_time')}
                        >
                          <Text style={styles.timeText}>{formatTime(selectedEndTime)}</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* Séparateur en dessous de la date de fin - réduire la marge au-dessus */}
            <View style={[styles.separator, {marginTop: 3, marginBottom: 20}]} />

            <TextInput
              style={styles.input}
              placeholder="Description"
              value={newEvent.summary}
              onChangeText={(text) => setNewEvent({ ...newEvent, summary: text })}
              multiline
            />

            {/* Section des rappels */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rappels</Text>
              
              {eventReminders.length > 0 ? (
                eventReminders.map((reminder, index) => (
                  <ReminderItem
                    key={reminder.id || index}
                    reminder={reminder}
                    onUpdate={updateReminder}
                    onDelete={deleteReminder}
                    // Supprimer complètement la prop isDefault pour ne plus différencier les rappels
                  />
                ))
              ) : (
                <View style={styles.noRemindersContainer}>
                  <Text style={styles.noRemindersText}>Aucun rappel configuré</Text>
                  <TouchableOpacity 
                    style={[styles.addReminderButton, { marginTop: 8 }]}
                    onPress={addReminder}
                  >
                    <Ionicons name="alarm-outline" size={20} color="#1a73e8" />
                    <Text style={styles.addReminderText}>
                      Configurer un rappel
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {eventReminders.length > 0 && (
                <TouchableOpacity 
                  style={styles.addReminderButton}
                  onPress={addReminder}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#1a73e8" />
                  <Text style={styles.addReminderText}>
                    Ajouter un autre rappel
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
          
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
        </View>
      </View>

      {currentPicker?.show && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={currentPicker.show}
        >
          <View style={styles.pickerModalContainer}>
            <View style={styles.pickerModalContent}>
              <DateTimePicker
                value={
                  currentPicker.current?.startsWith('start') 
                    ? selectedStartTime 
                    : selectedEndTime
                }
                mode={currentPicker.current?.endsWith('date') ? 'date' : 'time'}
                is24Hour={true}
                // Changer le mode d'affichage selon la plateforme
                display={Platform.OS === 'ios' 
                  ? (currentPicker.current?.endsWith('date') ? 'inline' : 'spinner') 
                  : (currentPicker.current?.endsWith('date') ? 'calendar' : 'clock')
                }
                onChange={handlePickerChange}
                locale="fr-FR"
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
    height: screenHeight * 0.7, // Hauteur FIXE à 70% de l'écran au lieu de maxHeight
  },
  modalScrollView: {
    flex: 1, // Utiliser flex: 1 pour prendre tout l'espace disponible entre le titre et les boutons
    marginBottom: 15, // Espace avant les boutons
  },
  scrollViewContent: {
    paddingBottom: 10, // Marge en bas du contenu
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
    marginBottom: 8, // Réduit de 15 à 8
  },
  dateTimeSection: {
    flex: 1,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    justifyContent: 'space-between', // Pour pousser l'heure à droite
  },
  datePickerText: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5', // Fond bleu très léger pour les dates
    borderRadius: 6,
  },
  timePickerText: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    textAlign: 'right', // Aligner le texte à droite
    alignItems: 'flex-end', // Aligner à droite
    backgroundColor: '#f5f5f5', // Fond gris très léger pour les heures
    borderRadius: 6,
    marginLeft: 8, // Ajouter une marge à gauche
  },
  dateText: {
    fontSize: 16,
    color: '#2d4150', // Couleur normale au lieu de bleu
    flexShrink: 1, // Permet au texte de se réduire si nécessaire
  },
  timeText: {
    fontSize: 16,
    color: '#2d4150', // Couleur normale au lieu de bleu
    textAlign: 'right', // Garantir l'alignement du texte à droite
  },
  pickerButton: {
    backgroundColor: '#f8f9fa',
    padding: 10, // Réduit de 12 à 10
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40, // Réduit de 48 à 40
    marginBottom: 0, // Supprimé la marge en bas
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
    width: '90%', // Augmenter la largeur pour mieux afficher le calendrier
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
    paddingVertical: 8, // Réduit de 12 à 8
    marginBottom: 8, // Réduit de 16 à 8
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    color: '#2d4150',
    fontWeight: '500', // Ajout pour rendre le texte un peu plus visible
  },
  // Nouveaux styles pour la catégorie
  categoryContainer: {
    marginBottom: 8, // Réduit de 16 à 8
  },
  categoryLabel: {
    fontSize: 16,
    color: '#2d4150',
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addReminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  addReminderText: {
    marginLeft: 8,
    color: '#1a73e8',
    fontWeight: '500',
  },
  noRemindersText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  noRemindersContainer: {
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 5, // Réduit de 10 à 5px
  },
  dateTimeBlock: {
    width: '100%', // Augmenté de 90% à 95%
    alignSelf: 'center',
    padding: 10, // Réduit de 15 à 10px
  },
  categorySelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 10,
    marginHorizontal: 15, // Ajout de marges horizontales
    // Pas de bordure ni de background
  },
  categoryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryButtonText: {
    fontSize: 16,
    color: '#2d4150',
  },
  categoryModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1a73e8',
    textAlign: 'center',
  },
  categoryOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryRadioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d0d0d0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  categoryRadioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#2d4150',
  },
  categoryCloseButton: {
    backgroundColor: '#1a73e8',
    padding: 10,
    borderRadius: 8,
    marginTop: 15,
    alignSelf: 'center',
    minWidth: 120,
    alignItems: 'center',
  },
});

export default EventModal;
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  ScrollView, 
  SafeAreaView,
  Modal,
  Button,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ParamsScreenProps {
  onClose: () => void;
}

// Options pour le premier jour de la semaine
const weekdayOptions = [
  { label: "Lundi", value: 1 },
  { label: "Mardi", value: 2 },
  { label: "Mercredi", value: 3 },
  { label: "Jeudi", value: 4 },
  { label: "Vendredi", value: 5 },
  { label: "Samedi", value: 6 },
  { label: "Dimanche", value: 0 }
];

const ParamsScreen: React.FC<ParamsScreenProps> = ({ onClose }) => {
  // États
  const [showWeekNumbers, setShowWeekNumbers] = useState(false);
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(1);
  const [defaultStartHour, setDefaultStartHour] = useState(9);
  const [defaultDuration, setDefaultDuration] = useState(60); // 60 minutes par défaut
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  
  // États pour les modales
  const [weekdayModalVisible, setWeekdayModalVisible] = useState(false);
  const [startHourModalVisible, setStartHourModalVisible] = useState(false);
  
  // Charger les paramètres au démarrage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const weekNumbers = await AsyncStorage.getItem('showWeekNumbers');
        const firstDay = await AsyncStorage.getItem('firstDayOfWeek');
        const startHour = await AsyncStorage.getItem('defaultStartHour');
        const duration = await AsyncStorage.getItem('defaultDuration');
        
        if (weekNumbers !== null) setShowWeekNumbers(weekNumbers === 'true');
        if (firstDay !== null) setFirstDayOfWeek(Number(firstDay));
        if (startHour !== null) setDefaultStartHour(Number(startHour));
        if (duration !== null) setDefaultDuration(Number(duration));
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Sauvegarder un paramètre
  const saveSettings = async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de ${key}:`, error);
    }
  };
  
  // Gérer le changement du toggle
  const toggleWeekNumbers = async (value: boolean) => {
    setShowWeekNumbers(value);
    try {
      await AsyncStorage.setItem('showWeekNumbers', value.toString());
      // Aucune alerte ici
    } catch (error) {
      console.error('Error saving weekNumbers preference:', error);
    }
  };

  // Même chose pour le premier jour de la semaine
  const toggleFirstDayOfWeek = async (value: number) => {
    setFirstDayOfWeek(value);
    try {
      await AsyncStorage.setItem('firstDayOfWeek', value.toString());
      // Aucune alerte ici
    } catch (error) {
      console.error('Error saving first day preference:', error);
    }
  };
  
  // Obtenir le nom du jour à partir de sa valeur
  const getWeekdayName = (value: number) => {
    const day = weekdayOptions.find(option => option.value === value);
    return day ? day.label : 'Lundi';
  };
  
  // Sélectionner un nouveau jour de la semaine
  const selectFirstDayOfWeek = (value: number) => {
    toggleFirstDayOfWeek(value);
    setWeekdayModalVisible(false);
  };
  
  // Sélectionner une nouvelle heure de début
  const selectStartHour = (value: number) => {
    setDefaultStartHour(value);
    saveSettings('defaultStartHour', value);
    setStartHourModalVisible(false);
  };

  // Ajouter une fonction pour formater la durée
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else if (minutes === 60) {
      return '1 heure';
    } else if (minutes % 60 === 0) {
      return `${minutes / 60} heures`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h${mins}`;
    }
  };

  // Ajouter une fonction pour sélectionner la durée
  const selectDefaultDuration = (value: number) => {
    setDefaultDuration(value);
    saveSettings('defaultDuration', value);
    setDurationModalVisible(false);
  };
  
  // Format d'affichage de l'heure
  const formatHour = (hour: number) => `${hour}:00`;
  
  // Générer les heures pour les sélecteurs
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a73e8" />
        </TouchableOpacity>
        <Text style={styles.title}>Paramètres</Text>
        <TouchableOpacity onPress={() => setAboutModalVisible(true)} style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={24} color="#1a73e8" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollContent}>
        {/* Section Affichage du calendrier */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Affichage du calendrier</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Afficher les numéros de semaine</Text>
              <Text style={styles.settingDescription}>
                Montre le numéro de la semaine dans la vue calendrier
              </Text>
            </View>
            <Switch
              trackColor={{ false: "#e0e0e0", true: "#b3d1ff" }}
              thumbColor={showWeekNumbers ? "#1a73e8" : "#ffffff"}
              ios_backgroundColor="#e0e0e0"
              onValueChange={toggleWeekNumbers}
              value={showWeekNumbers}
            />
          </View>
          
          <View style={styles.lastSettingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Premier jour de la semaine</Text>
              <Text style={styles.settingDescription}>{getWeekdayName(firstDayOfWeek)}</Text>
            </View>
            <TouchableOpacity onPress={() => setWeekdayModalVisible(true)}>
              <Text style={styles.changeButton}>Modifier</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Section Paramètres des évènements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Évènements</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Heure de début par défaut</Text>
              <Text style={styles.settingDescription}>{formatHour(defaultStartHour)}</Text>
            </View>
            <TouchableOpacity onPress={() => setStartHourModalVisible(true)}>
              <Text style={styles.changeButton}>Modifier</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.lastSettingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Durée par défaut</Text>
              <Text style={styles.settingDescription}>{formatDuration(defaultDuration)}</Text>
            </View>
            <TouchableOpacity onPress={() => setDurationModalVisible(true)}>
              <Text style={styles.changeButton}>Modifier</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {/* Modal pour le premier jour de la semaine */}
      <Modal
        visible={weekdayModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setWeekdayModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Premier jour de la semaine</Text>
            
            {weekdayOptions.map((option) => (
              <TouchableOpacity 
                key={option.value} 
                style={[
                  styles.modalOption,
                  firstDayOfWeek === option.value && styles.selectedOption
                ]}
                onPress={() => selectFirstDayOfWeek(option.value)}
              >
                <Text style={[
                  styles.modalOptionText,
                  firstDayOfWeek === option.value && styles.selectedOptionText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setWeekdayModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Modal pour l'heure de début */}
      <Modal
        visible={startHourModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStartHourModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Heure de début par défaut</Text>
            
            <ScrollView style={styles.modalScroll}>
              {hours.map((hour) => (
                <TouchableOpacity 
                  key={hour} 
                  style={[
                    styles.modalOption,
                    defaultStartHour === hour && styles.selectedOption
                  ]}
                  onPress={() => selectStartHour(hour)}
                >
                  <Text style={[
                    styles.modalOptionText,
                    defaultStartHour === hour && styles.selectedOptionText
                  ]}>
                    {formatHour(hour)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setStartHourModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal pour la durée par défaut */}
      <Modal
        visible={durationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDurationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Durée par défaut</Text>
            
            <ScrollView style={styles.modalScroll}>
              {[15, 30, 45, 60, 90, 120, 180, 240].map((duration) => (
                <TouchableOpacity 
                  key={`duration-${duration}`} 
                  style={[
                    styles.modalOption,
                    defaultDuration === duration && styles.selectedOption
                  ]}
                  onPress={() => selectDefaultDuration(duration)}
                >
                  <Text style={[
                    styles.modalOptionText,
                    defaultDuration === duration && styles.selectedOptionText
                  ]}>
                    {formatDuration(duration)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setDurationModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal pour les informations "À propos" */}
      <Modal
        visible={aboutModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.aboutModalContent}>
            <Text style={styles.modalTitle}>À propos</Text>
            
            <View style={styles.aboutContent}>
              <Text style={styles.aboutText}>Version 1.6.9</Text>
              <Text style={styles.aboutText}>© 2025 Mini-Projet Agenda SRT4</Text>
              <Text style={styles.aboutText}>Auteurs : Quentin ALT & Antoine LEBARBEY</Text>
              <Text style={styles.aboutDescription}>
                Application développée dans le cadre du cours de développement d'applications mobiles.
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setAboutModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  infoButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2d4150',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastSettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0,
  },
  settingLabelContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#2d4150',
  },
  settingDescription: {
    fontSize: 14,
    color: '#5f6368',
    marginTop: 4,
  },
  changeButton: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
    padding: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 4,
  },
  
  // Styles pour les modales
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  aboutModalContent: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2d4150',
  },
  modalScroll: {
    width: '100%',
    maxHeight: 300,
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    width: '100%',
  },
  selectedOption: {
    backgroundColor: '#e8f0fe',
  },
  disabledOption: {
    opacity: 0.5,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#2d4150',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#1a73e8',
    fontWeight: 'bold',
  },
  disabledOptionText: {
    color: '#ccc',
  },
  modalCancelButton: {
    marginTop: 20,
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#e53935',
    fontSize: 16,
    fontWeight: '500',
  },
  aboutContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#5f6368',
    textAlign: 'center',
    marginTop: 10,
  },
  modalCloseButton: {
    marginTop: 20,
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#1a73e8',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ParamsScreen;
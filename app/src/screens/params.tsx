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
  Platform
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
  const [defaultEndHour, setDefaultEndHour] = useState(10);
  
  // États pour les modales
  const [weekdayModalVisible, setWeekdayModalVisible] = useState(false);
  const [startHourModalVisible, setStartHourModalVisible] = useState(false);
  const [endHourModalVisible, setEndHourModalVisible] = useState(false);
  
  // Charger les paramètres au démarrage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const weekNumbers = await AsyncStorage.getItem('showWeekNumbers');
        const firstDay = await AsyncStorage.getItem('firstDayOfWeek');
        const startHour = await AsyncStorage.getItem('defaultStartHour');
        const endHour = await AsyncStorage.getItem('defaultEndHour');
        
        if (weekNumbers !== null) setShowWeekNumbers(weekNumbers === 'true');
        if (firstDay !== null) setFirstDayOfWeek(Number(firstDay));
        if (startHour !== null) setDefaultStartHour(Number(startHour));
        if (endHour !== null) setDefaultEndHour(Number(endHour));
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
  const toggleWeekNumbers = (value: boolean) => {
    setShowWeekNumbers(value);
    saveSettings('showWeekNumbers', value);
  };
  
  // Obtenir le nom du jour à partir de sa valeur
  const getWeekdayName = (value: number) => {
    const day = weekdayOptions.find(option => option.value === value);
    return day ? day.label : 'Lundi';
  };
  
  // Sélectionner un nouveau jour de la semaine
  const selectFirstDayOfWeek = (value: number) => {
    setFirstDayOfWeek(value);
    saveSettings('firstDayOfWeek', value);
    setWeekdayModalVisible(false);
  };
  
  // Sélectionner une nouvelle heure de début
  const selectStartHour = (value: number) => {
    setDefaultStartHour(value);
    saveSettings('defaultStartHour', value);
    
    // Ajuster l'heure de fin si nécessaire
    if (value >= defaultEndHour) {
      const newEndHour = Math.min(value + 1, 23);
      setDefaultEndHour(newEndHour);
      saveSettings('defaultEndHour', newEndHour);
    }
    
    setStartHourModalVisible(false);
  };
  
  // Sélectionner une nouvelle heure de fin
  const selectEndHour = (value: number) => {
    setDefaultEndHour(value);
    saveSettings('defaultEndHour', value);
    setEndHourModalVisible(false);
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
              <Text style={styles.settingLabel}>Heure de fin par défaut</Text>
              <Text style={styles.settingDescription}>{formatHour(defaultEndHour)}</Text>
            </View>
            <TouchableOpacity onPress={() => setEndHourModalVisible(true)}>
              <Text style={styles.changeButton}>Modifier</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Section À propos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <Text style={styles.aboutText}>Version 1.6.9</Text>
          <Text style={styles.aboutText}>© 2025 Mini-Projet Agenda</Text>
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
      
      {/* Modal pour l'heure de fin */}
      <Modal
        visible={endHourModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEndHourModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Heure de fin par défaut</Text>
            
            <ScrollView style={styles.modalScroll}>
              {hours.map((hour) => (
                <TouchableOpacity 
                  key={hour} 
                  style={[
                    styles.modalOption,
                    defaultEndHour === hour && styles.selectedOption,
                    hour <= defaultStartHour && styles.disabledOption
                  ]}
                  onPress={() => hour > defaultStartHour ? selectEndHour(hour) : null}
                  disabled={hour <= defaultStartHour}
                >
                  <Text style={[
                    styles.modalOptionText,
                    defaultEndHour === hour && styles.selectedOptionText,
                    hour <= defaultStartHour && styles.disabledOptionText
                  ]}>
                    {formatHour(hour)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setEndHourModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
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
});

export default ParamsScreen;
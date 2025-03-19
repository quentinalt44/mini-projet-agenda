import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
  Alert,
} from 'react-native';
import { databaseService } from '../database/DatabaseService';
import { Agenda, Timeline, WeekCalendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import DrawerItem from '../components/DrawerItem';
import CustomKnob from '../components/CustomKnob';
import EventModal from '../components/EventModal';
import EventDetailsModal from '../components/EventDetailsModal';
import ModalWrapper from '../components/ModalWrapper';
import styles from '../styles/styles';
//import { formatDate, formatTime } from '../utils/dateUtils';

// Define event categories with their colors
const EVENT_CATEGORIES = [
  { id: 'default', color: '#1a73e8', name: 'Par défaut' },
  { id: 'work', color: '#d50000', name: 'Travail' },
  { id: 'personal', color: '#33b679', name: 'Personnel' },
  { id: 'family', color: '#f6bf26', name: 'Famille' },
  { id: 'health', color: '#8e24aa', name: 'Santé' },
  { id: 'other', color: '#616161', name: 'Autre' }
];

// Configuration de la localisation en français
LocaleConfig.locales['fr'] = {
  monthNames: [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ],
  monthNamesShort: ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui"
};

// Définir le français comme langue par défaut
LocaleConfig.defaultLocale = 'fr';

interface CalendarDay {
  dateString: string;
}

interface TimelineEvent {
  id?: string;
  start: string;
  end: string;
  title: string;
  summary?: string;
  isFullDay?: boolean;
  category?: string;
}

type ViewType = 'day' | 'week' | 'month';

interface Reminder {
  id?: string | number;
  time: number;  // Valeur numérique
  unit: 'minute' | 'hour' | 'day';  // Unité de temps
}

interface Event {
  id?: string | number;
  title: string;
  summary?: string;
  start: string;
  end: string;
  isFullDay?: boolean;
  start_date?: string;
  end_date?: string;
  category?: string;
  reminders?: Reminder[];  // Ajout de la propriété reminders
}

interface EventUpdateData {
  id?: number;
  title: string;
  summary?: string;
  start_date: string;
  end_date: string;
}

interface EventData {
  title: string;
  summary?: string;
  start_date: string;
  end_date: string;
  id?: number;
}

interface AgendaItem extends Event {
  height?: number;
}

interface AgendaItems {
  [key: string]: AgendaItem[];
}

interface CalendarScreenProps {
  onSettingsPress: () => void;
}

const CalendarScreen: React.FC<CalendarScreenProps> = ({ onSettingsPress }) => {
  const calendarRef = useRef<any>(null);
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayString); // Initialisation à aujourd'hui
  const [currentMonth, setCurrentMonth] = useState(todayString.substring(0, 7));
  const todayDay = today.getDate();
  const [markedDates, setMarkedDates] = useState({
    [selectedDate]: {
      selected: true,
      selectedColor: '#1a73e8',
      marked: false
    }
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerAnimation = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const drawerWidth = screenWidth * 0.75;
  const [activeView, setActiveView] = useState<ViewType>('month');
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [newEvent, setNewEvent] = useState<Event>({
    title: '',
    summary: '',
    start: new Date().toISOString(),
    end: new Date().toISOString(),
    isFullDay: false
  });
  const [selectedStartTime, setSelectedStartTime] = useState(() => {
    const now = new Date();
    now.setHours(9, 0, 0, 0); // 9:00 par défaut
    return now;
  });

  const [selectedEndTime, setSelectedEndTime] = useState(() => {
    const now = new Date();
    now.setHours(10, 0, 0, 0); // 10:00 par défaut
    return now;
  });
  const [selectedEventDate, setSelectedEventDate] = useState(new Date());
  const [currentPicker, setCurrentPicker] = useState<{
    show: boolean;
    mode: 'date' | 'time';
    current: 'start_date' | 'start_time' | 'end_date' | 'end_time';
  }>({
    show: false,
    mode: 'date',
    current: 'start_date'
  });

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [modalKey, setModalKey] = useState(Date.now());

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const dbEvents = await databaseService.getEvents();
      if (Array.isArray(dbEvents)) {
        const formattedEvents = dbEvents.map(event => ({
          id: event.id?.toString(), // Convert number to string
          start: event.start_date,
          end: event.end_date,
          title: event.title,
          summary: event.summary,
          isFullDay: event.isFullDay,
          category: event.category // Ajouter cette ligne manquante
        }));
        setEvents(formattedEvents);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    }
  };

  // Modifiez la méthode handleAddNewEvent pour utiliser des dates UTC stables pour les événements journée entière

  const handleAddNewEvent = async () => {
    if (!isValidEventTimes()) {
      Alert.alert(
        "Erreur",
        "La date et l'heure de fin doivent être postérieures à la date et l'heure de début",
        [{ text: "OK" }]
      );
      return;
    }
  
    let startDateISO, endDateISO;
    
    if (newEvent.isFullDay) {
      // Pour les événements journée entière, on utilise une approche différente
      // qui ignore complètement le fuseau horaire
      
      // Récupérer les dates de début et de fin
      const startDate = new Date(selectedStartTime);
      const endDate = new Date(selectedEndTime);
      
      // Extraire les composants de date pour les manipuler directement en tant que chaînes
      const startYear = startDate.getFullYear();
      const startMonth = (startDate.getMonth() + 1).toString().padStart(2, '0');
      const startDay = startDate.getDate().toString().padStart(2, '0');
      
      const endYear = endDate.getFullYear();
      const endMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');
      const endDay = endDate.getDate().toString().padStart(2, '0');
      
      // Création de chaînes ISO SANS conversion de fuseau horaire
      // Format: YYYY-MM-DDT00:00:00
      startDateISO = `${startYear}-${startMonth}-${startDay}T00:00:00`;
      endDateISO = `${endYear}-${endMonth}-${endDay}T23:59:00`;
      
      console.log(`Creating multi-day event from ${startDay}/${startMonth}/${startYear} to ${endDay}/${endMonth}/${endYear}`);
      console.log(`Start ISO: ${startDateISO}`);
      console.log(`End ISO: ${endDateISO}`);
    } else {
      // Pour les événements normaux, utiliser l'heure sélectionnée
      startDateISO = selectedStartTime.toISOString();
      endDateISO = selectedEndTime.toISOString();
    }
  
    const eventData = {
      title: newEvent.title,
      summary: newEvent.summary,
      start_date: startDateISO,
      end_date: endDateISO,
      isFullDay: newEvent.isFullDay,
      category: newEvent.category || 'default', // Assurez-vous que la catégorie est envoyée
      reminders: newEvent.reminders || [] // Ajoutez cette ligne
    };
  
    console.log(`Adding event with full day: ${newEvent.isFullDay}, category: ${newEvent.category || 'default'}`);
  
    try {
      if (newEvent.id) {
        await databaseService.updateEvent(newEvent.id.toString(), {
          title: eventData.title,
          summary: eventData.summary,
          start: eventData.start_date,
          end: eventData.end_date,
          isFullDay: eventData.isFullDay,
          category: eventData.category // Ajouter cette ligne
        });
        console.log("✅ Event updated successfully");
      } else {
        await databaseService.addEvent(eventData);
        console.log("✅ Event added successfully");
      }
  
      // Fermer la modal avant le rafraîchissement
      setIsModalVisible(false);
      setNewEvent({
        title: '',
        summary: '',
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        isFullDay: false
      });
      
      // Utiliser la nouvelle fonction de rafraîchissement
      await forceCalendarRefresh();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handlePickerChange = (event: any, selectedDate?: Date) => {
    if (!selectedDate) return;
    
    const currentDate = selectedDate || new Date();
    setCurrentPicker({ ...currentPicker, show: Platform.OS === 'ios' });
  
    if (currentPicker.current?.startsWith('start')) {
      // Si on modifie la date ou l'heure de début
      const newStartTime = new Date(selectedStartTime);
      
      if (currentPicker.current === 'start_date') {
        // Si on modifie la date uniquement, garder l'heure actuelle
        newStartTime.setFullYear(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      } else {
        // Si on modifie l'heure uniquement, garder la date actuelle
        newStartTime.setHours(currentDate.getHours(), currentDate.getMinutes());
      }
      
      setSelectedStartTime(newStartTime);
      
      // Mettre à jour l'état de l'événement avec la nouvelle date/heure
      setNewEvent({
        ...newEvent,
        start: newStartTime.toISOString()
      });
    } else {
      // Si on modifie la date ou l'heure de fin
      const newEndTime = new Date(selectedEndTime);
      
      if (currentPicker.current === 'end_date') {
        newEndTime.setFullYear(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      } else {
        newEndTime.setHours(currentDate.getHours(), currentDate.getMinutes());
      }
      
      setSelectedEndTime(newEndTime);
      
      // Mettre à jour l'état de l'événement avec la nouvelle date/heure
      setNewEvent({
        ...newEvent,
        end: newEndTime.toISOString()
      });
    }
  };

  const showPicker = (type: 'date' | 'start_date' | 'start_time' | 'end_date' | 'end_time' | 'start' | 'end') => {
    const isDateType = type.includes('date') || type === 'date';
    setCurrentPicker({
      show: true,
      mode: isDateType ? 'date' : 'time',
      current: type === 'date' ? 'start_date' : 
               type === 'start' ? 'start_time' :
               type === 'end' ? 'end_time' :
               type as 'start_date' | 'start_time' | 'end_date' | 'end_time'
    });
  };

  const handleTodayPress = () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    setSelectedDate(todayString);
    setCurrentMonth(todayString.substring(0, 7));
    
    setMarkedDates({
      [todayString]: {
        selected: true,
        selectedColor: '#1a73e8',
        marked: false
      }
    });
  };

  const handleDayPress = (day: CalendarDay) => {
    setSelectedDate(day.dateString);
    setCurrentMonth(day.dateString.substring(0, 7));
    
    setMarkedDates({
      [day.dateString]: {
        selected: true,
        selectedColor: '#1a73e8',
        marked: false
      }
    });
  };

  const toggleDrawer = () => {
    const toValue = isDrawerOpen ? 0 : 1;
    Animated.timing(drawerAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsDrawerOpen(!isDrawerOpen);
  };

  const translateX = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerWidth, 0],
  });

  const overlayOpacity = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const theme = {
    backgroundColor: '#ffffff',
    calendarBackground: '#ffffff',
    textSectionTitleColor: '#b6c1cd',
    selectedDayBackgroundColor: '#1a73e8',
    selectedDayTextColor: '#ffffff',
    todayBackgroundColor: 'transparent', // Ajoutez cette ligne
    todayTextColor: '#1a73e8',
    dayTextColor: '#2d4150',
    textDisabledColor: '#d9e1e8',
    dotColor: 'transparent',
    selectedDotColor: 'transparent',
    arrowColor: '#1a73e8',
    monthTextColor: '#2d4150',
    textDayFontSize: 16,
    textMonthFontSize: 16,
  };

  // Using the state variable instead of creating a new constant

  // Modifiez également la méthode loadItemsForMonth
  const loadItemsForMonth = (day: CalendarDay) => {
    const items: AgendaItems = {};
    
    events.forEach(event => {
      try {
        if (event.isFullDay) {
          // Pour les événements journée entière, traiter uniquement les parties date
          // sans créer d'objets Date qui causeraient des conversions de fuseau horaire
          
          // Pour start et end, prenez seulement la partie date (avant le T)
          const startDateParts = event.start.split('T')[0].split('-');
          const endDateParts = event.end.split('T')[0].split('-');
          
          // Créer des dates locales sans heures pour itérer
          const startYear = parseInt(startDateParts[0]);
          const startMonth = parseInt(startDateParts[1]) - 1; // Mois en JS commence à 0
          const startDay = parseInt(startDateParts[2]);
          
          const endYear = parseInt(endDateParts[0]);
          const endMonth = parseInt(endDateParts[1]) - 1;
          const endDay = parseInt(endDateParts[2]);
          
          const startDate = new Date(startYear, startMonth, startDay);
          const endDate = new Date(endYear, endMonth, endDay);
          
          // Créer une date pour itérer sur tous les jours
          const currentDate = new Date(startDate);
          
          // Boucler sur chaque jour entre début et fin
          while (currentDate <= endDate) {
            const year = currentDate.getFullYear();
            const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const day = currentDate.getDate().toString().padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            
            if (!items[dateKey]) {
              items[dateKey] = [];
            }
            
            items[dateKey].push({
              id: event.id,
              title: event.title,
              height: 50,
              summary: event.summary,
              start: event.start,
              end: event.end,
              isFullDay: event.isFullDay,
              category: event.category // Ajouter la catégorie
            });
            
            // Passer au jour suivant
            currentDate.setDate(currentDate.getDate() + 1);
          }
        } else {
          // Pour les événements réguliers, utiliser le code existant
          const startDate = new Date(event.start);
          const endDate = new Date(event.end);
          
          // Si l'événement s'étend sur plusieurs jours, l'ajouter à tous les jours concernés
          const currentDate = new Date(startDate);
          currentDate.setHours(0, 0, 0, 0); // Début de la journée
          
          const lastDay = new Date(endDate);
          lastDay.setHours(23, 59, 59, 999); // Fin de la journée
          
          while (currentDate <= lastDay) {
            // Utiliser une méthode qui évite les problèmes de fuseau horaire
            const year = currentDate.getFullYear();
            const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const day = currentDate.getDate().toString().padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            
            if (!items[dateString]) {
              items[dateString] = [];
            }
            
            items[dateString].push({
              id: event.id,
              title: event.title,
              height: 50,
              summary: event.summary,
              start: event.start,
              end: event.end,
              isFullDay: event.isFullDay,
              category: event.category  // Ajout de cette ligne qui manquait
            });
            
            // Passer au jour suivant
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      } catch (error) {
        console.error("Error processing event:", error, event);
      }
    });
    
    if (!items[day.dateString]) {
      items[day.dateString] = [];
    }
    
    return items;
  };

  const renderCalendar = () => {
    switch (activeView) {
      case 'day':
        return (
          <Timeline
            events={events}
            showNowIndicator
            scrollToFirst
            //style={{ flex: 1 }}
            timelineLeftInset={50}
          />
        );

      case 'month':
      default:
        return (
          <Agenda
            ref={calendarRef}
            items={loadItemsForMonth({ dateString: selectedDate })}
            selected={selectedDate}
            renderEmptyDate={() => (
              <View style={styles.emptyDate}>
                <Text>Pas d'événement</Text>
              </View>
            )}
            renderEmptyData={() => (
              <View style={styles.emptyDate}>
                <Text>Pas d'événement pour ce jour</Text>
              </View>
            )}
            rowHasChanged={(r1: AgendaItem, r2: AgendaItem) => {
              // Comparer à la fois le titre et la catégorie pour détecter les changements
              return r1.title !== r2.title || r1.category !== r2.category;
            }}
            renderItem={(item: AgendaItem) => {
              // Log de débogage pour voir la catégorie et la couleur utilisée
              console.log(`Renderisation de l'item ${item.title}, catégorie: ${item.category}, fullDay: ${item.isFullDay}`);
              
              const category = EVENT_CATEGORIES.find(cat => cat.id === (item.category || 'default'));
              const categoryColor = category?.color || '#1a73e8';
              
              // Générer le badge pour les événements
              let badge = null;
              
              if (item.isFullDay) {
                // Badge pour les événements journée entière
                try {
                  const startDate = new Date(item.start.split('T')[0]);
                  const endDate = new Date(item.end.split('T')[0]);
                  const currentDate = new Date(selectedDate);
                  
                  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  const currentDayNumber = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  
                  badge = `Jour ${currentDayNumber}/${totalDays}`;
                } catch (error) {
                  console.error("Erreur lors du calcul du badge de jour:", error);
                }
              } else {
                // Badge pour les événements classiques
                try {
                  const startDate = new Date(item.start);
                  const endDate = new Date(item.end);
                  const currentDate = new Date(selectedDate);
                  
                  // Vérifier si l'événement s'étend sur plusieurs jours
                  const startDay = new Date(startDate);
                  startDay.setHours(0, 0, 0, 0);
                  
                  const endDay = new Date(endDate);
                  endDay.setHours(0, 0, 0, 0);
                  
                  const currentDay = new Date(currentDate);
                  currentDay.setHours(0, 0, 0, 0);
                  
                  const isMultiDayEvent = startDay.getTime() !== endDay.getTime();
                  
                  if (isMultiDayEvent) {
                    // C'est un événement sur plusieurs jours
                    
                    // Formatter les heures au format 24h: HH:MM
                    const startHour = startDate.getHours().toString().padStart(2, '0');
                    const startMin = startDate.getMinutes().toString().padStart(2, '0');
                    const endHour = endDate.getHours().toString().padStart(2, '0');
                    const endMin = endDate.getMinutes().toString().padStart(2, '0');
                    
                    if (currentDay.getTime() === startDay.getTime()) {
                      // Premier jour de l'événement
                      badge = `Début ${startHour}:${startMin} →`;
                    } else if (currentDay.getTime() === endDay.getTime()) {
                      // Dernier jour de l'événement
                      badge = `→ Fin ${endHour}:${endMin}`;
                    } else {
                      // Jour intermédiaire
                      badge = `Jour intermédiaire`;
                    }
                  } else {
                    // Événement classique d'un jour
                    const startHour = startDate.getHours().toString().padStart(2, '0');
                    const startMin = startDate.getMinutes().toString().padStart(2, '0');
                    const endHour = endDate.getHours().toString().padStart(2, '0');
                    const endMin = endDate.getMinutes().toString().padStart(2, '0');
                    
                    badge = `${startHour}:${startMin} - ${endHour}:${endMin}`;
                  }
                } catch (error) {
                  console.error("Erreur lors de la formation des heures:", error);
                }
              }
              
              // Style différent selon que l'événement est sur la journée entière ou non
              const itemStyle = item.isFullDay 
                ? [
                    styles.agendaItem, 
                    { 
                      backgroundColor: categoryColor,
                      borderLeftWidth: 0 // Pas besoin de bordure si tout est coloré
                    }
                  ] 
                : [
                    styles.agendaItem,
                    { 
                      borderLeftWidth: 4, 
                      borderLeftColor: categoryColor 
                    }
                  ];
              
              // Style de texte différent pour les événements journée entière
              const titleStyle = item.isFullDay
                ? [styles.agendaItemTitle, { color: '#ffffff', fontWeight: 'bold' as const }]
                : styles.agendaItemTitle;
              
              const summaryStyle = item.isFullDay
                ? [styles.agendaItemSummary, { color: '#ffffff', opacity: 0.9 }]
                : styles.agendaItemSummary;
              
              // Style du badge différent selon le type d'événement
              const badgeStyle = item.isFullDay
                ? {
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 10,
                    marginLeft: 8,
                    alignSelf: 'flex-start' as 'flex-start'
                  }
                : {
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    backgroundColor: '#f1f3f4',
                    borderRadius: 10,
                    marginLeft: 8,
                    alignSelf: 'flex-start' as 'flex-start'
                  };
              
              const badgeTextStyle = item.isFullDay
                ? {
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: 'bold' as 'bold'
                  }
                : {
                    color: '#5f6368',
                    fontSize: 10,
                    fontWeight: 'bold' as 'bold'
                  };
              
              return (
                <TouchableOpacity 
                  style={itemStyle}
                  onPress={() => handleEventPress(item)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={titleStyle}>{item.title}</Text>
                    {badge && (
                      <View style={badgeStyle}>
                        <Text style={badgeTextStyle}>{badge}</Text>
                      </View>
                    )}
                  </View>
                  {item.summary && (
                    <Text style={summaryStyle}>{item.summary}</Text>
                  )}
                </TouchableOpacity>
              );
            }}
            theme={{
              ...theme, // Gardez les thèmes existants
              agendaDayTextColor: '#2d4150',
              agendaDayNumColor: '#2d4150',
              agendaTodayColor: '#1a73e8',
              selectedDayBackgroundColor: '#1a73e8',
              selectedDayTextColor: '#ffffff',
              dotColor: '#1a73e8',
              selectedDotColor: '#ffffff',
              todayBackgroundColor: 'transparent',
              todayTextColor: '#1a73e8'
            }}
            showClosingKnob={true}
            renderKnob={() => <CustomKnob />}
            enableSwipeMonths={true}
            markedDates={markedDates}
            pastScrollRange={12}
            futureScrollRange={12}
            showOnlySelectedDayItems={true}
            hideExtraDays={false}
            onDayPress={handleDayPress}
            current={selectedDate}
            firstDay={1}
            />
        );
    }
  };

  const handleFabPress = () => {
    const selectedDateObj = new Date(selectedDate);
    setSelectedEventDate(selectedDateObj);
    
    // Update times while keeping previously selected hours
    const newStartTime = new Date(selectedDateObj);
    newStartTime.setHours(9, 0, 0, 0);
    setSelectedStartTime(newStartTime);
  
    const newEndTime = new Date(selectedDateObj);
    newEndTime.setHours(10, 0, 0, 0);
    setSelectedEndTime(newEndTime);
  
    // Utiliser un nouvel objet complètement différent
    const freshEvent: Event = {
      id: undefined,
      title: '',
      summary: '',
      start: newStartTime.toISOString(),
      end: newEndTime.toISOString(),
      isFullDay: false,
      reminders: []
    };
    
    console.log("Creating new event with isFullDay:", freshEvent.isFullDay);
    setNewEvent(freshEvent);
    setModalMode('create');
    setModalKey(Date.now()); // Générer une nouvelle clé
    setIsModalVisible(true);
  };

  const handleEventPress = (item: AgendaItem) => {
    // Assurez-vous que l'ID est présent
    if (!item.id) {
      console.error('Event has no ID');
      return;
    }
    setSelectedEvent(item);
    setIsDetailsModalVisible(true);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || !selectedEvent.id) {
      console.error('No event selected or no event ID');
      return;
    }
    
    try {
      await databaseService.deleteEvent(Number(selectedEvent.id));
      
      // Fermer la modal de détails
      setIsDetailsModalVisible(false);
      
      // Utiliser la nouvelle fonction de rafraîchissement
      await forceCalendarRefresh();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // Remplacez complètement la fonction handleEditEvent par cette version
const handleEditEvent = () => {
  if (!selectedEvent) return;
  
  // Préparer les dates
  let startTime = new Date(selectedEvent.start);
  let endTime = new Date(selectedEvent.end);
  
  // Mettre à jour les sélecteurs de temps
  setSelectedStartTime(startTime);
  setSelectedEndTime(endTime);
  
  // Préparer l'événement pour l'édition
  const eventToEdit = {
    id: selectedEvent.id,
    title: selectedEvent.title || '',
    summary: selectedEvent.summary || '',
    start: selectedEvent.start,
    end: selectedEvent.end,
    isFullDay: selectedEvent.isFullDay || false,
    category: selectedEvent.category || 'default'
  };
  
  // Mettre à jour l'état newEvent
  setNewEvent(eventToEdit);
  
  // Changer le mode du modal
  setModalMode('edit');
  
  // Générer une nouvelle clé pour forcer le rendu du modal
  setModalKey(Date.now());
  
  // Fermer le modal de détails et ouvrir le modal d'édition
  setIsDetailsModalVisible(false);
  setIsModalVisible(true);
};

  const isValidEventTimes = () => {
    return selectedEndTime > selectedStartTime;
  };

  // Ajoutez cette nouvelle fonction dans votre composant CalendarScreen
  const forceCalendarRefresh = async () => {
    // 1. D'abord recharger les données
    await loadEvents();
    
    // 2. Créer une nouvelle référence de la chaîne de date
    const currentDate = selectedDate;
    
    // 3. Utiliser plusieurs techniques combinées pour forcer le rafraîchissement
    setTimeout(() => {
      try {
        // Technique 1: Mettre à jour directement les items via la référence
        if (calendarRef.current && calendarRef.current.updateItems) {
          const items = loadItemsForMonth({ dateString: currentDate });
          calendarRef.current.updateItems(items);
        }
        
        // Technique 2: Changer temporairement de date puis revenir
        const tempDate = new Date(currentDate);
        tempDate.setDate(tempDate.getDate() + 1);
        const nextDay = tempDate.toISOString().split('T')[0];
        
        setSelectedDate(nextDay);
        
        // Technique 3: Revenir à la date d'origine après un court délai
        setTimeout(() => {
          setSelectedDate(currentDate);
          
          // Technique 4: Mettre à jour les dates marquées
          setMarkedDates({
            [currentDate]: {
              selected: true,
              selectedColor: '#1a73e8',
              marked: false
            }
          });
        }, 50);
      } catch (error) {
        console.error("Erreur pendant le rafraîchissement du calendrier:", error);
      }
    }, 100);
  };

  return (
    <View style={styles.container}>
      {/* Drawer */}
      <Animated.View style={[
        styles.drawer,
        {
          transform: [{ translateX }],
          width: drawerWidth,
        }
      ]}>
        <View style={styles.drawerTitle}>
          <View style={styles.googleText}>
            <Text style={[styles.googleLetter, { color: '#4285F4' }]}>G</Text>
            <Text style={[styles.googleLetter, { color: '#EA4335' }]}>o</Text>
            <Text style={[styles.googleLetter, { color: '#FBBC05' }]}>g</Text>
            <Text style={[styles.googleLetter, { color: '#4285F4' }]}>o</Text>
            <Text style={[styles.googleLetter, { color: '#34A853' }]}>l</Text>
            <Text style={[styles.googleLetter, { color: '#EA4335' }]}>e</Text>
          </View>
          <Text style={styles.calendarText}> Calendar</Text>
        </View>
        <View>
          <DrawerItem
            icon="calendar-outline"
            label="Day"
            isActive={activeView === 'day'}
            onPress={() => {
              setActiveView('day');
              toggleDrawer();
            }}
          />
          <DrawerItem
            icon="calendar-outline"
            label="Week"
            isActive={activeView === 'week'}
            onPress={() => {
              setActiveView('week');
              toggleDrawer();
            }}
          />
          <DrawerItem
            icon="grid-outline"
            label="Month"
            isActive={activeView === 'month'}
            onPress={() => {
              setActiveView('month');
              toggleDrawer();
            }}
          />
        </View>
      </Animated.View>

      {/* Overlay avec animation */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
            pointerEvents: isDrawerOpen ? 'auto' : 'none',
          }
        ]}
      >
        <TouchableWithoutFeedback onPress={toggleDrawer}>
          <View style={styles.overlayTouchable} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={toggleDrawer}
          >
            <Ionicons name="menu-outline" size={30} color="#5f6368" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.todayButton} onPress={handleTodayPress}>
            <Text style={styles.todayButtonText}>{todayDay}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton} onPress={onSettingsPress}>
            <Ionicons name="settings-outline" size={24} color="#5f6368" />
          </TouchableOpacity>
        </View>
      </View>
      {renderCalendar()}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleFabPress}
      >
        <Ionicons name="add" size={30} color="#ffffff" />
      </TouchableOpacity>

      {/* Modal principal */}
      <ModalWrapper
        key={`modal-${modalMode}-${isModalVisible ? 1 : 0}-${modalKey}`} // Utilise modalKey de state
        isVisible={isModalVisible}
        mode={modalMode}
        modalMode={modalMode} // Add the required modalMode prop
        newEvent={{...newEvent, isFullDay: newEvent.isFullDay || false, summary: newEvent.summary || ''}} // Ensure isFullDay is always boolean and summary is always a string
        setNewEvent={setNewEvent}
        handleAddNewEvent={handleAddNewEvent}
        setIsModalVisible={setIsModalVisible}
        selectedStartTime={selectedStartTime}
        selectedEndTime={selectedEndTime}
        setSelectedStartTime={setSelectedStartTime}
        setSelectedEndTime={setSelectedEndTime}
        selectedEventDate={selectedEventDate}
        showPicker={showPicker}
        currentPicker={currentPicker}
        handlePickerChange={handlePickerChange}
        setCurrentPicker={setCurrentPicker}
        // Ajoutez ces props manquantes
        reminders={(newEvent.reminders || []).map(reminder => ({
          ...reminder,
          id: reminder.id !== undefined ? reminder.id : Date.now().toString()
        }))}
        onUpdateReminders={(updatedReminders) => {
          setNewEvent({
            ...newEvent,
            reminders: updatedReminders
          });
        }}
      />

      {/* Modal de détails */}
      <EventDetailsModal
        isVisible={isDetailsModalVisible}
        event={{
          id: selectedEvent?.id?.toString(), // Convert ID to string
          title: selectedEvent?.title || '',
          summary: selectedEvent?.summary,
          start: selectedEvent?.start || new Date().toISOString(),
          end: selectedEvent?.end || new Date().toISOString(),
          isFullDay: selectedEvent?.isFullDay,
          category: selectedEvent?.category // Ajouter cette ligne
        }}
        onClose={() => setIsDetailsModalVisible(false)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />
    </View>
  );
};

export default CalendarScreen;

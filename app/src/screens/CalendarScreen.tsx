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
import { Agenda, Timeline, WeekCalendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import DrawerItem from '../components/DrawerItem';
import CustomKnob from '../components/CustomKnob';
import EventModal from '../components/EventModal';
import EventDetailsModal from '../components/EventDetailsModal';
import styles from '../styles/styles';
//import { formatDate, formatTime } from '../utils/dateUtils';

interface CalendarDay {
  dateString: string;
}

interface TimelineEvent {
  id?: string;
  start: string;
  end: string;
  title: string;
  summary?: string;
}

type ViewType = 'day' | 'week' | 'month';

interface Event {
  id?: string | number;
  title: string;
  summary?: string;
  start: string;
  end: string;
  isFullDay?: boolean;
  start_date?: string;
  end_date?: string;
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
const CalendarScreen = () => {
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
          summary: event.summary
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

  const handleAddNewEvent = async () => {
    if (!isValidEventTimes()) {
      Alert.alert(
        "Erreur",
        "La date et l'heure de fin doivent être postérieures à la date et l'heure de début",
        [{ text: "OK" }]
      );
      return;
    }
  
    const eventData = {
      title: newEvent.title,
      summary: newEvent.summary,
      start_date: selectedStartTime.toISOString(),
      end_date: selectedEndTime.toISOString(),
      isFullDay: newEvent.isFullDay
    };
  
    try {
      if (newEvent.id) {
        await databaseService.updateEvent(newEvent.id.toString(), {
          title: eventData.title,
          summary: eventData.summary,
          start: eventData.start_date,
          end: eventData.end_date,
          isFullDay: eventData.isFullDay
        });
      } else {
        await databaseService.addEvent(eventData);
      }
  
      await loadEvents();
      setIsModalVisible(false);
      setNewEvent({
        title: '',
        summary: '',
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        isFullDay: false
      });
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };
  

  const handlePickerChange = (event: any, selected?: Date) => {
    if (!selected) return;
  
    switch (currentPicker.current) {
      case 'start_date':
        const newStartDate = new Date(selectedStartTime);
        newStartDate.setFullYear(selected.getFullYear());
        newStartDate.setMonth(selected.getMonth());
        newStartDate.setDate(selected.getDate());
        setSelectedStartTime(newStartDate);
        break;
      case 'start_time':
        const startWithNewTime = new Date(selectedStartTime);
        startWithNewTime.setHours(selected.getHours());
        startWithNewTime.setMinutes(selected.getMinutes());
        setSelectedStartTime(startWithNewTime);
        break;
      case 'end_date':
        const newEndDate = new Date(selectedEndTime);
        newEndDate.setFullYear(selected.getFullYear());
        newEndDate.setMonth(selected.getMonth());
        newEndDate.setDate(selected.getDate());
        setSelectedEndTime(newEndDate);
        break;
      case 'end_time':
        const endWithNewTime = new Date(selectedEndTime);
        endWithNewTime.setHours(selected.getHours());
        endWithNewTime.setMinutes(selected.getMinutes());
        setSelectedEndTime(endWithNewTime);
        break;
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

  const loadItemsForMonth = (day: CalendarDay) => {
    const items: AgendaItems = {};
    
    events.forEach(event => {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      // Loop through all days between start and end date
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        
        if (!items[dateString]) {
          items[dateString] = [];
        }
        
        items[dateString].push({
          id: event.id,
          title: event.title,
          height: 50,
          summary: event.summary,
          start: event.start,
          end: event.end
        });
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
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
              return r1.title !== r2.title;
            }}
            renderItem={(item: AgendaItem) => (
              <TouchableOpacity 
                style={styles.agendaItem}
                onPress={() => handleEventPress(item)}
              >
                <Text style={styles.agendaItemTitle}>{item.title}</Text>
                {item.summary && (
                  <Text style={styles.agendaItemSummary}>{item.summary}</Text>
                )}
              </TouchableOpacity>
            )}
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
    newStartTime.setHours(
      selectedStartTime.getHours(),
      selectedStartTime.getMinutes(),
      0,
      0
    );
    setSelectedStartTime(newStartTime);
  
    const newEndTime = new Date(selectedDateObj);
    newEndTime.setHours(
      selectedEndTime.getHours(),
      selectedEndTime.getMinutes(),
      0,
      0
    );
    setSelectedEndTime(newEndTime);
  
    setModalMode('create'); // Set mode to create
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
      await loadEvents();
      setIsDetailsModalVisible(false);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleEditEvent = () => {
    if (!selectedEvent) return;
  
    const startDate = new Date(selectedEvent.start);
    const endDate = new Date(selectedEvent.end);
  
    setSelectedEventDate(startDate);
    setSelectedStartTime(startDate);
    setSelectedEndTime(endDate);
    setNewEvent({
      id: selectedEvent.id,
      title: selectedEvent.title,
      summary: selectedEvent.summary || '',
      start: selectedEvent.start,
      end: selectedEvent.end
    });
  
    setModalMode('edit'); // Set mode to edit
    setIsDetailsModalVisible(false);
    setIsModalVisible(true);
  };

  const isValidEventTimes = () => {
    return selectedEndTime > selectedStartTime;
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
          <TouchableOpacity style={styles.settingsButton}>
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
      <EventModal
        isVisible={isModalVisible}
        mode={modalMode} // Use modalMode instead of checking newEvent.id
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        handleAddNewEvent={handleAddNewEvent}
        setIsModalVisible={setIsModalVisible}
        selectedStartTime={selectedStartTime}
        selectedEndTime={selectedEndTime}
        selectedEventDate={selectedEventDate}
        showPicker={showPicker}
        currentPicker={currentPicker}
        handlePickerChange={handlePickerChange}
        setCurrentPicker={setCurrentPicker}
      />

      {/* Modal de détails */}
      <EventDetailsModal
        isVisible={isDetailsModalVisible}
        event={{
          id: selectedEvent?.id?.toString(), // Convert ID to string
          title: selectedEvent?.title || '',
          summary: selectedEvent?.summary,
          start: selectedEvent?.start || new Date().toISOString(),
          end: selectedEvent?.end || new Date().toISOString()
        }}
        onClose={() => setIsDetailsModalVisible(false)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />
    </View>
  );
};

export default CalendarScreen;

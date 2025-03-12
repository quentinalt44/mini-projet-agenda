import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { databaseService } from '../database/DatabaseService';
import { Agenda, Timeline, WeekCalendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import DrawerItem from '../components/DrawerItem';
import CustomKnob from '../components/CustomKnob';
import EventModal from '../components/EventModal';
import styles from '../styles/styles';
//import { formatDate, formatTime } from '../utils/dateUtils';

interface CalendarDay {
  dateString: string;
}

interface TimelineEvent {
  start: string;
  end: string;
  title: string;
  summary?: string;
}

type ViewType = 'day' | 'week' | 'month';

interface AgendaItem {
  id?: number;
  name: string;
  height: number;
  summary?: string;
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
  const [newEvent, setNewEvent] = useState({
    title: '',
    summary: '',
    start: new Date().toISOString(),
    end: new Date().toISOString()
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
    current: 'date' | 'start' | 'end';
  }>({
    show: false,
    mode: 'date',
    current: 'date'
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const dbEvents = await databaseService.getEvents();
      if (Array.isArray(dbEvents)) {
        const formattedEvents = dbEvents.map(event => ({
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
    const startDateTime = new Date(selectedEventDate);
    startDateTime.setHours(selectedStartTime.getHours(), selectedStartTime.getMinutes());

    const endDateTime = new Date(selectedEventDate);
    endDateTime.setHours(selectedEndTime.getHours(), selectedEndTime.getMinutes());

    const newTimelineEvent = {
      title: newEvent.title,
      summary: newEvent.summary,
      start_date: startDateTime.toISOString(),
      end_date: endDateTime.toISOString()
    };

    try {
      await databaseService.addEvent(newTimelineEvent);
      await loadEvents();
      setIsModalVisible(false);
      setNewEvent({ title: '', summary: '', start: new Date().toISOString(), end: new Date().toISOString() });
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handlePickerChange = (event: any, selected?: Date) => {
    if (!selected) return;
  
    switch (currentPicker.current) {
      case 'date':
        setSelectedEventDate(selected);
        break;
      case 'start':
        setSelectedStartTime(selected);
        if (selectedEndTime < selected) {
          const newEndTime = new Date(selected);
          newEndTime.setHours(selected.getHours() + 1);
          setSelectedEndTime(newEndTime);
        }
        break;
      case 'end':
        setSelectedEndTime(selected);
        break;
    }
  };

  const showPicker = (type: 'date' | 'start' | 'end') => {
    setCurrentPicker({
      show: true,
      mode: type === 'date' ? 'date' : 'time',
      current: type
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
      const eventDate = event.start.split('T')[0];
      if (!items[eventDate]) {
        items[eventDate] = [];
      }
      items[eventDate].push({
        name: event.title,
        height: 50,
        summary: event.summary
      });
    });

    // Si aucun événement n'existe pour le jour sélectionné, on renvoie un objet vide
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
              return r1.name !== r2.name;
            }}
            renderItem={(item: AgendaItem) => (
              <TouchableOpacity 
                style={styles.agendaItem}
                onPress={() => {/* gérer le tap sur l'événement */}}
              >
                <Text style={styles.agendaItemTitle}>{item.name}</Text>
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

    setIsModalVisible(true);
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
    </View>
  );
};

export default CalendarScreen;

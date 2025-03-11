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
import * as SQLite from 'expo-sqlite';
import { Agenda, Timeline, WeekCalendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import DrawerItem from '../components/DrawerItem';
import CustomKnob from '../components/CustomKnob';
import EventModal from '../components/EventModal';
import styles from '../styles/styles';
import { formatDate, formatTime } from '../utils/dateUtils';

interface MonthChangeData {
  year: number;
  month: number;
}

interface CalendarDay {
  dateString: string;
}

interface TimelineEvent {
  start: string;
  end: string;
  title: string;
  summary?: string;
}

interface DBEvent {
  id: number;
  title: string;
  summary: string | null;
  start_date: string;
  end_date: string;
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

const db = SQLite.openDatabaseSync('calendar.db');

const CalendarScreen = () => {
  const calendarRef = useRef<any>(null);
  const [selectedDate, setSelectedDate] = useState('2025-03-05');
  const [currentMonth, setCurrentMonth] = useState('2025-03');
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const todayDay = today.getDate();
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
  const [selectedStartTime, setSelectedStartTime] = useState(new Date());
  const [selectedEndTime, setSelectedEndTime] = useState(new Date());
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

  const handleAddNewEvent = () => {
    const startDateTime = new Date(selectedEventDate);
    startDateTime.setHours(selectedStartTime.getHours(), selectedStartTime.getMinutes());

    const endDateTime = new Date(selectedEventDate);
    endDateTime.setHours(selectedEndTime.getHours(), selectedEndTime.getMinutes());

    const newTimelineEvent: TimelineEvent = {
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      title: newEvent.title,
      summary: newEvent.summary
    };

    setEvents([...events, newTimelineEvent]);
    setIsModalVisible(false);
    setNewEvent({ title: '', summary: '', start: new Date().toISOString(), end: new Date().toISOString() });
  };

  const handlePickerChange = (event: any, selected?: Date) => {
    setCurrentPicker(prev => ({ ...prev, show: Platform.OS === 'ios' }));

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
    setSelectedDate(todayString);
  };

  const handleDayPress = (day: CalendarDay) => {
    setSelectedDate(day.dateString);
    setCurrentMonth(day.dateString.substring(0, 7));
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

  const markedDates = {
    [selectedDate]: {
      selected: true,
      selectedColor: '#1a73e8',
    }
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
        const agendaItems: AgendaItems = {};
        if (events.length > 0) {
          agendaItems[selectedDate] = events.map(event => ({
            name: event.title,
            height: 50,
            summary: event.summary
          }));
        } else {
          agendaItems[selectedDate] = [{
            name: 'Pas d\'événement pour ce jour',
            height: 50,
          }];
        }

        return (
          <Agenda
            style={[styles.calendar, { height: '100%' }]}
            theme={theme}
            onDayPress={handleDayPress}
            selected={selectedDate}
            current={selectedDate}
            minDate={'2024-01-01'}
            maxDate={'2030-12-31'}
            firstDay={1}
            pastScrollRange={50}
            futureScrollRange={50}
            renderEmptyData={() => (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Aucun événement</Text>
              </View>
            )}
            items={agendaItems}
            renderItem={(item: AgendaItem) => (
              <View style={{
                backgroundColor: 'white',
                flex: 1,
                padding: 10,
                marginRight: 10,
                marginTop: 17,
                borderRadius: 5
              }}>
                <Text>{item.name}</Text>
                {item.summary && (
                  <Text style={{ fontSize: 12, color: '#666' }}>{item.summary}</Text>
                )}
              </View>
            )}
            showClosingKnob={false}
            hideKnob={false}
            renderKnob={() => <CustomKnob />}
            enableSwipeMonths={true}
          />
        );
    }
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
        onPress={() => setIsModalVisible(true)}
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
      />
    </View>
  );
};

export default CalendarScreen;

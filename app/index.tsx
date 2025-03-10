import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Text, 
  Animated, 
  Dimensions, 
  TouchableWithoutFeedback 
} from 'react-native';
import { Agenda, Timeline, WeekCalendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

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

// Ajouter un type pour les vues possibles
type ViewType = 'day' | 'week' | 'month';

// Ajoutez le composant CustomKnob en haut du fichier, après les interfaces
const CustomKnob = () => (
  <View style={styles.knob} />
);

export default function Index() {
  const calendarRef = useRef<any>(null);
  const [selectedDate, setSelectedDate] = useState('2025-03-05');
  const [currentMonth, setCurrentMonth] = useState('2025-03');
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const todayDay = today.getDate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerAnimation = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const drawerWidth = screenWidth * 0.75; // 75% de la largeur de l'écran
  const [activeView, setActiveView] = useState<ViewType>('month');

  // Modifier le composant DrawerItem pour ajouter l'action onPress
  const DrawerItem = ({ 
    icon, 
    label, 
    isActive, 
    onPress 
  }: { 
    icon: keyof typeof Ionicons.glyphMap, 
    label: string, 
    isActive: boolean,
    onPress: () => void 
  }) => (
    <TouchableOpacity 
      style={[styles.drawerItem, isActive && styles.activeDrawerItem]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={isActive ? '#000' : '#5f6368'} />
      <Text style={[styles.drawerText, isActive && styles.activeDrawerText]}>{label}</Text>
    </TouchableOpacity>
  );

  const overlayOpacity = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

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
    const mockEvents: TimelineEvent[] = [
      {
        start: `${selectedDate} 09:00:00`,
        end: `${selectedDate} 10:30:00`,
        title: 'Example Event',
        summary: 'This is an example event'
      }
    ];

    switch (activeView) {
      case 'day':
        return (
          <Timeline
            events={mockEvents}
            showNowIndicator
            scrollToFirst
            style={{ flex: 1 }}
            timelineLeftInset={50}
          />
        );
      
      /*case 'week':
        return (
          <WeekCalendar
            current={selectedDate}
            onDayPress={handleDayPress}
            firstDay={1}
            theme={theme}
            style={styles.calendar}
          />
        );*/
      
      case 'month':
      default:
        interface AgendaItem {
          name: string;
          height: number;
        }

        interface AgendaItems {
          [key: string]: AgendaItem[];
        }

        const agendaItems: AgendaItems = {};
        agendaItems[selectedDate] = [{
          name: 'Pas d\'événement pour ce jour',
          height: 50,
        }];

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
            // Ajouter pointerEvents pour désactiver les interactions quand fermé
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  todayButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    borderRadius: 4,
    borderColor: '#1a73e8',
    borderWidth: 2,
  },
  settingsButton: {
    padding: 8,
  },
  menuButton: {
    padding: 8,
  },
  todayButtonText: {
    color: '#1a73e8',
    fontSize: 20,
    fontWeight: 'bold',
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 5,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    zIndex: 2,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    paddingRight: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1,
  },
  overlayTouchable: {
    flex: 1,
  },
  drawerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  googleText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleLetter: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  drawerItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 16,
  gap: 12, // Espacement entre icône et texte
  },
  activeDrawerItem: {
    backgroundColor: '#E3F2FD', // Bleu clair pour l'élément actif
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
  },
  drawerText: {
    fontSize: 16,
    color: '#5f6368',
  },
  activeDrawerText: {
    fontWeight: 'bold',
    color: '#000',
  },
  calendarText: {
    fontSize: 20,
    color: '#5f6368',
  },
  timelineContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  knob: {
    width: 100,
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,},
});

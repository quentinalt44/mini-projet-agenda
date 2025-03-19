import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface ReminderItemProps {
  reminder: {
    id: string | number;
    time: number;
    unit: 'minute' | 'hour' | 'day';
  };
  onUpdate: (id: string | number, reminder: any) => void;
  onDelete: (id: string | number) => void;
}

const ReminderItem: React.FC<ReminderItemProps> = ({ reminder, onDelete }) => {
  // Fonction pour formater le texte du rappel
  const formatReminderText = () => {
    const { time, unit } = reminder;
    
    if (unit === 'minute') {
      return time === 1 ? '1 minute avant' : `${time} minutes avant`;
    } else if (unit === 'hour') {
      return time === 1 ? '1 heure avant' : `${time} heures avant`;
    } else if (unit === 'day') {
      return time === 1 ? '1 jour avant' : `${time} jours avant`;
    }
    return `${time} ${unit} avant`;
  };

  return (
    <View style={styles.container}>
      <Ionicons name="alarm-outline" size={20} color="#1a73e8" style={styles.icon} />
      <Text style={styles.reminderText}>{formatReminderText()}</Text>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => onDelete(reminder.id)}
      >
        <View style={styles.deleteIconContainer}>
          <Ionicons name="close" size={12} color="white" style={styles.deleteIcon} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 5,
    marginBottom: 5
  },
  icon: {
    marginRight: 10
  },
  reminderText: {
    fontSize: 16,
    color: '#2d4150',
    flex: 1
  },
  deleteButton: {
    padding: 5,
  },
  deleteIconContainer: {
    backgroundColor: '#e53935', // Rouge moyen, entre clair et foncé
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    fontWeight: 'bold',
    lineHeight: 14,
    width: 14,
    height: 14,
    textAlign: 'center',
  }
});

export default ReminderItem;
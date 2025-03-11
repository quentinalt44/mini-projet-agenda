import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DrawerItemProps {
  icon: string;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const DrawerItem: React.FC<DrawerItemProps> = ({ icon, label, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.drawerItem, isActive && styles.activeDrawerItem]}
    onPress={onPress}
  >
    <Ionicons name={icon as any} size={24} color={isActive ? '#1a73e8' : '#5f6368'} />
    <Text style={[styles.drawerText, isActive && styles.activeDrawerText]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  activeDrawerItem: {
    backgroundColor: '#E3F2FD',
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
});

export default DrawerItem;

import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EventDetailsModalProps {
    isVisible: boolean;
    event: {
      id?: string;
      title: string;
      summary?: string;
      start: string;
      end: string;
    };
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
  }

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isVisible,
  event,
  onClose,
  onEdit,
  onDelete,
}) => {
  const handleDelete = () => {
    Alert.alert(
      "Supprimer l'événement",
      "Êtes-vous sûr de vouloir supprimer cet événement ?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Supprimer",
          onPress: onDelete,
          style: "destructive"
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{event.title}</Text>
            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={onEdit}
              >
                <Ionicons name="pencil" size={24} color="#1a73e8" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash" size={24} color="#dc3545" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>Début:</Text>
            <Text style={styles.dateText}>{formatDate(event.start)}</Text>
          </View>

          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>Fin:</Text>
            <Text style={styles.dateText}>{formatDate(event.end)}</Text>
          </View>

          {event.summary && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionLabel}>Description:</Text>
              <Text style={styles.descriptionText}>{event.summary}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a73e8',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    padding: 8,
  },
  dateSection: {
    marginBottom: 15,
  },
  dateLabel: {
    fontSize: 16,
    color: '#5f6368',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#2d4150',
  },
  descriptionSection: {
    marginTop: 10,
  },
  descriptionLabel: {
    fontSize: 16,
    color: '#5f6368',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 16,
    color: '#2d4150',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#5f6368',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default EventDetailsModal;
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Dimensions,
  Animated,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';

// Garder les catégories d'événements
const EVENT_CATEGORIES = [
  { id: 'default', label: 'Par défaut', color: '#1a73e8' },
  { id: 'work', label: 'Travail', color: '#d50000' },
  { id: 'personal', label: 'Personnel', color: '#33b679' },
  { id: 'family', label: 'Famille', color: '#f6bf26' },
  { id: 'health', label: 'Santé', color: '#8e24aa' },
  { id: 'other', label: 'Autre', color: '#616161' },
];

interface EventDetailsModalProps {
  isVisible: boolean;
  event: {
    id?: string;
    title: string;
    summary?: string;
    start: string;
    end: string;
    isFullDay?: boolean;
    category?: string;
    location?: {
      latitude: number;
      longitude: number;
      title?: string;
    };
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
  // État séparé pour la carte en plein écran
  const [showMapModal, setShowMapModal] = useState(false);
  
  // Coordonnées par défaut (Paris) si aucun emplacement n'est spécifié
  const defaultLocation = {
    latitude: 48.8566,
    longitude: 2.3522,
    title: 'Paris'
  };
  
  // Utiliser l'emplacement de l'événement ou l'emplacement par défaut
  const location = event.location || defaultLocation;
  
  // Vérification de la validité de l'emplacement
  const hasValidLocation = location && 
    typeof location.latitude === 'number' && 
    typeof location.longitude === 'number';

  // Fonction pour obtenir les informations de la catégorie
  const getCategoryInfo = (categoryId?: string) => {
    const category = EVENT_CATEGORIES.find(cat => cat.id === (categoryId || 'default'));
    return {
      label: category?.label || 'Par défaut',
      color: category?.color || '#1a73e8'
    };
  };

  const categoryInfo = getCategoryInfo(event.category);

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

  // S'assurer que la modale de carte est fermée lorsque la modale principale se ferme
  useEffect(() => {
    if (!isVisible) {
      setShowMapModal(false);
    }
  }, [isVisible]);

  return (
    <>
      {/* Modal principal des détails de l'événement */}
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

            <View style={styles.categorySection}>
              <Text style={styles.categoryLabel}>Catégorie:</Text>
              <View style={styles.categoryBadge}>
                <View style={[styles.categoryColor, { backgroundColor: categoryInfo.color }]} />
                <Text style={styles.categoryText}>{categoryInfo.label}</Text>
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
            
            {/* Section carte simplifiée - juste une vignette cliquable */}
            {hasValidLocation && (
              <View style={styles.mapSection}>
                <Text style={styles.mapLabel}>Emplacement:</Text>
                <TouchableOpacity 
                  style={styles.mapThumbnailContainer}
                  onPress={() => setShowMapModal(true)}
                  activeOpacity={0.8}
                >
                  <MapView
                    style={styles.mapThumbnail}
                    region={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                  >
                    <Marker
                      coordinate={{
                        latitude: location.latitude,
                        longitude: location.longitude
                      }}
                    />
                  </MapView>
                  <View style={styles.mapOverlay}>
                    <Text style={styles.mapOverlayText}>Voir la carte</Text>
                    <Ionicons name="expand" size={18} color="white" />
                  </View>
                </TouchableOpacity>
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

      {/* Modal séparé pour la carte en plein écran */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showMapModal}
        onRequestClose={() => setShowMapModal(false)}
      >
        <SafeAreaView style={styles.mapModalContainer}>
          {hasValidLocation ? (
            <MapView
              style={styles.fullScreenMap}
              region={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={true}
              zoomEnabled={true}
              rotateEnabled={true}
              pitchEnabled={true}
            >
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude
                }}
                title={location.title || event.title}
              />
            </MapView>
          ) : (
            <View style={styles.noLocationContainer}>
              <Text style={styles.noLocationText}>Aucun emplacement disponible</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.mapBackButton}
            onPress={() => setShowMapModal(false)}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </>
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
    marginBottom: 15,
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
  categorySection: {
    marginBottom: 15,
  },
  categoryLabel: {
    fontSize: 16,
    color: '#5f6368',
    marginBottom: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 16,
    color: '#2d4150',
  },
  
  // Vignette de carte
  mapSection: {
    marginTop: 10,
    marginBottom: 5,
  },
  mapLabel: {
    fontSize: 16,
    color: '#5f6368',
    marginBottom: 8,
  },
  mapThumbnailContainer: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mapThumbnail: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  mapOverlayText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Modal carte plein écran
  mapModalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  fullScreenMap: {
    width: '100%',
    height: '100%',
  },
  mapBackButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  noLocationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
  },
  noLocationText: {
    color: 'white',
    fontSize: 18,
  },
});

export default EventDetailsModal;
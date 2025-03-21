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
  onMapPress: (location: any) => void; // Nouvelle prop
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isVisible,
  event,
  onClose,
  onEdit,
  onDelete,
  onMapPress,
}) => {
  // État séparé pour la carte en plein écran
  const [showMapModal, setShowMapModal] = useState(false);

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

  // Ajouter ceci juste avant le return principal
  useEffect(() => {
    console.log("showMapModal state changed to:", showMapModal);
  }, [showMapModal]);

  // Modifier la façon dont vous gérez la modal de carte pour utiliser une approche plus directe
  const toggleMapModal = () => {
    console.log("Current showMapModal:", showMapModal);
    console.log("Setting showMapModal to:", !showMapModal);
    setShowMapModal(!showMapModal);
  };

  // Dans le composant EventDetailsModal, ajoutez ce code de débogage juste avant le return
  useEffect(() => {
    // Log détaillé de l'objet event
    console.log("Event Object:", {
      id: event.id,
      title: event.title,
      hasLocation: Boolean(event.location),
      locationData: event.location,
      locationProps: event.location ? Object.keys(event.location) : []
    });
    
    // Vérifier si l'objet location utilise lat/lng au lieu de latitude/longitude
    if (event.location) {
      console.log("Location coordinates:", {
        latitude: event.location.latitude,
        longitude: event.location.longitude,
        lat: (event.location as any).lat,
        lng: (event.location as any).lng
      });
    }
  }, [event]);

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
            
            {/* Section de la carte avec vérification adaptée pour les données lat/lng */}
            {(event.location || (event.location as any)?.lat) && (
              <View style={styles.mapSection}>
                <Text style={styles.mapLabel}>Emplacement:</Text>
                <View style={styles.mapThumbnailContainer}>
                  <MapView
                    style={styles.mapThumbnail}
                    region={{
                      latitude: event.location?.latitude || (event.location as any)?.lat || 0,
                      longitude: event.location?.longitude || (event.location as any)?.lng || 0,
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
                        latitude: event.location?.latitude || (event.location as any)?.lat || 0,
                        longitude: event.location?.longitude || (event.location as any)?.lng || 0
                      }}
                    />
                  </MapView>
                  
                  <TouchableOpacity 
                    style={styles.mapExpandButton}
                    onPress={() => {
                      // Créer un objet de données standardisé pour la carte
                      const mapData = {
                        location: {
                          latitude: event.location?.latitude || (event.location as any)?.lat || 0,
                          longitude: event.location?.longitude || (event.location as any)?.lng || 0,
                          title: event.location?.title || (event.location as any)?.title || event.title
                        },
                        eventId: event.id,
                        showSingleEvent: true
                      };
                      
                      console.log('Ouverture de la carte avec paramètres:', mapData);
                      onMapPress(mapData);
                      onClose();
                    }}
                  >
                    <Ionicons name="map-outline" size={24} color="white" />
                    <Text style={styles.mapExpandButtonText}>Voir la carte</Text>
                  </TouchableOpacity>
                </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Plus sombre pour plus de contraste
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10, // Plus grand
    gap: 8,
    height: 40, // Hauteur fixe pour cliquer plus facilement
  },
  mapOverlayText: {
    color: 'white',
    fontSize: 16, // Plus grand
    fontWeight: '500',
  },
  mapExpandButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
    height: 40,
  },
  mapExpandButtonText: {
    color: 'white',
    fontSize: 16,
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
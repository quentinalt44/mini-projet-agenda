import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Text,
  Alert,
  Modal,
  ScrollView,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Callout } from 'react-native-maps';
import { databaseService, EVENT_CATEGORIES } from '../database/DatabaseService';

interface CalendarEvent {
  id?: string | number;
  title: string;
  start: string;
  end: string;
  location?: {
    latitude: number;
    longitude: number;
    title?: string;
  };
  category?: string;
  // Autres propriétés d'événement...
}

interface MapScreenProps {
  location: {
    latitude: number;
    longitude: number;
    title?: string;
    eventId?: string | number;
    showSingleEvent?: boolean;
  };
  onClose: () => void;
  onEventPress?: (eventId: string | number) => void;
  eventId?: string | number;
  showSingleEvent?: boolean;
}

// Modifiez la signature du composant pour utiliser directement les props sans destructuration
const MapScreen: React.FC<MapScreenProps> = (props) => {
  const { location, onClose, onEventPress, eventId, showSingleEvent } = props;
  
  // Créer des états distincts pour la position utilisateur et l'emplacement central initial
  const [userPosition, setUserPosition] = useState({
    // Utiliser la géolocalisation ou une position par défaut, PAS l'emplacement passé
    latitude: 47.218371, // Coordonnées par défaut (La Roche-sur-Yon)
    longitude: -1.553621,
    title: "Ma position"
  });
  
  // Utilisez la géolocalisation du navigateur pour récupérer la position réelle
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setUserPosition({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            title: "Ma position"
          });
          console.log("Position utilisateur obtenue :", position.coords);
        },
        error => {
          console.log("Erreur de géolocalisation :", error);
        }
      );
    }
  }, []);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Utilisez directement props.showSingleEvent et props.eventId dans useEffect
  useEffect(() => {
    console.log("MapScreen - Chargement des événements");
    console.log("Props reçues:", {
      eventId: props.eventId,
      showSingleEvent: props.showSingleEvent
    });
    
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        let allEvents = await databaseService.getEvents();
        
        // Filtrer les événements qui ont une localisation valide
        let filteredEvents = allEvents.filter(event => 
          event.location && 
          typeof event.location.latitude === 'number' && 
          typeof event.location.longitude === 'number'
        );
        
        console.log(`${filteredEvents.length} événements avec localisation trouvés`);
        
        // Si showSingleEvent est TRUE et qu'un eventId est spécifié, filtrer la liste
        if (props.showSingleEvent === true && props.eventId) {
          console.log(`Filtrage pour afficher uniquement l'événement ${props.eventId}`);
          
          // Comparaison stricte avec conversion en chaîne
          const eventIdStr = String(props.eventId);
          filteredEvents = filteredEvents.filter(event => String(event.id) === eventIdStr);
          
          console.log(`Après filtrage: ${filteredEvents.length} événement(s)`);
        } else {
          console.log("Affichage de tous les événements");
        }
        
        // Transformation pour l'affichage
        const displayEvents = filteredEvents.map(event => ({
          id: event.id,
          title: event.title,
          start: event.start_date,
          end: event.end_date,
          location: event.location,
          category: event.category,
        }));
        
        setEvents(displayEvents);
        
        // Si on a filtré sur un seul événement et qu'on l'a trouvé, centrer dessus
        if (props.showSingleEvent === true && filteredEvents.length > 0) {
          const event = filteredEvents[0];
          console.log(`Centrage sur l'événement unique: ${event.id}`);
          
          setTimeout(() => {
            if (mapRef.current && event.location) {
              mapRef.current.animateToRegion({
                latitude: event.location.latitude,
                longitude: event.location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }, 500);
            }
          }, 300);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des événements:", error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEvents();
  }, [props.eventId, props.showSingleEvent]);

  // Modifiez le useEffect qui ajuste automatiquement le zoom pour voir tous les marqueurs
  // Remplacez le bloc useEffect existant par celui-ci:
  useEffect(() => {
    // Ne pas ajuster automatiquement à l'ouverture
    // Les événements seront chargés et visibles, mais la carte restera centrée sur la position de l'utilisateur
    
    // Si vous souhaitez toujours voir l'indicateur de chargement pour savoir quand c'est prêt:
    if (isMapReady && !isLoading && events.length > 0) {
      console.log("Carte et événements prêts - Position maintenue sur l'utilisateur");
    }
  }, [isMapReady, isLoading, events]);

  // Formater la date pour l'affichage dans les infobulles
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Ajoutez cette fonction après le formatEventDate
  const getMapRegion = () => {
    // S'il y a des événements, centrer la carte sur le premier événement
    if (events.length > 0 && events[0].location) {
      return {
        latitude: events[0].location.latitude,
        longitude: events[0].location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    
    // Sinon, utiliser la position actuelle
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  };

  // Modifiez la fonction fitAllMarkers comme suit
  const fitAllMarkers = () => {
    if (!mapRef.current) return;
    
    // Création d'un tableau pour stocker tous les points à afficher
    const points = [];
    
    // Ajouter tous les points des événements
    if (events.length > 0) {
      events.forEach(event => {
        if (event.location) {
          points.push({
            latitude: event.location.latitude,
            longitude: event.location.longitude,
          });
        }
      });
    }
    
    // Toujours ajouter la position de l'utilisateur
    points.push({
      latitude: userPosition.latitude,
      longitude: userPosition.longitude
    });
    
    // Si aucun point à afficher, sortir
    if (points.length === 0) return;
    
    // Log pour debug
    console.log(`Ajustement de la vue pour inclure ${points.length} points (${events.length} événements + position utilisateur)`);
    
    // Ajuster la carte pour voir tous les points
    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 70, right: 70, bottom: 70, left: 70 }, // Marge plus grande
      animated: true
    });
  };

  // Ajoutez cette nouvelle fonction après fitAllMarkers
  const centerOnMyLocation = () => {
    console.log("Centrage sur position utilisateur:", userPosition);
    
    if (!mapRef.current) return;
    
    mapRef.current.animateToRegion({
      latitude: userPosition.latitude,
      longitude: userPosition.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
  };

  // Ajoutez cette fonction utilitaire dans votre composant MapScreen (après le formatEventDate)
  const getCategoryColor = (category?: string): string => {
    // Si aucune catégorie n'est spécifiée, utilisez la couleur par défaut
    if (!category) return '#1a73e8'; // Bleu par défaut
    
    // Recherchez la catégorie dans la liste des catégories
    const categoryObj = EVENT_CATEGORIES.find(cat => cat.id === category);
    
    // Si la catégorie existe, retournez sa couleur, sinon la couleur par défaut
    return categoryObj?.color || '#1a73e8';
  };

  // États pour les filtres
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState<{[key: string]: boolean}>({});
  const [areFiltersActive, setAreFiltersActive] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  
  // Initialisation des filtres de catégorie basés sur EVENT_CATEGORIES
  useEffect(() => {
    const initialFilters = EVENT_CATEGORIES.reduce((acc, category) => {
      acc[category.id] = true; // Toutes les catégories sont activées par défaut
      return acc;
    }, {} as {[key: string]: boolean});
    
    setCategoryFilters(initialFilters);
  }, []);
  
  // Appliquer les filtres chaque fois que les événements ou les filtres changent
  useEffect(() => {
    if (events.length === 0) {
      setFilteredEvents([]);
      return;
    }
    
    // Vérifier si des filtres sont actifs
    const hasActiveFilters = Object.values(categoryFilters).some(value => !value);
    setAreFiltersActive(hasActiveFilters);
    
    // Appliquer les filtres seulement en mode carte principale
    if (!props.showSingleEvent && hasActiveFilters) {
      const filtered = events.filter(event => {
        // Filtrer par catégorie
        if (event.category && !categoryFilters[event.category]) {
          return false;
        }
        return true;
      });
      
      setFilteredEvents(filtered);
    } else {
      // Si aucun filtre n'est actif ou si on est en mode événement unique, utiliser tous les événements
      setFilteredEvents(events);
    }
  }, [events, categoryFilters, props.showSingleEvent]);
  
  // Fonction pour basculer l'état d'un filtre de catégorie
  const toggleCategoryFilter = (categoryId: string) => {
    setCategoryFilters(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  // Fonction pour réinitialiser tous les filtres
  const resetFilters = () => {
    const resetValues = EVENT_CATEGORIES.reduce((acc, category) => {
      acc[category.id] = true;
      return acc;
    }, {} as {[key: string]: boolean});
    
    setCategoryFilters(resetValues);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onClose}
        >
          <Ionicons name="arrow-back" size={24} color="#1a73e8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {props.showSingleEvent === true 
            ? events.length > 0 
              ? `Emplacement : ${events[0].title}` 
              : "Emplacement de l'événement"
            : "Carte des événements"}
        </Text>
        
        {/* Bouton de filtre (uniquement en mode carte principale) */}
        {!props.showSingleEvent ? (
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setIsFilterModalVisible(true)}
          >
            <Ionicons 
              name={areFiltersActive ? "funnel" : "funnel-outline"} 
              size={22} 
              color={areFiltersActive ? "#1a73e8" : "#5f6368"} 
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01, // Zoom plus proche
          longitudeDelta: 0.01,
        }}
        // Supprimez ou commentez cette ligne s'il y en a une qui utilise getMapRegion()
        // region={isLoading ? undefined : getMapRegion()}
        onMapReady={() => {
          console.log("Carte prête - position initiale:", location);
          // Marquer la carte comme prête
          setIsMapReady(true);
        }}
        showsUserLocation={false} // Changé de true à false
        followsUserLocation={false}
        zoomEnabled={true}
        zoomControlEnabled={true}
        loadingEnabled={true}
        moveOnMarkerPress={false}
        showsMyLocationButton={true}
      >
        {/* Position de l'utilisateur - Retrait de la condition !props.showSingleEvent */}
        <Marker
          coordinate={{
            latitude: userPosition.latitude,
            longitude: userPosition.longitude
          }}
          title="Ma position"
        >
          <View style={styles.userLocationMarker}>
            <View style={styles.userLocationDot} />
          </View>
        </Marker>

        {/* Événements - Utilisez filteredEvents au lieu de events */}
        {filteredEvents.map(event => {
          if (!event.location) return null;
          
          return (
            <Marker
              key={String(event.id)}
              coordinate={{
                latitude: event.location.latitude,
                longitude: event.location.longitude
              }}
              title={event.title}
              description={formatEventDate(event.start)}
              pinColor={getCategoryColor(event.category)}
            />
          );
        })}
      </MapView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Chargement des événements...</Text>
        </View>
      )}

      {!isLoading && events.length === 0 && (
        <View style={styles.noEventsOverlay}>
          <Ionicons name="calendar-outline" size={24} color="#1a73e8" />
          <Text style={styles.noEventsText}>
            Aucun événement avec emplacement
          </Text>
          <Text style={styles.noEventsSubtext}>
            Créez des événements avec un emplacement pour les voir sur la carte
          </Text>
        </View>
      )}

      {/* Ajoutez ce bouton flottant */}
      <>
        {/* Bouton pour ajuster la vue à tous les marqueurs */}
        <TouchableOpacity 
          style={styles.fitButton}
          onPress={fitAllMarkers}
        >
          <Ionicons name="expand-outline" size={24} color="#1a73e8" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.myLocationButton}
          onPress={centerOnMyLocation}
        >
          <Ionicons name="locate" size={24} color="#ffffff" />
        </TouchableOpacity>
      </>

      {/* Modal pour les filtres */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFilterModalVisible}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.filterModalContainer}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filtrer les événements</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#5f6368" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterCategoriesContainer}>
              <Text style={styles.filterSectionTitle}>Catégories</Text>
              
              {EVENT_CATEGORIES.map(category => (
                <TouchableOpacity 
                  key={category.id}
                  style={styles.categoryFilterItem}
                  onPress={() => toggleCategoryFilter(category.id)}
                >
                  <View style={styles.categoryFilterItemContent}>
                    <View style={[
                      styles.categoryIndicator, 
                      { backgroundColor: category.color }
                    ]} />
                    <Text style={styles.categoryFilterItemText}>{category.label}</Text>
                  </View>
                  <Switch
                    value={categoryFilters[category.id]}
                    onValueChange={() => toggleCategoryFilter(category.id)}
                    trackColor={{ false: '#d8d8d8', true: '#1a73e8' }}
                    thumbColor={categoryFilters[category.id] ? '#fff' : '#f4f3f4'}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.filterModalFooter}>
              <TouchableOpacity 
                style={styles.resetFilterButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetFilterButtonText}>Réinitialiser</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyFilterButton}
                onPress={() => setIsFilterModalVisible(false)}
              >
                <Text style={styles.applyFilterButtonText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a73e8',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  map: {
    flex: 1,
  },
  userLocationMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4285F4',
  },
  eventCallout: {
    width: 200,
  },
  calloutContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1a73e8',
  },
  calloutDate: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 2,
  },
  calloutCategory: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 6,
  },
  calloutLocation: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 6,
  },
  calloutHint: {
    fontSize: 12,
    color: '#9aa0a6',
    fontStyle: 'italic',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
  },
  loadingText: {
    color: 'white',
    fontSize: 14,
  },
  noEventsOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    maxWidth: '80%',
  },
  noEventsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginTop: 8,
    textAlign: 'center',
  },
  noEventsSubtext: {
    fontSize: 14,
    color: '#5f6368',
    marginTop: 4,
    textAlign: 'center',
  },
  fitButton: {
    position: 'absolute',
    right: 20,
    bottom: 90, // 140 → 90 (moins haut, à seulement 70px au-dessus du bouton inférieur)
    backgroundColor: '#ffffff',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: '#1a73e8',
  },
  myLocationButton: {
    position: 'absolute',
    right: 20, // 16 → 20
    bottom: 20, // 16 → 20
    backgroundColor: '#1a73e8',
    width: 56, // 46 → 56
    height: 56, // 46 → 56
    borderRadius: 28, // 23 → 28
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6, // 3 → 6
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // height: 1 → 2
    shadowOpacity: 0.25, // 0.2 → 0.25
    shadowRadius: 3.84, // 2 → 3.84
  },
  filterButton: {
    padding: 8,
  },
  filterModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a73e8',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#202124',
  },
  filterCategoriesContainer: {
    maxHeight: 300,
  },
  categoryFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryFilterItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryFilterItemText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#202124',
  },
  filterModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  resetFilterButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1a73e8',
  },
  resetFilterButtonText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
  },
  applyFilterButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    backgroundColor: '#1a73e8',
  },
  applyFilterButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MapScreen;
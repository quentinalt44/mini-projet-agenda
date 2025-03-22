import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Text,
  Alert
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
  };
  onClose: () => void;
  onEventPress?: (eventId: string | number) => void;
}

const MapScreen: React.FC<MapScreenProps> = ({ location, onClose, onEventPress }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Charger les événements avec localisation
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const allEvents = await databaseService.getEvents() as unknown as CalendarEvent[];
        
        console.log("=== DIAGNOSTIC CARTE ===");
        console.log(`Total d'événements: ${allEvents.length}`);
        
        // Vérifier combien d'événements ont un champ location
        const eventsWithLocationField = allEvents.filter(event => event.location);
        console.log(`Événements avec champ location: ${eventsWithLocationField.length}`);
        
        if (eventsWithLocationField.length > 0) {
          console.log("Premier événement avec champ location:", 
            JSON.stringify(eventsWithLocationField[0].location, null, 2));
        }
        
        // Filtrer avec une condition plus précise
        const eventsWithLocation = allEvents.filter(event => 
          event.location && 
          typeof event.location.latitude === 'number' && 
          typeof event.location.longitude === 'number'
        );
        
        console.log(`Événements avec coordonnées valides: ${eventsWithLocation.length}`);
        
        if (eventsWithLocation.length > 0) {
          console.log("Premier événement avec coordonnées valides:");
          console.log(`ID: ${eventsWithLocation[0].id}`);
          console.log(`Titre: ${eventsWithLocation[0].title}`);
          console.log(`Latitude: ${eventsWithLocation[0].location?.latitude}`);
          console.log(`Longitude: ${eventsWithLocation[0].location?.longitude}`);
        }
        
        setEvents(eventsWithLocation as CalendarEvent[]);
      } catch (error) {
        console.error("Erreur lors du chargement des événements:", error);
        Alert.alert("Erreur", "Impossible de charger les événements");
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

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

  // Ajoutez cette fonction pour ajuster le zoom pour voir tous les marqueurs
  const fitAllMarkers = () => {
    if (!mapRef.current || events.length === 0) return;
    
    // Ajouter tous les points à inclure dans le zoom
    const points = events
      .filter(e => e.location)
      .map(e => ({
        latitude: e.location!.latitude,
        longitude: e.location!.longitude,
      }));
    
    // Ajouter la position actuelle
    points.push({
      latitude: location.latitude,
      longitude: location.longitude
    });
    
    // Ajuster la carte pour voir tous les points
    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true
    });
  };

  // Ajoutez cette nouvelle fonction après fitAllMarkers
  const centerOnMyLocation = () => {
    if (!mapRef.current) return;
    
    mapRef.current.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01, // Zoom un peu plus proche pour votre position
      longitudeDelta: 0.01,
    }, 500); // Animation de 500ms
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onClose}
        >
          <Ionicons name="arrow-back" size={24} color="#1a73e8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Carte des événements</Text>
        <View style={styles.placeholder} />
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
        showsUserLocation={true}
        followsUserLocation={false}
        zoomEnabled={true}
        zoomControlEnabled={true}
        loadingEnabled={true}
        moveOnMarkerPress={false}
        showsMyLocationButton={true}
      >
        {/* Position actuelle */}
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude
          }}
          title="Ma position"
          pinColor="#4285F4"
        >
          <View style={styles.userLocationMarker}>
            <View style={styles.userLocationDot} />
          </View>
        </Marker>

        {/* Marqueurs pour chaque événement avec localisation */}
        {events.length > 0 ? (
          events.map(event => {
            // Log plus détaillé pour chaque événement lors du rendu
            console.log(`Rendu de l'événement ${event.id} - ${event.title}`);
            
            // Vérifier que location existe avant d'accéder à ses propriétés
            if (!event.location) {
              console.log(`Événement ${event.id} ignoré: location indéfini`);
              return null;
            }
            
            console.log(`Coordonnées: ${typeof event.location.latitude} (${event.location.latitude}), ${typeof event.location.longitude} (${event.location.longitude})`);
            
            // Assurez-vous que les coordonnées sont des nombres
            const latitude = Number(event.location.latitude);
            const longitude = Number(event.location.longitude);
            
            // Vérifier que l'événement a des coordonnées valides
            if (!event.location || typeof event.location.latitude !== 'number' || typeof event.location.longitude !== 'number') {
              console.log(`Événement ${event.id} ignoré: coordonnées invalides`);
              return null;
            }
            
            return (
              <Marker
                key={event.id}
                coordinate={{
                  latitude: latitude,
                  longitude: longitude
                }}
                title={event.title}
                description={formatEventDate(event.start)}
                pinColor={getCategoryColor(event.category)} // Utilisez la couleur de la catégorie
                onCalloutPress={() => {
                  if (onEventPress && event.id !== undefined) {
                    onEventPress(event.id);
                  }
                }}
              >
                <Callout tooltip style={styles.eventCallout}>
                  <View style={styles.calloutContainer}>
                    <View style={styles.calloutHeader}>
                      <View 
                        style={[
                          styles.categoryIndicator, 
                          { backgroundColor: getCategoryColor(event.category) }
                        ]} 
                      />
                      <Text style={styles.calloutTitle}>{event.title}</Text>
                    </View>
                    <Text style={styles.calloutDate}>
                      {formatEventDate(event.start)}
                    </Text>
                    <Text style={styles.calloutCategory}>
                      {EVENT_CATEGORIES.find(cat => cat.id === event.category)?.label || "Sans catégorie"}
                    </Text>
                    <Text style={styles.calloutLocation}>
                      {event.location?.title || "Emplacement sans nom"}
                    </Text>
                    <Text style={styles.calloutHint}>
                      Appuyez pour voir les détails
                    </Text>
                  </View>
                </Callout>
              </Marker>
            );
          })
        ) : !isLoading ? (
          // Si aucun événement et pas en chargement, afficher un message sur la carte
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude
            }}
            title="Aucun événement"
            description="Ajoutez des événements avec des emplacements pour les voir ici"
            pinColor="#AAAAAA"
          />
        ) : null}
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
        
        {/* Bouton pour recentrer sur ma position */}
        <TouchableOpacity 
          style={styles.myLocationButton}
          onPress={centerOnMyLocation}
        >
          <Ionicons name="locate" size={24} color="#ffffff" />
        </TouchableOpacity>
      </>
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
});

export default MapScreen;
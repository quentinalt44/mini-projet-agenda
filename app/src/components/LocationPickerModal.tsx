import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Text, 
  SafeAreaView,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

interface LocationPickerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectLocation: (location: { latitude: number; longitude: number; title?: string } | null) => void;
  initialLocation?: { latitude: number; longitude: number; title?: string };
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ 
  isVisible, 
  onClose, 
  onSelectLocation,
  initialLocation
}) => {
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    title?: string;
  } | null>(initialLocation || null);
  
  const [locationTitle, setLocationTitle] = useState(initialLocation?.title || '');
  const [isLoading, setIsLoading] = useState(false);

  // Réinitialiser l'état lorsque le modal s'ouvre
  useEffect(() => {
    if (isVisible) {
      setSelectedLocation(initialLocation || null);
      setLocationTitle(initialLocation?.title || '');
    }
  }, [isVisible, initialLocation]);

  // Obtenir la position actuelle de l'utilisateur
  const getUserLocation = async () => {
    setIsLoading(true);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          "Permission refusée",
          "L'accès à votre position est nécessaire pour cette fonctionnalité.",
          [{ text: "OK" }]
        );
        setIsLoading(false);
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        title: locationTitle
      });
    } catch (error) {
      console.error("Erreur lors de l'obtention de la position:", error);
      Alert.alert(
        "Erreur de localisation",
        "Impossible d'obtenir votre position actuelle.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer la sélection d'un point sur la carte
  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      title: locationTitle
    });
  };

  // Confirmer la sélection de l'emplacement
  const confirmLocation = () => {
    if (selectedLocation) {
      onSelectLocation({
        ...selectedLocation,
        title: locationTitle || 'Emplacement sélectionné'
      });
      onClose();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#1a73e8" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choisir un emplacement</Text>
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={confirmLocation}
            disabled={!selectedLocation}
          >
            <Text style={[
              styles.confirmButtonText, 
              !selectedLocation && styles.disabledButtonText
            ]}>Valider</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nom de l'emplacement (optionnel)"
            value={locationTitle}
            onChangeText={setLocationTitle}
          />
        </View>
        
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: initialLocation?.latitude || 48.8566,
            longitude: initialLocation?.longitude || 2.3522,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={handleMapPress}
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude
              }}
              title={locationTitle || "Emplacement sélectionné"}
              draggable
              onDragEnd={(e) => {
                setSelectedLocation({
                  latitude: e.nativeEvent.coordinate.latitude,
                  longitude: e.nativeEvent.coordinate.longitude,
                  title: locationTitle
                });
              }}
            />
          )}
        </MapView>
        
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={getUserLocation}
          disabled={isLoading}
        >
          <Ionicons name="locate" size={22} color="white" />
          <Text style={styles.locationButtonText}>
            {isLoading ? "Chargement..." : "Ma position"}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
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
  closeButton: {
    padding: 8,
  },
  confirmButton: {
    padding: 8,
  },
  confirmButtonText: {
    color: '#1a73e8',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButtonText: {
    color: '#9aa0a6',
  },
  inputContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  map: {
    flex: 1,
  },
  locationButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#1a73e8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    gap: 8,
  },
  locationButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
});

export default LocationPickerModal;
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Define types for coordinates and store
type Coords = {
  lat: number
  lng: number
}

type LocationStore = {
  coords: Coords | null
  error: string | null
  geoString: string | null  // For Hasura geography data type
  isLoading: boolean
  lastUpdated: number | null
  getLocation: () => Promise<Coords | null>
  refreshLocation: () => Promise<Coords | null>
  clearLocation: () => void
}

/**
 * Location store with persistence for fetching and storing user geolocation
 * Formats coordinates for display and stores as geography data type for Hasura
 */
export const useLocationStore = create<LocationStore>()(
  persist(
    (set, get) => ({
      coords: null,
      error: null,
      geoString: null,
      isLoading: false,
      lastUpdated: null,

      /**
       * Get the user's current location
       * Returns cached location if available, otherwise fetches new location
       */
      getLocation: async () => {
        const { coords, lastUpdated } = get();
        
        // If we already have coordinates and they're less than 5 minutes old, return them
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        if (coords && lastUpdated && lastUpdated > fiveMinutesAgo) {
          return coords;
        }
        
        // Otherwise fetch new coordinates
        return get().refreshLocation();
      },
      
      /**
       * Force refresh the location regardless of cache
       */
      refreshLocation: () => {
        return new Promise<Coords | null>((resolve, reject) => {
          // Set loading state
          set({ isLoading: true, error: null });

          // Check if geolocation is supported
          if (!navigator.geolocation) {
            const error = 'Geolocation is not supported by your browser.';
            set({ error, isLoading: false });
            reject(new Error(error));
            return;
          }

          // Request position with timeout and high accuracy
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              const newCoords = { lat, lng };
              
              // Format for Hasura geography type (PostGIS format)
              // IMPORTANT: For PostGIS/Hasura, the format is POINT(longitude latitude)
              const newGeoString = `SRID=4326;POINT(${lng} ${lat})`;

              // Update store with new values
              set({
                coords: newCoords,
                geoString: newGeoString,
                error: null,
                isLoading: false,
                lastUpdated: Date.now()
              });

              // Resolve with the new coordinates
              resolve(newCoords);
            },
            (err) => {
              // Handle geolocation errors with descriptive messages
              let errorMessage: string;
              
              // Enhanced error handling
              switch (err.code) {
                case 1:
                  errorMessage = 'Permission denied. Please allow location access in your browser settings.';
                  break;
                case 2:
                  // POSITION_UNAVAILABLE - more detailed error for troubleshooting
                  errorMessage = 'Unable to determine your location. This could be due to poor GPS signal, network issues, or device limitations.';
                  break;
                case 3:
                  errorMessage = 'Location request timed out. Please try again in a better coverage area.';
                  break;
                default:
                  errorMessage = `Geolocation error: ${err.message || 'Unknown error accessing geolocation'}`;
              }
              
              console.log('Geolocation error details:', { 
                code: err.code, 
                message: err.message,
                fullError: err
              });
              
              set({ 
                error: errorMessage,
                isLoading: false,
                // Don't clear existing coords on error, only update error state
                // This way users can still use previously fetched coordinates if available
              });
              
              reject(new Error(errorMessage));
            },
            {
              enableHighAccuracy: true,     // Try to get the most accurate position
              timeout: 15000,               // Increased timeout for better chance of success
              maximumAge: 60000             // Accept cached positions up to 1 minute old
            }
          );
        });
      },

      /**
       * Clear all location data from store
       */
      clearLocation: () => {
        set({
          coords: null,
          geoString: null,
          error: null,
          isLoading: false,
          lastUpdated: null
        });
      }
    }),
    {
      name: 'user-location-store', // Storage key
      storage: createJSONStorage(() => localStorage), // Use localStorage
      partialize: (state) => ({
        // Only persist these values, not the functions
        coords: state.coords,
        geoString: state.geoString,
        lastUpdated: state.lastUpdated
      })
    }
  )
)
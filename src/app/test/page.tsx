"use client";
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Initialize Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const MapboxLocationPicker = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const geocoder = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ lng: number; lat: number } | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [77.5946, 12.9716], // Default to Bangalore
      zoom: 12
    });

    // Add geocoder control
    const MapboxGeocoder = require('@mapbox/mapbox-gl-geocoder');
    geocoder.current = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: false,
      placeholder: 'Search for places...',
    });

    map.current.addControl(geocoder.current);

    // Handle geocoder result
    geocoder.current.on('result', (e: any) => {
      const [lng, lat] = e.result.center;
      setSelectedLocation({ lng, lat });
      updateMarker(lng, lat);
      console.log('Selected location:', { lng, lat, address: e.result.place_name });
    });

    // Add click event handler
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setSelectedLocation({ lng, lat });
      updateMarker(lng, lat);
      console.log('Selected location:', { lng, lat });
      reverseGeocode(lng, lat);
    });

    // Add navigation control
    map.current.addControl(new mapboxgl.NavigationControl());

    // Clean up on unmount
    return () => {
      if (map.current) map.current.remove();
    };
  }, []);

  const updateMarker = (lng: number, lat: number) => {
    // Remove existing marker if any
    if (marker.current) marker.current.remove();

    // Add new marker
    marker.current = new mapboxgl.Marker()
      .setLngLat([lng, lat])
      .addTo(map.current!);

    // Fly to the location
    map.current?.flyTo({
      center: [lng, lat],
      zoom: 14
    });
  };

  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        console.log('Address:', data.features[0].place_name);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxgl.accessToken}&limit=1`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setSelectedLocation({ lng, lat });
        updateMarker(lng, lat);
        console.log('Found location:', { lng, lat, address: data.features[0].place_name });
      } else {
        console.log('No results found');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <form onSubmit={handleManualSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter an address or place"
            className="flex-1 p-2 border rounded"
          />
          <button 
            type="submit" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Search
          </button>
        </form>
      </div>
      
      <div className="w-full h-[500px] relative">
        <div ref={mapContainer} className="w-full h-full rounded-lg" />
      </div>
      
      {selectedLocation && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p className="font-medium">Selected Location:</p>
          <p>Longitude: {selectedLocation.lng.toFixed(6)}</p>
          <p>Latitude: {selectedLocation.lat.toFixed(6)}</p>
        </div>
      )}
      
      <p className="mt-2 text-sm text-gray-600">
        Click on the map or search to select a location
      </p>
    </div>
  );
};

const Page = () => {
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Location Picker with Search</h1>
      <MapboxLocationPicker />
    </div>
  );
};

export default Page;
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px',
  marginTop: '10px'
};

const defaultCenter = {
  lat: 31.5204, // Lahore
  lng: 74.3587
};

const MapComponent = ({ apiKey, latitude, longitude, onLocationSelect }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey
  });

  const [map, setMap] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);

  useEffect(() => {
    if (latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude))) {
        setMarkerPosition({ lat: parseFloat(latitude), lng: parseFloat(longitude) });
    }
  }, [latitude, longitude]);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPosition({ lat, lng });
    onLocationSelect(lat, lng);
  };

  const handleMarkerDragEnd = (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      onLocationSelect(lat, lng);
  };

  if (loadError) {
    return <div>Error loading maps: {loadError.message}</div>;
  }

  return isLoaded ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPosition}
        zoom={13}
        onClick={handleMapClick}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        <Marker 
            position={markerPosition} 
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
        />
      </GoogleMap>
      <div style={{ fontSize: '0.8rem', color: '#666' }}>
        Click on the map or drag the marker to set the restaurant location.
      </div>
    </div>
  ) : (
    <div>Loading Map...</div>
  );
};

const LocationPicker = ({ latitude, longitude, onLocationSelect }) => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const isPlaceholder = apiKey === "YOUR_VALID_API_KEY_HERE" || apiKey === "YOUR_GOOGLE_MAPS_API_KEY";

  if (!apiKey || isPlaceholder) {
    return (
      <div style={{ ...containerStyle, backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ccc', padding: '20px', textAlign: 'center' }}>
        <div>
          <p><strong>{isPlaceholder ? "Setup Required: Replace Placeholder Key" : "Google Maps API Key Missing"}</strong></p>
          <div style={{ fontSize: '0.9rem', color: '#666', lineHeight: '1.5' }}>
            {isPlaceholder ? (
               <>
                   The <code>.env</code> file currently uses a placeholder.<br/>
                   1. Open <code>frontend/.env</code><br/>
                   2. Replace <code>YOUR_VALID_API_KEY_HERE</code> with your actual Google Maps API Key.<br/>
                   3. <strong>Restart the server</strong> (Ctrl+C then npm start).
               </>
            ) : (
               <>
                   Please create a <code>.env</code> file in the <code>frontend</code> folder and add:
                   <br />
                   <code>REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key</code>
               </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <MapComponent 
      apiKey={apiKey}
      latitude={latitude} 
      longitude={longitude} 
      onLocationSelect={onLocationSelect} 
    />
  );
}

export default LocationPicker;

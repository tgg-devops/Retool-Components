import React, { useEffect, useRef } from 'react';
import { type FC } from 'react';
import { Retool } from '@tryretool/custom-component-support';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const AddressMap: FC = () => {
  const [address] = Retool.useStateString({
    name: 'address',
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const geocodeAddress = async (addr: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}`
      );
      const data = await response.json();
      if (data && data[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
      }).setView([51.505, -0.09], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapInstance.current);
    }

    const updateMap = async () => {
      if (!address || !mapInstance.current) return;

      const coords = await geocodeAddress(address);
      if (coords) {
        if (markerRef.current) {
          mapInstance.current.removeLayer(markerRef.current);
        }

        mapInstance.current.setView([coords.lat, coords.lng], 13);

        // Use a divIcon with a larger emoji
        const emojiIcon = L.divIcon({
          html: '<span style="font-size: 28px;">📍</span>', // Inline CSS for larger size
          className: '', // Empty className to avoid default Leaflet styles
          iconSize: [40, 40], // Match bounding box to font size
          iconAnchor: [20, 40], // Center bottom of the larger icon
        });

        markerRef.current = L.marker([coords.lat, coords.lng], {
          icon: emojiIcon,
        }).addTo(mapInstance.current);
      }
    };

    updateMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [address]);

  return (
    <div>
      <div
        ref={mapRef}
        style={{
          height: '400px',
          width: '100%',
          border: '1px solid #ddd',
        }}
      />
    </div>
  );
};

export default AddressMap;
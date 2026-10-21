import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface VenueLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
}

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});

export const VenueLocationPicker: React.FC<VenueLocationPickerProps> = ({
  latitude,
  longitude,
  onChange
}) => {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current || latitude === null || longitude === null) return;

    const map = L.map(mapElementRef.current).setView([latitude, longitude], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    const marker = L.marker([latitude, longitude], {
      icon: markerIcon,
      draggable: true
    }).addTo(map);

    const notifyLocationChange = (position: L.LatLng) => {
      onChangeRef.current(position.lat, position.lng);
    };

    marker.on('dragend', () => {
      const position = marker.getLatLng();
      notifyLocationChange(position);
    });
    map.on('click', (event: L.LeafletMouseEvent) => {
      marker.setLatLng(event.latlng);
      notifyLocationChange(event.latlng);
    });

    mapRef.current = map;
    markerRef.current = marker;
    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [latitude !== null && longitude !== null]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || latitude === null || longitude === null) return;
    const position = L.latLng(latitude, longitude);
    markerRef.current.setLatLng(position);
    mapRef.current.setView(position);
  }, [latitude, longitude]);

  if (latitude === null || longitude === null) return null;

  return (
    <div className="space-y-2">
      <div ref={mapElementRef} className="h-64 w-full rounded-xl overflow-hidden border border-slate-200 z-0" />
      <p className="text-[11px] text-slate-500">
        Kéo ghim hoặc bấm lên bản đồ để chọn đúng vị trí/lối vào cụm sân.
      </p>
      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
        <span>Vĩ độ: {latitude.toFixed(6)}</span>
        <span>Kinh độ: {longitude.toFixed(6)}</span>
      </div>
    </div>
  );
};

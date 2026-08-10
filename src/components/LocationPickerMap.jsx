import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon bug in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

export default function LocationPickerMap({ lang, onLocationSelect }) {
    // Default center to Makkah
    const defaultCenter = [21.3891, 39.8579];
    const [position, setPosition] = useState(null);

    useEffect(() => {
        if (position) {
            onLocationSelect(position.lat, position.lng);
        }
    }, [position, onLocationSelect]);

    return (
        <div className="w-full h-48 rounded-xl overflow-hidden border border-gray-200 mt-2 z-0 relative">
            <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={true} className="h-full w-full">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
            {!position && (
                <div className="absolute inset-0 bg-black/20 z-[1000] flex items-center justify-center pointer-events-none">
                    <span className="bg-white text-gray-800 px-4 py-2 rounded-xl text-sm font-bold shadow-lg">
                        {lang === 'ar' ? 'انقر على الخريطة لتحديد الموقع' : 'Click on the map to set location'}
                    </span>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon bug in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks and move marker
function MapEvents({ setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });
    return null;
}

// Component to recenter map when position changes
function Recenter({ lat, lng }) {
    const map = useMapEvents({});
    useEffect(() => {
        map.setView([lat, lng]);
    }, [lat, lng, map]);
    return null;
}

export default function LocationPicker({ lang, initialLat, initialLng, onLocationChange }) {
    // Default to Makkah (Haram) if no initial coordinates
    const defaultLat = 21.4225;
    const defaultLng = 39.8262;

    const [position, setPosition] = useState(
        initialLat && initialLng 
            ? { lat: initialLat, lng: initialLng } 
            : { lat: defaultLat, lng: defaultLng }
    );

    const markerRef = useRef(null);

    // Update parent when position changes
    // Using a ref to store the latest onLocationChange to avoid dependency issues
    const onChangeRef = useRef(onLocationChange);
    useEffect(() => {
        onChangeRef.current = onLocationChange;
    }, [onLocationChange]);

    useEffect(() => {
        if (position && onChangeRef.current) {
            onChangeRef.current(position.lat, position.lng);
        }
    }, [position]);

    // Sync with external initialLat/initialLng (e.g. after data loads)
    useEffect(() => {
        if (initialLat && initialLng && (initialLat !== position.lat || initialLng !== position.lng)) {
            setPosition({ lat: initialLat, lng: initialLng });
        }
    }, [initialLat, initialLng]);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    setPosition(marker.getLatLng());
                }
            },
        }),
        []
    );

    return (
        <div className="w-full">
            <label className="text-xs font-bold text-gray-500 mb-2 block">
                {lang === 'ar' ? 'حدد موقع الفندق على الخريطة' : 'Select Hotel Location on Map'}
            </label>
            <div className="text-[10px] text-gray-400 mb-2">
                {lang === 'ar' ? 'انقر على الخريطة أو اسحب الدبوس لتحديد الموقع بدقة' : 'Click on the map or drag the pin to set the exact location'}
            </div>
            
            <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200 relative z-0">
                <MapContainer center={position} zoom={15} scrollWheelZoom={true} className="h-full w-full">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Recenter lat={position.lat} lng={position.lng} />
                    <MapEvents setPosition={setPosition} />
                    <Marker
                        draggable={true}
                        eventHandlers={eventHandlers}
                        position={position}
                        ref={markerRef}
                    >
                        <Popup minWidth={90}>
                            <span className="text-sm font-bold">
                                {lang === 'ar' ? 'موقع الفندق' : 'Hotel Location'}
                            </span>
                        </Popup>
                    </Marker>
                </MapContainer>
            </div>
            
            <div className="flex gap-4 mt-3">
                <div className="flex-1">
                    <label className="text-[10px] text-gray-400 block">{lang === 'ar' ? 'خط العرض (Latitude)' : 'Latitude'}</label>
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-2 text-sm text-gray-700 font-mono" dir="ltr">
                        {position.lat.toFixed(6)}
                    </div>
                </div>
                <div className="flex-1">
                    <label className="text-[10px] text-gray-400 block">{lang === 'ar' ? 'خط الطول (Longitude)' : 'Longitude'}</label>
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-2 text-sm text-gray-700 font-mono" dir="ltr">
                        {position.lng.toFixed(6)}
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

// Fix Leaflet's default icon bug in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Calculate Haversine distance
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371e3; // Radius of the earth in m
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in m
    return Math.round(d);
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

export default function HotelMapViewer({ lang, hotelName, latitude, longitude }) {
    // Masjid Al Haram Coordinates
    const haramLat = 21.4225;
    const haramLng = 39.8262;

    const distance = useMemo(() => {
        return getDistanceFromLatLonInMeters(latitude, longitude, haramLat, haramLng);
    }, [latitude, longitude]);

    if (!latitude || !longitude) return null;

    const position = [latitude, longitude];
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-6">
            <h3 className="font-bold text-gray-900 mb-4">{lang === 'ar' ? 'الموقع على الخريطة' : 'Location on Map'}</h3>

            <div className="h-48 w-full rounded-xl overflow-hidden mb-4 relative z-0">
                <MapContainer center={position} zoom={15} scrollWheelZoom={false} className="h-full w-full">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={position}>
                        <Popup>{hotelName}</Popup>
                    </Marker>
                </MapContainer>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold hover:bg-blue-100 transition-colors"
                >
                    <Navigation size={18} />
                    {lang === 'ar' ? 'الاتجاه إلى الفندق' : 'Directions to Hotel'}
                </a>

                {distance !== null && (
                    <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-800 rounded-xl font-bold border border-emerald-100">
                        <MapPin size={18} />
                        {lang === 'ar' ? `المسافة للحرم: ${distance} متر` : `Distance to Haram: ${distance} m`}
                    </div>
                )}
            </div>
        </div>
    );
}

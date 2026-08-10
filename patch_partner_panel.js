const fs = require('fs');

const file = 'c:/Users/AMER/Desktop/projects Antigravity/ttaskinn/src/PartnerPanel.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add import statement
if (!content.includes('LocationPickerMap')) {
    content = content.replace(
        "import React, { useState, useEffect } from 'react';",
        "import React, { useState, useEffect } from 'react';\nimport LocationPickerMap from './components/LocationPickerMap';"
    );
}

// 2. Add state for lat, lng inside HotelSetupWizard
const wizardStateTarget = "const [formData, setFormData] = useState({ name: '', city: 'makkah', address: '', distance: 0, description: '' });";
const wizardStateReplacement = "const [formData, setFormData] = useState({ name: '', city: 'makkah', address: '', distance: 0, description: '', latitude: null, longitude: null });";

content = content.replace(wizardStateTarget, wizardStateReplacement);

// 3. Add the Map Component inside HotelSetupWizard 
const mapInsertionTarget = `                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1.5 block">{lang === 'ar' ? 'الوصف' : 'Description'}</label>
                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 outline-none h-24 resize-none" />
                    </div>`;

const mapInsertionReplacement = `                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1.5 block">{lang === 'ar' ? 'الوصف' : 'Description'}</label>
                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 outline-none h-24 resize-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                            {lang === 'ar' ? 'موقع الفندق على الخريطة' : 'Hotel Location on Map'}
                        </label>
                        <LocationPickerMap lang={lang} onLocationSelect={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))} />
                        {formData.latitude && <p className="text-xs text-emerald-600 mt-1">{lang === 'ar' ? 'تم تحديد الموقع بنجاح' : 'Location selected successfully'}</p>}
                    </div>`;

content = content.replace(mapInsertionTarget, mapInsertionReplacement);

// 4. Also prevent submit unless location is picked
const submitButtonTarget = `<button onClick={() => onSave(formData)} disabled={!formData.name || loading} className="w-full py-3.5 bg-emerald-800 text-white rounded-xl font-bold hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-800/20 mt-4">`;
const submitButtonReplacement = `<button onClick={() => onSave(formData)} disabled={!formData.name || !formData.latitude || loading} className="w-full py-3.5 bg-emerald-800 text-white rounded-xl font-bold hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-800/20 mt-4">`;

content = content.replace(submitButtonTarget, submitButtonReplacement);

// 5. Add lat and lng to creation payload
const payloadTarget = `                distance_to_haram_meters: parseInt(data.distance || 0),
                description: data.description,`;
const payloadReplacement = `                distance_to_haram_meters: parseInt(data.distance || 0),
                description: data.description,
                latitude: data.latitude,
                longitude: data.longitude,`;

if (content.includes("latitude: data.latitude") === false) {
    content = content.replace(payloadTarget, payloadReplacement);
}

fs.writeFileSync(file, content);
console.log('PartnerPanel.jsx updated successfully with Map Picker');

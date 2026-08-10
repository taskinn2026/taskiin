const fs = require('fs');

const file = 'c:/Users/AMER/Desktop/projects Antigravity/ttaskinn/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add import statement
if (!content.includes('HotelMapViewer')) {
    content = content.replace(
        "import React, { useState, useEffect, useRef, useMemo } from 'react';",
        "import React, { useState, useEffect, useRef, useMemo } from 'react';\nimport HotelMapViewer from './components/HotelMapViewer';"
    );
}

// 2. Replace the fake map block
const mapTarget = `          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-bold text-lg text-gray-900 mb-3">{t('location')}</h3>
            <div onClick={() => setIsMapOpen(true)} className="relative h-48 bg-stone-100 rounded-2xl overflow-hidden cursor-pointer group border border-gray-200">
              <div className="absolute inset-0 opacity-40 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Mecca_street_map.png')] bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-500" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 group-hover:bg-black/10 transition-colors">
                <button className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 transform group-hover:scale-105 transition-transform"><MapPin size={16} className="text-emerald-600" />{t('interactiveMap')}</button>
              </div>
            </div>
          </div>`;

const mapReplacement = `          <div className="border-t border-gray-100 pt-6">
            <HotelMapViewer 
              lang={lang} 
              hotelName={hotel?.name} 
              latitude={hotel?.coordinates?.lat} 
              longitude={hotel?.coordinates?.lng} 
            />
          </div>`;

content = content.replace(mapTarget, mapReplacement);

fs.writeFileSync(file, content);
console.log('App.jsx updated successfully with HotelMapViewer');

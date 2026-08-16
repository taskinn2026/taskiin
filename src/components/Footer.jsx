import React, { useState, useEffect } from 'react';
import { commonService } from '../services/commonService';
import logo from '../assets/logo.png';

export const Footer = ({ lang, onPageClick }) => {
  const [links, setLinks] = useState([]);
  useEffect(() => {
    const fetchLinks = async () => {
      const data = await commonService.getAppSettings('footer_links');
      if (data && Array.isArray(data)) {
        setLinks(data);
      } else {
        // Default fallback
        setLinks([
          { title: 'من نحن', url: '/#about' },
          { title: 'الشروط والأحكام', url: '/#terms' },
          { title: 'تواصل معنا', url: '/#contact' }
        ]);
      }
    };
    fetchLinks();
  }, []);

  return (
    <footer className="bg-gray-900 text-white py-12 mt-auto w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 flex items-center gap-2">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src={logo} alt="Talbiyah" className="w-full h-full object-contain filter brightness-0 invert opacity-80" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">{lang === 'ar' ? 'تلبية' : 'Talbia'}<span className="text-emerald-400">{lang === 'ar' ? 'تسكين' : 'Taskin'}</span></span>
          </div>
          <div className="md:col-span-3 flex flex-wrap gap-x-8 gap-y-4 md:justify-end">
            {links.map((link, idx) => {
              const isInternal = link.url && link.url.startsWith('#page=');
              return (
                <a key={idx} href={isInternal ? '#' : link.url} onClick={(e) => {
                  if (isInternal && onPageClick) {
                    e.preventDefault();
                    onPageClick(link.url.split('=')[1]);
                  } else if (isInternal && !onPageClick) {
                     window.location.href = '/' + link.url;
                  }
                }} className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                  {link.title}
                </a>
              );
            })}
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Talbia Taskin. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
        </div>
      </div>
    </footer>
  );
};

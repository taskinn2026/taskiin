import React, { useState, useEffect } from 'react';
import { commonService } from '../services/commonService';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Footer } from './Footer';

export default function CustomPageViewer({ slug, onBack, lang }) {
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPage = async () => {
            setLoading(true);
            try {
                const data = await commonService.getCustomPageBySlug(slug);
                setPage(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadPage();
    }, [slug]);

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex items-center sticky top-0 z-30 shadow-sm">
                <button onClick={onBack} className="p-2 -mx-2 hover:bg-gray-100 rounded-xl text-gray-700 mr-2 rtl:ml-2 rtl:mr-0 transition-colors">
                    {lang === 'ar' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                </button>
                <h1 className="text-xl font-bold text-gray-900">
                    {loading ? (lang === 'ar' ? 'جاري التحميل...' : 'Loading...') : page?.title || (lang === 'ar' ? 'الصفحة غير موجودة' : 'Page Not Found')}
                </h1>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div>
                    </div>
                ) : page ? (
                    <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
                        <div className="prose prose-emerald max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {page.content}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{lang === 'ar' ? 'عذراً، هذه الصفحة غير موجودة' : 'Sorry, page not found'}</h2>
                        <p className="text-gray-500">{lang === 'ar' ? 'ربما تم حذفها أو أن الرابط غير صحيح.' : 'It might have been deleted or the link is incorrect.'}</p>
                        <button onClick={onBack} className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">
                            {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
                        </button>
                    </div>
                )}
            </main>
            <Footer lang={lang} onPageClick={(slug) => { window.location.href = '/#page=' + slug; }} />
        </div>
    );
}

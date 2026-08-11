import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { commonService } from '../services/commonService';
import { Plus, Edit, Trash2, Save, X, Eye } from 'lucide-react';

export default function AdminPagesSection({ t, lang }) {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentForm, setCurrentForm] = useState({ id: null, title: '', slug: '', content: '' });

    const fetchPages = async () => {
        setLoading(true);
        try {
            const data = await commonService.getCustomPages();
            setPages(data);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPages();
    }, []);

    const handleSave = async () => {
        if (!currentForm.title || !currentForm.slug || !currentForm.content) {
            toast.error(lang === 'ar' ? 'يرجى تعبئة جميع الحقول' : 'Please fill all fields');
            return;
        }
        
        // Ensure slug is url-friendly
        const slugFormatted = currentForm.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

        try {
            if (currentForm.id) {
                await commonService.updateCustomPage(currentForm.id, {
                    title: currentForm.title,
                    slug: slugFormatted,
                    content: currentForm.content
                });
                toast.success(lang === 'ar' ? 'تم التعديل بنجاح' : 'Updated successfully');
            } else {
                await commonService.createCustomPage({
                    title: currentForm.title,
                    slug: slugFormatted,
                    content: currentForm.content
                });
                toast.success(lang === 'ar' ? 'تم الإنشاء بنجاح' : 'Created successfully');
            }
            setIsEditing(false);
            fetchPages();
        } catch (e) {
            toast.error(e.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(lang === 'ar' ? 'تأكيد الحذف؟' : 'Confirm delete?')) return;
        try {
            await commonService.deleteCustomPage(id);
            toast.success(lang === 'ar' ? 'تم الحذف' : 'Deleted');
            fetchPages();
        } catch (e) {
            toast.error(e.message);
        }
    };

    if (isEditing) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">{currentForm.id ? (lang === 'ar' ? 'تعديل صفحة' : 'Edit Page') : (lang === 'ar' ? 'صفحة جديدة' : 'New Page')}</h2>
                    <button onClick={() => setIsEditing(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl"><X size={20} /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{lang === 'ar' ? 'عنوان الصفحة' : 'Page Title'}</label>
                        <input type="text" value={currentForm.title} onChange={e => setCurrentForm({...currentForm, title: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{lang === 'ar' ? 'الرابط (Slug)' : 'Slug (URL)'}</label>
                        <input type="text" value={currentForm.slug} onChange={e => setCurrentForm({...currentForm, slug: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-emerald-500" dir="ltr" placeholder="e.g. about-us" />
                        <p className="text-xs text-gray-400 mt-1">{lang === 'ar' ? 'يجب أن يحتوي على حروف إنجليزية وأرقام وشرطات فقط' : 'Only english letters, numbers, and hyphens'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{lang === 'ar' ? 'المحتوى' : 'Content'}</label>
                        <textarea value={currentForm.content} onChange={e => setCurrentForm({...currentForm, content: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-emerald-500 h-64 resize-y"></textarea>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"><Save size={18} /> {t.save}</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">{lang === 'ar' ? 'إدارة الصفحات' : 'Manage Pages'}</h2>
                <button onClick={() => { setCurrentForm({ id: null, title: '', slug: '', content: '' }); setIsEditing(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-700">
                    <Plus size={16} />
                    {lang === 'ar' ? 'إضافة صفحة' : 'Add Page'}
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-800 mx-auto"></div></div>
            ) : pages.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-500">{lang === 'ar' ? 'لا توجد صفحات' : 'No pages found'}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pages.map(page => (
                        <div key={page.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                            <h3 className="font-bold text-gray-900 mb-1">{page.title}</h3>
                            <p className="text-sm text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded inline-block" dir="ltr">/{page.slug}</p>
                            
                            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setCurrentForm(page); setIsEditing(true); }} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><Edit size={16} /></button>
                                <button onClick={() => handleDelete(page.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

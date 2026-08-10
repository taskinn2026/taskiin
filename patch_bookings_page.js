const fs = require('fs');

const file = 'c:/Users/AMER/Desktop/projects Antigravity/ttaskinn/src/components/BookingsPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add handleTogglePartnerSearch
const target1 = `    const handleCancelConfirm = async () => {`;
const replace1 = `    const handleTogglePartnerSearch = async (bookingId, currentVal) => {
        try {
            const { error } = await supabase.from('bookings').update({ partner_search_active: !currentVal }).eq('id', bookingId);
            if (error) throw error;
            if (showToast) showToast(lang === 'ar' ? 'تم التحديث بنجاح' : 'Updated successfully');
            await refreshBookings();
            setSelectedBooking(prev => prev ? { ...prev, partner_search_active: !currentVal } : null);
        } catch (e) {
            console.error(e);
            if (showToast) showToast(lang === 'ar' ? 'فشل التحديث' : 'Update failed');
        }
    };

    const handleCancelConfirm = async () => {`;

if (!content.includes('handleTogglePartnerSearch')) {
    content = content.replace(target1, replace1);
}

// 2. Add the toggle UI inside the selectedBooking modal
// Under the status block near line 300
const target2 = `                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm text-gray-600">{t.status}</span>
                            <StatusBadge status={selectedBooking.status} t={t} />
                        </div>`;

const replace2 = `                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm text-gray-600">{t.status}</span>
                            <StatusBadge status={selectedBooking.status} t={t} />
                        </div>

                        {/* Partner Search Toggle (Only for confirmed/paid bookings) */}
                        {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'paid') && (
                            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{lang === 'ar' ? 'أبحث عن شريك غرفة' : 'Looking for Roommate'}</h4>
                                    <p className="text-xs text-gray-600">{lang === 'ar' ? 'سيظهر ملفك للآخرين للتواصل معك' : 'Your profile will be visible to others'}</p>
                                </div>
                                <button 
                                    onClick={() => handleTogglePartnerSearch(selectedBooking.id, selectedBooking.partner_search_active)} 
                                    className={\`w-12 h-7 rounded-full relative transition-colors \${selectedBooking.partner_search_active ? 'bg-emerald-600' : 'bg-gray-300'}\`}
                                >
                                    <span className={\`absolute w-5 h-5 bg-white rounded-full top-1 transition-all shadow \${selectedBooking.partner_search_active ? (lang === 'ar' ? 'left-1' : 'right-1') : (lang === 'ar' ? 'right-1' : 'left-1')}\`}></span>
                                </button>
                            </div>
                        )}`;

if (!content.includes("Looking for Roommate")) {
    content = content.replace(target2, replace2);
}

fs.writeFileSync(file, content);
console.log('BookingsPage.jsx successfully patched.');

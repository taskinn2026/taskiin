import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';

// Helper to dispatch visual logs
const dispatchNetworkEvent = (method, url, status = 'OK') => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('network-request', {
            detail: { method, url, timestamp: new Date(), status }
        }));
    }
};

export const commonService = {
    // 2.4 Save Search
    saveSearch: async (userId, searchParams) => {
        if (!userId) return;
        const { error } = await supabase
            .from('saved_searches')
            .insert([{
                user_id: userId,
                city: searchParams.city,
                check_in: searchParams.dates?.start,
                check_out: searchParams.dates?.end,
                guests: searchParams.capacity,
                // created_at is auto
            }]);

        dispatchNetworkEvent('POST', '/saved_searches', error ? 'ERROR' : 'OK');

        if (error) console.error('Error saving search:', error);
    },

    // 8. Notifications
    getNotifications: async (userId) => {
        console.log('[Network] GET /notifications');
        dispatchNetworkEvent('GET', '/notifications');
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('receiver_id', userId)
            .eq('is_read', false)
            .neq('type', 'chat') // Exclude chat notifications
            .order('created_at', { ascending: false });

        if (error) return [];
        return data;
    },

    markNotificationRead: async (notifId) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
        dispatchNetworkEvent('PATCH', `/notifications/${notifId}`);
    },

    markAllNotificationsAsRead: async (userId) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('receiver_id', userId)
            .eq('is_read', false);
        if (error) console.error("Failed to mark all notifications read", error);
        dispatchNetworkEvent('PATCH', `/notifications/mark-all-read`);
    },

    subscribeToNotifications: (userId, callback) => {
        return supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `receiver_id=eq.${userId}`
                },
                (payload) => {
                    callback(payload.new);
                }
            )
            .subscribe();
    },

    // 9. Banners
    getBanners: async () => {
        dispatchNetworkEvent('GET', '/banners');
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .order('position', { ascending: true });
        if (error) return [];
        return data;
    },

    getAllBanners: async () => {
        dispatchNetworkEvent('GET', '/banners/all');
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .order('position', { ascending: true });
        if (error) return [];
        return data;
    },

    // 6. Settings (Footer, etc)
    getAppSettings: async (key) => {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', key)
            .maybeSingle();
        if (error) {
            console.error('Error fetching settings:', error);
            return null;
        }
        return data?.value || null;
    },

    updateAppSettings: async (key, value) => {
        const { error } = await supabase
            .from('app_settings')
            .upsert({ key, value }, { onConflict: 'key' });
        if (error) throw error;
        return true;
    },

    toggleBanner: async (id, isActive) => {
        const { error } = await supabase
            .from('banners')
            .update({ is_active: isActive })
            .eq('id', id);
        if (error) throw error;
    },

    createBanner: async (bannerData) => {
        const { error } = await supabase
            .from('banners')
            .insert([bannerData]);
        if (error) throw error;
    },

    updateBanner: async (id, bannerData) => {
        const { error } = await supabase
            .from('banners')
            .update(bannerData)
            .eq('id', id);
        if (error) throw error;
    },

    // ========== SEASON BANNERS (New Table) ========== //
    getAdminSeasonBanners: async () => {
        const { data, error } = await supabase
            .from('season_banners')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    getActiveSeasonBanner: async (role) => {
        // Fetch the active banner that matches the role or 'all'
        let query = supabase.from('season_banners').select('*').eq('is_active', true);
        if (role) {
            query = query.in('target_role', ['all', role]);
        }
        const { data, error } = await query.limit(1).maybeSingle();
        if (error) throw error;
        return data;
    },

    createSeasonBanner: async (bannerData) => {
        const { error } = await supabase
            .from('season_banners')
            .insert([bannerData]);
        if (error) throw error;
    },

    updateSeasonBanner: async (id, bannerData) => {
        const { error } = await supabase
            .from('season_banners')
            .update(bannerData)
            .eq('id', id);
        if (error) throw error;
    },

    toggleSeasonBanner: async (id, isActive) => {
        const { error } = await supabase
            .from('season_banners')
            .update({ is_active: isActive })
            .eq('id', id);
        if (error) throw error;
    },

    deleteSeasonBanner: async (id) => {
        const { error } = await supabase
            .from('season_banners')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    uploadBannerImage: async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        let fileToUpload = file;
        try {
            const options = {
                maxSizeMB: 0.3,
                maxWidthOrHeight: 1280,
                useWebWorker: true,
            };
            fileToUpload = await imageCompression(file, options);
        } catch (error) {
            console.error('Error compressing image:', error);
        }

        const { error: uploadError } = await supabase.storage
            .from('banners')
            .upload(filePath, fileToUpload, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('rooms').getPublicUrl(filePath);
        return data.publicUrl;
    }
};


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

export const authService = {
    // 1.1 Login
    signIn: async (email, password) => {
        console.log('[Network] POST /auth/token');
        dispatchNetworkEvent('POST', '/auth/token');
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;

        // Fetch profile and role
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        return { user: data.user, profile };
    },

    // 1.1 Support Register with Profile Creation
    signUp: async (email, password, metadata) => {
        dispatchNetworkEvent('POST', '/auth/signup');
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata, // e.g. full_name
            },
        });
        if (error) throw error;

        // Manual Profile Creation (Upsert for safety)
        if (data.user) {
            // Explicit Insert
            const { error: profileError } = await supabase.from('profiles').insert({
                id: data.user.id,
                full_name: metadata.full_name,
                role: metadata.role || 'pilgrim',
                avatar_url: metadata.avatar_url || null
            });

            // Ignore duplicate key error (23505)
            if (profileError && profileError.code !== '23505') {
                console.error('Profile creation failed:', profileError);
            }
        }

        return data;
    },

    signOut: async () => {
        dispatchNetworkEvent('POST', '/auth/logout');
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Logout error from server:', error);
        } finally {
            // Force clear local storage to ensure the user is logged out locally
            // even if the server throws a 403 or network error
            localStorage.clear();
            sessionStorage.clear();
        }
    },

    getCurrentSession: async () => {
        // Silent refresh often happens here
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    getUserProfile: async (userId) => {
        dispatchNetworkEvent('GET', `/profiles/${userId}`);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) return null;
        return data;
    },

    // 1.2 Create Profile (Insert)
    createProfile: async (profileData) => {
        const { data, error } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Legacy update support
    updateProfile: async (userId, updates) => {
        dispatchNetworkEvent('PATCH', `/profiles/${userId}`);
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select();
        if (error) throw error;
        return data?.[0];
    },

    // 1.3 Upload Avatar
    uploadAvatar: async (userId, file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        let fileToUpload = file;
        try {
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 800,
                useWebWorker: true,
            };
            fileToUpload = await imageCompression(file, options);
        } catch (error) {
            console.error('Error compressing image:', error);
        }

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, fileToUpload);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return data.publicUrl;
    }
};


import { supabase } from '../lib/supabase';

export const reviewService = {
    // Get reviews for a hotel/offer
    getReviews: async (hotelId) => {
        const { data, error } = await supabase
            .from('reviews')
            .select('*, user:profiles(full_name, avatar_url)')
            .eq('hotel_id', hotelId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reviews:', error);
            return [];
        }
        return data;
    },

    // Add a review
    addReview: async (reviewData) => {
        // reviewData: { user_id, hotel_id, offer_id, rating, comment }
        const { data, error } = await supabase
            .from('reviews')
            .insert([reviewData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

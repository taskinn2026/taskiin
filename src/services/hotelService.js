
import { supabase } from '../lib/supabase';
import { calculatePrice } from '../utils/pricing';
import imageCompression from 'browser-image-compression';

export const hotelService = {
    // 3. Featured Offers -> Returns Hotels with Offer Price
    getFeaturedOffers: async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('offers')
            .select(`
                *, 
                room:rooms(*, hotel:hotels(*)),
                bookings(
                    guests,
                    status,
                    created_at,
                    profile:profiles!bookings_user_id_fkey(id, full_name, avatar_url, privacy_settings)
                )
            `)
            .eq('status', 'approved') // Only approved offers
            .eq('room.hotel.is_active', true) // Only active hotels
            .eq('room.hotel.stop_sell', false) // Respect stop_sell
            // Allow offers with null dates or valid date range
            //.or(`available_from.is.null,available_from.lte.${today}`)
            //.or(`available_to.is.null,available_to.gte.${today}`)
            .order('id', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching featured offers:', error);
            return [];
        }

        // Map Offer to UI Hotel Card Structure
        return data.map(offer => ({
            id: offer.room.hotel.id,
            offerId: offer.id,
            owner_id: offer.room.hotel.owner_id,
            isFixedPrice: offer.is_fixed_price,
            name: offer.title || offer.room.hotel.name, // Use offer title if available
            hotelName: offer.room.hotel.name, // Always keep hotel name separately
            images: offer.room.images || offer.room.hotel.images,
            distance: offer.room.hotel.distance_to_haram_meters,
            rating: offer.room.hotel.rating,
            price: offer.discount_price || offer.price_per_night,
            originalPrice: offer.discount_price ? offer.price_per_night : null,
            capacity: offer.room.capacity || offer.room.total_beds || 2,
            available_from: offer.available_from,
            available_to: offer.available_to,
            city: offer.room.hotel.city,
            description: offer.room.hotel.description,
            room_type: offer.room.room_type,
            amenities: offer.room.amenities,
            coordinates: { lat: offer.room.hotel.latitude, lng: offer.room.hotel.longitude },
            pilgrims: (offer.bookings || [])
                .filter(b => ['confirmed', 'paid'].includes(b.status))
                .map(b => {
                    const p = b.profile;
                    if (!p) return null;
                    const privacy = p.privacy_settings || {};
                    return {
                        id: p.id,
                        name: privacy.hideName ? 'Guest' : p.full_name,
                        avatar: privacy.hidePhoto ? null : p.avatar_url,
                    };
                }).filter(Boolean)
        }));
    },

    // 4. Nearby Hotels -> Returns Hotels with "Starting" Price
    getNearbyHotels: async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('hotels')
            .select('*, rooms(offers(*))')
            .eq('is_active', true)
            .eq('stop_sell', false)
            .order('distance_to_haram_meters', { ascending: true })
            .limit(8);

        if (error) {
            console.error('Error fetching hotels:', error);
            return [];
        }

        return data.map(hotel => {
            const allOffers = hotel.rooms?.flatMap(r => r.offers) || [];
            // Filter only approved offers within valid date range
            const validOffers = allOffers.filter(o =>
                o.status === 'approved' &&
                o.available_from <= today &&
                o.available_to >= today
            );
            const price = validOffers.length > 0
                ? Math.min(...validOffers.map(o => o.discount_price || o.price_per_night))
                : 0;

            return {
                ...hotel,
                price: price,
                distance: hotel.distance_to_haram_meters,
                occupancyStatus: validOffers.length > 0 ? 'available' : 'sold_out'
            };
        });
    },

    // 2.1 City Autocomplete
    getCitySuggestions: async (query) => {
        if (!query) return [];
        const { data, error } = await supabase
            .from('hotels')
            .select('city, name')
            .ilike('name', `%${query}%`)
            .eq('is_active', true)
            .limit(5);

        if (error) return [];
        return data;
    },

    // 2.2 Hotel Name Autocomplete
    searchHotelsByName: async (query) => {
        if (!query || query.length < 2) return [];
        
        // Search by hotel name
        const { data: byName } = await supabase
            .from('hotels')
            .select('id, name, city')
            .ilike('name', `%${query}%`)
            .eq('is_active', true)
            .limit(5);

        // Search by owner's phone or phone_number
        const { data: byPhone } = await supabase
            .from('hotels')
            .select('id, name, city, owner:profiles!inner(id, phone, phone_number)')
            .eq('is_active', true)
            .or(`phone.ilike.%${query}%,phone_number.ilike.%${query}%`, { foreignTable: 'profiles' })
            .limit(5);

        const combined = [...(byName || []), ...(byPhone || [])];
        // Deduplicate by hotel id
        const uniqueHotels = Array.from(new Map(combined.map(item => [item.id, item])).values());
        
        return uniqueHotels.slice(0, 5).map(h => ({ id: h.id, name: h.name, city: h.city }));
    },

    getUniqueCities: async () => {
        const { data, error } = await supabase
            .from('hotels')
            .select('city')
            .eq('is_active', true);
        
        if (error) {
            console.error('Error fetching cities:', error);
            return [];
        }
        
        return Array.from(new Set(data.map(h => h.city).filter(Boolean)));
    },

    // 2.3 Mark Notifications Read
    markAllNotificationsRead: async (userId) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('receiver_id', userId);

        if (error) console.error("Error marking notifications read:", error);
        return !error;
    },

    // 2.4 Search -> Returns Offers (mapped to Hotel Cards)
    searchHotels: async (filters) => {
        // Strict Performance: Filter in DB as much as possible

        // 1. Prepare Filter Values
        const cityMap = { 'مكة': 'makkah', 'مكة المكرمة': 'makkah', 'mecca': 'makkah', 'المدينة': 'madinah', 'المدينة النبوية': 'madinah', 'medina': 'madinah' };
        let cityTerm = filters?.city?.toLowerCase().trim() || '';
        // Map common spellings to standardized English that DB uses.
        if (cityMap[cityTerm]) cityTerm = cityMap[cityTerm];


        console.log(`[Search Debug] Raw Params: City="${cityTerm}", Cap=${filters?.capacity}, Type=${filters?.type}, Dates=${filters?.dates ? JSON.stringify(filters.dates) : 'None'}`);

        // 2. Build Query with !inner joins + Bookings Preview (for Avatars)
        let dbQuery = supabase
            .from('offers')
            .select(`
                *,
                room:rooms!inner(
                    *,
                    hotel:hotels!inner(*)
                ),
                bookings(
                    guests,
                    status,
                    created_at,
                    profile:profiles!bookings_user_id_fkey(id, full_name, avatar_url, privacy_settings)
                )
            `)
            .eq('status', 'approved')
            .eq('room.hotel.is_active', true)
            .eq('room.hotel.stop_sell', false)
            // Filter bookings in the relation - moved to JS or use complex query if needed for specific statuses
            // BUT for just fetching avatars, we can accept all non-cancelled or filter in JS map.
            // Supabase 'in' on joined table acts as inner join often.
            // Better to filter avatars in JS or use specific RPC if performance critical.
            // For now, let's fetch them and filter in JS to ensure OFFERS stick around.
            .order('created_at', { foreignTable: 'bookings', ascending: false })
            .limit(4, { foreignTable: 'bookings' });

        // 3. Apply DB Filters

        // A. City Filter
        if (cityTerm) {
            // Using ilike on standard term. 
            // Note: Supabase JS syntax for nested filter: .ilike('room.hotel.city', ...) works with !inner
            dbQuery = dbQuery.ilike('room.hotel.city', `%${cityTerm}%`);
        }

        // B. Date Availability (Offer Validity Period)
        if (filters?.dates?.start && filters?.dates?.end) {
            // Offer must allow bookings in this range
            dbQuery = dbQuery
                .lte('available_from', filters.dates.end)
                .gte('available_to', filters.dates.start);
        }

        // C. Capacity (Min Beds/Persons)
        // C. Capacity (Min Beds/Persons)
        if (filters?.capacity && filters.capacity !== 'all') {
            const minCap = parseInt(filters.capacity);
            if (!isNaN(minCap)) {
                // Strict equality as per user feedback (Double means Double, Triple means Triple)
                // Using .eq instead of .gte
                dbQuery = dbQuery.or(`capacity.eq.${minCap},total_beds.eq.${minCap}`, { foreignTable: 'room' });
            }
        }

        // Execute DB Query
        const { data, error } = await dbQuery;

        if (error) {
            console.error('Search error:', error);
            return [];
        }

        // Return empty if no results from DB
        if (!data || data.length === 0) return [];

        // 4. Fetch additional data needed for strict Bed Availability check (Bookings)
        // Only if we have date filters + Bed Type filter
        // Note: The 'bookings' fetched above are LIMIT 4 per offer (preview). 
        // For Availability calculation, we need ALL relevant bookings.
        // So we MUST fetch them separately if dates are involved.

        let bookingsMap = {};
        let seasonalMap = {};

        if (filters?.dates?.start && filters?.dates?.end) {
            const offerIds = data.map(o => o.id);
            const roomIds = data.map(o => o.room.id);

            // A. Seasonal Prices
            if (roomIds.length > 0) {
                const { data: prices } = await supabase
                    .from('room_prices')
                    .select('*')
                    .in('room_id', roomIds);

                prices?.forEach(p => {
                    if (!seasonalMap[p.room_id]) seasonalMap[p.room_id] = [];
                    seasonalMap[p.room_id].push(p);
                });
            }

            // B. Existing Bookings (For Bed Availability Calculation)
            if (offerIds.length > 0) {
                const { data: bookings } = await supabase
                    .from('bookings')
                    .select('offer_id, check_in, check_out, guests, booking_type')
                    .in('offer_id', offerIds)
                    .neq('status', 'cancelled')
                    .lt('check_in', filters.dates.end)
                    .gt('check_out', filters.dates.start);

                bookings?.forEach(b => {
                    if (!bookingsMap[b.offer_id]) bookingsMap[b.offer_id] = [];
                    bookingsMap[b.offer_id].push(b);
                });
            }
        }

        // 5. Client-Side Mapping & Final Filtering (Price & Exact Beds)
        const finalResults = data.map(offer => {
            // Price Calculation (Seasonal)
            let finalPrice = offer.discount_price || offer.price_per_night;
            if (filters?.dates?.start && filters?.dates?.end) {
                const total = calculatePrice(offer.price_per_night, seasonalMap[offer.room.id] || [], filters.dates.start, filters.dates.end);
                const nights = Math.max(1, Math.round((new Date(filters.dates.end) - new Date(filters.dates.start)) / (86400000)));
                finalPrice = Math.round(total / nights);
            }

            // Bed Availability Calculation
            const capacity = offer.room.capacity || offer.room.total_beds || 2;
            let maxBedsUsed = 0;
            let hasFullRoomBooking = false;

            if (filters?.dates?.start && filters?.dates?.end) {
                const offerBookings = bookingsMap[offer.id] || [];
                // ... same logic as before for beds ...
                hasFullRoomBooking = offerBookings.some(b => b.booking_type === 'room' || b.booking_type === 'full');
                if (!hasFullRoomBooking) {
                    const startDate = new Date(filters.dates.start);
                    const endDate = new Date(filters.dates.end);
                    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
                        const dayStr = d.toISOString().split('T')[0];
                        let bedsUsed = 0;
                        for (const b of offerBookings) {
                            if (dayStr >= b.check_in && dayStr < b.check_out) {
                                bedsUsed += (b.guests || 1);
                            }
                        }
                        maxBedsUsed = Math.max(maxBedsUsed, bedsUsed);
                    }
                } else {
                    maxBedsUsed = capacity;
                }
            }

            // Map Preview Pilgrims (from the limited join)
            const pilgrims = (offer.bookings || [])
                .filter(b => ['confirmed', 'paid'].includes(b.status)) // JS Filter to replace DB filter
                .map(b => {
                    const p = b.profile;
                    if (!p) return null;
                    const privacy = p.privacy_settings || {};
                    return {
                        id: p.id,
                        name: privacy.hideName ? 'Guest' : p.full_name,
                        avatar: privacy.hidePhoto ? null : p.avatar_url,
                    };
                }).filter(Boolean);

            // Should we show bed info on the card?
            const showBedInfo = filters?.type === 'bed' && filters?.dates?.start && filters?.dates?.end;

            return {
                id: offer.room.hotel.id,
                offerId: offer.id,
                owner_id: offer.room.hotel.owner_id,
                name: offer.title || offer.room.hotel.name,
                hotelName: offer.room.hotel.name,
                images: offer.room.images || offer.room.hotel.images,
                distance: offer.room.hotel.distance_to_haram_meters,
                rating: offer.room.hotel.rating,
                price: finalPrice,
                originalPrice: offer.discount_price ? offer.price_per_night : null,
                capacity: capacity,
                city: offer.room.hotel.city,
                description: offer.room.hotel.description,
                room_type: offer.room.room_type,
                total_beds: offer.room.total_beds,
                amenities: offer.room.amenities,
                coordinates: { lat: offer.room.hotel.latitude, lng: offer.room.hotel.longitude },
                // Bed info: only include when type=bed + dates selected
                _showBedInfo: showBedInfo,
                bedsUsed: showBedInfo ? maxBedsUsed : undefined,
                bedsAvailable: showBedInfo ? (hasFullRoomBooking ? 0 : Math.max(0, capacity - maxBedsUsed)) : undefined,
                isFullyBooked: (filters?.dates?.start && filters?.dates?.end) ? (hasFullRoomBooking || maxBedsUsed >= capacity) : false,
                pilgrims: pilgrims // Include for Card Avatar
            };
        }).filter(h => {
            // 5. Final JS Filters (Price & Availability Status)

            // Budget
            if (filters?.budget && h.price > filters.budget) return false;

            // Fully Booked Check (If filtering by type)
            if (filters?.type === 'bed' && h.isFullyBooked) return false;
            if (filters?.type === 'room' && h.isFullyBooked) return false; // Strict Room check? 
            // If type is room, we need WHOLE room available
            if (filters?.type === 'room' && h.bedsUsed > 0) return false;

            return true;
        });

        console.log(`[Search Debug] Final Results: ${finalResults.length} offers found.`);
        return finalResults;
    },

    getHotelDetails: async (hotelId) => {
        const { data, error } = await supabase
            .from('hotels')
            .select('*, rooms(*, offers(*))')
            .eq('id', hotelId)
            .single();

        if (error) return null;
        return data;
    },

    // --- PARTNER DASHBOARD FUNCTIONS ---

    // Get the hotel associated with the current user (owner)
    getMyHotel: async (userId) => {
        const { data, error } = await supabase
            .from('hotels')
            .select('*')
            .eq('owner_id', userId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    // Create a new hotel profile for the user
    createHotel: async (userId, hotelData) => {
        const { data, error } = await supabase
            .from('hotels')
            .insert({ ...hotelData, owner_id: userId })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    updateHotel: async (hotelId, updates) => {
        const { data, error } = await supabase
            .from('hotels')
            .update(updates)
            .eq('id', hotelId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Get Rooms for a specific hotel
    getHotelRooms: async (hotelId) => {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('hotel_id', hotelId);
        if (error) throw error;
        return data;
    },

    createRoom: async (roomData) => {
        const { data, error } = await supabase
            .from('rooms')
            .insert(roomData)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    updateRoom: async (roomId, updates) => {
        const { data, error } = await supabase
            .from('rooms')
            .update(updates)
            .eq('id', roomId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    deleteRoom: async (roomId) => {
        const { error } = await supabase
            .from('rooms')
            .delete()
            .eq('id', roomId);
        if (error) throw error;
        return true;
    },

    // Get Offers for a specific hotel's rooms
    getHotelOffers: async (hotelId) => {
        // We need offers where the room belongs to this hotel
        const { data, error } = await supabase
            .from('offers')
            .select('*, room:rooms!inner(*)')
            .eq('room.hotel_id', hotelId);

        if (error) throw error;
        return data;
    },

    createOffer: async (offerData) => {
        const { data, error } = await supabase
            .from('offers')
            .insert(offerData)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    updateOffer: async (offerId, updates) => {
        const { data, error } = await supabase
            .from('offers')
            .update(updates)
            .eq('id', offerId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    deleteOffer: async (offerId) => {
        const { error } = await supabase
            .from('offers')
            .delete()
            .eq('id', offerId);
        if (error) throw error;
        return true;
    },

    // Get Bookings for a hotel
    getHotelBookings: async (hotelId) => {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                profile:profiles!bookings_user_id_fkey(full_name, email, avatar_url),
                offer:offers!inner(
                    title,
                    price_per_night,
                    discount_price,
                    room:rooms!inner(
                        title, 
                        hotel_id
                    )
                )
            `)
            .eq('offer.room.hotel_id', hotelId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    updateBookingStatus: async (bookingId, status, extraUpdates = {}) => {
        const { error } = await supabase
            .from('bookings')
            .update({ status, ...extraUpdates })
            .eq('id', bookingId);

        if (error) throw error;
        return true;
    },

    checkInBooking: async (bookingId) => {
        const { data, error } = await supabase
            .from('bookings')
            .update({
                status: 'confirmed',
                checked_in_at: new Date().toISOString()
            })
            .eq('id', bookingId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Dashboard Stats
    getHotelStats: async (hotelId) => {
        // This would ideally be a set of optimized RPC calls or separate queries
        // For now, we'll fetch basic counts.

        // Bookings count
        const { count: bookingsCount, error: bError } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'confirmed'); // Need join logic for hotel_id if not strictly filtered, but let's assume implementation details

        // We need complex joins for strict stats, executing simple queries for now involves fetching data which might be heavy.
        // Let's rely on the client aggregating fetched bookings/rooms for MVP.
        return {};
    },

    // Finance
    getHotelWallet: async (hotelId) => {
        const { data, error } = await supabase
            .from('hotel_wallets')
            .select('*')
            .eq('hotel_id', hotelId)
            .single();
        // It's ok if it doesn't exist yet, it defaults to 0
        if (error && error.code !== 'PGRST116') throw error;
        return data || { balance: 0 };
    },

    getHotelReconciliations: async (hotelId) => {
        const { data, error } = await supabase
            .from('reconciliation_reports')
            .select('*')
            .eq('hotel_id', hotelId)
            .order('period_start', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    getHotelFinance: async (hotelId) => {
        // Fetch payouts
        const { data: payouts, error } = await supabase
            .from('payout_requests')
            .select('*')
            .eq('hotel_id', hotelId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return payouts;
    },

    // 2.2 Room Prices (Seasonal)
    getRoomPrices: async (roomId) => {
        const { data, error } = await supabase
            .from('room_prices')
            .select('*')
            .eq('room_id', roomId);
        if (error) throw error;
        return data;
    },

    addSeasonalPrice: async (priceData) => {
        // { room_id, start_date, end_date, price }
        const { data, error } = await supabase
            .from('room_prices')
            .insert([priceData])
            .select();
        if (error) throw error;
        return data;
    },

    requestPayout: async (hotelId, amount) => {
        const { data, error } = await supabase
            .from('payout_requests')
            .insert({ hotel_id: hotelId, amount })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    uploadRoomImage: async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        let fileToUpload = file;
        try {
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };
            fileToUpload = await imageCompression(file, options);
        } catch (error) {
            console.error('Error compressing image:', error);
        }

        const { error: uploadError } = await supabase.storage
            .from('rooms')
            .upload(filePath, fileToUpload);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('rooms').getPublicUrl(filePath);
        return data.publicUrl;
    },

    getNotifications: async (ownerId) => {
        const { data } = await supabase.from('notifications')
            .select('*').eq('receiver_id', ownerId).neq('type', 'chat').order('created_at', { ascending: false }).limit(10);
        return data || [];
    },

    subscribeToNotifications: (ownerId, callback) => {
        return supabase.channel('hotel-notifs-' + ownerId)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiver_id=eq.${ownerId}` },
                payload => {
                    if (payload.new.type !== 'chat') callback(payload.new);
                }
            ).subscribe();
    },

    markAllNotificationsRead: async (ownerId) => {
        const { error } = await supabase.from('notifications').update({ is_read: true }).eq('receiver_id', ownerId).eq('is_read', false);
        if (error) console.error("Failed to mark all notifications read", error);
    },

    createTestNotification: async (ownerId) => {
        const { error } = await supabase.from('notifications').insert({
            receiver_id: ownerId,
            title: 'Test Notification',
            body: 'This is a test alert from the system.',
        });
        if (error) throw error;
    }
};

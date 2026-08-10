
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mfwovozywkmsdyebmpav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1md292b3p5d2ttc2R5ZWJtcGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzA5MTYsImV4cCI6MjA4MzEwNjkxNn0.eBd1H-Ydm7xPBHTsvCmMgQSJYWEJa3HDhgRX3b918q0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fetchOffers() {
    console.log("--- Debugging Offers Fetch ---");

    try {
        // Run the query exactly as hotelService (after fix)
        // Note: removed !inner logic for simpler JS execution if needed, but keeping it to test accuracy
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
                    status
                )
            `)
            .eq('status', 'approved')
            .eq('room.hotel.is_active', true)
            .eq('room.hotel.stop_sell', false)
            .limit(5);

        const { data, error } = await dbQuery;

        if (error) {
            console.error("Query Error:", error);
            process.exit(1);
        }

        console.log(`Found ${data?.length || 0} offers.`);

        if (data && data.length > 0) {
            console.log("First Offer:", data[0].title);
            console.log("Associated Hotel:", data[0].room.hotel.name);
            console.log("Bookings Count:", data[0].bookings.length);
        } else {
            console.log("NO OFFERS FOUND.");
        }
        process.exit(0);

    } catch (e) {
        console.error("Execution Error:", e);
        process.exit(1);
    }
}

fetchOffers();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'VITE_SUPABASE_URL_PLACEHOLDER',
    'VITE_SUPABASE_ANON_KEY_PLACEHOLDER'
);

async function testQuery() {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            total_price,
            profile:profiles(full_name),
            offer:offers(room:rooms(hotel:hotels(name)))
        `)
        .order('created_at', { ascending: false })
        .limit(2);

    console.log("Error?", error);
    console.log("Data?", data);
}

testQuery();

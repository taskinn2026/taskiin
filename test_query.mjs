import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://mfwovozywkmsdyebmpav.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1md292b3p5d2ttc2R5ZWJtcGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzA5MTYsImV4cCI6MjA4MzEwNjkxNn0.eBd1H-Ydm7xPBHTsvCmMgQSJYWEJa3HDhgRX3b918q0'
);

async function testQuery() {
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .limit(1);

    console.log("Error?", error);
    console.log("Data Keys:", data && data.length > 0 ? Object.keys(data[0]) : "No data");
    console.log("First Row:", data?.[0]);
}

testQuery();


import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mfwovozywkmsdyebmpav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1md292b3p5d2ttc2R5ZWJtcGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzA5MTYsImV4cCI6MjA4MzEwNjkxNn0.eBd1H-Ydm7xPBHTsvCmMgQSJYWEJa3HDhgRX3b918q0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCities() {
    console.log("--- Checking Hotel Cities ---");
    try {
        const { data, error } = await supabase
            .from('hotels')
            .select('id, name, city')
            .limit(10);

        if (error) {
            console.error(error);
            process.exit(1);
        }

        console.log("Found Hotels:", data);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkCities();

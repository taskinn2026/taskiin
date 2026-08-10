const fs = require('fs');

const file = 'c:/Users/AMER/Desktop/projects Antigravity/ttaskinn/src/services/pilgrimService.js';
let content = fs.readFileSync(file, 'utf8');

const getRoommatesTarget1 = `      .in('offer_id', offerIds)
      .eq('status', 'confirmed')
      .neq('user_id', userId);`;

const getRoommatesReplacement1 = `      .in('offer_id', offerIds)
      .eq('status', 'confirmed')
      .neq('user_id', userId)
      .eq('partner_search_active', true);`;

// There are two getRoommates functions in this file. (lines 94 and 600)
content = content.replace(getRoommatesTarget1, getRoommatesReplacement1);

const getRoommatesTarget2 = `      .in('offer_id', offerIds)
      .neq('user_id', userId)
      .in('status', ['confirmed', 'paid'])
      .order('check_in', { ascending: false });`;

const getRoommatesReplacement2 = `      .in('offer_id', offerIds)
      .neq('user_id', userId)
      .in('status', ['confirmed', 'paid'])
      .eq('partner_search_active', true)
      .order('check_in', { ascending: false });`;

content = content.replace(getRoommatesTarget2, getRoommatesReplacement2);

const fetchMyOfferIdsTarget = `      const { data: myBookings } = await supabase
        .from('bookings')
        .select('offer_id')
        .eq('user_id', userId)
        .eq('status', 'confirmed');`;

const fetchMyOfferIdsReplacement = `      const { data: myBookings } = await supabase
        .from('bookings')
        .select('offer_id')
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .eq('partner_search_active', true);`;

content = content.replace(fetchMyOfferIdsTarget, fetchMyOfferIdsReplacement);

fs.writeFileSync(file, content);
console.log('pilgrimService patched to require partner_search_active = true');

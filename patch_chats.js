const fs = require('fs');

const file = 'c:/Users/AMER/Desktop/projects Antigravity/ttaskinn/src/services/pilgrimService.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add hotel query to getChats
const profileQueryTarget = `    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, privacy_settings')
      .in('id', Array.from(allUserIds));

    // Create a map for quick lookup
    const profileMap = (profiles || []).reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});`;

const profileQueryReplacement = `    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, privacy_settings')
      .in('id', Array.from(allUserIds));

    // Fetch hotels for these users just in case they are hotel owners
    const { data: hotels } = await supabase
      .from('hotels')
      .select('owner_id, name, images')
      .in('owner_id', Array.from(allUserIds));

    // Create a map for quick lookup
    const profileMap = (profiles || []).reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    const hotelMap = (hotels || []).reduce((acc, h) => {
      // Handle the case where the name field is JSONB (localization)
      const hotelName = typeof h.name === 'object' ? (h.name.ar || h.name.en || 'Hotel') : h.name;
      acc[h.owner_id] = { name: hotelName, avatar: h.images?.[0] };
      return acc;
    }, {});`;

if (!content.includes('const hotelMap =')) {
    content = content.replace(profileQueryTarget, profileQueryReplacement);
}

// 2. Filter empty conversations and use hotel profile
const transformTarget = `    // 4. Transform and Attach Profiles
    return conversations.map(c => {
      // Find "other" participant
      const otherPart = c.participants?.find(p => p.user_id !== userId);
      const otherProfile = otherPart ? profileMap[otherPart.user_id] : null;

      const sortedMessages = c.messages?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const lastMsg = sortedMessages?.[0];
      const unreadCount = c.messages?.filter(m => m.sender_id !== userId && !m.read_at).length || 0;

      return {
        id: c.id,
        userId: otherPart?.user_id,
        user: otherProfile?.full_name || 'Guest',
        img: otherProfile?.avatar_url,
        lastMsg: lastMsg?.message,
        time: lastMsg?.created_at,
        unread: unreadCount
      };
    });`;

const transformReplacement = `    // 4. Transform and Attach Profiles
    return conversations
      .filter(c => c.messages && c.messages.length > 0) // Hide empty phantom chats
      .map(c => {
      // Find "other" participant
      const otherPart = c.participants?.find(p => p.user_id !== userId);
      
      const otherProfile = otherPart ? profileMap[otherPart.user_id] : null;
      const hotelOwnerProfile = otherPart ? hotelMap[otherPart.user_id] : null;

      const sortedMessages = c.messages?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const lastMsg = sortedMessages?.[0];
      const unreadCount = c.messages?.filter(m => m.sender_id !== userId && !m.read_at).length || 0;

      // Prefer hotel details if they are a hotel owner, else normal profile, else Guest
      const displayName = hotelOwnerProfile?.name || otherProfile?.full_name || 'Guest';
      const displayImg = hotelOwnerProfile?.avatar || otherProfile?.avatar_url;

      return {
        id: c.id,
        userId: otherPart?.user_id,
        user: displayName,
        img: displayImg,
        lastMsg: lastMsg?.message,
        time: lastMsg?.created_at,
        unread: unreadCount
      };
    });`;

if (!content.includes('.filter(c => c.messages && c.messages.length > 0)')) {
    content = content.replace(transformTarget, transformReplacement);
}

fs.writeFileSync(file, content);
console.log('pilgrimService.js patched for chats');

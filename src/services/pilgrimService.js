import { supabase } from '../lib/supabase';

// Helper to dispatch visual logs
const dispatchNetworkEvent = (method, url, status = 'OK') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('network-request', {
      detail: { method, url, timestamp: new Date(), status }
    }));
  }
};

// Image Placeholder to handle missing schema column
const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500';

export const pilgrimService = {
  // 1. My Bookings
  getBookings: async (userId) => {

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        payments (*),
        offer:offers (
          *,
          room:rooms (
            *,
            hotel:hotels (*)
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    dispatchNetworkEvent('GET', '/bookings', error ? 'ERROR' : 'OK');

    if (error) throw error;

    return data.map(b => ({
      ...b,
      offer: {
        ...b.offer,
        hotel: {
          ...b.offer?.room?.hotel,
          images: [PLACEHOLDER_IMG]
        },
        title: b.offer?.title
      }
    }));
  },

  // 1a. Single Booking Fetch (For Realtime INSERT)
  getBooking: async (bookingId) => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        offer:offers (
          *,
          room:rooms (
            *,
            hotel:hotels (*)
          )
        )
      `)
      .eq('id', bookingId)
      .single();

    dispatchNetworkEvent('GET', `/bookings/${bookingId}`, error ? 'ERROR' : 'OK');

    if (error) throw error;

    return {
      ...data,
      offer: {
        ...data.offer,
        hotel: {
          ...data.offer?.room?.hotel,
          images: [PLACEHOLDER_IMG]
        },
        title: data.offer?.title
      }
    };
  },

  cancelBooking: async (bookingId) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);
    if (error) throw error;
  },

  // 2. Roommates
  getRoommates: async (userId, knownOfferIds = null) => {
    let offerIds = knownOfferIds;

    // If ids not provided, fetch them (fallback)
    if (!offerIds) {
      const { data: myBookings } = await supabase
        .from('bookings')
        .select('offer_id')
        .eq('user_id', userId)
        .in('status', ['confirmed', 'paid', 'completed']);
      offerIds = myBookings?.map(b => b.offer_id) || [];
    }

    if (!offerIds.length) return [];

    // 2. Find other bookings for these offers
    // Use Batching: .in('offer_id', offerIds)
    // Use Nested Select: profile:profiles(...)
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        offer_id,
        check_in,
        check_out,
        profile:profiles!bookings_user_id_fkey (id, full_name, avatar_url, city, bio_tags, privacy_settings)
      `)
      .in('offer_id', offerIds)
      .in('status', ['confirmed', 'paid', 'completed'])
      .neq('user_id', userId);

    if (error) {
      console.warn("Roommates fetch failed", error);
      return [];
    }

    return data.map(b => ({
      id: b.id,
      booking_id: b.id,
      offer_id: b.offer_id,
      check_in: b.check_in,
      check_out: b.check_out,
      user_id: b.profile?.id,
      profile: b.profile || {}
    })).filter(r => r.profile?.id); // Filter out invalid profiles
  },

  // 3. Chats
  // Get recent messages for dropdown (grouped by sender)
  getRecentMessagesWithSenders: async (userId) => {
    // 1. Find conversations where I am a participant
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (!participations?.length) return [];
    const conversationIds = participations.map(p => p.conversation_id);

    // 2. Fetch messages AND sender profiles in ONE query
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id (id, full_name, avatar_url, privacy_settings)
      `)
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to fetch recent messages:', error);
      return [];
    }

    if (!messages?.length) return [];

    // 3. Group by sender logic (Client side aggregation is fine)
    const grouped = messages.reduce((acc, msg) => {
      const senderId = msg.sender_id;
      if (!acc[senderId]) {
        const privacy = msg.sender?.privacy_settings || {};
        const safeName = privacy.hideName ? 'Guest' : (msg.sender?.full_name || 'Guest');
        const safeAvatar = privacy.hidePhoto ? null : msg.sender?.avatar_url;

        acc[senderId] = {
          ...msg,
          sender: {
            ...msg.sender,
            full_name: safeName,
            avatar_url: safeAvatar
          },
          count: 0,
          ids: [],
          unread_count: 0
        };
      }
      acc[senderId].count += 1;
      acc[senderId].ids.push(msg.id);
      if (!msg.read_at) acc[senderId].unread_count += 1;
      return acc;
    }, {});

    // 4. Check roommate status (Optimized: Check bookings cache OR simple shared offer check)
    // We'll skip complex roommate check here to save requests unless essential.
    // If essential, we assume one extra request is okay vs N+1.

    return Object.values(grouped);
  },

  // Mark multiple messages as read
  markMessagesAsRead: async (messageIds) => {
    if (!messageIds.length) return;
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds);
    if (error) throw error;
  },

  // Get total unread count
  getUnreadCount: async (userId) => {
    console.log('[Network] GET /conversation_participants (unread count)');
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (!participations || participations.length === 0) return 0;
    const conversationIds = participations.map(p => p.conversation_id);

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .is('read_at', null);

    if (error) return 0;
    return count;
  },

  markAllMessagesAsRead: async (userId) => {
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (!participations?.length) return;
    const conversationIds = participations.map(p => p.conversation_id);

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .is('read_at', null);
  },
  getChats: async (userId) => {
    // 1. Get IDs of conversations where I am a participant
    const { data: myConvos, error: partError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (partError) {
      console.error('[getChats] Error fetching participations:', partError);
      return [];
    }

    if (!myConvos || myConvos.length === 0) return [];

    const conversationIds = myConvos.map(c => c.conversation_id);

    // 2. Fetch full conversation details for these IDs (including ALL participants)
    // 2. Fetch conversations and participants (without joining profiles directly due to missing FK)
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (message, created_at, sender_id, read_at),
        participants:conversation_participants (user_id)
      `)
      .in('id', conversationIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getChats] Error:', error);
      return [];
    }

    // 3. Manually fetch profiles for all participants
    // Extract all unique user IDs from participants
    const allUserIds = new Set();
    conversations.forEach(c => {
      c.participants?.forEach(p => {
        if (p.user_id) allUserIds.add(p.user_id);
      });
    });

    // Fetch profiles
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
      const hotelName = typeof h.name === 'object' ? (h.name?.ar || h.name?.en || 'Hotel') : h.name;
      acc[h.owner_id] = { name: hotelName, avatar: h.images?.[0] };
      return acc;
    }, {});

    // 4. Transform and Attach Profiles
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
        const privacy = otherProfile?.privacy_settings || {};
        const isHideName = privacy?.hideName || false;
        const isHidePhoto = privacy?.hidePhoto || false;

        const isRoommateChat = c.type === 'roommate';

        const displayName = (isRoommateChat ? null : hotelOwnerProfile?.name) || (isHideName ? 'Guest' : otherProfile?.full_name) || 'Guest';
        const displayImg = (isRoommateChat ? null : hotelOwnerProfile?.avatar) || (isHidePhoto ? null : otherProfile?.avatar_url);

        return {
          id: c.id,
          userId: otherPart?.user_id,
          user: displayName,
          img: displayImg,
          lastMsg: lastMsg?.message,
          time: lastMsg?.created_at,
          unread: unreadCount
        };
      });
  },

  // 3b. Single Conversation Fetch (For Realtime INSERT)
  getConversation: async (conversationId, myUserId) => {
    // 1. Fetch conversation details
    const { data: conv, error } = await supabase
      .from('conversations')
      .select(`*, messages (message, created_at, sender_id)`)
      .eq('id', conversationId)
      .single();

    dispatchNetworkEvent('GET', `/conversations/${conversationId}`, error ? 'ERROR' : 'OK');

    if (error) return null;

    // 2. Fetch specific participants
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId);

    // 3. Find other user
    const otherUserId = participants?.find(p => p.user_id !== myUserId)?.user_id;
    if (!otherUserId) return null;

    // 4. Get Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', otherUserId)
      .single();

    // 5. Format
    const sortedMessages = conv.messages?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const lastMsg = sortedMessages?.[0];

    return {
      id: conv.id,
      userId: otherUserId,
      user: profile?.full_name || 'Guest',
      img: profile?.avatar_url,
      lastMsg: lastMsg?.message,
      time: lastMsg?.created_at,
      unread: 0
    };
  },

  // 4. Favorites
  getFavorites: async (userId) => {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        offer:offers (
          *,
          room:rooms (
            *,
            hotel:hotels (*)
          )
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    return data.map(f => {
      const offer = f.offer;
      const room = offer?.room;
      const hotel = room?.hotel;
      if (!hotel) return null;

      return {
        ...hotel,
        offerId: offer.id, // Consistent casing
        offerTitle: offer.title,
        hotelName: hotel.name,
        price: offer.discount_price || offer.price_per_night,
        originalPrice: offer.discount_price ? offer.price_per_night : null,
        images: room.images || hotel.images || [PLACEHOLDER_IMG],
        distance: hotel.distance_to_haram_meters + 'm',
        room_type: room.room_type,
        capacity: room.capacity,
        amenities: room.amenities
      };
    }).filter(Boolean);
  },

  removeFavorite: async (userId, offerId) => {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('offer_id', offerId);
    if (error) throw error;
  },

  // 5. Payments
  // 5. Payments
  getPayments: async (userId) => {
    console.log('[Network] GET /payments');
    dispatchNetworkEvent('GET', '/payments');
    // Payments linked to bookings
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        booking:bookings!inner(user_id) 
      `)
      .eq('booking.user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Chat Interactions
  getMessages: async (conversationId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  getUnreadMessagesWithSenders: async (userId) => {
    console.log('[pilgrimService] getUnreadMessagesWithSenders called for:', userId);

    // 1. Find conversations
    const { data: participations, error: partError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (partError) {
      console.error('[pilgrimService] Error fetching participations:', partError);
      return [];
    }

    console.log('[pilgrimService] Participations found:', participations?.length);

    if (!participations || participations.length === 0) {
      console.warn('[pilgrimService] No participations found for user.');
      return [];
    }

    const conversationIds = participations.map(p => p.conversation_id);
    console.log('[pilgrimService] Querying messages for conversation IDs:', conversationIds);

    // 2. Fetch unread messages (without join first to avoid 400 error)
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .is('read_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[pilgrimService] Error fetching messages:', error);
      throw error;
    }

    if (!messages || messages.length === 0) return [];

    // 3. Manually fetch profiles for these senders
    const senderIds = [...new Set(messages.map(m => m.sender_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, privacy_settings')
      .in('id', senderIds);

    // 4. Attach profile to message
    const messagesWithSender = messages.map(msg => {
      const sender = profiles?.find(p => p.id === msg.sender_id);
      return {
        ...msg,
        sender: sender || { full_name: 'Guest', avatar_url: null }
      };
    });

    console.log('[pilgrimService] Unread messages fetched:', messagesWithSender.length);
    return messagesWithSender;
  },

  sendMessage: async (conversationId, senderId, message, senderRole = 'user') => {
    // 1. Insert Message
    const { data: msgData, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        message: message,
        sender_role: senderRole
      })
      .select()
      .single();
    if (error) throw error;

    // 2. Notification Logic
    // We explicitly restored Client-Side notifications relying on a custom RLS Policy
    // which gracefully preventsQUIC_PROTOCOL_ERROR WebSocket hangs that DB Triggers were causing.
    try {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id, last_seen_at')
        .eq('conversation_id', conversationId)
        .neq('user_id', senderId);

      if (participants && participants.length > 0) {
        for (const receiver of participants) {
          let bodyText = 'رسالة جديدة من معتمر (الشريك المحتمل)';

          // Only send the notification if we don't have network errors.
          // Note: The insert might silently fail if the RLS policy isn't applied, but won't crash the WebSocket.
          const { error: notifError } = await supabase.from('notifications').insert({
            receiver_id: receiver.user_id,
            title: 'رسالة جديدة',
            body: bodyText,
            type: 'chat',
            data: { conversation_id: conversationId },
            created_at: new Date().toISOString()
          });

          if (notifError) {
            console.error("[pilgrimService] Failed to insert manual notification:", notifError);
          }
        }
      }
    } catch (e) {
      console.error("Failed to execute chat notification logic:", e);
    }
  },

  subscribeToMessages: (conversationId, callback) => {
    return supabase
      .channel(`chat:${conversationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, payload => {
        callback(payload);
      })
      .subscribe();
  },

  getOrCreateConversation: async (myId, otherId) => {
    console.log('[pilgrimService] getOrCreateConversation:', { myId, otherId });
    // Client-side "get or create" logic
    const { data: myConvos } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', myId);
    console.log('[pilgrimService] myConvos:', myConvos?.length);
    const myConvoIds = myConvos?.map(c => c.conversation_id) || [];

    if (myConvoIds.length > 0) {
      const { data: existing, error: existError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .in('conversation_id', myConvoIds)
        .eq('user_id', otherId)
        .maybeSingle(); // Use maybeSingle to avoid 406 on multiple matches (though unlikely for pair chat) or 0 matches

      console.log('[pilgrimService] existing check:', existing, existError);
      if (existing) return existing.conversation_id;
    }

    // Create new via RPC (Secure atomic creation)
    console.log('[pilgrimService] Creating new conversation via RPC...');
    const { data: newConvoId, error } = await supabase.rpc('create_new_conversation', {
      other_user_id: otherId
    });

    if (error) {
      console.error('[pilgrimService] Create conversation RPC failed:', error);
      throw error;
    }

    console.log('[pilgrimService] New conversation created:', newConvoId);
    return newConvoId;
  },

  // STRICT ROOMMATE LOGIC: Create chat only if overlapping dates and confirmed bookings
  getOrCreateRoommateConversation: async (myId, otherId, offerId) => {
    console.log('[pilgrimService] getOrCreateRoommateConversation:', { myId, otherId, offerId });

    // Call the strict RPC function directly.
    // It handles the verification of bookings, dates overlap, and creation securely on the backend.
    const { data: conversationId, error } = await supabase.rpc('get_or_create_roommate_chat', {
      p_other_user_id: otherId,
      p_offer_id: offerId
    });

    if (error) {
      console.error('[pilgrimService] Strict Roommate RPC failed:', error);
      throw error;
    }

    return conversationId;
  },



  // Get roommates for specific offers
  getRoommates: async (userId, offerIds) => {
    if (!offerIds || offerIds.length === 0) return [];

    // Fetch bookings for these offers, excluding the user
    // We fetch bookings (not just profiles) to check dates and offer details
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        check_in,
        check_out,
        status,
        deposit_amount,
        guests,
        created_at,
        offer_id,
        offer:offers(title),
        profile:profiles(id, full_name, avatar_url, city, privacy_settings, bio_tags)
      `)
      .in('offer_id', offerIds)
      .neq('user_id', userId)
      .in('status', ['confirmed', 'paid', 'completed'])
      .order('check_in', { ascending: false });

    if (error) {
      console.error('getRoommates error:', error);
      return [];
    }

    return (data || []).map(b => {
      const p = b.profile || {};
      const privacy = p.privacy_settings || {};

      return {
        ...b,
        profile: {
          ...p,
          full_name: privacy.hideName ? 'Guest' : p.full_name,
          avatar_url: privacy.hidePhoto ? null : p.avatar_url,
          city: p.city || null
        }
      };
    });
  },

  // Phase 2: Message Features
  markAsRead: async (conversationId, userId) => {
    // Mark all messages in this conversation sent by OTHERS as read
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null);

    if (error) console.error("Failed to mark read", error);
  },

  deleteMessage: async (messageId) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
    if (error) throw error;
  },
  // Subscribe to all incoming messages for a user (for global notifications)
  subscribeToAllUserMessages: (userId, callback) => {
    return supabase
      .channel(`user-messages:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, async (payload) => {
        // Check if this message is in a conversation where user is a participant
        // and the message is NOT from the user themselves
        if (payload.new && payload.new.sender_id !== userId) {
          // Verify user is a participant in this conversation
          const { data } = await supabase
            .from('conversation_participants')
            .select('id')
            .eq('conversation_id', payload.new.conversation_id)
            .eq('user_id', userId)
            .maybeSingle();

          if (data) {
            // User is a participant, this is an incoming message
            callback(payload.new);
          }
        }
      })
      .subscribe();
  },

  // Get unread messages with sender info for dropdown


  // Mark a specific message as read
  markMessageAsRead: async (messageId) => {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) throw error;
  },

  getRecentMessagesWithSenders: async (userId) => {
    const { data: myConvos } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', userId);
    const convoIds = myConvos?.map(c => c.conversation_id) || [];

    if (convoIds.length === 0) return [];

    // 1. Fetch messages WITHOUT join to avoid FK errors
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', convoIds)
      .neq('sender_id', userId)
      .is('read_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getRecentMessages error:', error);
      return [];
    }

    if (!messages || messages.length === 0) return [];

    // 2. Extract sender IDs and fetch profiles manually
    const senderIds = [...new Set(messages.map(m => m.sender_id))];
    let pMap = {};
    let hMap = {};
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', senderIds);
      pMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

      const { data: hotels } = await supabase
        .from('hotels')
        .select('owner_id, name, images')
        .in('owner_id', senderIds);
      hMap = (hotels || []).reduce((acc, h) => {
        const hotelName = typeof h.name === 'object' ? (h.name?.ar || h.name?.en || 'Hotel') : h.name;
        acc[h.owner_id] = { name: hotelName, avatar: h.images?.[0] };
        return acc;
      }, {});
    }

    // Fetch conversation types to know if it's a roommate chat
    const { data: convData } = await supabase
      .from('conversations')
      .select('id, type')
      .in('id', convoIds);
    const convMap = (convData || []).reduce((acc, c) => ({ ...acc, [c.id]: c.type }), {});

    // 3. Group and Attach Profile Data
    const grouped = messages.reduce((acc, msg) => {
      const senderId = msg.sender_id;
      // Prefer hotel details if available, EXCEPT for roommate chats
      const hotelProfile = hMap[senderId];
      const userProfile = pMap[senderId];
      const isRoommateChat = convMap[msg.conversation_id] === 'roommate';

      const senderName = (isRoommateChat ? null : hotelProfile?.name) || userProfile?.full_name || 'Guest';
      const senderAvatar = (isRoommateChat ? null : hotelProfile?.avatar) || userProfile?.avatar_url;

      const senderProfile = { full_name: senderName, avatar_url: senderAvatar };

      if (!acc[senderId]) {
        acc[senderId] = {
          id: msg.id,
          sender_id: senderId,
          sender: senderProfile,
          message: msg.message,
          created_at: msg.created_at,
          read_at: msg.read_at,
          ids: [],
          unread_count: 0
        };
      }
      acc[senderId].ids.push(msg.id);
      acc[senderId].unread_count += 1;

      // Keep latest message content
      if (new Date(msg.created_at) > new Date(acc[senderId].created_at)) {
        acc[senderId].message = msg.message;
        acc[senderId].created_at = msg.created_at;
        acc[senderId].id = msg.id;
      }
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  markMessagesAsRead: async (messageIds) => {
    if (!messageIds || messageIds.length === 0) return;
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds);
    if (error) throw error;
  },

  markAllMessagesAsRead: async (userId) => {
    const { data: myConvos } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', userId);
    const convoIds = myConvos?.map(c => c.conversation_id) || [];
    if (convoIds.length === 0) return;

    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('conversation_id', convoIds)
      .neq('sender_id', userId)
      .is('read_at', null);

    if (error) throw error;
  },

  getUnreadCount: async (userId) => {
    const { data: myConvos } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', userId);
    const convoIds = myConvos?.map(c => c.conversation_id) || [];
    if (convoIds.length === 0) return 0;

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', convoIds)
      .neq('sender_id', userId)
      .is('read_at', null);

    return count || 0;
  }
};

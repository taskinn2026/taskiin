import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../hooks/useUser';
import { useUserProfile } from '../hooks/useUserProfile';
import { useBookings } from '../hooks/useBookings';

import { useQueryClient } from '@tanstack/react-query';
import { pilgrimService } from '../services/pilgrimService';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const { user, isLoading: userLoading } = useUser();
  const userId = user?.id;

  // React Query Hooks - Single Source of Truth
  const { data: profile, isLoading: profileLoading } = useUserProfile(userId);
  // bookings removed from global context to prevent eager fetching on home page
  // const { data: bookings, isLoading: bookingsLoading } = useBookings(userId);
  // Removed global useChats to prevent eager fetching




  // Profile: We can fetch it via a hook too, or just use a simple one-off query since it's rarely complex
  // But to be consistent with "No useEffect fetch", let's use a hook or rely on what we have.
  // For now, let's keep the user object as primary source if metadata is there, 
  // but usually we need the 'profiles' row. Let's add a quick useProfile hook logic here or separate hook.
  // We'll create useProfile hook next step to be clean.

  const loading = userLoading || (userId && profileLoading);

  // Realtime Subscriptions (Invalidate Cache Only)
  useEffect(() => {
    if (!userId) return;

    // A. Bookings (Invalidate only if someone is listening to 'bookings' query elsewhere)
    const bookingsChannel = supabase
      .channel(`public:bookings:${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${userId}`
      }, () => {
        console.log('[Realtime] Booking change -> Invalidate');
        queryClient.invalidateQueries(['bookings', userId]);
      })
      .subscribe();

    // B. Chats
    const chatsChannel = supabase
      .channel(`public:chats:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${userId}`
      }, () => {
        console.log('[Realtime] New Chat -> Invalidate');
        queryClient.invalidateQueries(['chats', userId]);
      })
      .subscribe();

    // C. Messages (Global Handler for unread/lastmsg updates)
    // Actually, invalidate 'chats' is enough if headers change. 
    // If we want instant message updates in the active chat, standard Query subscription or 'useSubscription' is better.
    // For now, invalidating 'chats' list is enough for the list view.
    const messagesChannel = supabase
      .channel(`public:messages_global:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new.sender_id !== userId) {
          queryClient.invalidateQueries(['chats', userId]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(chatsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [userId, queryClient]);

  return (
    <DataContext.Provider value={{
      user,
      profile: profile || user?.user_metadata || {},
      // bookings removed from global context

      roommates: [], // Lazy loaded now
      loading
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);

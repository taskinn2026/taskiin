import React, { createContext, useContext } from 'react';
import { usePresence } from '../hooks/usePresence';

const PresenceContext = createContext(null);

export const PresenceProvider = ({ children, userId }) => {
    const presence = usePresence(userId);

    return (
        <PresenceContext.Provider value={presence}>
            {children}
        </PresenceContext.Provider>
    );
};

export const usePresenceContext = () => {
    const context = useContext(PresenceContext);
    if (!context) {
        throw new Error('usePresenceContext must be used within a PresenceProvider');
    }
    return context;
};

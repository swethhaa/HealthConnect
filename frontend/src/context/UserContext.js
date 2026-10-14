import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved && localStorage.getItem('sessionToken') ? JSON.parse(saved) : null;
    });

    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('sessionToken', token);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('sessionToken');
    };

    return (
        <UserContext.Provider value={{ user, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);

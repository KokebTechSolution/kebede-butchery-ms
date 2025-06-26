// src/api/auth.js

import axios from 'axios';

let tokens = JSON.parse(localStorage.getItem('tokens'));

const updateTokens = (newTokens) => {
    tokens = newTokens;
    localStorage.setItem('tokens', JSON.stringify(tokens));
};

const getAccessToken = () => tokens?.access;
const getRefreshToken = () => tokens?.refresh;

const refreshToken = async () => {
    try {
        const response = await axios.post('http://localhost:8000/api/users/token/refresh/', {
            refresh: getRefreshToken(),
        });
        updateTokens(response.data);
        return response.data.access;
    } catch (error) {
        console.error('Token refresh failed', error);
        // Handle logout
        return null;
    }
};

export { getAccessToken, refreshToken, updateTokens };

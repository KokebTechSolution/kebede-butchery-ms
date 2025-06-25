// src/api/auth.js

export const getToken = () => {
    return localStorage.getItem('token'); // Or the key you are using to store your token
};

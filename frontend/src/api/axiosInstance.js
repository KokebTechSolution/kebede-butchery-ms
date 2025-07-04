import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: ' http://localhost:8000/api/',
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                const response = await axios.post('http://localhost:8000/api/users/token/refresh/', {
                    refresh: refreshToken,
                });
                
                const newAccessToken = response.data.access;
                localStorage.setItem('access_token', newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axios(originalRequest);

            } catch (refreshError) {
                // On refresh failure, dispatch a logout event
                console.error("Token refresh failed, logging out.", refreshError);
                window.dispatchEvent(new Event('logout'));
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;

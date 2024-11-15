import axios from 'axios';

const api = axios.create({
    baseURL: 'https://eeb7-38-51-234-14.ngrok-free.app/',
    headers: { 'Content-Type': 'application/json' },
});

export default api;
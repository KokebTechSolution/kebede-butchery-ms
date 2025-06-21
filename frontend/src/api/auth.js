import axios from 'axios';

const API_URL = 'http://localhost:8000'; 

export const loginUser = async (username, password) => {
  console.log("Submitting login with:", { username, password });
  try {
    const response = await axios.post(`${API_URL}/api/token/`, {
      username,
      password
    });
    console.log("Login successful, received data:", response.data);
    return response.data;
  } catch (error) {
    console.error("Login failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

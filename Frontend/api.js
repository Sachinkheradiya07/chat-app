import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for better error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with an error status code
      const { status, data } = error.response;
      
      if (status === 401 || status === 403) {
        // Token expired or invalid - clear storage and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        window.location.href = "/login";
      }
      
      console.error(`API Error [${status}]:`, data?.message || error.message);
      
      return Promise.reject({
        status,
        message: data?.message || "An error occurred",
        data
      });
    } else if (error.request) {
      // Request was made but no response
      console.error("No response from server:", error.request);
      return Promise.reject({
        message: "No response from server. Please check your connection.",
        error
      });
    } else {
      // Error in request setup
      console.error("Request Error:", error.message);
      return Promise.reject({
        message: error.message || "An unexpected error occurred",
        error
      });
    }
  }
);

export default API;
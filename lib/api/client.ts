import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — attempt token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(
          `${BASE_URL}/api/mobile/auth/refresh`,
          { refreshToken },
        );

        const newToken = data.data.accessToken;
        await SecureStore.setItemAsync("accessToken", newToken);

        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        // Refresh failed — clear auth and let the app redirect to login
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        await SecureStore.deleteItemAsync("user");
        await SecureStore.deleteItemAsync("shopId");
        await SecureStore.deleteItemAsync("role");
      }
    }

    return Promise.reject(error);
  },
);

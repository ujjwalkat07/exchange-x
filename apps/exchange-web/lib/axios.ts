import axios from "axios";

export const api = axios.create({
  baseURL: typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_URL || "http://localhost:8008"),
  withCredentials: true,
});

api.interceptors.request.use(async (config) => config);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 400) &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/api/auth/new-refresh-token") &&
      !originalRequest.url?.includes("/api/auth/login")
    ) {
      originalRequest._retry = true;

      try {
        await api.post("/api/auth/new-refresh-token", {});
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

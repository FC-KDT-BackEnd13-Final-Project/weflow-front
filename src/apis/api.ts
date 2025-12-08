import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  // 백엔드 주소
  withCredentials: false,
});

// ------------ 요청 인터셉터 ------------
api.interceptors.request.use(
  (config) => {
    //const token = localStorage.getItem("accessToken"); // 혹은 Zustand, Recoil 저장소에서 불러오기
    const token = import.meta.env.VITE_ACCESS_TOKEN;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ------------ 응답 인터셉터(옵션) ------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 토큰 만료 시 자동 로그아웃 or refresh token 로직
    if (error.response?.status === 401) {
      // 예: refresh 시도하거나 로그인 페이지로 보냄
    }
    return Promise.reject(error);
  }
);

export default api;
import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:7022/api", // 🔁 change if needed
});

export default api;

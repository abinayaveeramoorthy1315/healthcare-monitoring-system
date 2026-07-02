import api from "../api";

export const getLatestVitals = async () => {
  const res = await api.get("/api/vitalsigns"); // ✅ vitalsigns!
  return res.data;
};

export const getAllVitalSigns = () => api.get("/api/vitalsigns");
export const addVitalSigns = (data) => api.post("/api/vitalsigns", data);
import api from "../api";

export const getAllAlerts = () => api.get("/api/alerts");
export const getLatestAlerts = () => api.get("/api/alerts/latest");
export const getCriticalCount = () => api.get("/api/alerts/count");
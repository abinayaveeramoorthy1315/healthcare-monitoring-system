import api from "../api";

export const getAllAppointments = () => api.get("/api/appointments");
export const addAppointment = (data) => api.post("/api/appointments", data);
export const deleteAppointment = (id) => api.delete(`/api/appointments/${id}`);
export const updateAppointment = (id, data) => api.put(`/api/appointments/${id}`, data);
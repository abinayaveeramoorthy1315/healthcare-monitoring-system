import api from "../api";

export const getAllDoctors = () => api.get("/api/doctors");
export const addDoctor = (data) => api.post("/api/doctors", data);
export const updateDoctor = (id, data) => api.put(`/api/doctors/${id}`, data);
export const deleteDoctor = (id) => api.delete(`/api/doctors/${id}`);
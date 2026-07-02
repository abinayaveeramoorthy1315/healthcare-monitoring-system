import api from "../api";

export const getAllPatients = () => api.get("/api/patients");
export const addPatient = (data) => api.post("/api/patients", data);
export const updatePatient = (id, data) => api.put(`/api/patients/${id}`, data);
export const deletePatient = (id) => api.delete(`/api/patients/${id}`);
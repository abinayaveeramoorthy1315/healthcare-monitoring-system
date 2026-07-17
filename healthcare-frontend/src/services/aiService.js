import api from '../api';

const API_BASE_URL = '/api/ai';

class AiService {
    async predictRisk(vitalsData) {
        try {
            const response = await api.post(`${API_BASE_URL}/predict`, vitalsData);
            return response.data;
        } catch (error) {
            console.error("Error predicting health risk:", error);
            throw error;
        }
    }

    async getPatientHistory(patientId) {
        try {
            const response = await api.get(`${API_BASE_URL}/history/${patientId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching AI prediction history:", error);
            throw error;
        }
    }

    async getDoctorPredictions() {
        try {
            const response = await api.get(`${API_BASE_URL}/doctor/predictions`);
            return response.data;
        } catch (error) {
            console.error("Error fetching doctor predictions:", error);
            throw error;
        }
    }

    async downloadReport(predictionId) {
        try {
            const response = await api.get(`${API_BASE_URL}/report/${predictionId}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `health_risk_report_${predictionId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error downloading report:", error);
            throw error;
        }
    }
}

export default new AiService();

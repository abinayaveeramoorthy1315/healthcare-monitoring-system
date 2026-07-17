import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { Favorite, Thermostat, Bloodtype, Speed, AccessTime, LocalHospital } from '@mui/icons-material';
import aiService from '../services/aiService';

const AiPredictionPage = () => {
    const [vitals, setVitals] = useState({
        heartRate: '',
        bloodPressure: '',
        spo2: '',
        temperature: '',
        age: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [prediction, setPrediction] = useState(null);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setVitals({
            ...vitals,
            [e.target.name]: e.target.value
        });
    };

    const handlePredict = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setPrediction(null);
        
        try {
            // Patient ID usually comes from context or local storage. Hardcoding 1 for demo if needed.
            const patientId = localStorage.getItem('userId') || 1; 
            const dataToSubmit = {
                ...vitals,
                heartRate: parseInt(vitals.heartRate),
                spo2: parseInt(vitals.spo2),
                temperature: parseFloat(vitals.temperature),
                age: parseInt(vitals.age),
                patientId: patientId
            };
            
            // Simulate network delay for animation effect
            await new Promise(r => setTimeout(r, 1500));
            
            const result = await aiService.predictRisk(dataToSubmit);
            setPrediction(result);
            
            // Trigger emergency popup if high/critical (could be handled in context)
            if (result.risk === 'CRITICAL' || result.risk === 'HIGH') {
                localStorage.setItem('latestAiRisk', result.risk);
                window.dispatchEvent(new Event('storage'));
            }
        } catch (err) {
            setError('Failed to generate prediction. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (risk) => {
        switch (risk) {
            case 'LOW': return '#4caf50'; // Green
            case 'MEDIUM': return '#ff9800'; // Orange
            case 'HIGH': return '#f44336'; // Red
            case 'CRITICAL': return '#b71c1c'; // Dark Red
            default: return '#757575'; // Grey
        }
    };

    const downloadReport = async () => {
        if (prediction && prediction.predictionId) {
             await aiService.downloadReport(prediction.predictionId);
        } else {
             // In case prediction object doesn't have ID from response directly, we would need to fetch the latest history.
             // For demo purposes, assuming predictionId is returned or alerting.
             alert("Report generation is only available for saved predictions.");
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 5, mb: 5 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Box display="flex" alignItems="center" mb={3}>
                    <LocalHospital color="primary" sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
                        AI Health Risk Prediction
                    </Typography>
                </Box>
                
                <Typography variant="body1" color="textSecondary" mb={4}>
                    Enter your current vital signs to get an AI-powered health risk assessment.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <form onSubmit={handlePredict}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <Box display="flex" alignItems="flex-end">
                                <Favorite sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
                                <TextField
                                    fullWidth
                                    label="Heart Rate (BPM)"
                                    name="heartRate"
                                    type="number"
                                    required
                                    value={vitals.heartRate}
                                    onChange={handleChange}
                                    variant="standard"
                                />
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <Box display="flex" alignItems="flex-end">
                                <Bloodtype sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
                                <TextField
                                    fullWidth
                                    label="Blood Pressure (e.g. 120/80)"
                                    name="bloodPressure"
                                    required
                                    value={vitals.bloodPressure}
                                    onChange={handleChange}
                                    variant="standard"
                                />
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <Box display="flex" alignItems="flex-end">
                                <Speed sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
                                <TextField
                                    fullWidth
                                    label="Oxygen Saturation (SpO2 %)"
                                    name="spo2"
                                    type="number"
                                    required
                                    value={vitals.spo2}
                                    onChange={handleChange}
                                    variant="standard"
                                />
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <Box display="flex" alignItems="flex-end">
                                <Thermostat sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
                                <TextField
                                    fullWidth
                                    label="Body Temperature (°C)"
                                    name="temperature"
                                    type="number"
                                    step="0.1"
                                    required
                                    value={vitals.temperature}
                                    onChange={handleChange}
                                    variant="standard"
                                />
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box display="flex" alignItems="flex-end">
                                <AccessTime sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
                                <TextField
                                    fullWidth
                                    label="Age"
                                    name="age"
                                    type="number"
                                    required
                                    value={vitals.age}
                                    onChange={handleChange}
                                    variant="standard"
                                />
                            </Box>
                        </Grid>
                    </Grid>

                    <Box mt={4} display="flex" justifyContent="center">
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={loading}
                            sx={{ px: 5, py: 1.5, borderRadius: 2 }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Predict Health Risk'}
                        </Button>
                    </Box>
                </form>

                {prediction && (
                    <Box mt={5}>
                        <Card 
                            sx={{ 
                                borderLeft: `6px solid ${getRiskColor(prediction.risk)}`,
                                borderRadius: 2,
                                boxShadow: 3
                            }}
                        >
                            <CardContent sx={{ p: 4 }}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={4} sx={{ textAlign: 'center', borderRight: { md: '1px solid #e0e0e0', xs: 'none' } }}>
                                        <Typography variant="h6" color="textSecondary" gutterBottom>
                                            Risk Level
                                        </Typography>
                                        <Typography variant="h3" fontWeight="bold" sx={{ color: getRiskColor(prediction.risk) }}>
                                            {prediction.risk}
                                        </Typography>
                                        <Typography variant="subtitle1" sx={{ mt: 1, color: 'text.secondary' }}>
                                            Confidence: {prediction.confidence}%
                                        </Typography>
                                    </Grid>
                                    
                                    <Grid item xs={12} md={8}>
                                        <Typography variant="h6" color="primary" gutterBottom>
                                            Analysis Reason
                                        </Typography>
                                        <Typography variant="body1" paragraph>
                                            {prediction.reason || "All vital signs appear to be in normal ranges."}
                                        </Typography>
                                        
                                        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                                            Recommended Action
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {prediction.recommendation}
                                        </Typography>
                                        
                                        {prediction.predictionId && (
                                            <Box mt={3}>
                                                <Button variant="outlined" color="primary" onClick={downloadReport}>
                                                    Download PDF Report
                                                </Button>
                                            </Box>
                                        )}
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default AiPredictionPage;

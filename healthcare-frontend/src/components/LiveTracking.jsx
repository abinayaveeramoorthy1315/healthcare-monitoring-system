import React, { useState, useEffect } from 'react';
import api from '../api';
import { FaAmbulance, FaUserInjured, FaPhoneAlt, FaMapMarkerAlt, FaClock, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import './LiveTracking.css';

const LiveTracking = ({ emergencyRequest, onClose }) => {
    const [ambulanceRequest, setAmbulanceRequest] = useState(null);
    const [eta, setEta] = useState(8);
    const [status, setStatus] = useState('ASSIGNED');
    const [progress, setProgress] = useState(20);
    const [ambLat, setAmbLat] = useState(emergencyRequest?.latitude + 0.01 || 18.5204);
    const [ambLng, setAmbLng] = useState(emergencyRequest?.longitude + 0.01 || 73.8567);
    const [loading, setLoading] = useState(true);

    const patLat = emergencyRequest?.latitude || 18.5104;
    const patLng = emergencyRequest?.longitude || 73.8467;

    useEffect(() => {
        if (!emergencyRequest?.id) return;
        
        const fetchAmbulanceReq = async () => {
            try {
                const res = await api.get(`/api/ambulance/request/${emergencyRequest.id}`);
                if (res.data) {
                    setAmbulanceRequest(res.data);
                    setEta(res.data.estimatedArrivalMinutes || 8);
                    setStatus(res.data.currentStatus || 'ASSIGNED');
                    if (res.data.ambulance) {
                        setAmbLat(res.data.ambulance.currentLatitude || patLat + 0.01);
                        setAmbLng(res.data.ambulance.currentLongitude || patLng + 0.01);
                    }
                }
            } catch (err) {
                console.error("Failed to load ambulance request:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAmbulanceReq();
    }, [emergencyRequest]);

    // Simulate movement and ETA countdown every 20 seconds
    useEffect(() => {
        if (!ambulanceRequest || status === 'ARRIVED' || status === 'PATIENT_PICKED' || status === 'COMPLETED') return;

        const interval = setInterval(async () => {
            setEta((prevEta) => {
                const nextEta = prevEta > 1 ? prevEta - 1 : 0;
                const nextStatus = nextEta === 0 ? 'ARRIVED' : 'ON_THE_WAY';
                setStatus(nextStatus);
                
                // Calculate new progress (from 20% at 8 mins to 100% at 0 mins)
                const nextProgress = Math.min(100, Math.max(20, 100 - (nextEta * 10)));
                setProgress(nextProgress);

                // Simulate movement closer to patient
                setAmbLat((prev) => prev + (patLat - prev) * 0.3);
                setAmbLng((prev) => prev + (patLng - prev) * 0.3);

                // Update backend
                if (ambulanceRequest?.requestId) {
                    api.post(`/api/ambulance/update/${ambulanceRequest.requestId}?status=${nextStatus}&eta=${nextEta}`)
                       .catch(e => console.error("Update failed", e));
                }

                return nextEta;
            });
        }, 20000); // Every 20 seconds

        return () => clearInterval(interval);
    }, [ambulanceRequest, status, patLat, patLng]);

    if (loading) {
        return (
            <div className="live-tracking-loading">
                <div className="spinner-border text-success" role="status" />
                <p>Dispatching Emergency Ambulance...</p>
            </div>
        );
    }

    if (!ambulanceRequest) {
        return (
            <div className="alert alert-warning m-3">
                <FaExclamationCircle /> Emergency SOS received, but no available ambulance assigned yet.
            </div>
        );
    }

    const amb = ambulanceRequest.ambulance || {};

    return (
        <div className="live-tracking-container">
            <div className="tracking-header">
                <h3>🚑 Live Ambulance Dispatch & Tracking</h3>
                {onClose && <button className="btn-close" onClick={onClose} />}
            </div>

            <div className="tracking-grid">
                {/* Ambulance Info Card */}
                <div className="ambulance-card">
                    <div className="amb-card-header">
                        <FaAmbulance className="amb-icon" />
                        <div>
                            <h4>Ambulance Assigned</h4>
                            <span className={`status-pill status-${status.toLowerCase()}`}>{status.replace('_', ' ')}</span>
                        </div>
                    </div>
                    
                    <div className="amb-details">
                        <div className="detail-row">
                            <span>Driver Name:</span>
                            <strong>{amb.driverName || "Driver Assigned"}</strong>
                        </div>
                        <div className="detail-row">
                            <span>Vehicle Number:</span>
                            <strong>{amb.vehicleNumber || "EMRG-108"}</strong>
                        </div>
                        <div className="detail-row">
                            <span>Driver Phone:</span>
                            <strong><FaPhoneAlt style={{color:'#16a34a', marginRight:'5px'}} /> {amb.phone || "108"}</strong>
                        </div>
                    </div>

                    <div className="eta-section">
                        <div className="eta-title">
                            <span><FaClock /> Estimated Arrival Time</span>
                            <span className="eta-badge">{status === 'ARRIVED' ? 'ARRIVED' : `${eta} Minutes`}</span>
                        </div>
                        <div className="progress amb-progress-bar">
                            <div 
                                className="progress-bar progress-bar-striped progress-bar-animated bg-success" 
                                role="progressbar" 
                                style={{ width: `${status === 'ARRIVED' ? 100 : progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Simulated Map */}
                <div className="map-card">
                    <h4><FaMapMarkerAlt /> Live Route & GPS Simulation</h4>
                    <div className="simulated-map">
                        <svg className="map-svg" viewBox="0 0 400 250">
                            {/* Road / Route Line */}
                            <line 
                                x1="80" y1="180" 
                                x2="320" y2="70" 
                                stroke="#cbd5e1" strokeWidth="8" strokeDasharray="10,6" 
                            />
                            <line 
                                x1="80" y1="180" 
                                x2={80 + ((320 - 80) * (progress / 100))} 
                                y2={180 - ((180 - 70) * (progress / 100))} 
                                stroke="#16a34a" strokeWidth="6" 
                            />

                            {/* Patient Marker */}
                            <g transform="translate(80, 180)">
                                <circle cx="0" cy="0" r="16" fill="#fef2f2" stroke="#dc2626" strokeWidth="3" />
                                <text x="-5" y="5" fontSize="14">🏠</text>
                                <text x="-25" y="30" fontSize="12" fontWeight="bold" fill="#dc2626">Patient</text>
                            </g>

                            {/* Ambulance Marker */}
                            <g transform={`translate(${80 + ((320 - 80) * (progress / 100))}, ${180 - ((180 - 70) * (progress / 100))})`}>
                                <circle cx="0" cy="0" r="18" fill="#dcfce7" stroke="#16a34a" strokeWidth="3" />
                                <text x="-7" y="6" fontSize="14">🚑</text>
                                <text x="-30" y="-25" fontSize="12" fontWeight="bold" fill="#16a34a">Ambulance ({status === 'ARRIVED' ? 'Arrived' : eta + 'm'})</text>
                            </g>
                        </svg>
                        <div className="map-footer-coords">
                            <small>Patient GPS: {patLat.toFixed(4)}, {patLng.toFixed(4)}</small> | 
                            <small> Ambulance GPS: {ambLat.toFixed(4)}, {ambLng.toFixed(4)}</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Emergency Timeline */}
            <div className="timeline-card">
                <h4>⏱️ Emergency Response Timeline</h4>
                <div className="timeline-horizontal">
                    <div className="timeline-step completed">
                        <div className="step-icon"><FaCheckCircle /></div>
                        <div className="step-time">00:00s</div>
                        <div className="step-label">SOS Triggered</div>
                    </div>
                    <div className="timeline-step completed">
                        <div className="step-icon"><FaCheckCircle /></div>
                        <div className="step-time">00:02s</div>
                        <div className="step-label">GPS Captured</div>
                    </div>
                    <div className="timeline-step completed">
                        <div className="step-icon"><FaCheckCircle /></div>
                        <div className="step-time">00:05s</div>
                        <div className="step-label">Doctor & Admin Notified</div>
                    </div>
                    <div className="timeline-step completed">
                        <div className="step-icon"><FaCheckCircle /></div>
                        <div className="step-time">00:08s</div>
                        <div className="step-label">HTML Email Dispatched</div>
                    </div>
                    <div className="timeline-step completed">
                        <div className="step-icon"><FaCheckCircle /></div>
                        <div className="step-time">00:10s</div>
                        <div className="step-label">Ambulance Assigned</div>
                    </div>
                    <div className={`timeline-step ${status !== 'ASSIGNED' ? 'completed' : 'active'}`}>
                        <div className="step-icon"><FaClock /></div>
                        <div className="step-time">Now</div>
                        <div className="step-label">On The Way</div>
                    </div>
                    <div className={`timeline-step ${status === 'ARRIVED' || status === 'PATIENT_PICKED' ? 'completed' : ''}`}>
                        <div className="step-icon"><FaUserInjured /></div>
                        <div className="step-time">ETA {eta}m</div>
                        <div className="step-label">Patient Picked Up</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveTracking;

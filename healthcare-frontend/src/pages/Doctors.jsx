import { useEffect, useState } from "react";
import {
  getAllDoctors,
  addDoctor,
  updateDoctor,
  deleteDoctor
} from "../services/doctorService";

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [doctorData, setDoctorData] = useState({
    doctorName: "",
    specialization: "",
    phone: "",
    email: "",
    availability: ""
  });

  const role = localStorage.getItem("role");

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const response = await getAllDoctors();
      setDoctors(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    setDoctorData({ ...doctorData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (editId) {
        await updateDoctor(editId, doctorData);
        alert("Doctor Updated Successfully");
      } else {
        await addDoctor(doctorData);
        alert("Doctor Added Successfully");
      }
      setDoctorData({
        doctorName: "",
        specialization: "",
        phone: "",
        email: "",
        availability: ""
      });
      setEditId(null);
      setShowForm(false);
      loadDoctors();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (doctor) => {
    setDoctorData({
      doctorName: doctor.doctorName,
      specialization: doctor.specialization,
      phone: doctor.phone,
      email: doctor.email,
      availability: doctor.availability
    });
    setEditId(doctor.doctorId);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    try {
      await deleteDoctor(id);
      alert("Doctor Deleted Successfully");
      loadDoctors();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Doctors Management</h2>

      {/* ✅ ADMIN மட்டும் Add button */}
      {role === "ADMIN" && (
        <div className="patient-header">
          <button
            className="add-btn"
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) {
                setEditId(null);
                setDoctorData({
                  doctorName: "",
                  specialization: "",
                  phone: "",
                  email: "",
                  availability: ""
                });
              }
            }}
          >
            + Add Doctor
          </button>
        </div>
      )}

      {/* ✅ ADMIN மட்டும் Form */}
      {role === "ADMIN" && showForm && (
        <div className="patient-form">
          <h3>{editId ? "Edit Doctor" : "Add Doctor"}</h3>

          <input type="text" name="doctorName"
            value={doctorData.doctorName} onChange={handleChange}
            placeholder="Doctor Name" />

          <input type="text" name="specialization"
            value={doctorData.specialization} onChange={handleChange}
            placeholder="Specialization" />

          <input type="text" name="phone"
            value={doctorData.phone} onChange={handleChange}
            placeholder="Phone Number" />

          <input type="email" name="email"
            value={doctorData.email} onChange={handleChange}
            placeholder="Email" />

          <input type="text" name="availability"
            value={doctorData.availability} onChange={handleChange}
            placeholder="Availability" />

          <button className="save-btn" onClick={handleSubmit}>
            {editId ? "Update Doctor" : "Save Doctor"}
          </button>
        </div>
      )}

      <table className="patient-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Doctor Name</th>
            <th>Specialization</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Availability</th>
            {/* ✅ ADMIN மட்டும் Action column */}
            {role === "ADMIN" && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {doctors.map((doctor) => (
            <tr key={doctor.doctorId}>
              <td>{doctor.doctorId}</td>
              <td>{doctor.doctorName}</td>
              <td>{doctor.specialization}</td>
              <td>{doctor.phone}</td>
              <td>{doctor.email}</td>
              <td>{doctor.availability}</td>

              {/* ✅ ADMIN மட்டும் Edit/Delete */}
              {role === "ADMIN" && (
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(doctor)}>
                    Edit
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(doctor.doctorId)}>
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Doctors;

import { useEffect, useState } from "react";
import {
  getAllPatients,
  addPatient,
  updatePatient,
  deletePatient
} from "../services/patientService";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [patientData, setPatientData] = useState({
    name: "",
    age: "",
    gender: "Female",
    phone: "",
    email: "",
    bloodGroup: ""
  });

  const role = localStorage.getItem("role"); // ✅ role check

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await getAllPatients();
      setPatients(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    setPatientData({
      ...patientData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    try {
      if (editId) {
        await updatePatient(editId, patientData);
        alert("Patient Updated Successfully");
      } else {
        await addPatient(patientData);
        alert("Patient Added Successfully");
      }
      setPatientData({
        name: "",
        age: "",
        gender: "Female",
        phone: "",
        email: "",
        bloodGroup: ""
      });
      setEditId(null);
      setShowForm(false);
      loadPatients();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (patient) => {
    setPatientData({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      bloodGroup: patient.bloodGroup
    });
    setEditId(patient.patientId);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this patient?"
    );
    if (!confirmDelete) return;
    try {
      await deletePatient(id);
      alert("Patient Deleted Successfully");
      loadPatients();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Patients Management</h2>

      {/* ✅ ADMIN மட்டும் Add button */}
      {role === "ADMIN" && (
        <div className="patient-header">
          <button
            className="add-btn"
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) {
                setEditId(null);
                setPatientData({
                  name: "",
                  age: "",
                  gender: "Female",
                  phone: "",
                  email: "",
                  bloodGroup: ""
                });
              }
            }}
          >
            + Add Patient
          </button>
        </div>
      )}

      {/* ✅ ADMIN மட்டும் Form */}
      {showForm && role === "ADMIN" && (
        <div className="patient-form">
          <h3>{editId ? "Edit Patient" : "Add Patient"}</h3>

          <input
            type="text"
            name="name"
            value={patientData.name}
            onChange={handleChange}
            placeholder="Enter Name"
          />
          <input
            type="number"
            name="age"
            value={patientData.age}
            onChange={handleChange}
            placeholder="Enter Age"
          />
          <select
            name="gender"
            value={patientData.gender}
            onChange={handleChange}
          >
            <option>Male</option>
            <option>Female</option>
          </select>
          <input
            type="text"
            name="phone"
            value={patientData.phone}
            onChange={handleChange}
            placeholder="Phone Number"
          />
          <input
            type="email"
            name="email"
            value={patientData.email}
            onChange={handleChange}
            placeholder="Email"
          />
          <input
            type="text"
            name="bloodGroup"
            value={patientData.bloodGroup}
            onChange={handleChange}
            placeholder="Blood Group"
          />

          <button className="save-btn" onClick={handleSubmit}>
            {editId ? "Update Patient" : "Save Patient"}
          </button>
        </div>
      )}

      <table className="patient-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Blood Group</th>
            {/* ✅ ADMIN மட்டும் Action column */}
            {role === "ADMIN" && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.patientId}>
              <td>{patient.patientId}</td>
              <td>{patient.name}</td>
              <td>{patient.age}</td>
              <td>{patient.gender}</td>
              <td>{patient.phone}</td>
              <td>{patient.email}</td>
              <td>{patient.bloodGroup}</td>

              {/* ✅ ADMIN Actions */}
              {role === "ADMIN" && (
                <td>
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(patient)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(patient.patientId)}
                  >
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

export default Patients;
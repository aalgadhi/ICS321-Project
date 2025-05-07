import React, { useState } from 'react';
import { registerUser } from '../api/api';
import { useNavigate } from 'react-router-dom';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    kfupm_id: '', // Add kfupm_id to state
    name: '',
    date_of_birth: '',
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await registerUser(formData); // formData now includes kfupm_id
      setMessage('Signup successful! Please login.');
      setFormData({
         kfupm_id: '', name: '', date_of_birth: '', username: '', password: ''
      }); // Clear form
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="col-md-6 offset-md-3">
      <h2 className="mb-3">Signup</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
           <label htmlFor="kfupmIdInput" className="form-label">KFUPM ID:</label> {/* Add new input */}
           <input
             type="number" // Use number type for numeric ID
             className="form-control"
             id="kfupmIdInput"
             name="kfupm_id"
             value={formData.kfupm_id}
             onChange={handleChange}
             required
           />
         </div>
        <div className="mb-3">
          <label htmlFor="nameInput" className="form-label">Full Name:</label>
          <input
            type="text"
            className="form-control"
            id="nameInput"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
         <div className="mb-3">
          <label htmlFor="dobInput" className="form-label">Date of Birth:</label>
          <input
            type="date"
            className="form-control"
            id="dobInput"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="usernameInput" className="form-label">Username:</label>
          <input
            type="text"
            className="form-control"
            id="usernameInput"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="passwordInput" className="form-label">Password:</label>
          <input
            type="password"
            className="form-control"
            id="passwordInput"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Signup</button>
        {error && <div className="alert alert-danger mt-3">{error}</div>}
        {message && <div className="alert alert-success mt-3">{message}</div>}
      </form>
    </div>
  );
};

export default SignupForm;
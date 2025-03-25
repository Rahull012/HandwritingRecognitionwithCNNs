import { useState } from 'react';
import { TextField, Button, Typography, Box, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import backgroundImage from '../assets/skin3.jpg';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    general: '',
  });
  const [success, setSuccess] = useState(false); // New state for success message
  const navigate = useNavigate();

  // Validation functions
  const validateName = (name) => {
    return name.length >= 2 && name.length <= 50;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '', general: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset errors and success
    setErrors({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      general: '',
    });
    setSuccess(false);

    let isValid = true;
    const newErrors = {};

    // Name validation
    if (!formData.name) {
      newErrors.name = 'Name is required';
      isValid = false;
    } else if (!validateName(formData.name)) {
      newErrors.name = 'Name must be between 2 and 50 characters';
      isValid = false;
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters long';
      isValid = false;
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    try {
      await axios.post('http://localhost:4000/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      setSuccess(true); // Show success message
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      // Navigate to login after a short delay to show the success message
      setTimeout(() => {
        navigate('/login');
      }, 2000); // 2-second delay
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      setErrors({
        ...newErrors,
        general: error.response?.data?.message || 'Registration failed. Please try again.',
      });
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        margin: 0,
        padding: 0,
      }}
    >
      <Box
        sx={{
          maxWidth: 'sm',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 3,
          padding: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          align="center"
          sx={{
            color: '#fff',
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #ff6f00, #ffca28)',
            padding: '10px',
            borderRadius: '8px',
          }}
        >
          Register
        </Typography>
        <Box sx={{ textAlign: 'center' }}>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Registration successful! Redirecting to login...
            </Alert>
          )}
          {errors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.general}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              required
              error={!!errors.name}
              helperText={errors.name}
              sx={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ff4081' },
                '& .MuiInputLabel-root': { color: '#000', fontWeight: 'bold' },
              }}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              error={!!errors.email}
              helperText={errors.email}
              sx={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ff4081' },
                '& .MuiInputLabel-root': { color: '#000', fontWeight: 'bold' },
              }}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              error={!!errors.password}
              helperText={errors.password}
              sx={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ff4081' },
                '& .MuiInputLabel-root': { color: '#000', fontWeight: 'bold' },
              }}
            />
            <TextField
              fullWidth
              label="Re-enter Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="normal"
              required
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              sx={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ff4081' },
                '& .MuiInputLabel-root': { color: '#000', fontWeight: 'bold' },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 2,
                background: 'linear-gradient(45deg, #ff6f00, #ffca28)',
                color: '#fff',
                '&:hover': { background: 'linear-gradient(45deg, #ffca28, #ff6f00)' },
                borderRadius: '20px',
                padding: '10px 20px',
              }}
            >
              Register
            </Button>
          </form>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterPage;
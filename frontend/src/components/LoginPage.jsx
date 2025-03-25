import { TextField, Button, Typography, Box, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useState } from 'react';
import backgroundImage from '../assets/skin3.jpg';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [success, setSuccess] = useState(false); // New state for success message
  const [generalError, setGeneralError] = useState(''); // New state for general error
  const navigate = useNavigate();

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation function (minimum 8 characters)
  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleLogin = async () => {
    // Reset errors and success
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
    setSuccess(false);

    // Validation checks
    let isValid = true;

    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (!validatePassword(password)) {
      setPasswordError('Password must be at least 8 characters long');
      isValid = false;
    }

    if (!isValid) return;

    try {
      const response = await axios.post('http://localhost:4000/auth/login', {
        email,
        password,
      });
      localStorage.setItem('token', response.data.token);
      setSuccess(true); // Show success message
      // Reset form
      setEmail('');
      setPassword('');
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate('/upload');
      }, 2000); // 2-second delay
    } catch (error) {
      setGeneralError('Invalid credentials');
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
          maxWidth: 'xs',
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
          Login
        </Typography>
        <Box sx={{ textAlign: 'center' }}>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Login successful! Redirecting...
            </Alert>
          )}
          {generalError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {generalError}
            </Alert>
          )}
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError('');
              setGeneralError('');
            }}
            error={!!emailError}
            helperText={emailError}
            sx={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ff4081' },
              '& .MuiInputLabel-root': { color: '#000', fontWeight: 'bold' },
            }}
          />
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError('');
              setGeneralError('');
            }}
            error={!!passwordError}
            helperText={passwordError}
            sx={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ff4081' },
              '& .MuiInputLabel-root': { color: '#000', fontWeight: 'bold' },
            }}
          />
          <Button
            variant="contained"
            fullWidth
            onClick={handleLogin}
            sx={{
              mt: 2,
              background: 'linear-gradient(45deg, #ff6f00, #ffca28)',
              color: '#fff',
              '&:hover': { background: 'linear-gradient(45deg, #ffca28, #ff6f00)' },
              borderRadius: '20px',
              padding: '10px 20px',
            }}
          >
            Login
          </Button>
          <Typography
            variant="body2"
            color="textSecondary"
            align="center"
            sx={{ mt: 2, color: '#4a148c' }}
          >
            Not registered?{' '}
            <Button
              variant="text"
              onClick={() => navigate('/register')}
              sx={{
                color: '#ff4081',
                textTransform: 'none',
                '&:hover': { color: '#ab47bc' },
              }}
            >
              Register
            </Button>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
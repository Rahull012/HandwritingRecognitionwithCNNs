import { Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import backgroundImage from '../assets/skin3.jpg'; // Replace with your actual image filename

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        // Make it full screen
        minHeight: '100vh',
        width: '100vw',
        position: 'fixed', // Ensures it covers the entire viewport
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
      <Typography variant="h2" gutterBottom style={{ color: '#fff' }}>
        Handwriting Recognition
      </Typography>
      <Box
        sx={{
          animation: 'float 3s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-20px)' },
          },
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '1rem',
          borderRadius: '8px',
          maxWidth: 'md', // Keeps content centered and constrained like Container
        }}
      >
        <Typography variant="body1" color="textPrimary">
          Analyze handwritten text, convert it into editable text and download it.
        </Typography>
      </Box>
      <Button
        variant="contained"
        color="primary"
        style={{ marginTop: '20px' }}
        onClick={() => navigate('/login')}
      >
        Get Started
      </Button>
    </Box>
  );
};

export default LandingPage;
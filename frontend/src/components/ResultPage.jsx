import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Button,
  Box,
  TextareaAutosize,
  Typography,
  List,
  ListItem,
  ListItemText,
  Drawer,
  IconButton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import backgroundImage from '../assets/skin3.jpg'; // Import the same background image

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { extractedText: initialText = '', userId = 'default' } = location.state || {};
  const [correctedText, setCorrectedText] = useState(initialText);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechPaused, setSpeechPaused] = useState(false);

  const isEnglishText = (text) => /^[\x20-\x7E]*$/.test(text);
  const saveToHistory = async () => {
    if (correctedText.trim()) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Session expired. Please log in again.');
          return;
        }
        await axios.post(
          'http://localhost:4000/api/history',
          { correctedText },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Text saved to history successfully!');
      } catch (err) {
        console.error('Error saving history:', err);
        if (err.response && err.response.status === 401) {
          alert('Unauthorized. Please log in again.');
        }
      }
    }
  };

  const handleTextChange = (event) => {
    setCorrectedText(event.target.value);
  };

  const handleDownloadAsPDF = () => {
    if (!correctedText) return;

    const element = document.createElement('div');
    element.style.padding = '20px';
    element.style.backgroundColor = '#ffffff'; // White background
    element.innerHTML = `<p style="color: #000000;">${correctedText.replace(/\n/g, '<br/>')}</p>`; // Black text

    const options = {
      margin: 1,
      filename: 'extracted_text.pdf',
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };

    html2pdf().from(element).set(options).save();
  };

  const textToSpeech = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const voices = speechSynthesis.getVoices();
      const englishVoice = voices.find((voice) => voice.lang.startsWith('en'));
      const utterance = new SpeechSynthesisUtterance();
      utterance.voice = englishVoice;
      utterance.text = correctedText;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeechPaused(false);
      };

      speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser.');
    }
  };

  const pauseSpeech = () => {
    if (speechSynthesis.speaking && !speechPaused) {
      speechSynthesis.pause();
      setSpeechPaused(true);
    }
  };

  const resumeSpeech = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setSpeechPaused(false);
    }
  };

  const stopSpeech = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeechPaused(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(correctedText).then(() => {
      alert('Text copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy text:', err);
      alert('Failed to copy text.');
    });
  };

  const clearText = () => {
    setCorrectedText('');
    stopSpeech();
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setIsDrawerOpen(open);
  };

  const handleMenuClick = (action) => {
    switch (action) {
      case 'back':
        navigate(-1);
        break;
      case 'logout':
        localStorage.removeItem('token');
        navigate('/login');
        break;
      default:
        break;
    }
  };

  const wordCount = correctedText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = correctedText.length;

  return (
    <Box
      sx={{
        // Full-screen background styling
        minHeight: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        overflow: 'auto', // Allow scrolling if content overflows
      }}
    >
      {/* Top Bar */}
      <Box
        sx={{
          position: 'sticky', // Sticky top bar
          top: 0,
          left: 0,
          width: '100%',
          background: 'linear-gradient(45deg, #ff6f00, #ffca28)',
          display: 'flex',
          alignItems: 'center',
          padding: 2,
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 1100, // Ensure it stays above other content
        }}
      >
        <IconButton onClick={toggleDrawer(true)} sx={{ color: '#fff' }}>
          <MenuIcon />
        </IconButton>
        <Typography
          variant="h6"
          sx={{ marginLeft: 2, color: '#fff', fontWeight: 'bold' }}
        >
          Extracted Text Viewer
        </Typography>
      </Box>

      {/* Drawer */}
      <Drawer anchor="left" open={isDrawerOpen} onClose={toggleDrawer(false)}>
        <Box
          sx={{
            width: 250,
            background: 'linear-gradient(to bottom, #ab47bc, #7c4dff)',
            height: '100%',
            color: '#fff',
          }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <List>
            <ListItem button onClick={() => handleMenuClick('back')}>
              <ListItemText primary="Back" sx={{ color: '#fff' }} />
            </ListItem>
            <ListItem button onClick={() => handleMenuClick('logout')}>
              <ListItemText primary="Logout" sx={{ color: '#fff' }} />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        sx={{
          mt: 10,
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white background
          padding: 3,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          mx: 'auto',
          maxWidth: '80%',
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{ color: '#d81b60', fontWeight: 'bold' }}
        >
          Extracted Text
        </Typography>

        <TextareaAutosize
          minRows={10}
          placeholder="Edit your extracted text here..."
          value={correctedText}
          onChange={handleTextChange}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '2px solid #f06292',
            backgroundColor: '#fce4ec',
            color: '#4a148c',
          }}
        />

        <Typography variant="body2" sx={{ mt: 1, color: '#4a148c' }}>
          Words: {wordCount} | Characters: {charCount}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            onClick={handleDownloadAsPDF}
            sx={{
              background: 'linear-gradient(45deg, #7b1fa2, #ab47bc)',
              color: '#fff',
              '&:hover': { background: 'linear-gradient(45deg, #ab47bc, #7b1fa2)' },
              borderRadius: '20px',
              padding: '10px 20px',
            }}
          >
            Download as PDF
          </Button>
          <Button
            variant="contained"
            onClick={saveToHistory}
            sx={{
              background: 'linear-gradient(45deg, #ff6f00, #ffca28)',
              color: '#fff',
              '&:hover': { background: 'linear-gradient(45deg, #ffca28, #ff6f00)' },
              borderRadius: '20px',
              padding: '10px 20px',
            }}
          >
            Save to History
          </Button>
          <Button
            variant="contained"
            onClick={copyToClipboard}
            sx={{
              background: 'linear-gradient(45deg, #0288d1, #4fc3f7)',
              color: '#fff',
              '&:hover': { background: 'linear-gradient(45deg, #4fc3f7, #0288d1)' },
              borderRadius: '20px',
              padding: '10px 20px',
            }}
          >
            Copy to Clipboard
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={clearText}
            sx={{
              borderRadius: '20px',
              padding: '10px 20px',
            }}
          >
            Clear Text
          </Button>
        </Box>

        {isEnglishText(correctedText) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              onClick={textToSpeech}
              sx={{
                background: 'linear-gradient(45deg, #ff4081, #f06292)',
                color: '#fff',
                '&:hover': { background: 'linear-gradient(45deg, #f06292, #ff4081)' },
                borderRadius: '20px',
                padding: '10px 20px',
              }}
            >
              Listen to Text
            </Button>
            {isSpeaking && (
              <>
                <Button
                  variant="outlined"
                  onClick={pauseSpeech}
                  disabled={speechPaused}
                  sx={{
                    borderColor: '#ff4081',
                    color: '#ff4081',
                    '&:hover': { borderColor: '#d81b60', color: '#d81b60' },
                    borderRadius: '20px',
                    padding: '10px 20px',
                  }}
                >
                  Pause
                </Button>
                <Button
                  variant="outlined"
                  onClick={resumeSpeech}
                  disabled={!speechPaused}
                  sx={{
                    borderColor: '#ff4081',
                    color: '#ff4081',
                    '&:hover': { borderColor: '#d81b60', color: '#d81b60' },
                    borderRadius: '20px',
                    padding: '10px 20px',
                  }}
                >
                  Resume
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={stopSpeech}
                  sx={{
                    borderRadius: '20px',
                    padding: '10px 20px',
                  }}
                >
                  Stop
                </Button>
              </>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ResultPage;
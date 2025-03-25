import { useState } from 'react';
import {
  Button,
  Typography,
  Box,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  ListSubheader,
  TextareaAutosize,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UndoIcon from '@mui/icons-material/Undo';
import html2pdf from 'html2pdf.js';
import backgroundImage from '../assets/skin3.jpg'; // Import the same background image

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [revertedText, setRevertedText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechPaused, setSpeechPaused] = useState(false);
  const isEnglishText = (text) => /^[\x20-\x7E]*$/.test(text);
  const navigate = useNavigate();

  const handleRevert = (text) => {
    setRevertedText(text);
  };

  const handleDownloadAsPDF = () => {
    if (!revertedText) return;

    const element = document.createElement('div');
    element.style.padding = '20px';
    element.style.backgroundColor = '#f0f4c3';
    element.innerHTML = `<h3 style="color: #d81b60;">Edited History</h3><p style="color: #4a148c;">${revertedText.replace(/\n/g, '<br/>')}</p>`;

    const options = {
      margin: 1,
      filename: 'edited_history.pdf',
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };

    html2pdf().from(element).set(options).save();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      const previewUrl = URL.createObjectURL(selectedFile);
      setImagePreview(previewUrl);
    } else {
      setImagePreview(null);
    }
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please upload an image.');
      return;
    }

    if (!language || language === '') {
      alert('Please select a language.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('language', language);

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Backend Response:', response.data);
      const extractedText = response.data.extractedText;
      navigate('/result', { state: { extractedText } });
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.response) {
        console.error('Error details:', error.response.data);
        alert(error.response.data.error || 'Error processing image');
      }
    } finally {
      setLoading(false);
    }
  };

  const textToSpeech = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const voices = speechSynthesis.getVoices();
      const englishVoice = voices.find((voice) => voice.lang.startsWith('en'));
      const utterance = new SpeechSynthesisUtterance();
      utterance.voice = englishVoice;
      utterance.text = revertedText;

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
    navigator.clipboard.writeText(revertedText).then(() => {
      alert('Text copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy text:', err);
      alert('Failed to copy text.');
    });
  };

  const clearText = () => {
    setRevertedText('');
    stopSpeech();
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:4000/api/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.length === 0) {
        alert('No history is there.');
        setIsHistoryVisible(false);
      } else {
        setHistory(res.data);
        setIsHistoryVisible(true);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryRecord = async (recordId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to delete history.');
        return;
      }

      const res = await axios.delete(`http://localhost:4000/api/history/${recordId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedHistory = history.filter((entry) => entry._id !== recordId);
      setHistory(updatedHistory);

      alert(res.data?.msg || 'Record deleted successfully!');
      if (updatedHistory.length === 0) {
        setIsHistoryVisible(false);
      }
    } catch (err) {
      console.error('Error deleting history record:', err.response?.data || err.message);
      alert(err.response?.data?.msg || 'An error occurred while deleting the record.');
    }
  };

  const clearHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to clear history.');
        return;
      }

      const res = await axios.delete('http://localhost:4000/api/history', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setHistory([]);
      setIsHistoryVisible(false);
      alert(res.data?.msg || 'History cleared successfully!');
    } catch (err) {
      console.error('Error clearing history:', err.response?.data || err.message);
      alert(err.response?.data?.msg || 'An error occurred while clearing history.');
    }
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setIsDrawerOpen(open);
  };

  const handleMenuClick = (action) => {
    switch (action) {
      case 'searchHistory':
        fetchHistory();
        break;
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
          display: 'flex',
          alignItems: 'center',
          padding: 2,
          background: 'linear-gradient(45deg, #ff6f00, #ffca28)',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
          position: 'sticky',
          top: 0,
          zIndex: 1100, // Ensure it stays above other content
        }}
      >
        <IconButton onClick={toggleDrawer(true)} sx={{ color: '#fff' }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ marginLeft: 2, color: '#fff', fontWeight: 'bold' }}>
          Upload Handwritten Image
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
            <ListItem button onClick={() => handleMenuClick('searchHistory')}>
              <ListItemText primary="Search History" sx={{ color: '#fff' }} />
            </ListItem>
            <ListItem button onClick={() => handleMenuClick('logout')}>
              <ListItemText primary="Logout" sx={{ color: '#fff' }} />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Upload Section */}
      {!isHistoryVisible && (
        <Box
          sx={{
            maxWidth: 'sm',
            background: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white background
            borderRadius: 3,
            padding: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            mt: 5,
            mx: 'auto', // Center horizontally
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{
                padding: '10px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '2px solid #7b1fa2',
                marginBottom: '10px',
              }}
            />
            {imagePreview && (
              <Box sx={{ mt: 2 }}>
                <img
                  src={imagePreview}
                  alt="Selected Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    border: '3px solid #ff4081',
                    borderRadius: '8px',
                  }}
                />
              </Box>
            )}
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel
                sx={{
                  color: '#000',
                  fontWeight: 'bold',
                }}
              >
                Select Language of the Handwritten Image
              </InputLabel>
              <Select
                value={language}
                onChange={handleLanguageChange}
                label="Select Language of the Handwritten Image"
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ff4081' },
                }}
              >
                <MenuItem value="">
                  <em>Select Language</em>
                </MenuItem>
                <MenuItem value="eng">English</MenuItem>
                <MenuItem value="te">Telugu</MenuItem>
                <MenuItem value="hi">Hindi</MenuItem>
                <MenuItem value="ta">Tamil</MenuItem>
                <MenuItem value="mal">Malayalam</MenuItem>
                <MenuItem value="kan">Kannada</MenuItem>
                <MenuItem value="mr">Marathi</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              sx={{
                mt: 2,
                background: 'linear-gradient(45deg, #ff6f00, #ffca28)',
                color: '#fff',
                '&:hover': { background: 'linear-gradient(45deg, #ffca28, #ff6f00)' },
                borderRadius: '20px',
                padding: '10px 20px',
              }}
              onClick={handleUpload}
            >
              Upload
            </Button>
            {loading && <CircularProgress sx={{ mt: 2, color: '#ff4081' }} />}
          </Box>
        </Box>
      )}

      {/* History Section */}
      {isHistoryVisible && !revertedText && (
        <Box
          sx={{
            mt: 4,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white background
            padding: 3,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            mx: 'auto',
            maxWidth: '80%',
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
            History
          </Typography>
          <List
            subheader={<ListSubheader sx={{ backgroundColor: '#81c784', color: '#fff' }}>Previous Search History</ListSubheader>}
            sx={{ textAlign: 'left', mx: 'auto', maxWidth: '60%', backgroundColor: '#fff', borderRadius: '8px' }}
          >
            {history.map((entry) => (
              <ListItem key={entry._id} divider sx={{ backgroundColor: '#f3e5f5' }}>
                <ListItemText primary={entry.correctedText} sx={{ color: '#4a148c' }} />
                <IconButton color="primary" onClick={() => handleRevert(entry.correctedText)} sx={{ mr: 1 }}>
                  <UndoIcon />
                </IconButton>
                <IconButton color="error" onClick={() => deleteHistoryRecord(entry._id)}>
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              color="error"
              onClick={clearHistory}
              sx={{ borderRadius: '20px', padding: '10px 20px' }}
            >
              Clear History
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#0288d1',
                '&:hover': { backgroundColor: '#0277bd' },
                borderRadius: '20px',
                padding: '10px 20px',
              }}
              onClick={() => setIsHistoryVisible(false)}
            >
              Close History
            </Button>
          </Box>
        </Box>
      )}

      {/* Edit History Section */}
      {revertedText && (
        <Box
          sx={{
            mt: 4,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white background
            padding: 3,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            mx: 'auto',
            maxWidth: '80%',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ color: '#d81b60', fontWeight: 'bold' }}>
            Edit History Record
          </Typography>

          {/* Textarea for Editing */}
          <TextareaAutosize
            minRows={10}
            value={revertedText}
            onChange={(e) => setRevertedText(e.target.value)}
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

          {/* Word and Character Count */}
          <Typography variant="body2" sx={{ mt: 1, color: '#4a148c' }}>
            Words: {revertedText.trim().split(/\s+/).filter(Boolean).length} | Characters: {revertedText.length}
          </Typography>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            {/* Download as PDF */}
            <Button
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #7b1fa2, #ab47bc)',
                color: '#fff',
                '&:hover': { background: 'linear-gradient(45deg, #ab47bc, #7b1fa2)' },
                borderRadius: '20px',
                padding: '10px 20px',
              }}
              onClick={handleDownloadAsPDF}
            >
              Download as PDF
            </Button>

            {/* Copy to Clipboard */}
            <Button
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #0288d1, #4fc3f7)',
                color: '#fff',
                '&:hover': { background: 'linear-gradient(45deg, #4fc3f7, #0288d1)' },
                borderRadius: '20px',
                padding: '10px 20px',
              }}
              onClick={copyToClipboard}
            >
              Copy to Clipboard
            </Button>

            {/* Clear Text */}
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

            {/* Close Edit History */}
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#0288d1',
                '&:hover': { backgroundColor: '#0277bd' },
                borderRadius: '20px',
                padding: '10px 20px',
              }}
              onClick={() => setRevertedText('')}
            >
              Close Edit History Record
            </Button>
          </Box>

          {/* Text-to-Speech Section */}
          {isEnglishText(revertedText) && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
              {/* Listen to Text */}
              <Button
                variant="contained"
                sx={{
                  background: 'linear-gradient(45deg, #ff4081, #f06292)',
                  color: '#fff',
                  '&:hover': { background: 'linear-gradient(45deg, #f06292, #ff4081)' },
                  borderRadius: '20px',
                  padding: '10px 20px',
                }}
                onClick={textToSpeech}
              >
                Listen to Text
              </Button>

              {/* Pause, Resume, and Stop Buttons */}
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
      )}
    </Box>
  );
};

export default UploadPage;
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs'); // Add this line to import the 'fs' module
const router = express.Router();

const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path));

    const response = await axios.post('http://localhost:5000/upload', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error forwarding to Flask server:', error.message);
    res.status(500).json({ error: 'Server error' });
  } finally {
    // Clean up the temporary uploaded file
    fs.unlinkSync(req.file.path);
  }
});

module.exports = router;

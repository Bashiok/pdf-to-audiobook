// server.js
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API endpoint for PDF conversion
app.post('/api/convert', upload.single('pdf'), async (req, res) => {
  try {
    const { voice, format, speed } = req.body.settings;
    const pdfPath = req.file.path;
    
    // 1. Extract text from PDF
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    const text = data.text;
    
    // 2. Call Kokoro TTS API (fp32 model)
    // This is a placeholder - you'd need to integrate with the actual API
    const audioPath = await convertTextToSpeech(text, voice, speed);
    
    // 3. Convert to requested format
    const outputPath = await convertAudioFormat(audioPath, format);
    
    // 4. Clean up temporary files
    fs.unlinkSync(pdfPath);
    fs.unlinkSync(audioPath);
    
    // 5. Return the audio file
    res.sendFile(outputPath, {}, () => {
      fs.unlinkSync(outputPath);
    });
    
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

async function convertTextToSpeech(text, voice, speed) {
  // This would call the Kokoro TTS API
  // For now, we'll simulate it with a mock
  return new Promise((resolve) => {
    const outputPath = path.join(__dirname, 'temp_audio.wav');
    // In a real implementation, you would call the Kokoro API here
    resolve(outputPath);
  });
}

async function convertAudioFormat(inputPath, format) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(__dirname, `output.${format.toLowerCase()}`);
    
    let command;
    if (format === 'MP3') {
      command = `ffmpeg -i ${inputPath} -codec:a libmp3lame -qscale:a 2 ${outputPath}`;
    } else if (format === 'WAV') {
      command = `ffmpeg -i ${inputPath} ${outputPath}`;
    } else {
      return reject(new Error('Unsupported format'));
    }
    
    exec(command, (error) => {
      if (error) return reject(error);
      resolve(outputPath);
    });
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const ffmpeg = require('fluent-ffmpeg');
const { PassThrough } = require('stream');
const axios = require('axios');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const FormData = require('form-data');

// Set the path to the FFmpeg binary
ffmpeg.setFfmpegPath(ffmpegPath);

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

/**
 * Extracts audio from a video file as a buffer and transcribes it using Whisper API.
 * @param {string} videoPath - Path to the video file.
 * @returns {Promise<string>} - Transcribed text from the video.
 */
const transcribeVideo = (videoPath) => {
  return new Promise((resolve, reject) => {
    const audioStream = new PassThrough();
    const chunks = [];

    // Setup ffmpeg to extract audio
    ffmpeg(videoPath)
      .noVideo()         // Ensures we are only extracting audio
      .format('mp3')     // Output format
      .audioCodec('libmp3lame')
      .on('error', (err) => reject(`Error extracting audio: ${err.message}`))
      .on('end', async () => {
        try {
          // Once ffmpeg finishes, we have all audio data in `chunks`
          const audioBuffer = Buffer.concat(chunks);

          // Create a FormData instance using `form-data` package
          const formData = new FormData();
          formData.append('file', audioBuffer, {
            filename: 'audio.mp3',
            contentType: 'audio/mpeg',
          });
          formData.append('model', 'whisper-1');

          // Send POST request to OpenAI Whisper API
          const response = await axios.post(OPENAI_API_URL, formData, {
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              ...formData.getHeaders(),
            },
          });

          resolve(response.data.text);
        } catch (err) {
          reject(`Error transcribing audio: ${err.message}`);
        }
      })
      .pipe(audioStream);

    // Collect data chunks from the audio stream
    audioStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    audioStream.on('error', (err) => reject(`Error reading audio stream: ${err.message}`));
  });
};

module.exports = transcribeVideo;

const ffmpeg = require('fluent-ffmpeg');
const { PassThrough } = require('stream');
const axios = require('axios');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

// Set the path to the FFmpeg binary
ffmpeg.setFfmpegPath(ffmpegPath);

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

/**
 * Extracts audio from a video file as a stream and transcribes it using Whisper API.
 * @param {string} videoPath - Path to the video file.
 * @returns {Promise<string>} - Transcribed text from the video.
 */
const transcribeVideo = (videoPath) => {
  return new Promise((resolve, reject) => {
    const audioStream = new PassThrough();

    // Extract audio from the video as a stream
    ffmpeg(videoPath)
      .output(audioStream)
      .format('mp3') // Ensure the format is compatible with Whisper API
      .audioCodec('libmp3lame')
      .on('error', (err) => reject(`Error extracting audio: ${err.message}`))
      .run();

    // Prepare form data for Whisper API
    const formData = new FormData();
    formData.append('file', audioStream, {
      filename: 'audio.mp3',
      contentType: 'audio/mpeg',
    });
    formData.append('model', 'whisper-1');

    // Make the API request
    axios
      .post(OPENAI_API_URL, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      })
      .then((response) => resolve(response.data.text))
      .catch((err) => reject(`Error transcribing audio: ${err.message}`));
  });
};

module.exports = transcribeVideo;

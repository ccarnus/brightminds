const ffmpeg = require('fluent-ffmpeg');
const { PassThrough } = require('stream');
const openai = require('openai');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

// Set the path to the FFmpeg binary
ffmpeg.setFfmpegPath(ffmpegPath);

// Set OpenAI API Key
const apikey = process.env.OPENAI_API_KEY;
const client = new openai({ apikey });

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
      .on('end', () => console.log('Audio extraction completed.'))
      .run();

    // Send audio stream to Whisper API
    client.audio
      .transcribe({
        model: 'whisper-1',
        file: audioStream,
      })
      .then((response) => resolve(response.text))
      .catch((err) => reject(`Error transcribing audio: ${err.message}`));
  });
};

module.exports = transcribeVideo;

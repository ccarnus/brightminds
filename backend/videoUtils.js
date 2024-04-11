const ffmpeg = require('fluent-ffmpeg');

/**
 * Gets the duration of a video file.
 * @param {string} videoFilePath Path to the video file.
 * @returns {Promise<number>} A promise that resolves with the video duration in seconds.
 */
const getVideoDurationInSeconds = (videoFilePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoFilePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const durationInMinutes = metadata.format.duration / 60;
        resolve(metaddurationInMinutes);
      }
    });
  });
};

module.exports = { getVideoDurationInSeconds };

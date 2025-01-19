/**
 * Computes a duration value from the given article description 
 * or any other parameters you need.
 *
 * @param {string} description - The article text/description.
 * @returns {number} - The computed duration (e.g. in minutes).
 */
function computeDuration(description) {
    // Example logic: 1 minute per 150 words in the description
    const wordsPerMinute = 150;
    const wordCount = description ? description.trim().split(/\s+/).length : 0;
    const duration = Math.ceil(wordCount / wordsPerMinute);
  
    return duration; 
  }
  
  module.exports = computeDuration;
  
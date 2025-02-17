// topic_indicator_computor.js

const axios = require('axios');
const cron = require('node-cron');
const mongoose = require('mongoose');
const Topic = require('../models/topic_model.js');

// MongoDB connection
mongoose.connect('mongodb+srv://ccarnus:totodu30@cast.xwxgb0o.mongodb.net/?retryWrites=true&w=majority')
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas for topic indicator computor!');
    // Once connected, schedule the job and/or run an immediate update.
    scheduleWeeklyImpactUpdate();
    computeImpactForAllTopics();
  })
  .catch((error) => {
    console.error('Unable to connect to MongoDB Atlas', error);
  });

// Your SERP API key and base URL
const SERP_API_KEY = 'e907eabcbaaa6d56cc12ebc3b9d1551dc0f900c1d2370d407c4a74757f682641';
const SERP_BASE_URL = 'https://serpapi.com/search';

/**
 * Computes and updates the impact value for a single topic.
 * It makes a GET request to the SERP API using the topic name as the query.
 * The returned total_results value is then saved to the topic's impact field.
 *
 * @param {Object} topic - A Mongoose Topic document.
 * @returns {Promise<Object>} The updated topic document.
 */
async function computeImpactForTopic(topic) {
  try {
    const query = encodeURIComponent(topic.name);
    const url = `${SERP_BASE_URL}?q=${query}&api_key=${SERP_API_KEY}`;

    const response = await axios.get(url);
    if (
      response.data &&
      response.data.search_information &&
      typeof response.data.search_information.total_results !== 'undefined'
    ) {
      // Update the topic impact using the total_results number
      topic.impact = response.data.search_information.total_results;
      await topic.save();
      console.log(`Updated impact for topic "${topic.name}" to ${topic.impact}`);
      return topic;
    } else {
      console.error(`Invalid response structure for topic "${topic.name}".`);
      return null;
    }
  } catch (error) {
    console.error(`Error computing impact for topic "${topic.name}":`, error.message);
    return null;
  }
}

/**
 * Finds all topics and computes their impact value.
 *
 * @returns {Promise<void>}
 */
async function computeImpactForAllTopics() {
  try {
    const topics = await Topic.find();
    console.log(`Found ${topics.length} topic(s) for impact update.`);
    for (const topic of topics) {
      await computeImpactForTopic(topic);
    }
    console.log("Completed updating impact for all topics.");
  } catch (error) {
    console.error("Error computing impact for all topics:", error.message);
  }
}

/**
 * Schedules a job to update the impact value for all topics every Monday at midnight.
 * The cron pattern "0 0 * * 1" corresponds to "At 00:00 on Monday."
 */
function scheduleWeeklyImpactUpdate() {
  cron.schedule('0 0 * * 1', () => {
    console.log("Scheduled weekly impact update started...");
    computeImpactForAllTopics();
  });
  console.log("Weekly impact update scheduled for every Monday at midnight.");
}

// Export the functions so they can be triggered elsewhere (for example, during topic creation)
module.exports = {
  computeImpactForTopic,
  computeImpactForAllTopics,
  scheduleWeeklyImpactUpdate,
};

// If this file is executed directly, the mongoose connection above will trigger the scheduling and immediate update.

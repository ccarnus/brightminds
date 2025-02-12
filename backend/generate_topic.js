const axios = require('axios');
const openai = require('openai');
const departments_ids = require('../lists/departments_ids');
const Topic = require('../models/topic_model.js');
const Cast = require('../models/cast_model.js');

const client = new openai({
  apiKey: process.env.OPENAI_API_KEY,
});

function getFieldId(departmentName) {
  const mapping = departments_ids.find(d => d.display_name === departmentName);
  return mapping ? mapping.id : null;
}

async function fetchAllOpenAlexTopics(fieldId) {
  let topics = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    const url = `https://api.openalex.org/topics?filter=field.id:${fieldId}&per_page=${perPage}&select=id,display_name&page=${page}`;
    const response = await axios.get(url);
    const results = response.data.results;
    if (results && results.length > 0) {
      topics = topics.concat(results);
      // If fewer than perPage topics were returned, we've reached the last page
      if (results.length < perPage) {
        break;
      }
      page++;
    } else {
      break;
    }
  }
  return topics;
}

/**
 * Uses GPT-4 to choose the best matching topic from the provided list based on the cast description.
 * The prompt instructs GPT-4 to respond with exactly the topic name as it appears in the list.
 */
async function determineBestTopic(description, topics) {
  const topicsText = topics
    .map((topic, index) => `${index + 1}. ${topic.display_name}`)
    .join('\n');

  const prompt = `I have a cast with the following description:\n\n"${description}"\n\nHere is a list of topics from the field. Based on the description, which one of these topics best matches the cast? Respond with only the topic name exactly as it appears in the list.\n\nTopics:\n${topicsText}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are an expert in categorizing research topics.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 50,
    temperature: 0.3,
  });

  // Expect the GPT-4 answer to be just the topic name.
  const bestTopicName = response.choices[0].message.content.trim();
  return bestTopicName;
}

/**
 * Main function: Given a cast object (with description and department),
 * this function fetches topics from OpenAlex, uses GPT-4 to determine the best match,
 * updates the cast object's topic field, and ensures the topic document exists.
 */
async function generateTopicForCast(cast) {
  try {
    // 1. Get the field id for the cast's department.
    const fieldId = getFieldId(cast.department);
    if (!fieldId) {
      throw new Error(`No field id found for department ${cast.department}`);
    }

    // 2. Fetch all topics from OpenAlex for this field.
    const openAlexTopics = await fetchAllOpenAlexTopics(fieldId);
    if (openAlexTopics.length === 0) {
      throw new Error('No topics returned from OpenAlex.');
    }

    // 3. Use GPT-4 to determine the best matching topic.
    const bestTopicName = await determineBestTopic(cast.description, openAlexTopics);
    console.log(`For cast "${cast.title}" the best matching topic is: ${bestTopicName}`);

    // 4. Update the cast with the new topic.
    cast.topic = bestTopicName;
    await cast.save();
    console.log(`Cast "${cast.title}" updated with topic: ${bestTopicName}`);

    // 5. Ensure the topic document exists or is updated.
    const topicController = require('../controllers/topic_controller.js');
    const topicResult = await topicController.createTopicIfNotExist({
      name: bestTopicName,
      departmentName: cast.department,
      contentId: cast._id,
      contentType: 'cast'
    });
    console.log(topicResult.message);

    return bestTopicName;
  } catch (error) {
    console.error('Error generating topic for cast:', error);
    return null;
  }
}

module.exports = {
  generateTopicForCast,
  fetchAllOpenAlexTopics,
  determineBestTopic,
  getFieldId
};

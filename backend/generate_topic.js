const axios = require('axios');
const openai = require('openai');
const departments_ids = require('../lists/departments_ids');
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
      if (results.length < perPage) break;
      page++;
    } else {
      break;
    }
  }
  return topics;
}
 
/**
 * Uses GPT-4 to choose the best matching topic from the provided list based on the description.
 * The prompt is adapted based on the content type (cast or article).
 */
async function determineBestTopic(description, topics, contentType) {
  const contentText = contentType === 'article' ? "article" : "cast";
  const topicsText = topics.map(topic => topic.display_name).join('\n');
  const prompt = `I have a ${contentText} with the following description:\n\n"${description}"\n\nHere is a list of topics from the field (one per line). Based on the description, which one of these topics best matches the ${contentText}? Respond with only the topic name exactly as it appears in the list, without any numbering or extra characters.\n\nTopics:\n${topicsText}`;
 
  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are an expert in categorizing research topics.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 50,
    temperature: 0.3,
  });
 
  const bestTopicNameRaw = response.choices[0].message.content.trim();
  const bestTopicName = bestTopicNameRaw.replace(/^\d+\.\s*/, '');
  return bestTopicName;
}
 
/**
 * A helper function that takes a content object (cast or article) and its type,
 * then uses GPT-4 (and the OpenAlex API) to determine the best topic,
 * updates the object’s topic field, and ensures a Topic document exists.
 */
async function generateTopicForContent(content, contentType) {
  try {
    // 1. Get the field id from the department.
    const fieldId = getFieldId(content.department);
    if (!fieldId) {
      throw new Error(`No field id found for department ${content.department}`);
    }
 
    // 2. Fetch all topics from OpenAlex for this field.
    const openAlexTopics = await fetchAllOpenAlexTopics(fieldId);
    if (openAlexTopics.length === 0) {
      throw new Error('No topics returned from OpenAlex.');
    }
 
    // 3. Use GPT-4 to determine the best matching topic.
    const bestTopicName = await determineBestTopic(content.description, openAlexTopics, contentType);
    console.log(`For ${contentType} "${content.title}" the best matching topic is: ${bestTopicName}`);
 
    // 4. Update the content object with the new topic.
    content.topic = bestTopicName;
    await content.save();
    console.log(`${contentType} "${content.title}" updated with topic: ${bestTopicName}`);
 
    // 5. Ensure the Topic document exists (or is updated) using your topic controller.
    const topicController = require('../controllers/topic_controller.js');
    const topicResult = await topicController.createTopicIfNotExist({
      name: bestTopicName,
      departmentName: content.department,
      contentId: content._id,
      contentType: contentType
    });
    console.log(topicResult.message);
 
    return bestTopicName;
  } catch (error) {
    console.error(`Error generating topic for ${contentType}:`, error);
    return null;
  }
}
 
module.exports = {
  generateTopicForCast: async (cast) => generateTopicForContent(cast, 'cast'),
  generateTopicForArticle: async (article) => generateTopicForContent(article, 'article'),
  fetchAllOpenAlexTopics,
  determineBestTopic,
  getFieldId
};

const Topic = require('../models/topic_model.js');

exports.createTopicIfNotExist = async ({
    name, 
    departmentName, 
    contentId, 
    contentType // 'article' or 'cast'
  }) => {
    try {
      // 1) Search for an existing topic
      let topic = await Topic.findOne({ name, departmentName });
  
      // 2) If topic doesn't exist, create a new one
      if (!topic) {
        const newTopicData = {
          name,
          departmentName
        };
  
        // Depending on what contentType is, initialize
        if (contentType === 'article') {
          newTopicData.articleCount = 1;
          newTopicData.articleIDs = [contentId];
        } else {
          newTopicData.castCount = 1;
          newTopicData.castIDs = [contentId];
        }
  
        topic = new Topic(newTopicData);
        await topic.save();
  
        return { message: 'Topic created successfully.', topic, status: 201 };
      }
  
      // 3) If topic DOES exist, update the correct array/counter
      if (contentType === 'article') {
        // Only add if not already present
        if (!topic.articleIDs.some(id => id.equals(contentId))) {
          topic.articleIDs.push(contentId);
          topic.articleCount += 1;
        }
      } else {
        // Cast
        if (!topic.castIDs.some(id => id.equals(contentId))) {
          topic.castIDs.push(contentId);
          topic.castCount += 1;
        }
      }
  
      await topic.save();
      return { message: 'Topic updated successfully.', topic, status: 200 };
    } catch (error) {
      console.error('Error creating or updating topic:', error);
      throw new Error('Error creating or updating topic.');
    }
  };

exports.getTopicsByDepartment = async (req, res, next) => {
    try {
        const topics = await Topic.find({ departmentName: req.params.departmentName });
        res.status(200).json(topics);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching topics.' });
    }
};

exports.getAllTopics = async (req, res, next) => {
    try {
        const topics = await Topic.find();
        res.status(200).json(topics);
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.getOneTopic = async (req, res, next) => {
    try {
        const topic = await Topic.findById(req.params.id);
        res.status(200).json(topic);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching topic.' });
    }
};

exports.updateTopic = async (req, res, next) => {
    try {
        const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(topic);
    } catch (error) {
        res.status(500).json({ error: 'Error updating topic.' });
    }
};

exports.removeExistingTopic = async ({
    name,
    departmentName,
    contentId,
    contentType // 'article' or 'cast'
  }) => {
    try {
      // 1) Find the topic
      const topic = await Topic.findOne({ name, departmentName });
      if (!topic) {
        return { status: 404, message: 'Topic not found.' };
      }
  
      // 2) Remove ID from the correct array and decrement
      if (contentType === 'article') {
        const originalLength = topic.articleIDs.length;
        topic.articleIDs = topic.articleIDs.filter(id => !id.equals(contentId));
        const newLength = topic.articleIDs.length;
  
        // Only decrement if an ID was actually removed
        if (newLength < originalLength) {
          topic.articleCount -= (originalLength - newLength);
          if (topic.articleCount < 0) {
            topic.articleCount = 0; // just a safeguard
          }
        }
      } else {
        // It's a cast
        const originalLength = topic.castIDs.length;
        topic.castIDs = topic.castIDs.filter(id => !id.equals(contentId));
        const newLength = topic.castIDs.length;
  
        // Only decrement if an ID was actually removed
        if (newLength < originalLength) {
          topic.castCount -= (originalLength - newLength);
          if (topic.castCount < 0) {
            topic.castCount = 0; // safeguard
          }
        }
      }
  
      // 3) If the topic has no articles AND no casts, remove it entirely
      if (topic.articleCount <= 0 && topic.castCount <= 0) {
        await Topic.deleteOne({ _id: topic._id });
        return { status: 200, message: 'Topic removed as no more content is associated.' };
      } else {
        await topic.save();
        return { status: 200, message: 'Content removed from topic successfully.', topic };
      }
    } catch (error) {
      console.error('Error removing content from topic:', error);
      throw new Error('Error removing content from topic.');
    }
  };
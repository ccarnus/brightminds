// queues/castQueue.js
const Queue = require('bull');
const generateEvaluation = require('../backend/generate_question');
const generateCastImage = require('../backend/generate_cast_image');
const Cast = require('../models/cast_model');

const castQueue = new Queue('castQueue');

castQueue.process(async (job, done) => {
    const { castId, description, url } = job.data;
    
    try {
        const evaluation = await generateEvaluation(description);
        const imagePath = await generateCastImage(description);
        const castImageURL = url + imagePath.replace(/^.*\/backend/, '/backend');

        await Cast.findByIdAndUpdate(castId, {
            evaluation: evaluation,
            castimageurl: castImageURL
        });

        done();
    } catch (error) {
        console.error('Error processing cast:', error);
        done(error);
    }
});

module.exports = castQueue;

// queues/castQueue.js
const Queue = require('bull');
const generateEvaluation = require('../backend/generate_question');
const generateCastImage = require('../backend/generate_cast_image');
const Cast = require('../models/cast_model');
const transcribeVideo = require('../backend/transcription');

const castQueue = new Queue('castQueue');

castQueue.process(async (job, done) => {
    const { castId, videoFilePath, url } = job.data;

    try {
        // 1. Transcribe the video
        const transcript = await transcribeVideo(videoFilePath);

        // 2. Update the cast description with the transcript
        await Cast.findByIdAndUpdate(castId, {
            description: transcript
        }, { new: true });

        // 3. Generate evaluation and image based on the transcript
        const evaluation = await generateEvaluation(transcript);
        const imagePath = await generateCastImage(transcript);
        const castImageURL = url + imagePath.replace(/^.*\/backend/, '/backend');

        // 4. Update the cast with evaluation and image
        await Cast.findByIdAndUpdate(castId, {
            evaluation: evaluation,
            castimageurl: castImageURL
        }, { new: true });

        done();
    } catch (error) {
        console.error('Error processing cast in queue:', error);
        done(error);
    }
});

module.exports = castQueue;

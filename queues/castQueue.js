// queues/castQueue.js
const fs = require('fs').promises;
const path = require('path');

castQueue.process(async (job, done) => {
  const { castId, videoFilePath, url } = job.data;
  try {
    // 1. Transcribe the video (one call)
    const { text: fullTranscript, srt: srtContent } = await transcribeVideo(videoFilePath);

    // 2. Save the SRT file to your server
    const subtitlesDir = path.join(__dirname, '../backend/media/cast_subtitles');
    await fs.mkdir(subtitlesDir, { recursive: true }); // ensure directory
    const srtFilename = `${castId}.srt`;
    const srtFilePath = path.join(subtitlesDir, srtFilename);

    await fs.writeFile(srtFilePath, srtContent, 'utf8');

    // 3. Update the cast's "description" with the transcript text
    //    and store the subtitle URL
    const castSubtitleURL = url + '/backend/media/cast_subtitles/' + srtFilename;

    let cast = await Cast.findByIdAndUpdate(
      castId,
      {
        description: fullTranscript,
        subtitleurl: castSubtitleURL // <-- new field in your model
      },
      { new: true }
    );

    // 4. Generate evaluation and image using the same transcript
    const evaluation = await generateEvaluation(fullTranscript);
    const imagePath = await generateCastImage(fullTranscript);
    const castImageURL = url + imagePath.replace(/^.*\/backend/, '/backend');

    // 5. Update the cast with evaluation and image
    cast = await Cast.findByIdAndUpdate(
      castId,
      {
        evaluation,
        castimageurl: castImageURL
      },
      { new: true }
    );

    done();
  } catch (error) {
    console.error('Error processing cast in queue:', error);
    done(error);
  }
});

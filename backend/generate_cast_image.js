const openai = require('openai');
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // To download the image
const sharp = require('sharp'); // To resize the image

const apikey = process.env.OPENAI_API_KEY;
const client = new openai({apikey});

async function downloadImage(url, filepath) {
    const writer = fs.createWriteStream(filepath);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function resizeImage(inputPath, outputPath, width, height) {
    try {
        await sharp(inputPath)
            .resize(width, height)
            .toFile(outputPath);
        console.log('Image resized successfully');
    } catch (error) {
        console.error('Error resizing image:', error);
    }
}

async function generateCastImage(description) {
    const modifiedDescription = `Create an engaging and visually appealing landscape cover image for a video. The design should be slick, simple, and user-friendly, inviting viewers without being too detailed. Focus on a few key components that accurately depict the video's subject matter, ensuring the image is clean, attractive, and uncluttered. The image should be vibrant and eye-catching to attract viewers. Do not include any text or writing in the image. The content of the image should align with the theme of this description: ${description}`;
    try {
        const response = await client.images.generate({
            model: "dall-e-3",
            prompt: modifiedDescription,
            n: 1,
            size: "1024x1024" // Generate in closest available format
        });

        if (!response.data || response.data.length === 0) {
            console.error("Unexpected response structure:", response);
            return null;
        }

        const imageUrl = response.data[0].url;
        const originalImagePath = path.join(__dirname, '/media/cast_images/', 'original_' + Date.now() + '.jpg');
        const resizedImagePath = path.join(__dirname, '/media/cast_images/', 'cast_' + Date.now() + '.jpg');

        await downloadImage(imageUrl, originalImagePath);

        await resizeImage(originalImagePath, resizedImagePath, 980, 560);

        return resizedImagePath;
    } catch (error) {
        console.error('Error generating cast image:', error);
        return null;
    }
}

module.exports = generateCastImage;

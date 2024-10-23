const openai = require('openai');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

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

async function generateArticleImage(description) {
    const modifiedDescription = `Create an engaging and visually appealing landscape cover image for an article. The design should be slick, simple, and user-friendly, inviting viewers without being too detailed. Focus on a few key components that accurately depict the article's subject matter, ensuring the image is clean, attractive, and uncluttered. The image should be vibrant and eye-catching to attract readers. Do not include any text or writing in the image. The content of the image should align with the theme of this description: ${description}`;
    try {
        const response = await client.images.generate({
            model: "dall-e-3",
            prompt: modifiedDescription,
            n: 1,
                size: "980x560"
        });

        // Check if the response has the expected structure
        if (!response.data || response.data.length === 0) {
            console.error("Unexpected response structure:", response);
            return null;
        }

        // Extract the image URL from the response
        const imageUrl = response.data[0].url;

        // Define the path where the image will be saved
        const imageFileName = 'article_' + Date.now() + '.jpg';
        const imagePath = path.join(__dirname, '/media/article_images/', imageFileName);

        // Download and save the image
        await downloadImage(imageUrl, imagePath);

        return imagePath;
    } catch (error) {
        console.error('Error generating article image:', error);
        return null;
    }
}

module.exports = generateArticleImage;

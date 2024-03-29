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
    const modifiedDescription = `Create an engaging and visually appealing landscape cover image for an article. IMPORTANT, the design should be user-friendly, inviting, and accurately depict the article's subject matter and shall not have any text. Don't make the image too dense, keep it simple, simple shapes. The content of the image should align with the following theme: ${description}.`;
    try {
        const response = await client.images.generate({
            model: "dall-e-3",
            prompt: description,
            n: 1,
            size: "1792x1024"
        });

        // Check if the response has the expected structure
        if (!response.data || response.data.length === 0) {
            console.error("Unexpected response structure:", response);
            return null;
        }

        // Extract the image URL from the response
        const imageUrl = response.data[0].url;

        // Define the path where the image will be saved
        const imageFileName = 'cast_' + Date.now() + '.jpg';
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

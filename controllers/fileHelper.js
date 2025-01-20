const fs = require('fs').promises;

/**
 * Deletes a file at the given path.
 * @param {string} filePath - The relative path to the file to be deleted.
 */
const deleteFile = async (filePath) => {
    try {
        await fs.unlink(filePath);
        console.log(`Deleted file: ${filePath}`);
    } catch (err) {
        if (err.code === 'ENOENT') {
            // File does not exist, no action needed
            console.log(`File not found, skipping deletion: ${filePath}`);
        } else {
            // Other errors should be thrown to be handled by the caller
            console.error(`Error deleting file ${filePath}:`, err);
            throw err;
        }
    }
};

module.exports = { deleteFile };

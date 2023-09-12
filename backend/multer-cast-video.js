const multer = require('multer');

const MIME_TYPES = {
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
    'video/webm': 'webm'
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './backend/media/cast_videos');
    },
    filename: (req, file, callback) => {
        const name = file.originalname.split(" ").join("_");
        const extension = MIME_TYPES[file.mimetype];
        callback(null, name + Date.now() + '.' + extension);
    }
})

module.exports = multer({storage: storage}).single('video');
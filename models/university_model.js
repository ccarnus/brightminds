const mongoose = require('mongoose');

const UniversitySchema = mongoose.Schema({
    name: {type:String, required:true},
    score: {type:Number, required:true},
    iconurl: {type:String, required:true}
});

module.exports = mongoose.model('university',UniversitySchema);
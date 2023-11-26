const mongoose = require('mongoose');

const UniversitySchema = mongoose.Schema({
    name: {type:String, required:true},
    score: {type:Number, default:0},
    iconurl: {type:String, required:true}
});

module.exports = mongoose.model('university',UniversitySchema);
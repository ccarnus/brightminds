const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
    email: {type:String, required: true, unique: true},
    password: {type: String, required: true},
    username: {type: String, required: true},
    role: {type: String, required: true},
    department: {type: String, requiered: true},
    score: {type: Number, required: true},
    profilePictureUrl: {type:String, required:true},
    evaluation_list: [{
        castid: {type:String, required:false},
        watched: {type:Boolean, required:false},
        answered: {type:Boolean, required:false}
    }]
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('user',userSchema);
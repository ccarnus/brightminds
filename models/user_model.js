const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
    email: {type:String, required: true, unique: true},
    password: {type: String, required: true},
    username: {type: String, required: true},
    role: {type: String, required: true},
    department: {type: String, requiered: true},
    score: {type: Number, required: true},
    profilePictureUrl: {type:String, required:true}
});

//We validate that the unique fields are unique before saving to the db
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('user',userSchema);
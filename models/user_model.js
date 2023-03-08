const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
    'email': {type:String, required: true, unique: true},
    'password': {type: String, required: true},
    'position': {type: String, required: true},
    'department': {type: String, requiered: true}

});

//We validate that the unique fields are unique before saving to the db
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('user',userSchema);
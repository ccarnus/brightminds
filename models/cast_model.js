 const mongoose = require('mongoose');

const castSchema = mongoose.Schema({
    title: {type:String, required:true},
    description: {type:String, required:false},
    department: {type: String, requiered: true},
    type: {type:String, required:false},
    brightmindid: {type:Number, required:false},
    casturl: {type:String, required:true},
    universitylogourl: {type:String, requiered:false},
    category: {type:String, requiered:true}
});

module.exports = mongoose.model('cast',castSchema);
 const mongoose = require('mongoose');

const castSchema = mongoose.Schema({
    title: {type:String, required:true},
    description: {type:String, required:true},
    department: {type: String, requiered: true},
    type: {type:String, required:true},
    brightmindid: {type:Number, required:true},
    casturl: {type:String, required:true},
    university: {type:String, requiered:true},
    category: {type:String, requiered:true}
});

module.exports = mongoose.model('cast',castSchema);
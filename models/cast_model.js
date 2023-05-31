 const mongoose = require('mongoose');

const castSchema = mongoose.Schema({
    title: {type:String, required:true},
    description: {type:String, required:true},
    department: {type: String, requiered: true},
    type: {type:String, required:true},
    brightmindid: {type:Number, required:true},
    casturl: {type:String, required:true},
    university: {type:String, requiered:true},
    category: {type:String, requiered:true},
    likes: {
        count: {type:Number, default:0},
        user: [
            {type:String, default:""}
        ]
    },
    comments: {
        count: {type:Number, default:0},
        comment: [
            {
                author: {type:String, default:""},
                content: {type:String, default:"", maxlength: 200}
            }
        ]
    }
});

module.exports = mongoose.model('cast',castSchema);
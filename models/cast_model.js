 const mongoose = require('mongoose');

const castSchema = mongoose.Schema({
    title: {type:String, required:true},
    description: {type:String, required:true},
    department: {type: String, required: true},
    type: {type:String, required:true},
    brightmindid: {type:Number, required:true},
    casturl: {type:String, required:true},
    castimageurl: { type: String, required:true},
    university: {type:String, requiered:true},
    category: {type:String, requiered:true},
    visibility: {type:String, requiered:true},
    duration: {type: Number, requiered:true},
    verificationStatus: {
        status: {type:String, requiered:false},
        approvals: {type: Number, required: false},
        approvers_id: [
            {type:String, required: false}
        ],
        disapprovers_id: [
            {type:String, required: false}
        ]
    },
    dateAdded: { type: Date, default: Date.now },
    grade: {
        value: { type: Number, min: 0, max: 10, default: 5 },
        count: { type: Number, default: 1 }
    },
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
                content: {type:String, default:""}
            }
        ]
    },
    evaluation: {
        question: {type:String, required:false},
        responses: [
            {
                type:String, required:false
            }
        ],
        correct: {type:String, required:false}
    }
});

module.exports = mongoose.model('cast',castSchema);
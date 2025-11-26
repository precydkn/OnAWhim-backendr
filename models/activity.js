const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['undone', 'done'],
        default: 'undone'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('Activity', ActivitySchema);
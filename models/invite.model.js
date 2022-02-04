const mongoose = require('mongoose')

const inviteModel = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    inviteUrl: {
        type: String,
        required: true,
    },
})

module.exports = mongoose.models.Invite || mongoose.model('Invite', inviteModel)

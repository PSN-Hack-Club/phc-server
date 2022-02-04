const {Schema, model, models} = require('mongoose')

const inviteModel = new Schema({
    email: {
        type: Schema.Types.String,
        required: true,
    },
    name: {
        type: Schema.Types.String,
        required: true,
    },
    inviteUrl: {
        type: Schema.Types.String,
        required: true,
    },
    discordId: {
        type: Schema.Types.String,
        requires: false
    }
})

module.exports = models.Invite || model('Invite', inviteModel)

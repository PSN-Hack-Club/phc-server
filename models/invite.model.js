import mongoose from 'mongoose'
const { Schema, model, models } = mongoose

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
    required: false,
  },
  createdAt: {
    type: Schema.Types.Number,
    required: true,
  },
})

export default models.Invite || model('Invite', inviteModel)

const mongoose = require('mongoose')
const Invites = require('./models/invite.model')
const { utcTimeNow } = require('./utils/time')

const main = async () => {
  const timeNow = utcTimeNow().getTime()
  const expiryTime = timeNow - 172800000
  await mongoose.connect(process.env.MONGODB_URL)

  // Delete all invites that have expired and don't have an ID yet
  const deleted = await Invites.deleteMany({
    $or: [
      {
        createdAt: { $lte: expiryTime },
      },
      { createdAt: { $exists: false } },
    ],
    discordId: { $exists: false },
  })

  console.log(deleted)
}

main().catch((err) => {
  console.error(err)
})

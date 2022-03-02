const router = require('express').Router()
const connectDb = require('../middleware/mongodb')
const Invites = require('./models/invite.model')
const { utcTimeNow } = require('./utils/time')

router.use(connectDb)

router.post('/sendToAll', async (req, res) => {
  const invites = await Invites.find({}).select('email').exec()
})

router.post('/sanitize', async (req, res) => {
  const timeNow = utcTimeNow().getTime()
  const expiryTime = timeNow - 172800000

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

  res.status(201).send(deleted)
})

module.exports = router

const router = require('express').Router()
const Invites = require('../models/invite.model')
const { utcTimeNow } = require('../utils/time')
const { sendBulk } = require('../utils/emailClient')

router.post('/sendMailToAll', async (req, res) => {
  const { subject, emailHeader, content } = req.body

  if (!subject || !emailHeader || !content) {
    return res.sendStatus(400)
  }

  const invites = await Invites.find({}).select('email name').exec()

  await sendBulk(
    invites.map((invite) => ({
      to: invite.email,
      name: invite.name.split(' ')[0],
      subject,
      header: emailHeader,
      content,
    }))
  )

  res.sendStatus(200)
})

router.post('/sendMail', async (req, res) => {
  const { to, name, subject, emailHeader, content } = req.body

  if (!subject || !emailHeader || !content || !to || !name) {
    return res.sendStatus(400)
  }

  await sendEmail({
    to,
    name,
    subject,
    header: emailHeader,
    content,
  })

  res.sendStatus(200)
})

router.post('/sanitize', async (req, res) => {
  const timeNow = utcTimeNow().getTime()
  const expiryTime = timeNow - 172800000

  // Delete all invites that have expired and don't have an ID yet
  try {
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
  } catch (error) {
    res.status(500).send({ error })
  }
})

module.exports = router

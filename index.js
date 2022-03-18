import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import Invites from './models/invite.model.js'
import { validPathwaysEmail, nameFromEmail } from './utils/emails.js'
import { sendEmail } from './utils/emailClient.js'
import basicAuth from 'express-basic-auth'
import axios from 'axios'
import { utcTimeNow } from './utils/time.js'
const PORT = 1337

import admin from './controllers/admin.js'

mongoose.connect(process.env.MONGODB_URL).catch((err) => {
  console.error(err)
  process.exit(1)
})

const app = express()
app.use(express.json())

app.use(
  cors({
    origin:
      (process.env.NODE_ENV || 'development') === 'development'
        ? 'http://localhost:3000'
        : 'https://psn.hackclub.com',
    credentials: true,
  })
)

app.use(
  '/admin',
  basicAuth({
    users: {
      admin: process.env.BASIC_AUTH,
    },
  }),
  admin
)

app.post('/join', async (req, res) => {
  const email = req.body.email
  if (!email) {
    return res.status(400).send({ msg: 'No email provided' })
  }

  const isValid = validPathwaysEmail(email)
  if (!isValid) {
    return res.status(400).send({ msg: 'Invalid Email Provided' })
  }

  try {
    const invite = await Invites.findOne({ email })
    if (invite) {
      return res.status(409).send({ msg: 'Invite already sent' })
    }
  } catch {}

  const name = nameFromEmail(email)

  let resp

  const token = process.env.DISCORD_TOKEN
  try {
    const channel = process.env.DISCORD_CHANNEL
    resp = await axios.post(
      `https://discordapp.com/api/v6/channels/${channel}/invites`,
      {
        max_age: 172800, // 48 hours in seconds
        max_uses: 2,
        unique: true,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${token}`,
        },
      }
    )
  } catch (e) {
    console.error(e)
    console.log('Discord issue')
    return res
      .status(500)
      .send({ msg: 'Internal Server Error\nPlease try again later!' })
  }

  const { code } = resp.data
  const url = `https://discord.gg/${code}`

  try {
    await sendEmail({
      to: email,
      subject: 'PSN Hack Club - Discord Invite',
      name,
      header: 'Welcome to the club!',
      content: [
        `You're receiving this email because your email was used to sign up for the PSN Hack Club!<br/>Join the discord server by clicking <a href="${url}" target="_blank">this link</a>. The invite will expire in 48 hours.`,
        `If that did not work, please use the link below.<br/><a href="${url}">${url}</a>`,
        `You can ignore this email if you did not request an invite.`,
      ],
    })
  } catch (e) {
    console.log(e)
    try {
      await axios.delete(`https://discordapp.com/api/v6/invtes/${code}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${token}`,
        },
      })
    } catch {}
    return res
      .status(500)
      .send({ msg: 'Internal Server Error\nPlease try again later!' })
  }

  try {
    await Invites.create({
      email,
      name,
      inviteUrl: url,
      createdAt: utcTimeNow().getTime(),
    })
  } catch {}

  return res.status(200).send({ msg: 'Email sent!' })
})

app.get('/', (req, res) => {
  res.status(200).send('pong')
})

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`)
})

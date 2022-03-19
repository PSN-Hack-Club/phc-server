import nodemailer from 'nodemailer'
import Handlebars from 'handlebars'
import pLimit from 'p-limit'
import { google } from 'googleapis'
const OAuth2 = google.auth.OAuth2
import fs from 'fs'

const template = Handlebars.compile(
  fs.readFileSync('./templates/email.hbs', 'utf8')
)

const createTransporter = async ({ pool } = { pool: false }) => {
  const oauth2Client = new OAuth2(
    process.env.EMAIL_CLIENT_ID,
    process.env.EMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  )

  oauth2Client.setCredentials({
    refresh_token: process.env.EMAIL_REFRESH_TOKEN,
  })

  let accessToken
  try {
    accessToken = await oauth2Client.getAccessToken()
  } catch (e) {
    console.log(e)
    return
  }

  return nodemailer.createTransport({
    pool,
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_ADDRESS,
      clientId: process.env.EMAIL_CLIENT_ID,
      clientSecret: process.env.EMAIL_CLIENT_SECRET,
      refreshToken: process.env.EMAIL_REFRESH_TOKEN,
      accessToken: accessToken,
    },
  })
}

const sendMailRaw = async (emailOptions) => {
  const emailTransporter = await createTransporter()
  if (!emailTransporter) {
    throw 'Could not make email transporter'
  }

  await new Promise((resolve, reject) => {
    emailTransporter.sendMail(
      {
        ...emailOptions,
        from: process.env.EMAIL_ADDRESS,
      },
      (err, info) => {
        if (err) {
          reject(err)
        }
        resolve()
      }
    )
  })

  emailTransporter.close()
}

const sendMail = async ({ header, name, content, ...emailOptions }) => {
  await sendMailRaw({
    ...emailOptions,
    html: template({
      header,
      name,
      content,
    }),
  })
}

const sendBulk = async (data) => {
  const emailTransporter = await createTransporter()
  if (!emailTransporter) {
    throw 'Could not create a transporter'
  }

  const failed = []
  const succeeded = []

  // send only 3 emails concurrently
  const limit = pLimit(3)

  // this is what you call bad code
  // I will some day redo this with typescript and better code
  const sendMailAsync = async ({ header, name, content, ...emailOptions }) => {
    try {
      await new Promise((resolve, reject) => {
        emailTransporter.sendMail(
          {
            ...emailOptions,
            html: template({
              header,
              name,
              content,
            }),
            from: process.env.EMAIL_ADDRESS,
          },
          (err, info) => {
            if (err) {
              reject(err)
            }
            resolve()
          }
        )
      })
      succeeded.push(emailOptions.to)
    } catch (e) {
      failed.push({
        email: emailOptions.to,
        error: e,
      })
    }
  }

  const promises = data.map((x) => limit(() => sendMailAsync(x)))

  await Promise.all(promises)

  emailTransporter.close()

  return { failed, succeeded }
}

export { sendMail, sendMailRaw, sendBulk }

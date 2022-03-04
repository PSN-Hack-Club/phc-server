const nodemailer = require('nodemailer')
const { google } = require('googleapis')
const OAuth2 = google.auth.OAuth2
const Handlebars = require('handlebars')
const template = Handlebars.compile(
  require('fs').readFileSync('./templates/email.hbs', 'utf8')
)

const createTransporter = async () => {
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

const sendEmailRaw = async (emailOptions) => {
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

const sendEmail = async ({ header, name, content, ...emailOptions }) => {
  await sendEmailRaw({
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
    throw 'Could not make email transporter'
  }

  const failed = []

  await Promise.all(
    data.map(async (x) => {
      try {
        await sendEmail(...x)
      } catch (e) {
        failed.push({
          email: x.to,
          error: e,
        })
      }
    })
  )

  return failed
}

module.exports = { sendEmail, sendEmailRaw, sendBulk }

const nodemailer = require('nodemailer')
const {google} = require('googleapis')
const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
    const oauth2Client = new OAuth2(
        process.env.EMAIL_CLIENT_ID,
        process.env.EMAIL_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.EMAIL_REFRESH_TOKEN
    });

    let accessToken;
    try {
        accessToken = oauth2Client.getAccessToken();
    } catch (e) {
        console.log(e)
        return
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: process.env.EMAIL_ADDRESS,
            accessToken,
        }
    });
};

const sendEmail = async (emailOptions) => {
    const emailTransporter = createTransporter();
    if (!emailTransporter) {
        throw "Could not make email transporter"
    }
    await new Promise((resolve, reject) => {
        emailTransporter.sendMail(emailOptions, (err, info) => {
            if (err) {
                reject(err)
            }
            resolve()
        });
    })
};

module.exports = sendEmail

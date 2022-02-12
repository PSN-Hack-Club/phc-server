const nodemailer = require('nodemailer')
const {google} = require('googleapis')
const OAuth2 = google.auth.OAuth2;

const createTransporter = () => nodemailer.createTransport({
    port: 465,
    host: 'smtp.gmail.com',
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
    },
    secure: true,
})

// const createTransporter = async () => {
//     const oauth2Client = new OAuth2(
//         process.env.EMAIL_CLIENT_ID,
//         process.env.EMAIL_CLIENT_SECRET,
//         "https://developers.google.com/oauthplayground"
//     );
//
//     oauth2Client.setCredentials({
//         refresh_token: process.env.EMAIL_REFRESH_TOKEN
//     });
//
//     let accessToken;
//     try {
//         accessToken = await new Promise((resolve, reject) => {
//             oauth2Client.getAccessToken((err, token) => {
//                 if (err) {
//                     reject("Failed to create access token :(");
//                 }
//                 resolve(token);
//             });
//         });
//     }
//     catch (e) {
//         console.log(e)
//         return
//     }
//
//     return nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//             type: "OAuth2",
//             user: process.env.EMAIL_ADDRESS,
//             accessToken,
//         }
//     });
// };

const sendEmail = async (emailOptions) => {
    const emailTransporter = createTransporter();
    if (!emailTransporter) {
        throw "Could not make email transporter"
    }
    await emailTransporter.sendMail(emailOptions, (err, _) => {
        if (err) {
            console.log(err)
        }
    });
};

module.exports = sendEmail

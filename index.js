require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Invites = require("./models/invite.model");
const {validPathwaysEmail, nameFromEmail} = require("./utils/emails");
const emailClient = require("./utils/emailClient");
const axios = require("axios");

const PORT = 1337;

mongoose.connect(process.env.MONGODB_URL).catch((err) => {
    console.error(err);
    process.exit(1);
});

const app = express();
app.use(express.json());

app.use(
    cors({
        origin: (process.env.NODE_ENV || "development") === "development" ? "http://localhost:3000" : "https://psn.hackclub.com",
        credentials: true,
    })
);

app.post('/join', async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(422).send()
    }
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

    try {
        const channel = process.env.DISCORD_CHANNEL
        const token = process.env.DISCORD_TOKEN
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
        return res.status(500).send({ msg: 'Internal Server Error' })
    }

    const { code } = resp.data
    const url = `https://discord.gg/${code}`

    try {
        await Invites.create({ email, name, inviteUrl: url })
    } catch {}

    return emailClient.sendMail(
        {
            from: process.env.EMAIL_ADDRESS,
            to: email,
            subject: 'PSN Hack Club - Discord Invite',
            html: `<div style="width: 100%; border-radius: 1em; background-color: white !important; color: black;"><p style="font-size: 1.5rem; margin-bottom:0; font-weight: 800">Welcome to the club!</p><p>Dear ${name},</p><p>You're receiving this email because your email was used to sign up for the PSN Hack Club!<br/>Join the discord server by clicking <a href="${url}" target="_blank">this link</a>. The invite will expire in 48 hours.</p><p>If that did not work, please use the link below.<br/><a href="${url}">${url}</a></p><p>You can ignore this email if you did not request an invite.</p><p>PSN Hack Club</p></div>`,
        },
        (err, _) => {
            if (err) {
                console.log(err)
                return res.status(500).send({ msg: 'Internal Server Error!' })
            } else {
                return res.status(200).send({ msg: 'Email sent!' })
            }
        }
    )
})

app.listen(PORT, () => {
    console.log(`server started on port ${PORT}`);
});

var express = require("express");
var router = express.Router();

const mailerConfig = require('../services/emailConfig').app;
const { Coresender, BodyType } = require('coresender');
const client = new Coresender(mailerConfig.coresenderAccountId, mailerConfig.coresenderSecretKey);
let sender = { name: mailerConfig.senderName, address: mailerConfig.senderAddress, contactUsAt: mailerConfig.contactUsAt };

router.get("/", async function (req, res, next) {

  res.send({ success: true });
});

router.post("/sendMailTo", async function (req, res, next) {
  const request = client.sendEmailRequest();
  if (req.body.to && req.body.to.length > 0) {
    if (req.body.to.length === 1 && req.body.to[0] === '') {
      res.send({ status: 'error', message: 'No recipients!' });
    } else {
      for (let i = 0; i < req.body.to.length; i++) {
        const user = req.body.to[i];
        if (user && user !== '') {
          request.addToBatch({
            fromEmail: sender.address,
            fromName: mailerConfig.senderName,
            toEmail: user,
            subject: req.body.subject,
            bodyHTML: req.body.message,
            bodyType: BodyType.HTML
          });
        }
      }
      request.execute().then((resp) => {
        const isAccepted = resp.allAccepted();
        const allItems = resp.getItems();
        // console.log(isAccepted);
        // console.log(allItems);
        let responseMsg = {
          status: 'success',
          message: 'Emails sent successfully to all users!'
        };
        if (!resp.allAccepted()) {
          const failedToSend = [];
          for (let i = 0; i < allItems.length; i++) {
            const item = allItems[i];
            if (item.status !== 'accepted') {
              failedToSend.push({ status: item.status, error: item.errors });
            }
          }
          responseMsg = {
            status: 'err',
            message: 'Email not sent to all users!',
            error: failedToSend
          }
        }
        res.send(responseMsg).json;
      });
    }
  } else {
    res.send({ status: 'error', message: 'No recipients!' });
  }

  // res.send({ success: true, to, subject, message });
});

module.exports = router;


//* Services

const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
  "585541018232-gjs7r4fjvtv6rd6i9c031ad98vcmmsdi.apps.googleusercontent.com", // ClientID
  "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", // Client Secret
  "https://developers.google.com/oauthplayground" // Redirect URL
);
oauth2Client.setCredentials({
  refresh_token: "1//04cUVdkzpGAvGCgYIARAAGAQSNwF-L9Ir0ELHQzaReWzGQ5oMZoIYoDFBYo1gzj2obzoLx-X1i5-FIJX864UAG3wJUCVhnsMVp4g"
});
const accessToken = oauth2Client.getAccessToken();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: mailerConfig.contactUsAt,
    clientId: '585541018232-gjs7r4fjvtv6rd6i9c031ad98vcmmsdi.apps.googleusercontent.com',
    clientSecret:'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',
    refreshToken:'1//04cUVdkzpGAvGCgYIARAAGAQSNwF-L9Ir0ELHQzaReWzGQ5oMZoIYoDFBYo1gzj2obzoLx-X1i5-FIJX864UAG3wJUCVhnsMVp4g',
    accessToken: accessToken,
    tls: {
      rejectUnauthorized: false
    }
    // user: mailerConfig.email,
    // pass: mailerConfig.password
  }
});

function sendMail(errorMessage) {
  console.log("errorMessage --> ", errorMessage);
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: mailerConfig.email,
      to: mailerConfig.vjErrorEmail,
      subject: "SMS Fail status.",
      html: `<h1>${errorMessage}</h1>`
    };
    transporter.sendMail(mailOptions, function (error, info) {
      const respObj = {
        status: 'success'
      };
      if (error) {
        console.log(error);
        respObj.status = 'error';
      } else {
        console.log('Email sent: ' + info.response);
      }
      transporter.close();
      resolve(respObj);
    });
  })
}

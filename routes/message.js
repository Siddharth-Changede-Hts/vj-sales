var express = require("express");
var router = express.Router();
const nodemailer = require('nodemailer');

const mailerConfig = require('../services/emailConfig').app;
const SMSConfig = require('../services/smsConfigs').app;

const axios = require("axios").default;

router.get("/", async function (req, res, next) {
  res.send({ success: true });
});

const twilioClient = require('twilio')(SMSConfig.TWILIO_ACCOUNT_SID, SMSConfig.TWILIO_AUTH_TOKEN);



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
const accessToken = oauth2Client.getAccessToken()
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

router.post("/sendOTPMessage", async function (req, res, next) {

  const {number, is_international_number} = req.body;

  var otp = Math.floor(1000 + Math.random() * 9000);

  if (is_international_number) {
    const sendSMs_twilio_servicesResponse = await sendSMs_OTP_twilio_services(otp, number);
    
    res.send(sendSMs_twilio_servicesResponse);
  } else {
    const sendSMs_A2P_servicesResponse = await sendSMs_OTP_A2P_services(otp, number);
    
    res.send(sendSMs_A2P_servicesResponse);
  }
});

router.post("/sendMessage", async function (req, res, next) {

  const {number, is_international_number, message} = req.body;


  if (is_international_number) {
    const sendSMs_twilio_servicesResponse = await sendSMs_twilio_services(message, number);
    
    res.send(sendSMs_twilio_servicesResponse);
  } else {
    const sendSMs_A2P_servicesResponse = await sendSMs_A2P_services(message, number);
    
    res.send(sendSMs_A2P_servicesResponse);
  }
});

module.exports = router;


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

//* For OTP
function sendSMs_OTP_A2P_services(otp, number) {
  return new Promise((resolve, reject) => {
    axios.get(`http://a2pservices.in/api/mt/SendSMS?user=vilas&password=123456789&senderid=VJDLLP&channel=Trans&DCS=0&flashsms=0&number=${number}&text=Dear Sir / Madam this code - ${otp} is a VJ system code to verify your enquiry. Please share it with your Channel Partner or Sales Manager from VJ Team . Regards,Team Vilas Javdekar Developers&route=20`).then(response => {
      if (response.data.ErrorMessage === "Done" &&  response.data.ErrorCode === "000") {
        resolve({ success: true, data: response.data, otp });
      } else {
        console.log(`response.data.ErrorCode ${number} -> `, response.data.ErrorCode);
        if (response.data.ErrorCode === "008" || response.data.ErrorCode === "8" || response.data.ErrorCode === "021" || response.data.ErrorCode === "21" || response.data.ErrorCode === "009" || response.data.ErrorCode === "9" || response.data.ErrorCode === "13") {
          let msg = "Your's A2PSERVICES ";
          if (response.data.ErrorCode === "008" || response.data.ErrorCode === "8") {
            msg = msg + "account not active.";
          } else if(response.data.ErrorCode === "021" || response.data.ErrorCode === "21") {
            msg = msg + "account insufficient credits.";
          } else if(response.data.ErrorCode === "009" || response.data.ErrorCode === "9"){
            msg = msg + "account locked, contact your account manager.";
          } else {
            msg = msg + response?.data?.ErrorMessage;
          }
          sendMail(msg).then(sendMailResponse => {
            if (sendMailResponse.status === "success") {

              resolve({ success: false, error: response.data });
            } else {
              resolve({ success: false, error: response.data });
            }
          }).catch(sendMailError => {
            console.log("sendMailError => ", sendMailError);
            resolve({ success: false, error: response.data });
          })
        } else {
          resolve({ success: false, error: response.data });
        }
      }
    }).catch(err => {
      console.log("Error => ", err);
      resolve({ success: false, error: err });
    })
  })
}

function sendSMs_OTP_twilio_services(otp, number) {
  return new Promise(async (resolve, reject) => {
    try {
      const body = {
        from :SMSConfig.TWILIO_FROM_NUMBER,
        body :`Dear Sir / Madam this code - ${otp} is a VJ system code to verify your enquiry. Please share it with your Channel Partner or Sales Manager from VJ Team . Regards,Team Vilas Javdekar Developers`,
        // body :`Test`,
        to : number
      }

      const twilioClientResponse = await twilioClient.messages.create(body);

      // console.log("Twilio response => ", twilioClientResponse);
      resolve({ success: true, data: twilioClientResponse, otp });
          
    } catch (error) {
      console.log("Twilio error => ", error);

      if (error.code === 1001 || error.code === 1002 || error.code === 1003 || error.code === 1004) {
        let msg = "Your's Twilio ";
        if (error.code === 1001) {
          msg = msg + "account not active.";
        } else if(error.code === 1002) {
          msg = msg + "Trial accounts do not support the feature you tried to use.";
        } else if(error.code === 1003){
          msg = msg + "account Incoming call rejected due to inactive account.";
        } else if(error.code === 1004){
          msg = msg + "account Call concurrency limit exceeded.";
        } else {
          msg = msg + response?.data?.ErrorMessage;
        }
        sendMail(msg).then(sendMailResponse => {
          if (sendMailResponse.status === "success") {

            resolve({ success: false, error });
          } else {
            resolve({ success: false, error });
          }
        }).catch(sendMailError => {
          console.log("sendMailError => ", sendMailError);
          resolve({ success: false, error });
        })
      } else {
        resolve({ success: false, error });
      }

    }
  })
}


//* For Message
function sendSMs_A2P_services(message, number) {
  return new Promise((resolve, reject) => {
    axios.get(`http://a2pservices.in/api/mt/SendSMS?user=vilas&password=123456789&senderid=VJDLLP&channel=Trans&DCS=0&flashsms=0&number=${number}&text=${message}&route=20`).then(response => {
      if (response.data.ErrorMessage === "Done" &&  response.data.ErrorCode === "000") {
        resolve({ success: true, data: response.data });
      } else {
        console.log(`response.data.ErrorCode ${number} -> `, response.data.ErrorCode);
        if (response.data.ErrorCode === "008" || response.data.ErrorCode === "8" || response.data.ErrorCode === "021" || response.data.ErrorCode === "21" || response.data.ErrorCode === "009" || response.data.ErrorCode === "9" || response.data.ErrorCode === "13") {
          let msg = "Your's A2PSERVICES ";
          if (response.data.ErrorCode === "008" || response.data.ErrorCode === "8") {
            msg = msg + "account not active.";
          } else if(response.data.ErrorCode === "021" || response.data.ErrorCode === "21") {
            msg = msg + "account insufficient credits.";
          } else if(response.data.ErrorCode === "009" || response.data.ErrorCode === "9"){
            msg = msg + "account locked, contact your account manager.";
          } else {
            msg = msg + response?.data?.ErrorMessage;
          }
          sendMail(msg).then(sendMailResponse => {
            if (sendMailResponse.status === "success") {

              resolve({ success: false, error: response.data });
            } else {
              resolve({ success: false, error: response.data });
            }
          }).catch(sendMailError => {
            console.log("sendMailError => ", sendMailError);
            resolve({ success: false, error: response.data });
          })
        } else {
          resolve({ success: false, error: response.data });
        }
      }
    }).catch(err => {
      console.log("Error => ", err);
      resolve({ success: false, error: err });
    })
  })
}

function sendSMs_twilio_services(message, number) {
  return new Promise(async (resolve, reject) => {
    try {
      const body = {
        from :SMSConfig.TWILIO_FROM_NUMBER,
        body :message,
        // body :`Test`,
        to : number
      }

      const twilioClientResponse = await twilioClient.messages.create(body);

      // console.log("Twilio response => ", twilioClientResponse);
      resolve({ success: true, data: twilioClientResponse });
          
    } catch (error) {
      console.log("Twilio error => ", error);

      if (error.code === 1001 || error.code === 1002 || error.code === 1003 || error.code === 1004) {
        let msg = "Your's Twilio ";
        if (error.code === 1001) {
          msg = msg + "account not active.";
        } else if(error.code === 1002) {
          msg = msg + "Trial accounts do not support the feature you tried to use.";
        } else if(error.code === 1003){
          msg = msg + "account Incoming call rejected due to inactive account.";
        } else if(error.code === 1004){
          msg = msg + "account Call concurrency limit exceeded.";
        } else {
          msg = msg + response?.data?.ErrorMessage;
        }
        sendMail(msg).then(sendMailResponse => {
          if (sendMailResponse.status === "success") {

            resolve({ success: false, error });
          } else {
            resolve({ success: false, error });
          }
        }).catch(sendMailError => {
          console.log("sendMailError => ", sendMailError);
          resolve({ success: false, error });
        })
      } else {
        resolve({ success: false, error });
      }

    }
  })
}
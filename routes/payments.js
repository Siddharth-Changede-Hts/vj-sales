var express = require('express');
var router = express.Router();
var Razorpay = require('razorpay');
const { sendSMs_A2P_services, sendSMs_twilio_services } = require('./message');
var instance = new Razorpay({
    key_id: 'rzp_test_hh7wD7GVmRaEaX',
    key_secret: 'us2o34YBjUEqkF2UqQZXwNap',
});
var supabase = require("../services/supabaseClient").supabase;

router.post('/create-virtual-acc', function (req, res, next) {
    if (!req.body.name || req.body.name === '') {
        res.send({ success: false, message: "Please provide lead name" })
    } else if (!req.body.contactNumber || req.body.contactNumber === '') {
        res.send({ success: false, message: "Please provide lead contact number" })
    } else if (!req.body.email || req.body.email === '') {
        res.send({ success: false, message: "Please provide lead email" })
    } else if (!req.body.personId || req.body.personId === '') {
        res.send({ success: false, message: "Please provide lead person id" })
    } else {
        instance.customers.create({
            name: req.body.name,
            contact: req.body.contactNumber,
            email: req.body.email,
        }).then((customerRes) => {
            instance.virtualAccounts.create({
                receivers: {
                    types: [
                        "bank_account",
                        "vpa"
                    ]
                },
                customer_id: customerRes.id,
            }).then((accRes) => {
                supabase.from('Person').update(
                    {
                        razorpayCustomerId: customerRes.id,
                        virtualAccDetails: { bankAccountNumber: accRes.receivers[0].account_number, bankIFSCCode: accRes.receivers[0].ifsc, bankUpiId: accRes.receivers[1].address, bankBeneficiaryName: accRes.receivers[0].name }
                    }).eq('personId', req.body.personId).then((personRes) => {
                        // CHANGE CONDITION 
                        if (req.body.contactNumber.toString().substr(0, 3) !== '+91') {
                            sendSMs_A2P_services("Hello", req.body.contactNumber)
                        } else {
                            sendSMs_twilio_services(`Account Number : ${accRes.receivers[0].account_number} \n IFSC Code : ${accRes.receivers[0].ifsc} \n Beneficiary Name : ${accRes.receivers[0].name} \n UPI Id : ${accRes.receivers[1].address}`, req.body.contactNumber).then((resp) => {
                                res.send({ success: true, message: "Virtual Account created successfully" })
                            }).catch((err) => {
                                res.send({ success: false, err })
                            })
                        }
                    })
            })
        }).catch((customerErr) => {
            if (customerErr.error.description === 'Customer already exists for the merchant') {
                res.send({ success: false, errorMsg: "Virtual Account already Exists" })
            }
        })
    }
})

router.post('/webhook', function (req, res, next) {
    if (req.body.event === 'payment_link.paid') {
        console.log(req.body)
        supabase.from('TokenTransactions').select('*,eventTokenId(*)').eq('paymentLinkId', req.body.payload.payment_link.entity.id).then((tokenTransaction) => {
            supabase.from('LeadStatus').update({ status: "Token Payment Complete" }).eq('leadId', tokenTransaction.data[0].leadId).then((leadStatus) => {
                supabase.rpc('getmaxsrno', { pid: tokenTransaction.data[0].eventTokenId.eventId }).then((rpcRes) => {
                    supabase.from('EventTokenLeadRelations').update({ srno: rpcRes.data[0].num === null ? 1 : parseInt(rpcRes.data[0].num) + 1, paidAmount: req.body.payload.payment_link.entity.amount_paid }).eq('eventTokenId', tokenTransaction.data[0].eventTokenId.eventTokenId).eq('leadId', tokenTransaction.data[0].leadId).then((leadStatus) => {
                        supabase.from('TokenTransactions').update({ status: "complete" }).eq('paymentLinkId', req.body.payload.payment_link.entity.id).then((resp) => {
                            res.send(resp)
                            console.log(resp)
                        })
                    })
                })
            })
        })
    } else {
        res.send("success")
        console.log(`${req.body.payload.payment.entity.amount} received for ${req.body.payload.virtual_account.entity.customer_id}`)
    }
})

router.post('/create-payment-link', function (req, res, next) {
    instance.paymentLink.create({
        // upi_link: true, NOT IN TEST MODE
        amount: req.body.amount * 100,
        currency: "INR",
        accept_partial: false,
        // first_min_partial_amount: 100,
        description: `${req.body.tokenName} token payment link for ${req.body.eventName} event for ${req.body.leadName} lead`,
        customer: {
            name: `${req.body.leadName}`,
            email: `${req.body.leadEmail}`,
            contact: `${req.body.leadContactNumber}`
        },
        notify: {
            sms: true,
            email: true
        },
        reminder_enable: true,
        // callback_url: "https://example-callback-url.com/",
        // callback_method: "get"
    }).then((resp) => {
        supabase.from('TokenTransactions').insert({ paymentLinkId: resp.id, status: "pending", amount: resp.amount / 100, leadId: req.body.leadId, eventTokenId: req.body.eventTokenId }).then((supabaseRes) => {
            res.send({ success: true, message: "Payment link shared successfully" })
        })
    }).catch((err) => {
        res.send({ success: false, err })
    })
})

module.exports = router;

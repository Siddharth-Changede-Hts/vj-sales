const axios = require("axios").default;
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
    } else if (!req.body.leadId || req.body.leadId === '') {
        res.send({ success: false, message: "Please provide lead lead id" })
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
                supabase.from('Leads').update(
                    {
                        razorpayCustomerId: customerRes.id,
                        virtualAccDetails: { bankAccountNumber: accRes.receivers[0].account_number, bankIFSCCode: accRes.receivers[0].ifsc, bankUpiId: accRes.receivers[1].address, bankBeneficiaryName: accRes.receivers[0].name }
                    }).eq('leadId', req.body.leadId).then((personRes) => {
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
                    supabase.from('EventTokenLeadRelations').update({ srno: rpcRes.data[0].num === null ? 1 : parseInt(rpcRes.data[0].num) + 1, bandNumber: rpcRes.data[0].num === null ? 1 : parseInt(rpcRes.data[0].num) + 1, paidAmount: req.body.payload.payment_link.entity.amount_paid / 100 }).eq('eventTokenId', tokenTransaction.data[0].eventTokenId.eventTokenId).eq('leadId', tokenTransaction.data[0].leadId).then((leadStatus) => {
                        supabase.from('TokenTransactions').update({ status: "complete", eventDateTime: new Date().getTime() }).eq('paymentLinkId', req.body.payload.payment_link.entity.id).then((resp) => {
                            res.send(resp)
                            console.log(resp)
                        })
                    })
                })
            })
        })
    } else if (req.body.event === 'payment_link.expired' || req.body.event === 'payment_link.cancelled') {
        supabase.from('TokenTransactions').select('*,eventTokenId(*)').eq('paymentLinkId', req.body.payload.payment_link.entity.id).then((tokenTransaction) => {
            supabase.from('LeadStatus').update({ status: "Site Visit Done" }).eq('leadId', tokenTransaction.data[0].leadId).then((leadStatus) => {
                supabase.from('EventTokenLeadRelations').delete().eq('paymentId', tokenTransaction.data[0].paymentId).then((relation) => {
                    supabase.from('TokenTransactions').update({ status: "expired" }).eq('paymentLinkId', req.body.payload.payment_link.entity.id).then((resp) => {
                        res.send("success")
                        console.log("success")
                    })
                })
            })
        })
    } else if (req.body.event === 'virtual_account.credited') {
        supabase.from('Leads').select('*').eq('razorpayCustomerId', req.body.payload.virtual_account.entity.customer_id).then((lead) => {
            supabase.rpc('getallotmentpayments', { pid: lead.data[0].leadId }).then(async (payments) => {
                let amount = req.body.payload.payment.entity.amount / 100
                for (let i = 0; i < payments.data.length; i++) {
                    if (amount > 0) {
                        if ((payments.data[i].totalCost - payments.data[i].paidAmount) >= amount) {
                            await supabase.from('AllotmentPayment').update({ paidAmount: parseFloat(payments.data[i].paidAmount + amount) }).eq('allotmentPaymentId', payments.data[i].allotmentPaymentId).then(async (resp) => {
                                await supabase.from('AllotmentTransactions').insert({ leadId: payments.data[i].leadId, unitId: payments.data[i].unitId, allotmentPaymentId: payments.data[i].allotmentPaymentId, amount: parseFloat(amount), transactionType: 'Allotment', modeOfPayment: 'Virtual acc' }).then(async (re) => {
                                    await supabase.from('LeadStatus').update({ status: ((payments.data[i].totalCost - payments.data[i].paidAmount) > amount) ? 'Allotment Partial Payment Done' : 'Allotment Payment Complete' }).eq('leadId', payments.data[0].leadId).then((r) => {
                                        amount = 0
                                        console.log("success")
                                        res.send("success")
                                    })
                                })
                            })
                        } else {
                            amount = amount - (payments.data[i].totalCost - payments.data[i].paidAmount)
                            await supabase.from('AllotmentPayment').update({ paidAmount: parseFloat((payments.data[i].totalCost - payments.data[i].paidAmount)) }).eq('allotmentPaymentId', payments.data[i].allotmentPaymentId).then(async (resp) => {
                                await supabase.from('AllotmentTransactions').insert({ leadId: payments.data[i].leadId, unitId: payments.data[i].unitId, allotmentPaymentId: payments.data[i].allotmentPaymentId, amount: parseFloat((payments.data[i].totalCost - payments.data[i].paidAmount)), transactionType: 'Allotment', modeOfPayment: 'Virtual acc' }).then(async (re) => {
                                    await supabase.from('LeadStatus').update({ status: 'Allotment Payment Complete' }).eq('leadId', payments.data[0].leadId).then((r) => {
                                        console.log("success")
                                        // res.send("success")
                                    })
                                })
                            })
                        }
                    } else {
                        break;
                    }
                }
            })
        })
    } else {
        res.send("success")
    }
})

router.post('/create-payment-link', function (req, res, next) {
    instance.paymentLink.create({
        // upi_link: true, NOT IN TEST MODE
        amount: req.body.amount * 100,
        currency: "INR",
        accept_partial: false,
        expire_by: new Date().getTime() + 86400000,
        // expire_by: 1673013266723,
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
        supabase.from('TokenTransactions').insert({ paymentLinkId: resp.id, paymentId: req.body.paymentId, status: "pending", amount: resp.amount / 100, leadId: req.body.leadId, eventTokenId: req.body.eventTokenId }).then((supabaseRes) => {
            res.send({ success: true, message: "Payment link shared successfully" })
        })
    }).catch((err) => {
        res.send({ success: false, err })
    })
})

router.post('/resend-payment-link', function (req, res, nex) {
    instance.paymentLink.notifyBy(req.body.paymentId, 'sms').then((resp) => {
        res.send({ success: true, message: "payment link send successfully" })
    }).catch((err) => {
        res.send({ success: false, err })
    })
})

router.post('/create-pos-transaction', function (req, res, next) {
    if (!req.body.TransactionNumber) {
        res.send({ success: false, message: "Please provide Transaction Number" })
    } else if (!req.body.amount) {
        res.send({ success: false, message: "Please provide Transaction Amount" })
    } else {
        axios.post('https://www.plutuscloudserviceuat.in:8201/API/CloudBasedIntegration/V1/UploadBilledTransaction',
            {
                TransactionNumber: `${req.body.TransactionNumber}`,
                SequenceNumber: 1,
                AllowedPaymentMode: "1",
                MerchantStorePosCode: "1221258286",
                Amount: `${req.body.amount * 100}`,
                UserID: "Sid",
                MerchantID: 29610,
                SecurityToken: "a4c9741b-2889-47b8-be2f-ba42081a246e",
                IMEI: "VILAS1000286",
                AutoCancelDurationInMinutes: 5
            }).then((resp) => {
                if (resp.data.PlutusTransactionReferenceID === 0) {
                    res.send({ success: true, message: "Please complete previous transaction to continue" })
                } else if (resp.data.PlutusTransactionReferenceID < 0) {
                    res.send({ success: true, message: "Please provide new transaction number" })
                } else {
                    res.send({ success: true, message: "Transaction created successfully", ptrnNo: resp.data.PlutusTransactionReferenceID })
                }
            }).catch((err) => {
                res.send({ success: false, err })
            })
    }
})

router.post('/check-pos-transaction-status', function (req, res, next) {
    if (!req.body.ptrnNo) {
        res.send({ success: false, message: "Please provide PRTN Number" })
    } else {
        axios.post('https://www.plutuscloudserviceuat.in:8201/API/CloudBasedIntegration/V1/GetCloudBasedTxnStatus',
            {
                MerchantID: 29610,
                SecurityToken: "a4c9741b-2889-47b8-be2f-ba42081a246e",
                IMEI: "VILAS1000286",
                MerchantStorePosCode: "1221258286",
                PlutusTransactionReferenceID: req.body.ptrnNo
            }).then((resp) => {
                // console.log(resp)
                // TXN APPROVED
                if (resp.data.ResponseMessage === 'TXN APPROVED') {
                    res.send({ success: true, message: "completed" })
                } else if (resp.data.ResponseMessage === 'TXN UPLOADED') {
                    res.send({ success: true, message: "pending" })
                } else {
                    res.send({ success: true, message: "expired" })
                }
            }).catch((err) => {
                res.send(err)
            })
    }
})

module.exports = router;

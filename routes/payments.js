var express = require('express');
var router = express.Router();
var Razorpay = require('razorpay')
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
                        res.send({ success: true, message: "Virtual Account created successfully" })
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
    console.log(req.body)
    if (req.body.event === 'virtual_account.created') {
        res.send("success")
        console.log(`virtual acc created for ${req.body.payload.virtual_account.customer_id}`)
    } else {
        res.send("success")
        console.log(`${req.body.payload.payment.entity.amount} received for ${req.body.payload.virtual_account.entity.customer_id}`)
    }
})

module.exports = router;

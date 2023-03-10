const axios = require("axios").default;
var express = require("express");
var router = express.Router();
var supabase = require("../services/supabaseClient").supabase;

router.post('/create-application', function (req, res, next) {
    let obj = req.body
    if (!obj.leadName || obj.leadName === '') {
        res.send({ success: false, message: "Please provide lead name" })
    }
    if (!obj.email || obj.email === '') {
        res.send({ success: false, message: "Please provide lead email" })
    }
    if (!obj.contactNumber || obj.contactNumber === '') {
        res.send({ success: false, message: "Please provide lead contact number" })
    }
    if (!obj.contactNumber || obj.contactNumber === '') {
        res.send({ success: false, message: "Please provide lead contact number" })
    }
    if (!obj.buId || obj.buId === '') {
        res.send({ success: false, message: "Please provide project buId" })
    }
    if (!obj.amount || obj.amount === '') {
        res.send({ success: false, message: "Please provide booking amount" })
    }
    if (!obj.allotmentPaymentId || obj.allotmentPaymentId === '') {
        res.send({ success: false, message: "Please provide allotment payment id" })
    } else {
        const bodyObj = {
            'FIRSTNAME': obj.leadName.split(' ')[0],
            'MIDDLENAME': obj.leadName.split(' ').length > 2 ? obj.leadName.split(' ')[1] : null,
            'LASTNAME': obj.leadName.split(' ')[obj.leadName.split(' ').length - 1],
            'DOB': null,
            'EMAIL': obj.email,
            'MOBILEPHONE': obj.contactNumber,
            'LINE1': null,
            'LINE2': null,
            'LINE3': null,
            'cityId': null,
            'PAN': null,
            'POSTALCODE': null,
            'countryId': 264,
            'DATE': new Date(),
            'BUID': obj.buId,
            'ISWANTMONEYRECEIPT': false,
            'PREFIXTYPE': 2904,
            'AMOUNT': obj.amount
        }
        const auth_token = 'Nmpvk-6_JPglyQ4rdxu02Y1Htmr7pOAPGFAZFjQL9ofkxd9OdV2c_j-f1sxwf_f9PHjeQ7isxghaPGnnjU04zfRTOKf7ftpt5fKp-jUu5Yqkwh1mE9mxueUdyg-kJxLcGcq0YSnb6t5rJf_GEVfMAPKzQO6uCnjwNV0aQcIYV8UQzS0dsfLBZOGYzuVDLmf7XE3M60sjusiKK1C2rR4YPWmAgPv1nDo3iBp7dS0m_s7Kh-OEVAq180MqFH1qbbwHwEtl4AFllLSh5rrdrHB9xUYk5EoHNrWUr9Ti4zk7EDvhrHvUNtnjyLZUZ4znaJgX69Q6S6U2vxJU6j5neQeS4Z6OP2kkR3WnslUO8MZu05ihFhlZBPGqD3sxj3mLJ9F8-uSuM2ejj8rJAt7lWd9fo91ro_Sa3DZEUIq8dRP6FTUVBO5-43MAOZs7RO9Sk3inXFiWnG9d9JCOD_10mWiWGTmTAhIVFVif69dASVBCTaVrU9nJSED3cjqU7vL13G7S5DC8oml3oxlGPet-_B9hrwmvrITYSCpVWYUFxv93L_EggZAuxjz5XAI5bwe5-u94iPEDXFHxVlLyPanjZY_qqUVMGjDKqfc8_SEPZWBayGZQjl-ZHiUrQH4LOlmSYAwaJHXIoMVK9X4UjpEuMy_We85yxs3v4Ca7y0jE75zo--gPn40Sy2joZN3O92xwfPc9B65DSm8lCjqthzjdFXdm7kucSRWf9fzUMc_mGBFGd6oAFG1A'
        const hed = { 'Authorization': 'Bearer ' + auth_token, 'Accept': 'application/json', 'Content-Type': 'application/json' }
        // axios.post('https://server10.farvisioncloud.com/CRM/odata/CreateCustomerToReceipt', bodyObj, { headers: hed }).then((resp) => {
        //     console.log(resp.data) 
        // supabase.from('AllotmentPayment').update({ applicationId: resp }).eq('allotmentPaymentId', obj.allotmentPaymentId).then((res) => {
        //     res.send({ success: true, message: "Application created successfully" })
        // }).catch((err) => {
        //     res.send({ success: false, message: err })
        // })
        // }).catch((err) => {
        //     res.send({ success: false, message: err })
        // })
        res.send(bodyObj)
    }
})

module.exports = router;

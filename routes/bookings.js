const axios = require("axios").default;
var express = require("express");
var router = express.Router();
var supabase = require("../services/supabaseClient").supabase;

router.post('/create-application', function (req, res, next) {
    let bodyObj = req.body
    // if (!obj.salutation || obj.salutation === '') {
    //     res.send({ success: false, message: "Please provide lead salutation" })
    // }
    // if (!obj.leadFirstName || obj.leadFirstName === '') {
    //     res.send({ success: false, message: "Please provide lead first name" })
    // }
    // // if (!obj.leadMiddleName || obj.leadMiddleName === '') {
    // //     res.send({ success: false, message: "Please provide lead middle name" })
    // // }
    // if (!obj.leadLastName || obj.leadLastName === '') {
    //     res.send({ success: false, message: "Please provide lead last name" })
    // }
    // if (!obj.leadDob || obj.leadDob === '') {
    //     res.send({ success: false, message: "Please provide lead last DOB" })
    // }
    // if (!obj.email || obj.email === '') {
    //     res.send({ success: false, message: "Please provide lead email" })
    // }
    // if (!obj.contactNumber || obj.contactNumber === '') {
    //     res.send({ success: false, message: "Please provide lead contact number" })
    // }
    // if (!obj.addressLine1 || obj.addressLine1 === '') {
    //     res.send({ success: false, message: "Please provide address line 1" })
    // }
    // if (!obj.addressLine2 || obj.addressLine2 === '') {
    //     res.send({ success: false, message: "Please provide address line 2" })
    // }
    // if (!obj.addressLine3 || obj.addressLine3 === '') {
    //     res.send({ success: false, message: "Please provide address line 3" })
    // }
    // if (!obj.cityId || obj.cityId === '') {
    //     res.send({ success: false, message: "Please provide lead cityId" })
    // }
    // if (!obj.panNumber || obj.panNumber === '') {
    //     res.send({ success: false, message: "Please provide pancard number" })
    // }
    // if (!obj.postalCode || obj.postalCode === '') {
    //     res.send({ success: false, message: "Please provide project postalCode" })
    // }
    // if (!obj.bookingDate || obj.bookingDate === '') {
    //     res.send({ success: false, message: "Please provide booking date" })
    // }
    // if (!obj.amount || obj.amount === '') {
    //     res.send({ success: false, message: "Please provide booking amount" })
    // }
    // if (!obj.allotmentPaymentId || obj.allotmentPaymentId === '') {
    //     res.send({ success: false, message: "Please provide allotment payment id" })
    // } else {
    if (!bodyObj.allotmentPaymentId || bodyObj.allotmentPaymentId === '') {
        res.send({ success: false, message: "Please provide allotment payment id" })
    } else {
        supabase.from('AllotmentPayment').select('*,bookingFormId(*)').eq('allotmentPaymentId', bodyObj.allotmentPaymentId).then((resp) => {
            const obj = resp.data[0].bookingFormId
            const reqObj = {
                'SALUTATION': obj.salutation,
                'FIRSTNAME,': obj.leadFirstName,
                'MIDDLENAME,': obj.leadMiddleName,
                'LASTNAME,': obj.leadLastName,
                'DOB': new Date(obj.leadDob).toISOString(),
                'EMAIL': obj.email,
                'MOBILEPHONE': obj.contactNumber,
                'LINE1': obj.addressLine1,
                'LINE2': obj.addressLine2,
                'LINE3': obj.addressLine3,
                'cityId': obj.cityId,
                'PAN': obj.panNumber,
                'POSTALCODE': obj.pincode,
                'countryId': 264,
                'DATE': obj.bookingDate,
                'BUID': obj.buId,
                'ISWANTMONEYRECEIPT': false,
                'PREFIXTYPE': 2904,
                'AMOUNT': obj.amount
                // 'prefix': obj.salutation,
                // 'first_name,': obj.leadFirstName,
                // 'middle_name,': obj.leadMiddleName,
                // 'last_name,': obj.leadLastName,
                // 'dob': new Date(obj.leadDob).toISOString(),
                // 'email': obj.email,
                // 'mobile_number': obj.contactNumber,
                // 'address_line_1': obj.addressLine1,
                // 'address_line_2': obj.addressLine2,
                // 'address_line_3': obj.addressLine3,
                // 'FV_CityId': obj.cityId,
                // 'pan_no': obj.panNumber,
                // 'pincode': obj.pincode,
                // 'countryId': 264,
                // 'bookDate': obj.bookingDate,
                // 'fa_bu_id': obj.buId,
                // 'ISWANTMONEYRECEIPT': false,
                // 'PREFIXTYPE': 2904,
                // 'AMOUNT': obj.amount
            }
            const auth_token = 'Nmpvk-6_JPglyQ4rdxu02Y1Htmr7pOAPGFAZFjQL9ofkxd9OdV2c_j-f1sxwf_f9PHjeQ7isxghaPGnnjU04zfRTOKf7ftpt5fKp-jUu5Yqkwh1mE9mxueUdyg-kJxLcGcq0YSnb6t5rJf_GEVfMAPKzQO6uCnjwNV0aQcIYV8UQzS0dsfLBZOGYzuVDLmf7XE3M60sjusiKK1C2rR4YPWmAgPv1nDo3iBp7dS0m_s7Kh-OEVAq180MqFH1qbbwHwEtl4AFllLSh5rrdrHB9xUYk5EoHNrWUr9Ti4zk7EDvhrHvUNtnjyLZUZ4znaJgX69Q6S6U2vxJU6j5neQeS4Z6OP2kkR3WnslUO8MZu05ihFhlZBPGqD3sxj3mLJ9F8-uSuM2ejj8rJAt7lWd9fo91ro_Sa3DZEUIq8dRP6FTUVBO5-43MAOZs7RO9Sk3inXFiWnG9d9JCOD_10mWiWGTmTAhIVFVif69dASVBCTaVrU9nJSED3cjqU7vL13G7S5DC8oml3oxlGPet-_B9hrwmvrITYSCpVWYUFxv93L_EggZAuxjz5XAI5bwe5-u94iPEDXFHxVlLyPanjZY_qqUVMGjDKqfc8_SEPZWBayGZQjl-ZHiUrQH4LOlmSYAwaJHXIoMVK9X4UjpEuMy_We85yxs3v4Ca7y0jE75zo--gPn40Sy2joZN3O92xwfPc9B65DSm8lCjqthzjdFXdm7kucSRWf9fzUMc_mGBFGd6oAFG1A'
            const hed = { 'Authorization': 'Bearer ' + auth_token, 'Accept': 'application/json', 'Content-Type': 'application/json' }
            // axios.post('https://server10.farvisioncloud.com/CRM/odata/CreateCustomerToReceipt', reqObj, { headers: hed }).then((farvisionRes) => {
            //     supabase.from('AllotmentPayment').update({ applicationNo:farvisionRes.data.bookingApplicationNo,applicationId: farvisionRes.data.bookingApplicationId }).eq('allotmentPaymentId', bodyObj.allotmentPaymentId).then((updateRes) => {
            //         res.send({ success: true, message: "Application created successfully" })
            //     }).catch((err) => {
            //         res.send({ success: false, message: err })
            //     })
            // }).catch((err) => {
            //     res.send({ success: false, message: err })
            // })
            res.send(reqObj)
        })
    }
})



module.exports = router;

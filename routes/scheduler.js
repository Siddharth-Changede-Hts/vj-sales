const axios = require("axios").default;
var express = require("express");
var router = express.Router();
var supabase = require("../services/supabaseClient").supabase;
const schedule = require('node-schedule');

const job = schedule.scheduleJob('00 12 * * *', function () {
    supabase.from('AllotmentPayment').select('*,unitId(*),inventoryMergedId(*)').eq('status', "complete").eq('kycFormFilled', true).then((allotmentPaymentRes) => {
        console.log(allotmentPaymentRes)
    })
    console.log('The answer to life, the universe, and everything!');
});

router.get('/check', function (req, res, next) {
    supabase.from('AllotmentPayment').select('*,unitId(*),inventoryMergedId(*)').eq('status', "complete").eq('kycFormFilled', true).then((allotmentPaymentRes) => {
        if (allotmentPaymentRes.data.length !== 0) {
            let vjUnits = []
            let landOwnerUnits = []
            allotmentPaymentRes.data.forEach((ele) => {
                if (ele.unitId && ele.unitId.unitId) {
                    let booking_id = ''//CALL PRANIL API TO GET BOOKING ID
                    if (booking_id !== '') {
                        supabase.from('AllotmentPayment').update({ booking_id: booking_id }).eq('allotmentPaymentId', ele.allotmentPaymentId).then((updateRes) => {
                            console.log("success")
                        })
                    } else {
                        if (ele.unitId.farvisionStatus === 'Blocked') {
                            if (ele.unitId.isSanctioned) {
                                landOwnerUnits.push(ele)
                            }
                        } else {
                            vjUnits.push(ele)
                        }
                    }
                }
            })
        }
    })
})

module.exports = router;

const axios = require("axios").default;
const https = require('https');
var express = require("express");
var router = express.Router();
var supabase = require("../services/supabaseClient").supabase;
const schedule = require('node-schedule');

const agent = new https.Agent({
    rejectUnauthorized: false
});

const job1 = schedule.scheduleJob('00 6 * * *', function () {
    // supabase.from('AllotmentPayment').select('*,unitId(*),inventoryMergedId(*)').eq('status', "complete").eq('kycFormFilled', true).then((allotmentPaymentRes) => {
    //     console.log(allotmentPaymentRes)
    // })
    console.log('00 6');
});
const job2 = schedule.scheduleJob('0 6 * * *', function () {
    // supabase.from('AllotmentPayment').select('*,unitId(*),inventoryMergedId(*)').eq('status', "complete").eq('kycFormFilled', true).then((allotmentPaymentRes) => {
    //     console.log(allotmentPaymentRes)
    // })
    console.log('0 6');
});
const job3 = schedule.scheduleJob('00 06 * * *', function () {
    // supabase.from('AllotmentPayment').select('*,unitId(*),inventoryMergedId(*)').eq('status', "complete").eq('kycFormFilled', true).then((allotmentPaymentRes) => {
    //     console.log(allotmentPaymentRes)
    // })
    console.log('00 06');
});
const job4 = schedule.scheduleJob('0 06 * * *', function () {
    // supabase.from('AllotmentPayment').select('*,unitId(*),inventoryMergedId(*)').eq('status', "complete").eq('kycFormFilled', true).then((allotmentPaymentRes) => {
    //     console.log(allotmentPaymentRes)
    // })
    console.log('0 06');
});
const job5 = schedule.scheduleJob('59 5 * * *', function () {
    // supabase.from('AllotmentPayment').select('*,unitId(*),inventoryMergedId(*)').eq('status', "complete").eq('kycFormFilled', true).then((allotmentPaymentRes) => {
    //     console.log(allotmentPaymentRes)
    // })
    console.log('59 5');
});
const job6 = schedule.scheduleJob('59 05 * * *', function () {
    // supabase.from('AllotmentPayment').select('*,unitId(*),inventoryMergedId(*)').eq('status', "complete").eq('kycFormFilled', true).then((allotmentPaymentRes) => {
    //     console.log(allotmentPaymentRes)
    // })
    console.log('59 05');
});

router.get('/check', function (req, res, next) {
    supabase.from('AllotmentPayment').select('*,unitId(*),inventoryMergedId(*)').eq('status', "Payment Complete").eq('kycFormFilled', true).then((allotmentPaymentRes) => {
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

const statusUpdates = schedule.scheduleJob('00 6 * * *', function () {
    supabase.from('Projects').select('*').then(async (projectRes) => {
        let count = 0
        for (const project of projectRes.data) {
            let matchRes = await matchUnits(project)
            console.log(count++, new Date().toDateString())
        }
        console.log("end")
        // res.send("done")
        // projectRes.data.forEach(async (project, index) => {
        //     if (index === projectRes.data.length - 1) {
        //     } else {
        //         console.log(index)
        //     }
        // })
    })
})

function matchUnits(project) {
    return new Promise((resolve, reject) => {
        supabase.from('Inventory').select('*,projectId(*),wingId(*)').eq('projectId', project.projectId).then((resp) => {
            axios.get(`https://labour.vjerp.com:4423/project/getUnits?buId=${project.buId}`, { httpsAgent: agent }).then(async (units) => {
                if (resp.data.length > 0) {
                    for (const ele of resp.data) {
                        let farvisionUnit = units.data.result.filter((e) => { return e.UnitId === ele.farvisionUnitId })[0]
                        if (farvisionUnit) {
                            if (ele.farvisionStatus !== farvisionUnit.UnitStatus) {
                                let updateRes = await UpdateUnit(ele, farvisionUnit, "yes")
                            } else {
                                let updateRes = await UpdateUnit(ele, farvisionUnit, "no")
                            }
                        }
                    }
                    resolve(true)
                    // resp.data.forEach(async (ele, index) => {
                    //     let updateRes = await UpdateUnit(ele, units)
                    //     if (index === resp.data.length - 1) {
                    //         resolve(true)
                    //     }
                    // })
                }
            })
        })
    })
}

function UpdateUnit(ele, farvisionUnit, flag) {
    return new Promise((resolve, reject) => {
        supabase.from('Inventory').update({ last_updated_at: new Date().getTime(), statusChanged: flag, farvisionStatus: farvisionUnit.UnitStatus }).eq('unitId', ele.unitId).then((re) => {
            resolve(true)
        }).catch((err) => {
            resolve(true)
            console.log(err)
        })
    })
}

module.exports = router;
module.exports.matchUnits = matchUnits;

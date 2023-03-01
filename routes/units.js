var express = require("express");
var router = express.Router();
var supabase = require("../services/supabaseClient").supabase;
let unitCount = {}

router.post('/updateStatus', function (req, res, next) {
    if (!req.body.unitId || req.body.unitId === '') {
        res.send({ success: false, message: "Please provide unitId" })
    }
    if (!req.body.time || req.body.time === '') {
        res.send({ success: false, message: "Please provide time in mins" })
    }
    if ((req.body.mode === 'preselect' || req.body.mode === 'preselect2') && (!req.body.paymentId || req.body.paymentId === '')) {
        res.send({ success: false, message: "Please provide paymentId" })
    }
    if (!req.body.mode || req.body.mode === '') {
        res.send({ success: false, message: "Please provide mode" })
    } else {
        res.send("Status will be changed back to available if not alloted")
        setTimeout(() => {
            if (req.body.mode === 'preselect' || req.body.mode === 'preselect2') {
                supabase.from('Inventory').select('*,inventoryStatusId(*)').eq('unitId', req.body.unitId).then((resp) => {
                    if (resp.data[0].inventoryStatusId.status === 'Preselected' || resp.data[0].inventoryStatusId.status === 'Alloted') {
                        supabase.from('InventoryStatus').select('*').eq('status', "Available").then((statusRes) => {
                            supabase.from('Inventory').update({ leadId: null, inventoryStatusId: statusRes.data[0].inventoryStatusId }).eq('unitId', resp.data[0].unitId).then((leadRes) => {
                                supabase.from('LeadStatus').update({ status: req.body.mode === 'preselect' ? "Preselect payment not done" : "Preselect not confirmed" }).eq('leadId', resp.data[0].leadId).then((leadRes) => {
                                    supabase.from('AllotmentPayment').update({ status: req.body.mode === 'preselect' ? "expired" : "complete", preselectConfirmation: req.body.mode === 'preselect' ? "payment not done" : "not confirmed" }).eq('unitId', resp.data[0].unitId).eq('leadId', resp.data[0].leadId).then((apREs) => {
                                        supabase.from('EventTokenLeadRelations').update({ status: 'expired', last_updated_at: new Date().getTime() }).eq('paymentId', req.body.paymentId).then((rr) => {
                                            console.log("Changed")
                                        })
                                    })
                                })
                            })
                        })
                    }
                })
            } else {
                supabase.from('Inventory').select('*,inventoryStatusId(*)').eq('unitId', req.body.unitId).then((resp) => {
                    if (resp.data[0].inventoryStatusId.status === 'On Hold') {
                        supabase.from('InventoryStatus').select('*').eq('status', "Available").then((statusRes) => {
                            supabase.from('Inventory').update({ inventoryStatusId: statusRes.data[0].inventoryStatusId, unitHoldTime: null }).eq('unitId', req.body.unitId).then((r) => {
                                console.log("Changed")
                            })
                        })
                    }
                })
            }
        }, req.body.time * 60000);
    }
})

router.get('/getToken', function (req, res, next) {
    var token = new Date().getTime().toString();
    unitCount[token] = {
        updatedCount: 0,
        processFinished: false,
    };
    setTimeout(() => {
        if (unitCount[token]) {
            delete unitCount[token];
        }
    }, 1000 * 60 * 60 * 60);
    res.send({ token });
})

router.post('/updateInventoryPrice', async function (req, res, next) {
    if (req.query.token && unitCount[req.query.token]) {
        let units = req.body.units
        res.send({ success: true, message: "Updation Started" })
        let count = 0
        for (let i = 0; i < units.length; i++) {
            // await supabase.from('b').insert({ name: "sid" }).then((resp) => {
            let resp = await supabase.from('Inventory').update({ totalCost: units[i].totalCost, SDR: units[i].SDR, OCR: units[i].OCR, GST: units[i].GST, BSP: units[i].BSP }).eq('unitId', units[i].unitId)
            unitCount[req.query.token].updatedCount = ++count
            unitCount[req.query.token].processFinished = false
            if (units.length === count) {
                unitCount[req.query.token].processFinished = true
            }
            // })
        }
        console.log("end")
    } else {
        res.send({ success: false, message: "Please provide token" })
    }
})

router.get('/getCount', function (req, res, next) {
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // flush the headers to establish SSE with client
    if (!req.query.token || !unitCount[req.query.token]) {
        // let data = JSON.stringify(unitCount[token]);
        res.send({ success: false, message: "Please provide token" })
        // res.end();
    } else {
        let refreshIntervalId = setInterval(() => {
            let refreshRate = 5000;
            let id = new Date().getTime();
            let data = JSON.stringify(unitCount[req.query.token]);
            let messageToSend = `retry: ${refreshRate}\nid:${id}\ndata: ${data}\n\n`;
            res.write(messageToSend);
            if (unitCount[req.query.token].processFinished) {
                res.end();
                clearInterval(refreshIntervalId);
            }
        }, 1000);
    }
})

module.exports = router;

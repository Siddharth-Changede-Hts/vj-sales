var express = require("express");
var router = express.Router();
var supabase = require("../services/supabaseClient").supabase;

router.post('/updateStatus', function (req, res, next) {
    if (!req.body.unitId || req.body.unitId === '') {
        res.send({ success: false, message: "Please provide unitId" })
    }
    if (!req.body.time || req.body.time === '') {
        res.send({ success: false, message: "Please provide time in mins" })
    }
    if (!req.body.mode || req.body.mode === '') {
        res.send({ success: false, message: "Please provide mode" })
    } else {
        res.send("Status will be changed back to available if not alloted")
        setTimeout(() => {
            if (mode === 'preselect') {
                supabase.from('Inventory').select('*,inventoryStatusId(*)').eq('unitId', req.body.unitId).then((resp) => {
                    if (resp.data[0].inventoryStatusId.status === 'Preselected') {
                        supabase.from('InventoryStatus').select('*').eq('status', "Available").then((statusRes) => {
                            supabase.from('LeadStatus').update({ status: "Preselect not confirmed" }).eq('leadId', resp.data[0].leadId).then((leadRes) => {
                                supabase.from('AllotmentPayment').update({ preselectConfirmation: "Not confirmed" }).eq('unitId', resp.data[0].unitId).eq('leadId', resp.data[0].leadId).then((apREs) => {
                                    console.log("Changed")
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

module.exports = router;

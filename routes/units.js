var express = require("express");
var router = express.Router();
var supabase = require("../services/supabaseClient").supabase;

router.post('/updateStatus', function (req, res, next) {
    res.send("Status will be changed back to available if not alloted")
    setTimeout(() => {
        supabase.from('Inventory').select('*,inventoryStatusId(*)').eq('unitId', req.body.unitId).then((resp) => {
            if (resp.data[0].inventoryStatusId.status === 'On Hold') {
                supabase.from('InventoryStatus').select('*').eq('status', "Available").then((statusRes) => {
                    supabase.from('Inventory').update({ inventoryStatusId: statusRes.data[0].inventoryStatusId, unitHoldTime: null }).eq('unitId', req.body.unitId).then((r) => {
                        console.log("Changed")
                    })
                })
            }
        })
    }, req.body.time * 60000);
})

module.exports = router;

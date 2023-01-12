var express = require("express");
var router = express.Router();
var supabase = require("../services/supabaseClient").supabase;

router.post('/updateStatus', function (req, res, next) {
    res.send("Status will be changed back to available is not alloted")
    setTimeout(() => {
        supabase.from('Inventory').select('*').eq('unitId', req.body.unitId).then((resp) => {
            if (resp.data[0].inventoryStatusId === '54a8de2e-72f1-4b64-afed-3de904197043') {
                supabase.from('Inventory').update({ inventoryStatusId: '51c40f6a-176d-4ef9-a2a7-a2c0569da025' }).eq('unitId', req.body.unitId).then((r) => {
                    console.log("Changed")
                })
            }
        })
    }, req.body.time * 60000);
})

module.exports = router;

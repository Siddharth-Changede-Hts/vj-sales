var express = require('express');
var router = express.Router();
var supabase = require("../services/supabaseClient").supabase;

router.post('/login', function (req, res, next) {
    supabase.auth.signInWithOtp({phone:"+919823140243"}).then((resp)=>{
        console.log("res")
        res.send(resp)
    }).catch((err)=>{
        console.log("err")
        res.send(err)
    })
})

module.exports = router;

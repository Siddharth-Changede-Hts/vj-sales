var express = require("express");
var router = express.Router();
var pdfParser = require("pdf-parser");

router.post('/convert', function (req, res, next) {
    if (!req.body.pdf || req.body.pdf === '') {
        res.send({ success: false, message: "Please provide pdf" })
    } else {
        pdfParser.pdf2json(req.body.pdf, function (error, pdf) {
            if (error != null) {
                res.send({ success: false, message: error });
            } else {
                res.send({ success: true, pdf: pdf });
            }
        });
    }
})

module.exports = router;


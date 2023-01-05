var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  var sql = require("mssql");

  // config for your database
  // var config = {
  //   user: 'sa',
  //   password: 'farvision@123',
  //   server: '192.168.33.20.database.windows.net',
  //   database: 'VJDLIVE45'
  // };

  // connect to your database
  sql.connect("mssql://sa:farvision@123@192.168.33.20:1433/VJDLIVE45", function (err) {

    if (err) res.send(err);

    // create Request object
    var request = new sql.Request();
    // res.send(request)
    // // query to the database and get the records
    request.query('select * from Framework.BusinessUnit', function (err, recordset) {

      if (err) console.log("err")

      // send records as a response
      res.send(recordset);

    });
  });
});

module.exports = router;

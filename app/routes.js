const express = require('express')
const router = express.Router()

const path = require("path")
const fs = require('fs-extra')

// get all data files
function getDataFiles() {
  const directoryPath = path.join(__dirname, "data");

  fs.readdir(directoryPath, function(err, files) {
    if (err) {
      console.log("Error getting directory information.")
    } else {
      files.forEach(function(file) {
        console.log(file)
      })
    }
  })
}


// Route from the index page - this allows us to store which version was chosen
router.post("/", function (req, res) {

  let prototype = {} || req.session.data['prototype'] // set up if doesn't exist
  prototype.version = req.session.data.version // pulls the value from the button
  req.session.data['prototype'] = prototype // write back these values into the session data
  res.redirect('/' + prototype.version + '/start') // go to the start page
})

// Call in routes file from routes folder to keep routes.js cleaner
router.use('/', require('./routes/routes-v1.js'))
router.use('/', require('./routes/routes-v2.js'))
router.use('/', require('./routes/routes-v3.js'))
router.use('/', require('./routes/routes-v4.js'))


module.exports = router


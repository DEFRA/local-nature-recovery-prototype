const express = require('express')
const router = express.Router()

// Route from the index page - this allows us to store which version was chosen
router.post("/", function (req, res) {
  let prototype = {} || req.session.data['prototype'] // set up if doesn't exist
  prototype.version = req.session.data.version // pulls the value from the button
  req.session.data['prototype'] = prototype // write back these values into the session data
  res.redirect('/' + prototype.version + '/start') // go to the start page
})

// Call in routes file from routes folder to keep routes.js cleaner
router.use('/', require('./routes/routes-v1.js'))

module.exports = router

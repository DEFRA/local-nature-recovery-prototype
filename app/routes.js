const express = require('express')
const router = express.Router()
const fs = require('fs-extra') // needed to import the json data

// funtion to load in data files
function loadJSONFromFile(fileName, path = 'app/data/') {
  let jsonFile = fs.readFileSync(path + fileName)
  return JSON.parse(jsonFile) // Return JSON as object
}

// Add your routes here - above the module.exports line

// Route from the index page - this allows us to store which version was chosen
router.post("/", function (req, res) {
  let prototype = {} || req.session.data['prototype'] // set up if doesn't exist
  prototype.version = req.session.data.version // pulls the value from the button
  req.session.data['prototype'] = prototype // write back these values into the session data
  res.redirect('/' + prototype.version + '/start') // go to the start page
})

//Gather up totals for the boxes on the grants page
router.get('/options-choice/*/grants', function (req, res) {

  var optionCount = req.session.data['grants'].length // count options
  // var capitalCount = req.session.data['grants'].length // count capital items
  // var supplementCount = req.session.data['grants'].length // count supplements

  // find the right version
  let version = req.session.data['prototype'].version
  return res.render(version + '/grants', {
    'optionCount': optionCount
  })
})



// Load JSON data from file ----------------------------------------------------
function dataImport(req, res, next) {
  if (!req.session.data['grants']) {
    console.log('loading in data');
    // pull in JSON data file
    delete req.session.data['grants']
    let grantsFile = 'grants.json'
    let path = 'app/data/'
    req.session.data['grants'] = loadJSONFromFile(grantsFile, path)
  } else {
    console.log('data retrieved')
  }
  next()
}

// router.get('/*', dataImport)
router.get('/', dataImport) // the homepage will delete the session data and re-import it

module.exports = router

const express = require('express')
const router = express.Router()
var jsonQuery = require('json-query')
var nunjucks  = require('nunjucks')
var env = nunjucks.configure()

router.post('/options-choice/*/sbi-number', function (req, res) {
  res.redirect('sbi-land-confirm')
})

// Create array of search results
router.get('/options-choice/*/confirm', function (req, res) {
  // check for data
  if (!req.session.data['import']) {
    res.redirect('/error')
  }

  // get the objects
  var grants = req.session.data['import'].grants
  // lets grab the prototype object as a place to store the selected filters
  let prototype = req.session.data['prototype']
  // add all the values if they don't already exist

  grantNum = prototype.grantNum // pulls the value from the button

  // we could generate a simple array to hold all the related items - nunjucts could easily use that to render the page
  // something like [5,47,67]
  const relatedList = [] // lets store the related items here


  // if nothing relates create a fallback for the prototype to display
  if (relatedList.length === 0) {
    relatedList.push(0, 1, 2, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15)
  }

  // write back these values into the session data
  req.session.data['prototype'] = prototype

  // find the right version to render
  let version = req.session.data['prototype'].version
  return res.render(version + '/confirm', {
    'relatedList': relatedList
  })
})

// function to search arrays for matches against other arrays
var findOne = function (haystack, arr) {
  return arr.some(function (v) {
    return haystack.indexOf(v) >= 0
  })
}

module.exports = router

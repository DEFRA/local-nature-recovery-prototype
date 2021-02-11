const express = require('express')
const router = express.Router()
var jsonQuery = require('json-query')
var nunjucks  = require('nunjucks')
var env = nunjucks.configure()

router.post('/options-choice/*/sbi-number', function (req, res) {
    //console.log('inside sbi-number route');
    res.redirect('sbi-land-confirm')
})

router.post('/options-choice/*/sbi-land-confirm', function (req, res) {
    //console.log('inside sbi-number route');
    res.redirect('sbi-land-confirm')
})

module.exports = router

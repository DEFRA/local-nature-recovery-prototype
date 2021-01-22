const express = require('express')
const router = express.Router()
const fs = require('fs-extra') // needed to import the json data

//Gather up totals for the boxes on the grants page
router.get('/options-choice/*/grants', function (req, res) {

  // count how many grants of each type
  var grants = req.session.data['import'].grants // get the object

  // start the counters on 0
  var optionCount = 0
  var capitalCount = 0
  var supplementCount = 0

  for(i = 0; i < grants.length; i++) {
    if (grants[i].type === 'Option') {
      optionCount++
    } else if (grants[i].type === 'Capital Item') {
      capitalCount++
    } else if (grants[i].type === 'Supplement') {
      supplementCount++
    }
  }

  // find the right version to render
  let version = req.session.data['prototype'].version
  return res.render(version + '/grants', {
    'optionCount': optionCount, // pass the totals to the view
    'capitalCount': capitalCount,
    'supplementCount': supplementCount
  })
})

// Create array of search results
router.get('/options-choice/*/search-results', function (req, res) {

  // get the object
  var grants = req.session.data['import'].grants

  // grab the query parameter from url
  var type = req.query.type

  // create new or grab existing array
  let grantList = req.session.data['grantList'] || []

  // find grants of each type and add index to the array
  for(i = 0; i < grants.length; i++) {
    if (grants[i].type === type) {
      grantList.push(i)
    }
  }

  // ### Get Filter Data ### 
  // get Grant Types Filter
  objTypeFilters = getObjTypesFilter();
  // ### Get Filter Data ### 
  
  // find the right version to render
  let version = req.session.data['prototype'].version
  return res.render(version + '/search-results', {
    'grantList': grantList,
    'type': type,
    'fTypes': objTypeFilters
  })
})

// show the grant details page
router.get('/options-choice/*/grant-details', function (req, res) {
  let prototype = req.session.data['prototype']

  // get the object
  var grants = req.session.data['import'].grants

  // grab the query parameter from url
  var grantNum = req.query.grant
  prototype.grantNum = grantNum

  // find the right version to render
  let version = req.session.data['prototype'].version
  req.session.data['prototype'] = prototype // write back these values into the session data
  return res.render(version + '/grant-details')
})

// filter grant list
router.post('/options-choice/*/search-results', function (req, res) {
  
  // --- Get Filter Data --- //
  // get Grant Types Filter
  objTypeFilters = getObjTypesFilter();
  // --- End Get Filter Data --- //

  console.log('mitesh submitted form--------');

  // grab the initial grant type(s) selected
  var type = req.body.type;

  //### grab filter type selected (array).
  var aFType = req.body.fType

  // load all grants
  var grants = req.session.data['import'].grants
  // create new grant list to display (or grab existing)
  let grantList = req.session.data['grantList'] || []

  //### find grants of selected type(s) and add to grantList  
    //loop grants
    for(g = 0; g < grants.length; g++) {
      // loop fType
      for(f = 0; f < aFType.length; f++)
      {
        // if grants.type == fType, add to grantList
        console.log("title"+ grants[g].title +"grant type:"+ grants[g].type.toLowerCase() +" : fTypes:"+ aFType[f].toLowerCase());
        if(grants[g].type.toLowerCase() == aFType[f].toLowerCase()) {
          grantList.push(g)
        }
      }
    }


  // find the right version to render
  let version = req.session.data['prototype'].version
  return res.render(version +'/search-results', {
    'fTypes': objTypeFilters,
    'grantList': grantList,
  })
})

// Add item to plan
router.post("/options-choice/*/grant-details", function (req, res) {
  let prototype = req.session.data['prototype']
  grantNum = prototype.grantNum // pulls the value from the button

  // get the object
  var grants = req.session.data['import'].grants
  var grantType = grants[grantNum].type

  let plan = req.session.data['plan'] || [] // set up if doesn't exist
  let planNum = plan.length
  let grantItem = [planNum, grantNum,grantType,0,false] // build an array of the plan items

  prototype.planNum = planNum
  plan.push(grantItem) // add to the array
  req.session.data['prototype'] = prototype // write back these values into the session data
  req.session.data['plan'] = plan
  console.log(plan)

  res.redirect('configure')
})

// show the grant details page
router.get('/options-choice/*/configure', function (req, res) {
  let prototype = req.session.data['prototype']
  planNum = prototype.planNum

  // grab the query parameter from url and override if it exists
  if (req.query.planNum) {
    var planNum = req.query.planNum
  }
  prototype.planNum = planNum

  // find the right version to render
  let version = req.session.data['prototype'].version
  req.session.data['prototype'] = prototype // write back these values into the session data
  return res.render(version + '/configure')
})

// configure item
router.post("/options-choice/*/configure", function (req, res) {
  let prototype = req.session.data['prototype']
  units = req.session.data.units // pulls the value from the button
  planNum = prototype.planNum // pulls the value from the button

  let plan = req.session.data['plan'] || [] // set up if it doesn't exist

  plan[planNum].splice(3, 1, units)
  plan[planNum].splice(4, 1, true)

  req.session.data['plan'] = plan

  res.redirect('plan')
})

// Create array of search results
router.get('/options-choice/*/plan', function (req, res) {
  // get the object
  let plan = req.session.data['plan']
  grantNum = req.session.data['prototype'].grantNum
  planNum = req.session.data['prototype'].planNum

  // start the counters on 0
  var completedCount = 0

  for(i = 0; i < plan.length; i++) {
    if (plan[i][4] === true) {
      completedCount++
    }
  }

  // find the right version to render
  let version = req.session.data['prototype'].version
  return res.render(version + '/plan', {
    'grantNum': grantNum,
    'planNum': planNum,
    'completedCount': completedCount
  })
})



// Load JSON data from file ----------------------------------------------------

// funtion to load in data files
function loadJSONFromFile(fileName, path = 'app/data/') {
  let jsonFile = fs.readFileSync(path + fileName)
  return JSON.parse(jsonFile) // Return JSON as object
}


function dataImport(req, res, next) {
  if (!req.session.data['import']) {
    console.log('loading in data');
    // pull in JSON data file
    delete req.session.data['import']
    let grantsFile = 'grants.json'
    let path = 'app/data/'
    req.session.data['import'] = loadJSONFromFile(grantsFile, path)
  } else {
    console.log('data retrieved')
  }
  next()
}

// Get Data for Filters  ----------------------------------------------------

// return Grant Types
function getObjTypesFilter(){
  // setup Filter Types
  var objTypeFilters = {
    '1': 'Option',
    '2': 'Capital Item',
    '3': 'Supplement'
  };

  return objTypeFilters;
}

// router.get('/*', dataImport)
router.get('/', dataImport) // the homepage will delete the session data and re-import it

module.exports = router

const express = require('express')
const router = express.Router()
const fs = require('fs-extra') // needed to import the json data

var nunjucks  = require('nunjucks');
var env = nunjucks.configure();

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

// Create array of search results
router.get('/options-choice/*/search-results', function (req, res) {

  // get the object
  var grants = req.session.data['import'].grants

  // grab the query parameter from url or form depending how we got here
  var type = req.query.type
  var gtChecked =[]; //gt filter from body, init
  if( typeof(type) !== 'undefined') {
    gtChecked.push(type)
  }
  if( typeof(req.body.fType) !== 'undefined') {
    gtChecked = req.body.fType
  }
  
  // --- Get Filter Data --- //
  aTypeFilters = getTypesFilter();
  
  // Render Filter Checkbox
  strGTInput = renderCheckboxIncState(gtChecked, aTypeFilters, "fType");

  // create new or grab existing array
  let grantList = req.session.data['grantList'] || []

  // find grants of each type and add index to the array
  for(i = 0; i < grants.length; i++) {
    if (grants[i].type === type) {
      grantList.push(i)
    }
  }

  // find the right version to render
  let version = req.session.data['prototype'].version
  return res.render(version + '/search-results', {
    'grantList': grantList,
    'type': type,
    'strGTInput': strGTInput
  })
})

// filter grant list
router.post('/options-choice/*/search-results', function (req, res) {
  
  // load all grants
  var grants = req.session.data['import'].grants
  // create new grant list to display (or grab existing)
  let grantList = req.session.data['grantList'] || []
  
  //### grab filter type selected (array).
  var gtChecked = [] // Grant Type Selection
  if(typeof(req.body.fType) !== 'undefined' || null) {
    gtChecked =req.body.fType;
  }
  // Land Use Selection

  // --- Get Filter Data --- //
  gtFilters = getTypesFilter();
  // ### Get Land Use

  // Display Filter Checkbox & Maintain State
  strGTInput = renderCheckboxIncState(gtChecked, gtFilters, "fType");
  strLUInput = ''//renderCheckboxIncState(gtChecked, gtFilters, "fType");

  // find grants of selected type(s) and add to grantList    
  for(g = 0; g < grants.length; g++) {
    // loop fType
    for(f = 0; f < gtChecked.length; f++)
    {
      // if grants.type == fType, add to grantList
      if(grants[g].type.toLowerCase() == gtChecked[f].toLowerCase()) {
        grantList.push(g)
        gtChecked.checked='checked'
      }
    }
  }

  // find the right version to render
  let version = req.session.data['prototype'].version
  return res.render(version +'/search-results', {
    'fTypes': gtFilters,
    'grantList': grantList,
    'aFTypeChecked': gtChecked,
    'strGTInput': strGTInput
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

// return Grant Types (NEEDS CONVERTING TO ARRAY)
function getTypesFilter(){
  var aTypeFilters =['Option', 'Capital Item','Supplement'];
  return aTypeFilters;
}

// render Filter Checkbox & Maintain State
function renderCheckboxIncState(selected, filter, name) {
  var strInput ='';
  var checked='';
  for(t=0; t < filter.length; t++) {
    checked='';
    for(s=0; s< selected.length; s++) {
      if(filter[t] == selected[s])
      {
        checked='checked';
        break;
      }
    }
    strInput = strInput + ' \
    <div class="govuk-checkboxes__item"> \
    <input onchange="this.form.submit()" '+ checked +' class="govuk-checkboxes__input" id="'+ name +'-'+ s +'" name="'+ name +'[]" type="checkbox" value="'+ filter[t] +'"> \
    <label class="govuk-label govuk-checkboxes__label" for="'+ name +'-'+ t +'"> \
      '+ filter[t] +' \
    </label> \
  </div> \
    ';
  }
  return strInput;
}

// router.get('/*', dataImport)
router.get('/', dataImport) // the homepage will delete the session data and re-import it

module.exports = router

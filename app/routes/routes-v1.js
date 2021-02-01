const express = require('express')
const router = express.Router()
const fs = require('fs-extra') // needed to import the json data

var nunjucks  = require('nunjucks')
var env = nunjucks.configure()


// filter grant list
router.post('/options-choice/*/location', function (req, res) {

  const location = req.session.data['location']

  if (location === 'postcode') {
    res.redirect('postcode')
  } else if (location === 'cph') {
    res.redirect('cph-number')
  } else if (location === 'sbi') {
    res.redirect('sbi-number')
  } else {
    res.redirect('map')
  }
})

// land use checkboxes
router.post('/options-choice/*/land-use', function (req, res) {

  const location = req.session.data['location']

  res.redirect('search-results')
})

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

  // grab the query parameter from url or form depending how we got here
  var type = req.query.type
  var gtChecked =[]; //gt filter from body, init
  if( typeof(type) !== 'undefined') {
    gtChecked.push(type)
  }
  if( typeof(req.body.fGrantType) !== 'undefined') {
    gtChecked = req.body.f_grant_type
  }
  
  // --- Get Filter Data --- //
  gtFilters = getTypesFilter(); // Grant Type
  luFilters = getLandUseFilter(); // Land Use
  lpFilters = getLocalPriorityFilter(); // Local Priorities
  
  // Render Filter Checkbox
  strGTInput = renderCheckboxIncState(gtChecked, gtFilters, "f_grant_type");
  strLUInput = renderCheckboxIncState("f_land_use", luFilters, "f_land_use");
  strLPInput = renderCheckboxIncState("f_local_p", lpFilters, "f_local_p");

  // create new or grab existing array
  let grantList = req.session.data['grantList'] || []

  // find grants of each type and add index to the array
  for(i = 0; i < grants.length; i++) {
    if (grants[i].type === type) {
      grantList.push(i)
    }
  }

  // if No GrantType selected, display all GrantTypes
  if(type==='undefined' || type ==null) {
    for(i = 0; i < grants.length; i++) {
      grantList.push(i)
    }
  }

  // find the right version to render
  let version = req.session.data['prototype'].version
  return res.render(version + '/search-results', {
    'grantList': grantList,
    'type': type,
    'strGTInput': strGTInput,
    'strLUInput': strLUInput,
    'strLPInput': strLPInput
  })
})

// filter grant list
router.post('/options-choice/*/search-results', function (req, res) {

  // load all grants
  var grants = req.session.data['import'].grants
  // create new grant list to display (or grab existing)
  let grantList = req.session.data['grantList'] || []
  
  // grab filters selected
  var gtChecked = [] // Grant Type selection
  if(typeof(req.body.f_grant_type) !== 'undefined' || null) {
    gtChecked =req.body.f_grant_type;
  }
  var luChecked = [] // Land Use selection
  if(typeof(req.body.f_land_use) !== 'undefined' || null) {
    luChecked =req.body.f_land_use;
  }
  var lpChecked = [] // // Local Priorities
  if(typeof(req.body.f_local_p) !== 'undefined' || null) {
    lpChecked =req.body.f_local_p;
  }

  // --- Get Filter Data --- //
  gtFilters = getTypesFilter(); // Grant Type
  luFilters = getLandUseFilter(); // Land Use
  lpFilters = getLocalPriorityFilter(); // Local Priorities

  // Display Filter Checkbox & Maintain State
  strGTInput = renderCheckboxIncState(gtChecked, gtFilters, "f_grant_type");
  strLUInput = renderCheckboxIncState(luChecked, luFilters, "f_land_use");
  strLPInput = renderCheckboxIncState(lpChecked, lpFilters, "f_local_p");



  // (1/4). find grants for selected 'Land Use' filters and add to grantList  
  for(g = 0; g < grants.length; g++) {

    var grants_use = grants[g].use.split(',').map(item => item.trim().toLowerCase());
    var foundone = findOne(grants_use,luChecked);
    if(foundone) {
      luChecked.checked='checked' 
      grantList.push(g)
    }
  }

  // (2/4). Remove all grants that are not part of selected GrantType
  console.log('-----')
  for(gl = 0; gl < grantList.length; gl++) {
    console.log('gl:'+ grants[grantList[gl]].type.toLowerCase() + ' - '+grants[grantList[gl]].code +' - '+ grants[grantList[gl]].type.toLowerCase() +' - '+ grants[grantList[gl]].use)

    if(gtChecked.includes(grants[grantList[gl]].type.toLowerCase()))
    {
      // keep in GrantList
      console.log('keeps');
    } else {
      // remove from GrantList
      console.log('REM: '+ grants[grantList[gl]].type);
      grantList.splice(gl,1);
      gl=gl-1
    }
  }

  // (3/4). if NO LandUse is selected then simply add all grants for GrantType Selected
  if(luChecked.length<=0) {
    // find grants of each type and add index to the array
    for(i = 0; i < grants.length; i++) {
      for(gt = 0; gt < gtChecked.length; gt++)
      {
        if (grants[i].type.trim().toLowerCase() == gtChecked[gt]) {
          grantList.push(i)
        }
      }
    }
  }

  // (4/4). if No GrantType selected, display all GrantTypes
  if(gtChecked.length ===0) {
    for(i = 0; i < grants.length; i++) {
      grantList.push(i)
    }
  }

    // Local Priority
    // copy Array item to new Array if Local Priority
    var grantListLocal = [];
    for(g = 0; g < grants.length; g++) {
      for(lp = 0; lp < lpChecked.length; lp++)
      {
        if (grants[g].priority.trim().toLowerCase() == 'true') {
          grantList.splice(grants[g],1);
          grantListLocal.push(grants[g])
        }
      }
    }
    

  // find the right version to render
  let version = req.session.data['prototype'].version
  return res.render(version +'/search-results', {
    'fTypes': gtFilters,
    'grantList': grantList,
    'aFTypeChecked': gtChecked,
    'strGTInput': strGTInput,
    'strLUInput': strLUInput,
    'strLPInput': strLPInput
  })
})

// show the grant details page
router.get('/options-choice/*/grant-details', function (req, res) {
  let prototype = req.session.data['prototype']
  console.log('hello')
  // get the object
  var grants = req.session.data['import'].grants

  // grab the query parameter from url
  var grantNum = req.query.grant
  prototype.grantNum = grantNum

  let unit = grants[grantNum].measure

  unit = unit.split(',')

  console.log(unit)

  // find the right version to render
  let version = req.session.data['prototype'].version
  req.session.data['prototype'] = prototype // write back these values into the session data
  return res.render(version + '/grant-details', {
    'unit': unit[0]
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
  return res.render(version + '/configure', {
    'grantNum': grantNum
  })

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

// delete item from plan 
router.post('/options-choice/*/plan', function (req, res) {
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

   // remove from plan
   plan.splice(req.body.planNum, 1);
 
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
    console.log('loading in data file')
    // pull in JSON data file
    delete req.session.data['import']
    let grantsFile = 'grants-full.json'
    let path = 'app/data/'
    req.session.data['import'] = loadJSONFromFile(grantsFile, path)
  } else {
    console.log('data retrieved')
  }
  next()
}

// Get Data for Filters  ----------------------------------------------------

// return Grant Types
function getTypesFilter(){
  var aTypeFilters =['Option', 'Capital Item','Supplement'];
  return aTypeFilters;
}
function getLandUseFilter(){
  var aTypeFilters =['Flood risk', 'Grassland','Uplands','Water Quality','Priority habitats','Arable land', 'Pollinators and Wildlife'];
  return aTypeFilters;
}
function getLocalPriorityFilter(){
  var aLocalPFilters =['Show only local priorities'];
  return aLocalPFilters;
}

// render Filter Checkbox & Maintain State
function renderCheckboxIncState(selected, filter, name) {
  var strInput ='';
  var checked='';
  for(t=0; t < filter.length; t++) {
    checked='';
    for(s=0; s< selected.length; s++) {
      if(filter[t].trim().toLowerCase() == selected[s].trim().toLowerCase())
      {
        checked='checked';
        break;
      }
    }
    strInput = strInput + ' \
    <div class="govuk-checkboxes__item"> \
    <input onchange="this.form.submit()" '+ checked +' class="govuk-checkboxes__input" id="'+ name.trim().toLowerCase() +'-'+ s +'" name="'+ name.trim().toLowerCase() +'[]" type="checkbox" value="'+ filter[t].trim().toLowerCase() +'"> \
    <label class="govuk-label govuk-checkboxes__label" for="'+ name.trim().toLowerCase() +'-'+ t +'"> \
      '+ filter[t] +' \
    </label> \
  </div> \
    ';
  }
  return strInput;
}

/**
 * @description determine if an array contains one or more items from another array.
 * @param {array} haystack the array to search.
 * @param {array} arr the array providing items to check for in the haystack.
 * @return {boolean} true|false if haystack contains at least one item from arr.
 */
var findOne = function (haystack, arr) {
  return arr.some(function (v) {
      return haystack.indexOf(v) >= 0;
  });
};


// router.get('/*', dataImport)
router.get('/', dataImport) // the homepage will delete the session data and re-import it

module.exports = router

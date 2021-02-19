const express = require('express')
const router = express.Router()
const fs = require('fs-extra') // needed to import the json data

const { JSDOM } = require("jsdom")
const axios = require('axios')

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

  let prototype = req.session.data['prototype']

  const location = req.session.data['location']

  let version = req.session.data['prototype'].version

  if (prototype.version === 'options-choice/v2/b' || prototype.version === 'options-choice/v3/b') { // TODO make this ignore the version number
    res.redirect('local-priorities')
  } else if (prototype.version === 'options-choice/v4/b') {
    res.redirect('grants')
  } else {
    res.redirect('search-results')
  }
})

//Gather up totals for the boxes on the grants page
router.get('/options-choice/*/grants', function (req, res) {

  // check for data
  if (!req.session.data['import']) {
    res.redirect('/error')
  }

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

  // check for data
  if (!req.session.data['import']) {
    res.redirect('/error')
  }

  res.locals.currentURL = req.originalUrl
  res.locals.prevURL = req.get('Referrer')

  prevURL = res.locals.prevURL
  console.log('previous page is: ' + res.locals.prevURL + " and current page is " + req.url + " " + res.locals.currentURL )

  // get the objects
  var grants = req.session.data['import'].grants
  // lets grab the prototype object as a place to store the selected filters
  let prototype = req.session.data['prototype']
  // add all the values if they don't already exist
  prototype.filterType = [['Option', ''], ['Capital Item', ''], ['Supplement', '']]
  prototype.filterUse = [['Air quality', ''], ['Arable land', ''], ['Boundaries', ''], ['Coast', ''], ['Educational access', ''], ['Flood risk', ''], ['Grassland', ''], ['Historic environment', ''], ['Livestock management', ''], ['Organic land', ''], ['Pollinators and Wildlife', ''], ['Priority habitats', ''], ['Trees (non-woodland)', ''], ['Uplands', ''], ['Vegetation control', ''], ['Water Quality', ''], ['Woodland', '']]
  prototype.filterPackage = [['Pollinators and Wildlife', ''], ['Improving Water Quality', ''], ['Air Quality', ''], ['Water Quality', ''], ['Climate Change Mitigation and Adaptation', ''], ['Flood Mitigation and Coastal Risk', ''], ['Drought and Wildfire Mitigation', ''], ['Heritage', ''], ['Access and Engagement', '']]
  // for version B we want to start with the local priorities checked
  if (prototype.version === 'options-choice/v1/b') { // TODO make this ignore the version number
    prototype.filterLocal = [['Show only local priorities', 'checked']]
  } else {
    prototype.filterLocal = [['Show only local priorities', '']]
  }

  // grab the query parameter from url or form depending how we got here
  type = req.query.type

  // if someone has come in from the land use page we need to take their answers and use them to filter the results

  // set up array to hold the grant list (search results)
  var grantList = []

  if (req.session.data.landuse !== 'undefined' && !type) {
    const landUse = req.session.data.landuse || []
    // if only one thing is checked if doesn't come to us as an array so we need to convert it into one
    if (Array.isArray(landUse)) {
      uses = landUse
    } else {
      uses = landUse.split()
    }
    const activeUses = [] // lets store the checked options here
    for (i = 0; i < prototype.filterUse.length; i++) {
      if (uses.length === 0) {
        prototype.filterUse[i][1] = ''
      } else {
        for (j = 0; j < uses.length; j++) {
          if (uses[j] === prototype.filterUse[i][0]) {
            prototype.filterUse[i][1] = 'checked'
            activeUses.push(prototype.filterUse[i][0])
            break
          } else {
            prototype.filterUse[i][1] = ''
          }
        }
      }
    }
    // find grants for selected 'land use' filters and add to grantList
    for (i = 0; i < grants.length; i++) {
      var grants_use = grants[i].use.split(',').map(item => item.trim())
      // build an array of the land use filters selected
      var foundUse = findOne(grants_use, activeUses)
      if (activeUses.length === 0) {
        grantList.push(i)
      } else {
        if (foundUse) {
          grantList.push(i)
        }
      }
    }
  }

  // let's check the appropriate filter
  if (type) {
    grantList = []
    for (i = 0; i < prototype.filterType.length; i++) {
      console.log(prototype.filterType[i][0])
      if (prototype.filterType[i][0] === type) {
        prototype.filterType[i][1] = 'checked'
      } else {
        prototype.filterType[i][1] = ''
      }
    }
    for(i = 0; i < grants.length; i++) {
      if (grants[i].type === type) {
        grantList.push(i)
      }
    }
    // if No GrantType selected, display all GrantTypes
    if(type === 'undefined' || type ==null) {
      for(i = 0; i < grants.length; i++) {
        grantList.push(i)
      }
    }
  }

  console.log("grantlist: " + grantList)

  // if No filters are selected, display all grants
  if (grantList.length === 0) {
    for(i = 0; i < grants.length; i++) {
      grantList.push(i)
    }
  }

  if (prototype.filterLocal[0][1] === 'checked') {
    var finalList = []

    for(i = 0; i < grantList.length; i++) {
      if (grants[grantList[i]].priority) {
        var type_local = grants[grantList[i]].priority.split(',').map(item => item.trim())
        // build an array of the grant type filters selected
        if (type_local[0] !== 'undefined') {
          finalList.push(grantList[i])
        }
      }
    }
  } else {
    finalList = Array.from(grantList)
  }

  // write back these values into the session data
  req.session.data['prototype'] = prototype

  // find the right version to render
  let version = req.session.data['prototype'].version
  return res.render(version + '/search-results', {
    'grantList': finalList,
    'prevURL': prevURL,
    'expjs': 'text from expressjs'
  })
})

// apply filters to grant listing
router.post('/options-choice/*/search-results', function (req, res) {
  // first grab our objects
  let grants = req.session.data['import'].grants  // load all grants
  let grantList = req.session.data['grantList'] || [] // create new grant list to display (or grab existing)
  let prototype = req.session.data['prototype'] // pull back list of filters

  // STEP 1 = set all the filters

  // PACKAGES

  // get the checked packages from the form submission, if nothing is checked create an empty array
  const selectedPackages = req.body.f_package || []
  // if only one thing is checked if doesn't come to us as an array so we need to convert it into one
  if (Array.isArray(selectedPackages)) {
    processPackages = selectedPackages
  } else {
    processPackages = selectedPackages.split()
  }
  const activePackages = [] // create an empty array to store a list of the selected packages
  // loop through the filter object looking for a matches against the returned checked items
  for (i = 0; i < prototype.filterPackage.length; i++) {
    // if nothing in the form is checked - mark everything in the nested array as unchecked
    if (processPackages.length === 0) {
      prototype.filterPackage[i][1] = ''
    } else { // find the filter and either set it to checked or unchecked
      for (j = 0; j < processPackages.length; j++) {
        if (processPackages[j] === prototype.filterPackage[i][0]) {
          prototype.filterPackage[i][1] = 'checked'
          // push to the array the selected values that we can loop through
          activePackages.push(prototype.filterPackage[i][0])
          break
        } else {
          prototype.filterPackage[i][1] = ''
        }
      }
    }
  }
  console.log("\nActive packages: " + activePackages)

  // LAND USE - same as above

  const selectedUses = req.body.f_land_use || []
  if (Array.isArray(selectedUses)) {
    processUses = selectedUses
  } else {
    processUses = selectedUses.split()
  }
  const activeUses = []
  for (i = 0; i < prototype.filterUse.length; i++) {
    if (processUses.length === 0 ) {
      prototype.filterUse[i][1] = ''
    } else {
      for (j = 0; j < processUses.length; j++) {
        if (processUses[j] === prototype.filterUse[i][0]) {
          prototype.filterUse[i][1] = 'checked'
          activeUses.push(prototype.filterUse[i][0])
          break
        } else {
          prototype.filterUse[i][1] = ''
        }
      }
    }
  }
  console.log("Active land use: " + activeUses)

  // GRANT TYPE - same as above

  const selectedType = req.body.f_grant_type || []
  if (Array.isArray(selectedType)) {
    processType = selectedType
  } else {
    processType = selectedType.split()
  }
  const activeTypes = []
  for (i = 0; i < prototype.filterType.length; i++) {
    if (processType.length === 0 ) {
      prototype.filterType[i][1] = ''
    } else {
      for (j = 0; j < processType.length; j++) {
        if (processType[j] === prototype.filterType[i][0]) {
          prototype.filterType[i][1] = 'checked'
          activeTypes.push(prototype.filterType[i][0])
          break
        } else {
          prototype.filterType[i][1] = ''
        }
      }
    }
  }
  console.log("Active types: " + activeTypes)

  // LOCAL PRIORITY - same as above

  const selectedLocal = req.body.f_local_p || []
  if (Array.isArray(selectedLocal)) {
    processLocal = selectedLocal
  } else {
    processLocal = selectedLocal.split()
  }
  const activeLocal = []
  for (i = 0; i < prototype.filterLocal.length; i++) {
    if (processLocal.length === 0 ) {
      prototype.filterLocal[i][1] = ''
    } else {
      for (j = 0; j < processLocal.length; j++) {
        if (processLocal[j] === prototype.filterLocal[i][0]) {
          prototype.filterLocal[i][1] = 'checked'
          activeLocal.push(prototype.filterLocal[i][0])
          break
        } else {
          prototype.filterLocal[i][1] = ''
        }
      }
    }
  }
  console.log("Active local: " + activeLocal + "\n")



  // STEP 2 = build out our lists

  // find grants for selected 'package' filters and add to the grant list
  // first create an array to hold the list
  const grantListbypackage = []
  // loop through the entire grants list and find the ones that match the

  // if nothing is selected we add the full list
  if (activePackages.length === 0) {
    for(i = 0; i < grants.length; i++) {
      // avoid issues if we check if the empty first
      grantListbypackage.push(i)
    }
  }
  else {
    for(i = 0; i < grants.length; i++) {
      // avoid issues if we check if the empty first
      if (grants[i].packages) {
        // we grab the values from each grant
        var grants_package = grants[i].packages.split(',').map(item => item.trim())
        // we them pass all of them past the selected filters to see if they match
        var foundPackage = findOne(grants_package, activePackages)
        // if we get at any of the filters matching we store this grant item in the new array
        if (activePackages.length === 0) {
          grantListbypackage.push(i)
        } else {
          if (foundPackage) {
            grantListbypackage.push(i)
          }
        }
      }
    }
  }
  console.log("list after packages: " + grantListbypackage)

  // find grants for selected 'land use' filters and add to grantList
  const grantListbyuse = []
  // we start by looping through the list filtered by package
  for(i = 0; i < grantListbypackage.length; i++) {
    if (grants[grantListbypackage[i]].use) {
      var grants_use = grants[grantListbypackage[i]].use.split(',').map(item => item.trim())
      // build an array of the land use filters selected
      var foundUse = findOne(grants_use, activeUses)
      if (activeUses.length === 0) {
        grantListbyuse.push(grantListbypackage[i])
      } else {
        if (foundUse) {
          grantListbyuse.push(grantListbypackage[i])
        }
      }
    }
  }
  console.log("list after land use: " + grantListbyuse)

  // subFilteredList = grantListbyuse.filter(function(item, pos, self) {
  //   return self.indexOf(item) == pos;
  // })

  // find grants for selected 'grant types' filters and add to grantList
  const grantListbytype = []
  for(i = 0; i < grantListbyuse.length; i++) {
    var type_use = grants[grantListbyuse[i]].type.split(',').map(item => item.trim())
    // build an array of the grant type filters selected
    var foundType = findOne(type_use, activeTypes)
    if (activeTypes.length === 0) {
      grantListbytype.push(grantListbyuse[i])
    } else {
      if (foundType) {
        grantListbytype.push(grantListbyuse[i])
      }
    }
  }
  console.log("list after Types: " + grantListbytype)

  // find grants for selected 'local priorities' filters and add to grantList
  var finalList = []
  for(i = 0; i < grantListbytype.length; i++) {
    if (prototype.filterLocal[0][1]) { // if the filter is picked sort it or keep everything

      if (grants[grantListbytype[i]].priority) {
        var type_local = grants[grantListbytype[i]].priority.split(',').map(item => item.trim())
        // build an array of the grant type filters selected

        if (type_local[0] !== 'undefined') {
          finalList.push(grantListbytype[i])

        }
      }
    } else {
      finalList = Array.from(grantListbytype)
    }
  }
  console.log("list after priorities: " + finalList)


  // write back these values into the session data
  req.session.data['prototype'] = prototype

  let version = prototype.version // find the right version to render
  return res.render(version +'/search-results', {
    'grantList': finalList
  })
})

// function to search arrays for matches against other arrays
var findOne = function (haystack, arr) {
  return arr.some(function (v) {
    return haystack.indexOf(v) >= 0
  })
}

// show the grant details page
router.get('/options-choice/*/grant-details', function (req, res) {

  // check for data
  if (!req.session.data['import']) {
    res.redirect('/error')
  }

  let prototype = req.session.data['prototype']
  // get the object
  var grants = req.session.data['import'].grants

  // grab the query parameter from url
  var grantNum = req.query.grant
  prototype.grantNum = grantNum

  let unit = grants[grantNum].measure

  unit = unit.split(',')

  // find the right version to render
  let version = req.session.data['prototype'].version
  req.session.data['prototype'] = prototype // write back these values into the session data
  
  const scrapeGov = async () => {
    try {
      // const { data } = await axios.get("https://www.gov.uk/countryside-stewardship-grants/creation-of-wood-pasture-wd6");
      const { data } = await axios.get(grants[grantNum].url);
      //const dom = new JSDOM(data, { runScripts: "dangerously", resources: "usable"});
      const dom = new JSDOM(data);
      const { document } = dom.window;
      const scrappedContent = document.querySelector(".gem-c-govspeak").innerHTML;
      
      return res.render(version + '/grant-details', {
        'unit': unit[0],
        'govtext': scrappedContent
      })

      //return firstPost;
    } catch (error) {
      throw error;
    }
  };

  scrapeGov();
})



// Add item to plan
router.post("/options-choice/*/grant-details", function (req, res) {
  let prototype = req.session.data['prototype']

  // get the object
  var grants = req.session.data['import'].grants
  var grantNum = prototype.grantNum
  var grantType = grants[grantNum].type

  let plan = req.session.data['plan'] || [] // set up if doesn't exist
  let planNum = plan.length
  let grantItem = [planNum, grantNum,grantType,'0',false] // build an array of the plan items

  prototype.planNum = planNum
  plan.push(grantItem) // add to the array
  req.session.data['prototype'] = prototype // write back these values into the session data
  req.session.data['plan'] = plan
  console.log(plan)

  res.redirect('configure')
})

// show the grant details page
router.get('/options-choice/*/configure', function (req, res) {

  // check for data
  if (!req.session.data['import']) {
    res.redirect('/error')
  }

  let prototype = req.session.data['prototype']
  planNum = prototype.planNum
  grantNum = prototype.grantNum // pulls the value from the button

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

  if (prototype.version === 'options-choice/v3/b' || prototype.version === 'options-choice/v4/b') { // TODO make this ignore the version number
    res.redirect('confirm')
  } else {
    res.redirect('plan')
  }


})

// Create array of search results
router.get('/options-choice/*/plan', function (req, res) {

  // check for data
  if (!req.session.data['import']) {
    res.redirect('/error')
  }

  // get the object
  let plan = req.session.data['plan'] || []

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
  plan.splice(req.body.planNum, 1)

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
    let grantsFile = 'grants-full-dr.json'
    let path = 'app/data/'
    req.session.data['import'] = loadJSONFromFile(grantsFile, path)

    // TODO - gather up the filter facets here - and find a way to avoid hard-coding them

  } else {
    console.log('data retrieved')
  }
  next()
}

router.get('/', dataImport) // the homepage will delete the session data and re-import it

module.exports = router

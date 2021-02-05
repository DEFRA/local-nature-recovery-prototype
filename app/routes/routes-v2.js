const express = require('express')
const router = express.Router()
var jsonQuery = require('json-query')
var nunjucks  = require('nunjucks')
var env = nunjucks.configure()


// Create array of search results
router.get('/options-choice/*/local-priorities', function (req, res) {

  // check for data
  if (!req.session.data['import']) {
    res.redirect('/error')
  }

  // get the objects
  var grants = req.session.data['import'].grants
  // lets grab the prototype object as a place to store the selected filters
  let prototype = req.session.data['prototype']
  // add all the values if they don't already exist
  prototype.filterType = [['Option', ''], ['Capital Item', ''], ['Supplement', '']]
  prototype.filterUse = [['Air quality', ''], ['Arable land', ''], ['Boundaries', ''], ['Coast', ''], ['Educational access', ''], ['Flood risk', ''], ['Grassland', ''], ['Historic environment', ''], ['Livestock management', ''], ['Organic land', ''], ['Priority habitats', ''], ['Trees (non-woodland)', ''], ['Uplands', ''], ['Vegetation control', ''], ['Water Quality', ''], ['Pollinators and Wildlife', ''], ['Woodland', '']]
  prototype.filterPackage = [['Pollinators and Wildlife', ''], ['Improving Water Quality', ''], ['Air Quality', ''], ['Water Quality', ''], ['Climate Change Mitigation and Adaptation', ''], ['Flood Mitigation and Coastal Risk', ''], ['Drought and Wildfire Mitigation', ''], ['Heritage', ''], ['Access and Engagement', '']]
  // for version B we want to start with the local priorities checked
  if (prototype.version === 'options-choice/v2/b') { // TODO make this ignore the version number
    prototype.filterLocal = [['Show only local priories', 'checked']]
  } else {
    prototype.filterLocal = [['Show only local priories', '']]
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

  // we have our final list - now we need to divide it into multiple categories
  console.log(req.session.data['import'])
  var data = req.session.data['import']
  console.log(jsonQuery('grants[*priority=Farmland birds]', {data: data}).key)

  var priorities = req.session.data['import'].priorities

  // lets loop through the list of priorities
  for(i = 0; i < priorities.length; i++) {
    console.log(priorities[i].name)
  }

  // we could generate a nested array to hold all the priority items

  const activePriorities = [] // lets store the checked options here
  for(i = 0; i < finalList.length; i++) {
    var prioritiesSet = grants[finalList[i]].priority.split(',').map(item => item.trim())
    // build an array of the land use filters selected
    var foundPriorities = findOne(prioritiesSet, activePriorities)
  }
  console.log("Found priorities: " + foundPriorities)






  // write back these values into the session data
  req.session.data['prototype'] = prototype

  // find the right version to render
  let version = req.session.data['prototype'].version
  return res.render(version + '/local-priorities', {
    'grantList': finalList
  })
})

// function to search arrays for matches against other arrays
var findOne = function (haystack, arr) {
  return arr.some(function (v) {
    return haystack.indexOf(v) >= 0
  })
}

module.exports = router

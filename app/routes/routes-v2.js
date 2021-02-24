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
  prototype.filterUse = [['Air quality', ''], ['Arable land', ''], ['Boundaries', ''], ['Coast', ''], ['Educational access', ''], ['Flood risk', ''], ['Grassland', ''], ['Historic environment', ''], ['Livestock management', ''], ['Organic land', ''], ['Pollinators and Wildlife', ''], ['Priority habitats', ''], ['Trees (non-woodland)', ''], ['Uplands', ''], ['Vegetation control', ''], ['Water quality', ''], ['Woodland', '']]
  prototype.filterPackage = [['Pollinators and Wildlife', ''], ['Improving Water Quality', ''], ['Air Quality', ''], ['Water Quality', ''], ['Climate Change Mitigation and Adaptation', ''], ['Flood Mitigation and Coastal Risk', ''], ['Drought and Wildfire Mitigation', ''], ['Heritage', ''], ['Access and Engagement', '']]
  // for version B we want to start with the local priorities checked
  if (prototype.version === 'options-choice/v2/b' || prototype.version === 'options-choice/v4/b') { // TODO make this ignore the version number
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
  // console.log(req.session.data['import'])
  var data = req.session.data['import']
  // console.log(jsonQuery('grants[*priority=Farmland birds]', {data: data}).key)

  // we need to take the data we need and re

  var priorities = req.session.data['import'].priorities

  // we could generate a nested array to hold all the priority items - nunjucts could easily use that to render the page
  // something like [ ['waders',[45,47,67]], ['Wet grassland', [2,4]], ['Farmland birds', []] ]
  const priorityList = [] // lets store the priority items here
  const finalPriorityList = [] // this is the array we'll pass back to nunjucts

  // first lets get the rows with items marked as priority using our prefiltered list
  const generatedPriorities = [] // lets store the priority items here
  for(i = 0; i < finalList.length; i++) {

    if (grants[finalList[i]].priority) { // json doesn't store blank items so it's easy to see if anything exists
      generatedPriorities.push(finalList[i])
    }
  }
  // we get an array of the grant items with something in the priority column
  console.log("Found these priority items: " + generatedPriorities + "\n")

  // lets go into each grant item and pull out the priority names into a nested array
  for(i = 0; i < generatedPriorities.length; i++) {
    var priortyItems = grants[generatedPriorities[i]].priority.split(',').map(item => item.trim())
    // build an array of the grant type filters selected
    let priorty = [generatedPriorities[i], priortyItems] // build an array of the plan items
    priorityList.push(priorty)
  }
  console.log("Our priorities list: " + priorityList)


  // lets loop through the list of priorities and look for matches against our shortlist
  for(i = 0; i < priorities.length; i++) {
    // we need to match the priority category name against each row in our priorityList

    //create an array to hold each line item that matches
    let priortyIndex = []

    // loop through our resultset and match the category name again any of the priorities for that item
    for(j = 0; j < priorityList.length; j++) {

      if (priorityList[j][1].includes(priorities[i].name)) {
        priortyIndex.push(priorityList[j][0])
        console.log("found one: " + priorities[i].name)
      }
      console.log("Found these in " + priorities[i].name + ": " + priortyIndex + "\n")
    }

    let priortyGrouping = [priorities[i].name, priortyIndex] // build an array of the plan items
    finalPriorityList.push(priortyGrouping)
  }

  // console.log("Final priority list: " + finalPriorityList)
  // write back these values into the session data
  req.session.data['prototype'] = prototype

  // find the right version to render
  let version = req.session.data['prototype'].version
  return res.render(version + '/local-priorities', {
    'grantList': finalList,
    'finalPriorityList': finalPriorityList
  })
})

// function to search arrays for matches against other arrays
var findOne = function (haystack, arr) {
  return arr.some(function (v) {
    return haystack.indexOf(v) >= 0
  })
}

module.exports = router

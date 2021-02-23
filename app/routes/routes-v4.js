const express = require('express')
const router = express.Router()
var jsonQuery = require('json-query')
var nunjucks  = require('nunjucks')
var env = nunjucks.configure()

// Create array of search results
router.get('/options-choice/v4/*/confirm', function (req, res) {
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

  var item = grants[grantNum];
  
  // we could generate a simple array to hold all the related items - nunjucts could easily use that to render the page
  // something like [5,47,67]
  const relatedList = [] // lets store the related items here
  const finalRelatedList = [] // lets store the filtered related items here

  /* Relationship */
  var relationship=[];
  if(item.hasOwnProperty('relationship')){
    // split into array
    var relationshipGrants = item.relationship.split(',').map(item => item.trim()); 
    var relationshipType = item.relationshipType; // r OR d
    if(relationshipType=='r')
    {
      relationshipType = 'The following are related';
    } else {
      relationshipType = 'The following are dependencies'
    }
    
    // loop array and grab the grantname from the main grants list
    for (rg =0; rg < relationshipGrants.length; rg++ ) {
      var rgCode = relationshipGrants[rg];

      //loop master grantlist and get grant name
      for(g=0; g < grants.length; g++) {
        if(grants[g].code == rgCode) {
          console.log('get name:'+ rgCode);
          relationship.push({'code' : rgCode, 'title' : grants[g].title, 'index' : g});
        }
      }
    }
  }

  /* End Relationship */

  if (grants[grantNum].packages) {
    var packages = grants[grantNum].packages.split(',').map(item => item.trim())
    // var uses = grants[grantNum].uses.split(',').map(item => item.trim())

    for (i = 0; i < grants.length; i++) {
      if (grants[i].packages) {
        var package_use = grants[i].packages.split(',').map(item => item.trim())
        // build an array of the land use filters selected
        var foundPackage = findOne(package_use, packages)
        if (foundPackage) {
          console.log("found: " + grants[i].code)
          relatedList.push(i)
        }
      }
    }

    const activeUses = prototype.filterUse // lets store the checked options here

    console.log(activeUses)

    // for (i = 0; i < relatedList.length; i++) {
    //   var grants_use = grants[i].use.split(',').map(item => item.trim())
    //   // build an array of the land use filters selected
    //   var foundUse = findOne(grants_use, uses)
    //   if (foundUse) {
    //     finalRelatedList.push(i)
    //   }
    // }
  }

  // if nothing relates create a fallback for the prototype to display
  if (relatedList.length === 0) {
    relatedList.push(0, 1, 2, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15)
  }

  // write back these values into the session data
  req.session.data['prototype'] = prototype

  // find the right version to render
  let version = req.session.data['prototype'].version
  return res.render(version + '/confirm', {
    'relatedList': relatedList,
    'finalRelatedList': finalRelatedList,
    'relationship' : relationship,
    'relationshipType' : relationshipType
  })
})
 

// TODO Add post option here for bulk adding options

// function to search arrays for matches against other arrays
var findOne = function (haystack, arr) {
  return arr.some(function (v) {
    return haystack.indexOf(v) >= 0
  })
}


// land use checkboxes
router.post('/options-choice/*/search', function (req, res) {
  var grants = req.session.data['import'].grants

  let grant = req.session.data.grantAutocomplete
  // get the grant code from the returned value
  grant2 = grant.substring(0,4).trim()
  // compare it to all the grants to find a match
  
  for (i = 0; i < grants.length; i++) {
    var grants_code = grants[i].code.trim()
    // build an array of the land use filters selected
    if (grant2 === grants_code) {
      console.log("VICTORY")
      grantNum = i
    }
  }
  res.redirect('grant-details?grant=' + grantNum)
})


module.exports = router

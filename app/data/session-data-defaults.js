/*

Provide default values for user session data. These are automatically added
via the `autoStoreData` middleware. Values will only be added to the
session if a value doesn't already exist. This may be useful for testing
journeys where users are returning or logging in to an existing application.

============================================================================

Example usage:

"full-name": "Sarah Philips",

"options-chosen": [ "foo", "bar" ]

============================================================================

*/

module.exports = {
  // add our data files here
  'dataFiles': [
    ['grants-full-ur16.json', 'UR16', 'Arable - combinable crops'],
    ['grants-full-ur15.json', 'UR15', 'Mixed with both arable -combinable crops, permanent pasture'],
    ['grants-full-ur14.json', 'UR14', '265 acres, permanent pasture and semi-natural ancient woodland'],
    ['grants-full-ur13.json', 'UR13', 'Small arable farm'],
    ['grants-full-ur12.json', 'UR12', '265 acres, permanent pasture and semi-natural ancient woodland'],
    ['grants-full-ur11.json', 'UR11', 'Mixed tenanted farm over 1000ac'],
    ['grants-full-ur10.json', 'UR10', 'Small arable farm'],
    ['grants-full-ur9.json', 'UR9', 'Arable combinable, sugar beet, potatoes, carrots'],
    ['grants-full-ur8.json', 'UR8', 'Upland mixed farm. Cattle, sheep all grass'],
    ['grants-full-ur7.json', 'UR7', 'Farms approx 1200 acres of arable land'],
    ['grants-full-ur6.json', 'UR6', 'Tenant farmer with mixed farming system.'],
    ['grants-full-ur5.json', 'UR5', 'Roughly 40,000 acres, with a mix of farming method'],
    ['grants-full-ur4.json', 'UR4', 'Mixed farm'],
    ['grants-full-ur3.json', 'UR3', 'Multiple environmental agreements on this farm'],
    ['grants-full-ur2.json', 'UR2', 'Upland farm. Mixed tenancies and lengths of tenure'],
    ['grants-full-ur1.json', 'UR1', 'Dairy Farmer and an Arable farmer']
  ]
}

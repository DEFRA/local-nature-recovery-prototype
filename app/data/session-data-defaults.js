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
    ['grants-full-ur15.json', 'UR15', 'Arable farmer'],
    ['grants-full-ur14.json', 'UR14', 'Arable farmer'],
    ['grants-full-ur13.json', 'UR13', 'Arable farmer'],
    ['grants-full-ur12.json', 'UR12', 'Arable farmer'],
    ['grants-full-ur11.json', 'UR11', 'Arable farmer'],
    ['grants-full-ur10.json', 'UR10', 'Arable farmer'],
    ['grants-full-ur9.json', 'UR9', 'Arable farmer'],
    ['grants-full-ur8.json', 'UR8', 'Arable farmer'],
    ['grants-full-ur7.json', 'UR7', 'Arable farmer'],
    ['grants-full-ur6.json', 'UR6', 'Arable farmer'],
    ['grants-full-ur5.json', 'UR5', 'Arable farmer'],
    ['grants-full-ur4.json', 'UR4', 'Arable farmer'],
    ['grants-full-ur3.json', 'UR3', 'Arable farmer'],
    ['grants-full-ur2.json', 'UR2', 'Arable farmer'],
    ['grants-full-ur1.json', 'UR1', 'Arable farmer']
  ]
}

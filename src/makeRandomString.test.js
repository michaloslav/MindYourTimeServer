const makeRandomString = require('./makeRandomString')
const rand = require('./testingUtil/rand')

test("makeRandomString returns the correct length", () => {
  // contains objects with properties length and result
  let testResults = []

  // add 5 objects to the array with random length properties
  for(let i = 0; i < 5; i++) testResults.push({length: rand(100)})

  // generate the results
  testResults.forEach(obj => obj.result = makeRandomString(obj.length))

  // check the result length
  testResults.forEach(obj => {
    expect(obj.result.length).toBe(obj.length)
  })
})

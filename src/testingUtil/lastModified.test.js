const timeStrings = require('./timeStrings')
const {projectLastModified, defaultProjectLastModified} = require('./lastModified')

test("projectLastModified testing util function", () => {
  const timeStr = timeStrings[0]
  const expectedObj = {
    id: timeStr, name: timeStr, color: timeStr, state: timeStr,
    estimatedDuration: timeStr, plannedTime: timeStr
  }

  expect(projectLastModified(0)).toEqual(expectedObj)
})

test("projectLastModified testing util function", () => {
  const timeStr = timeStrings[0]
  const expectedObj = {
    id: timeStr, name: timeStr, color: timeStr, state: timeStr,
    estimatedDuration: timeStr, days: timeStr
  }

  expect(defaultProjectLastModified(0)).toEqual(expectedObj)
})

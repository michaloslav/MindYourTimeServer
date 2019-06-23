const randTimeObject = require('./randTimeObject')

test("randTimeObject testing util function", () => {
  // create 5 random TimeObjects
  let arr = []
  for(let i = 0; i < 5; i++) arr.push(randTimeObject())

  arr.forEach(obj => {
    expect(obj.h).toBeGreaterThanOrEqual(0)
    expect(obj.h).toBeLessThan(12)
    expect(obj.m).toBeGreaterThanOrEqual(0)
    expect(obj.m).toBeLessThan(60)
    expect(typeof obj.pm).toBe("boolean")
  })
})

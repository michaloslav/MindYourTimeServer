const project = require('./project')

test("project testing util function", () => {
  const proj = project(123456789)

  expect(proj.id).toBe(123456789)
  expect(proj.name).toBe("123456789")
  expect(proj).toHaveProperty("color")
  expect(proj.estimatedDuration).toBeGreaterThanOrEqual(0)
  expect(proj).toHaveProperty("state")
  expect(proj.plannedTime).toHaveProperty("start")
  expect(proj.plannedTime).toHaveProperty("end")
})

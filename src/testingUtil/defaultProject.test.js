const defaultProject = require('./defaultProject')

test("defaultProject testing util", () => {
  const proj = defaultProject(123456789)

  expect(proj.id).toBe(123456789)
  expect(proj.name).toBe("123456789")
  expect(proj).toHaveProperty("color")
  expect(proj.estimatedDuration).toBeGreaterThanOrEqual(0)
  expect(proj).toHaveProperty("state")
  expect(proj).toHaveProperty("days")
  expect(proj.days.length).toBe(7)
  expect(typeof proj.days[0]).toBe("boolean")
})

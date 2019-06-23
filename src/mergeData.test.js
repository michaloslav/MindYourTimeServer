const mergeData = require('./mergeData')
const project = require('./testingUtil/project')
const defaultProject = require('./testingUtil/defaultProject')
const {projectLastModified, defaultProjectLastModified} = require('./testingUtil/lastModified')
const timeStrings = require('./testingUtil/timeStrings')

test("A project was added", () => {
  const dbData = {
    projects: [
      project(159)
    ],
    lastModified: {
      projects:{
        159: projectLastModified(0)
      }
    },
    lastReset: "2019-06-13T18:25:35.308Z"
  }

  const localData = {
    projects: [
      ...dbData.projects,
      project(753)
    ],
    lastModified: {
      projects: {
        ...dbData.lastModified.projects,
        753: projectLastModified(1)
      }
    },
    lastReset: dbData.lastReset
  }

  const {lastReset, ...modifiedData} = localData

  const expectedData = {mergedData: localData, modifiedData}

  expect(mergeData(dbData, localData)).toEqual(expectedData)
})

test("A project property was modified", () => {
  const proj1 = project(123)
  const proj2 = project(456)
  const lastModified1 = projectLastModified(1)
  const lastModified2 = projectLastModified(1)

  const dbData = {
    projects: [proj1, proj2],
    lastModified: {
      projects: {123: lastModified1, 456: lastModified2}
    },
    lastReset: timeStrings[0]
  }

  const localData = {
    projects: [
      proj1,
      {...proj2, name: "new 456"}
    ],
    lastModified: {
      projects: {
        123: lastModified1,
        456: {...lastModified2, name: timeStrings[2]}
      }
    },
    lastReset: timeStrings[0]
  }

  const {projects, lastModified} = localData
  const modifiedData = {projects, lastModified}

  const expectedData = {mergedData: localData, modifiedData}

  expect(mergeData(dbData, localData)).toEqual(expectedData)

})

test("A project was deleted", () => {
  const proj1 = project(123)
  const proj2 = project(456)
  const lastModified1 = projectLastModified(1)
  const lastModified2 = projectLastModified(1)

  const dbData = {
    projects: [proj1, proj2],
    lastModified: {
      projects: {123: lastModified1, 456: lastModified2}
    },
    lastReset: timeStrings[0]
  }

  const localData = {
    projects: [
      proj1
    ],
    lastModified: {
      projects: {
        123: lastModified1,
        456: {id: timeStrings[2]}
      }
    },
    lastReset: timeStrings[0]
  }

  const {projects, lastModified} = localData
  const modifiedData = {projects, lastModified}

  const expectedData = {mergedData: localData, modifiedData}

  expect(mergeData(dbData, localData)).toEqual(expectedData)

})

test("Merge data from a device that was offline when a reset occured on it", () => {
  const dbData = {
    projects: [project(123), project(456)],
    lastModified: {
      projects: {
        123: projectLastModified(0),
        456: projectLastModified(0)
      }
    },
    lastReset: "2019-06-13T10:25:35.308Z"
  }

  const localData = {
    projects: [project(789)],
    lastModified: {
      projects: {
        789: projectLastModified(1)
      }
    },
    lastReset: "2019-06-14T10:25:35.308Z"
  }

  const expectedData = {mergedData: localData, modifiedData: localData}

  expect(mergeData(dbData, localData)).toEqual(expectedData)
})

test("A reset happened while online", () => {
  const defProj1 = defaultProject(111)
  const defProj2 = defaultProject(444)
  const defProj3 = defaultProject(777)
  const proj1 = project(123)
  const proj2 = project(456)
  const proj3 = project(789)
  const proj4 = project(159)

  const dbData = {
    projects: [proj1, proj2],
    defaultProjects: [defProj1, defProj3],
    lastModified: {
      projects: {
        123: projectLastModified(1),
        456: projectLastModified(1)
      },
      defaultProjects: {
        111: defaultProjectLastModified(0),
        444: defaultProjectLastModified(0)
      }
    },
    lastReset: timeStrings[2]
  }

  const localData = {
    projects: [proj4, proj3],
    defaultProjects: [defProj1, defProj3],
    lastModified: {
      projects: {
        159: projectLastModified(3),
        789: projectLastModified(3)
      },
      defaultProjects: {
        111: defaultProjectLastModified(0),
        444: defaultProjectLastModified(0)
      }
    },
    lastReset: timeStrings[3]
  }

  const {defaultProjects, ...modifiedData} = localData

  const expectedData = {mergedData: localData, modifiedData}

  expect(mergeData(dbData, localData).mergedData).toEqual(expectedData.mergedData)
  expect(mergeData(dbData, localData).modifiedData).toEqual(expectedData.modifiedData)
})

var test = require('tape')
var dataFormat = require('../index')()

test('format an array of objects', function (t) {
  var data = require('./fixture.json')

  var formatted = dataFormat.format(data, {
    coordinateKeys: {
      latitude: 'latitude',
      longitude: 'longitude'
    }
  })

  var keys = Object.keys(formatted.properties)
  t.equal(keys.length, 9)
  t.equal(formatted.data.length, 8)

  formatted.data.forEach(function (item) {
    t.ok(item.key)
    t.ok(item.value)
    t.ok(item.geometry)
    t.ok(item.geometry.coordinates)
  })

  t.end()
})

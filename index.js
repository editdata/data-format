var validator = require('is-my-json-valid')
var extend = require('extend')
var type = require('type-of')
var isgeojson = require('is-geojson')
var cuid = require('cuid')

function findProperty (props, id) {
  var name = id.name ? id.name : id
  var propkey = id.key ? id.key : id

  for (var key in props) {
    var nameMatch = props[key].name === name
    var keyMatch = props[key].key === propkey
    if (nameMatch || keyMatch) return props[key]
  }
}

function createProperty (key, value, keyPrefix) {
  return {
    key: (keyPrefix || '') + cuid(),
    name: key,
    type: initType(value),
    default: null
  }
}

function createProperties (obj, keyPrefix) {
  var props = {}
  var keys = Object.keys(obj)
  var l = keys.length
  var i = 0

  for (i; i < l; i++) {
    var key = keys[i]
    var value = obj[key]
    var prop = createProperties(key, value, keyPrefix)
    props[prop.key] = prop
  }

  return props
}

function updateProperty (props, id, options) {
  var prop = findProperty(props, id)
  prop = extend(prop, options)
  props[prop.key] = prop
  return prop
}

function removeProperty (props, id) {
  var prop = findProperty(props, id)
  delete props[prop.key]
}

function validateProperty (props, prop, value) {
  if (typeof prop === 'string') {
    prop = findProperty(props, prop)
    if (!prop) return new Error('Property not found')
  }
  if (!prop) return new Error('Property, property key, or property name required as second argument')
  var validate = validator(props[prop.key])
  return validate(value)
}

function convertToKeys (props, row) {
  var data = {}
  var prop

  Object.keys(row).forEach(function (key) {
    prop = findProperty(props, key)

    if (!prop) {
      prop = createProperty(key, row[key])
    }

    if (!props[prop.key]) {
      props[prop.key] = prop
    }

    data[prop.key] = row[key]
  })
  return data
}

function convertToNames (props, row) {
  var data = {}
  var prop

  Object.keys(row).forEach(function (key) {
    prop = findProperty(props, key)

    if (!prop) {
      prop = createProperty(key, row[key])
    }

    data[prop.name] = row[key]
  })
  return data
}

function convert (props, row, options) {
  options = options || {}
  if (options.to === 'names') {
    return convertToNames(props, row)
  } else {
    return convertToKeys(props, row)
  }
}

function initType (value) {
  return [type(value), 'null']
}

function getType (props, key) {
  return props[key].type[0]
}

function isType (prop, checkType) {
  prop.type.some(function (type) {
    return type === checkType
  })
}

function toGeoJSON (data, properties, options) {
  if (data.data && data.properties) {
    options = properties
    properties = data.properties
    data = data.data
  }

  options = options || {}
  var features = []

  data.forEach(function (item, i) {
    features[i] = {}
    features[i].type = 'Feature'
    features[i].id = item.key
    features[i].geometry = item.geometry
    if (!options.convertToNames) {
      features[i].properties = item.value
    } else {
      features[i].properties = convertToNames(properties, item.value)
    }
  })

  return features
}

function format (data, options) {
  if (type(data) !== 'array') {
    return new Error('data format is invalid. an array of objects is required')
  }

  options = options || {}
  options.key = options.key || 'key'
  options.value = options.value || 'value'

  var results = {
    properties: {},
    data: []
  }

  var l = data.length
  var i = 0

  for (i; i < l; i++) {
    var item = data[i]
    formatRow(item, results, options)
  }

  return results
}

function formatRow (item, results, options) {
  results = results || {}
  results.data = results.data || []
  results.properties = results.properties || {}

  var formatted = {
    key: null,
    value: {},
    geometry: {}
  }

  if (isgeojson(item) && item.id && item.properties && item.geometry) {
    formatted.key = item.id
    formatted.value = item.properties
    formatted.geometry = item.geometry
  } else if (type(item) === 'object') {
    formatted.key = item[options.key] || item.id || 'row-' + cuid()
    formatted.value = item[options.value] || item.properties || item

    if (options.coordinateKeys) {
      formatted.geometry = { type: 'Point', 'coordinates': [] }

      if (options.coordinateKeys.array) {
        formatted.geometry.coordinates = item[options.coordinateKeys.array]
      } else if (options.coordinateKeys.latitude && options.coordinateKeys.longitude) {
        formatted.geometry.coordinates[0] = item[options.coordinateKeys.longitude]
        formatted.geometry.coordinates[1] = item[options.coordinateKeys.latitude]
      }
    } else {
      Object.keys(formatted.value).forEach(function (key) {
        if (key === 'lon' || key === 'long' || key === 'longitude') {
          formatted.geometry.coordinates[0] = formatted.value[key]
        } else if (key === 'lat' || key === 'latitude') {
          formatted.geometry.coordinates[1] = formatted.value[key]
        }
      })
    }
  }

  formatted.value = convert(results.properties, formatted.value)
  results.data.push(formatted)
  return results
}

module.exports = format
module.exports.format = format
module.exports.formatRow = formatRow
module.exports.findProperty = findProperty
module.exports.createProperty = createProperty
module.exports.updateProperty = updateProperty
module.exports.removeProperty = removeProperty
module.exports.validateProperty = validateProperty
module.exports.convertToNames = convertToNames
module.exports.convertToKeys = convertToKeys
module.exports.convert = convert
module.exports.getType = getType
module.exports.isType = isType
module.exports.toGeoJSON = toGeoJSON

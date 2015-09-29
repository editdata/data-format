var validator = require('is-my-json-valid')
var extend = require('extend')
var type = require('type-of')
var isgeojson = require('is-geojson')
var cuid = require('cuid')

module.exports = function dataType (options) {
  options = options || {}
  var keyFormat = options.keyFormat || 'property-'

  function findProperty (props, id) {
    var name = id.name ? id.name : id
    var propkey = id.key ? id.key : id

    for (var key in props) {
      var nameMatch = props[key].name === name
      var keyMatch = props[key].key === propkey
      if (nameMatch || keyMatch) return props[key]
    }
  }

  function createProperty (key, value) {
    return {
      key: keyFormat + cuid(),
      name: key,
      type: getType(value),
      default: null
    }
  }

  function updateProperty (props, id, options) {
    var prop = findProperty(props, id)
    prop = extend(prop, options)
    props[prop.key] = prop
    return prop
  }

  function removeProperty (props, id) {
    var prop = findProperty(id)
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

  function getType (value) {
    return [type(value), 'null']
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
    options = options || {}
    options.key = options.key || 'key'
    options.value = options.value || 'value'

    var results = {
      properties: {},
      data: []
    }

    if (type(data) === 'array') {
      data.forEach(function (item) {
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
          }
        } else {
          return new Error('data format is invalid. an array of objects is required')
        }

        formatted.value = convert(results.properties, formatted.value)
        results.data.push(formatted)
      })
    } else {
      return new Error('data format is invalid. an array of objects is required')
    }

    return results
  }

  return {
    format: format,
    findProperty: findProperty,
    createProperty: createProperty,
    updateProperty: updateProperty,
    removeProperty: removeProperty,
    validateProperty: validateProperty,
    convertToNames: convertToNames,
    convertToKeys: convertToKeys,
    convert: convert,
    getType: getType,
    toGeoJSON: toGeoJSON
  }
}

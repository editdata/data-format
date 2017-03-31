# data-format

Format data for use in [data-editor](https://github.com/editdata/data-editor) and other [data-ui](https://github.com/editdata/data-ui) tools.

[![npm](https://img.shields.io/npm/v/data-format.svg)](http://npmjs.com/data-format)

## Install

```
npm i --save data-format
```

## Usage

```
var dataFormat = require('data-format')
var formatted = dataFormat(arrayOfObjects)
```

## API

### `var dataFormat = require('data-format')`

### `dataFormat(data, [options])`

Accepts array of objects. Objects might be plain tabular data or geojson features.

#### `options`
- `coordinateKeys` - `object`
  - if coordinates are stored as array: `{ array: 'key-of-coordinates-array' }`
  - if coordinates are stored as lat/long: `{ latitude: 'latitude-key', longitude: 'longitude-key' }`

### `dataFormat.findProperty(properties, id)`

### `dataFormat.createProperty(key, value)`

### `dataFormat.updateProperty(properties, id, options)`

### `dataFormat.removeProperty(properties, id)`

### `dataFormat.validateProperty(properties, id, value)`

### `dataFormat.convert(props, row, options)`

### `dataFormat.convertToNames(props, row)`

### `dataFormat.convertToKeys(props, row)`

### `dataFormat.getType(value)`

### `dataFormat.toGeoJSON(data, properties[, options])`

## License
[MIT](LICENSE.md)

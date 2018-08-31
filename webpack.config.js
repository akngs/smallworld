const path = require('path')

module.exports = {
  entry: './js/index.js',
  output: {
    path: path.resolve(__dirname, 'docs'),
    filename: 'bundle.js',
    library: 'sw',
    libraryTarget: 'window'
  },
  externals: {
    d3: 'd3'
  }
}

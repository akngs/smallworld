const path = require('path')

module.exports = {
  entry: './js/index.ts',
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'docs'),
    filename: 'bundle.js',
    library: 'sw',
    libraryTarget: 'window'
  },
  externals: {
    d3: 'd3',
    jsnetworkx: 'jsnetworkx'
  }
}

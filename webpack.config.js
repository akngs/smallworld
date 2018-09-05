const path = require('path')

module.exports = {
  entry: './js/index.js',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
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

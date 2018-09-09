const path = require('path')

module.exports = {
  entry: ['@babel/polyfill', './js/index.ts'],
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
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

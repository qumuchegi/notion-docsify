const path = require('path')
// const CopyAssets = require('copy-webpack-plugin')

module.exports = {
  target: 'node',
  mode: 'development',
  context: path.resolve(__dirname, 'scripts'),
  entry: '/index.mjs',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build')
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader'
          }
        ],
        exclude: /node_modules/
      },
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  }
}
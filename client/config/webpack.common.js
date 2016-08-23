var Webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var AssetsPlugin = require('assets-webpack-plugin');
var Helpers = require('./helpers');

module.exports = {
	entry: {
		'polyfill': './src/polyfill.ts',
		'vendor': './src/vendor.ts',
		'app': './src/main.ts'
	},

	resolve: {
		extensions: ['', '.js', '.ts', '.scss', '.css']
	},

	module: {
		loaders: [
			{
				test: /\.ts$/,
				loader: 'ts-loader'
			},
			{
				test: /\.html$/,
				loader: 'html'
			},
			{
				test: /\.scss$/,
				exclude: /node_modules/,
				loaders: ['raw-loader' ,'sass-loader?sourceMap'/*, 'autoprefixer'*/]
			},
			{
				test: /\.((woff2?|svg|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9]))$/, // Font-Awesome.
				loader: 'file?name=files/[name].[hash].[ext]'
			},
			{
				test: /\.(png|jpe?g|gif|svg|woff2?|ttf|eot|ico)$/,
				loader: 'file?name=files/[name].[hash].[ext]'
			},
			{
				test: /\.css$/,
				exclude: Helpers.root('src', 'app'),
				loader: ExtractTextPlugin.extract('style', 'css?sourceMap')
			},
			{
				test: /\.css$/,
				include: Helpers.root('src', 'app'),
				loader: 'raw'
			}
		]
	},

	plugins: [
		new Webpack.optimize.CommonsChunkPlugin({
			name: ['app', 'vendor', 'polyfill']
		}),
		(()=>{
			let dir = Helpers.root('dist');
			return new AssetsPlugin({
				path: dir,
				prettyPrint: true,
				filename: 'webpack-assets.json'
			});
		})()
	]
};

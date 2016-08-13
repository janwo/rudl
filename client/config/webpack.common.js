var Webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var AssetsPlugin = require('assets-webpack-plugin');
var Helpers = require('./helpers');

module.exports = {
	entry: {
		'polyfills': './src/polyfills.ts',
		'vendor': './src/vendor.ts',
		'app': './src/main.ts'
	},

	resolve: {
		extensions: ['', '.js', '.ts']
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
				loaders: ['raw-loader' ,'sass-loader?sourceMap']
			},
			{
				test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
				loader: 'file?name=assets/[name].[hash].[ext]'
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
			name: ['app', 'vendor', 'polyfills']
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

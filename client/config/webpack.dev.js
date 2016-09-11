var webpackMerge = require( 'webpack-merge' );
var ExtractTextPlugin = require( 'extract-text-webpack-plugin' );
var commonConfig = require( './webpack.common.js' );
var Helpers = require( './helpers' );

module.exports = webpackMerge( commonConfig, {
	devtool: 'cheap-module-eval-source-map',
	
	output: {
		path: Helpers.root( 'dist/assets' ),
		publicPath: 'http://localhost:8079/assets/',
		filename: '[name].js',
		chunkFilename: '[id].chunk.js'
	},
	
	plugins: [
		new ExtractTextPlugin( '[name].css' )
	],
	
	devServer: {
		historyApiFallback: true,
		stats: 'minimal',
		proxy: {
			'**': {
				target: 'http://localhost:3000',
				secure: false
			}
		}
	}
} );

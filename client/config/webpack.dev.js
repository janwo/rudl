let webpackMerge = require( 'webpack-merge' );
let ExtractTextPlugin = require( 'extract-text-webpack-plugin' );
let commonConfig = require( './webpack.common.js' );
let Helpers = require( './helpers' );

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

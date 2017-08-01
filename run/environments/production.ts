import * as Webpack from 'webpack';
import * as ExtractTextPlugin from 'extract-text-webpack-plugin';
import {AotPlugin} from '@ngtools/webpack';
import {root} from '../config';

export default {
	name: 'rudl - Production Environment',
	frontend: {
		webpack: {
			config: [
				(Config: any) => {
					return {
						module: {
							rules: [
								{
									test: /\.ts$/,
									use: '@ngtools/webpack'
								}
							]
						},
						plugins: [
							new AotPlugin({
								tsConfigPath: root('client/tsconfig.json'),
								i18nFile: root(`client/locale/messages.${'de'}.xlf`),
								locale: 'de'
							}),
							new Webpack.optimize.UglifyJsPlugin({
								compress: {
									warnings: false
								},
								comments: false,
								sourceMap: false
							}),
							new Webpack.NoEmitOnErrorsPlugin(),
							new ExtractTextPlugin('[name].[hash].css')
						]
					};
				}
			]
		}
	},
	backend: {
		excludeRoutes: [
			'test-routes'
		],
		log: {
			file: {
				enabled: true
			}
		}
	}
};

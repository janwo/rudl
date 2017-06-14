import * as ExtractTextPlugin from 'extract-text-webpack-plugin';

export default {
	name: 'rudl - Test Environment',
	debug: true,
	frontend: {
		webpack: {
			config: [
				(Config: any) => {
					return {
						devtool: 'inline-source-map',
						module: {
							rules: [
								{
									test: /\.ts$/,
									use: [
										'awesome-typescript-loader?tsconfig=client/tsconfig.json',
										'angular2-template-loader'
									]
								}
							]
						},
						plugins: [
							new ExtractTextPlugin('[name].css')
						]
					};
				}
			]
		}
	}
};

export default {
	name: 'rudl - Local Environment',
	frontend: {
		webpack: {
			config: [
				( Config ) => {
					return {
						devtool: 'cheap-module-source-map',
					}
				}
			]
		},
	},
	backend: {
		host: 'your host (forces overwriting)',
		port: process.env.BACKEND_SERVER_PORT || 'your port (if no corresponding ENV is set)',
	}
};

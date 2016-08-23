// Usage: `{{{hookAssets assets}}}`
// Hooks all assets

const headExtensions = [
	'css'
];

module.exports = function (assets, isHead = true) {
	let out = '';
	for(let type in assets) {
		// Exclude?
		let isHeadExtension = headExtensions.indexOf(type) > -1;
		if(isHead !== isHeadExtension) continue;

		out += `<!-- ${type} -->\n`;
		assets[type].forEach(path => {
;			switch(type) {
				case 'js':
					out += `<script src="${path}"></script>\n`;
					return;

				case 'css':
					out += `<link rel="stylesheet" type="text/css" href="${path}"/>\n`;
					return;
			}
		});
	}
	return out;
};

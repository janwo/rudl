// Usage: `{{{hookMeta metas}}}`
// Hooks custom meta

module.exports = function (metas) {
	let out = '';
	for (let metaName in metas) out += `<meta name="${metaName}" content="${metas[metaName]}">\n`;
	return out;
};

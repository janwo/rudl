// Usage: `{{{hookAssets assets}}}`
// Hooks all assets
module.exports = function (assets) {
    let out = '';
    for (let type in assets) {
        out = `<!-- ${type} -->\n`;
        assets[type].forEach(path => {
            switch (type) {
                case 'js':
                    out += `<script src="${path}"></script>\n`;
                    break;
            }
        });
    }
    return out;
};
//# sourceMappingURL=hookAssets.js.map
var Path = require('path');
var _root = Path.resolve(__dirname, '..');
exports.root = function(args) {
	args = Array.prototype.slice.call(arguments, 0);
	return Path.join.apply(Path, [_root].concat(args));
};

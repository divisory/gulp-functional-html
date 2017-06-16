var generateForExpression = fs = require('./ParseFor');


module.exports = function(html){

	html = generateForExpression(html);

	return html;

}
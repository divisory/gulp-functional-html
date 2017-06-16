var matches = {
	// forExp: /^(.*?)<for[^>]*>([\s\S]*?)<\/for>(?![\s\S]*<\/for>[\s\S]*$)/gim,
	// forExp: /(?:^(\t)<for[^>]*>([\s\S]*?)^(\t)<\/for>|^(\t\t)<for[^>]*>([\s\S]*?)^(\t\t)<\/for>|^(\t\t\t)<for[^>]*>([\s\S]*?)^(\t\t\t)<\/for>|^(\t\t\t\t)<for[^>]*>([\s\S]*?)^(\t\t\t\t)<\/for>|^(\t\t\t\t\t)<for[^>]*>([\s\S]*?)^(\t\t\t\t\t)<\/for>|^(\t\t\t\t\t\t)<for[^>]*>([\s\S]*?)^(\t\t\t\t\t\t)<\/for>)/gim,
	forOpen: /^(.*?)<for[^>]*>(.*?)(\n|\r)/gi,
	forInside: /<for[^>]*>/gim,
	forClose: /(\n|\r)(.*?)<\/for>(?![\s\S]*<\/for>[\s\S]*$)/gi,
	expression: /expression="(.*?)"/gim,
	data: /data="([\s\S])"*[^"]*/gim,
	startTab: /^\t{1}/gim
}

function parseForExpression(str){
	var exp 			= str.replace(/(expression\=|\"|\')/gim, '')
	var parts 		= exp.split(';');

	var options = {
		variable: 	parts[0].replace(/( |\s|\=|[0-9])/gim, ''), 	/*i*/
		value: 			parseInt(parts[0].replace(/[^\/\d]/gim, '')), /*0*/
		target: 		parseInt(parts[1].replace(/[^\/\d]/gim, '')), /*10*/
		operator: 	parts[1].match(/(>\=|<\=|<|>)/gim)[0], 				/*>*/
		iterator: 	parts[2].replace(/(\$|[a-zA-Z]| |\s)/gim, '') /*++*/
	};
	return options;
}

function parseData(str){
	var data = null;
	if (str.match(matches.data)){
		data = str.match(matches.data)[0].replace(/^data="/,'').replace(/\'/gim, '"');
		data = JSON.parse(data);
	}
	return data;
}

function escapeSpecialChars(str){
	return str
		.replace(/\=/gim, '\\=')
		.replace(/\$/gim, '\\$')
		.replace(/\+/gim, '\\+')
		.replace(/\[/gim, '\\[')
		.replace(/\]/gim, '\\]')
		.replace(/\?/gim, '\\?')
		.replace(/\:/gim, '\\:');
}

function evaluateTemplate(str, options, data){
	ev = new RegExp('\{\{(.*?)\}\}', 'gim');
	var variable	= options.variable || '',
			value			= options.value || '',
			target		= options.target || '',
			operator	= options.operator || '',
			iterator	= options.iterator || ''
			data = data;
			console.log(data)
	return str.replace(ev, function (a, b) {
		return b.match(/\$/gim) ? b : eval(b);
	})
}

function parseTemplate(str, options, counter, isNotLast){
	return str.replace(
		new RegExp(options.variable.replace(/\$/gim, '\\$'), 'gim'),
		counter
	) + (isNotLast ? '\n' : '');
}

function checkLastItem(counter, options){
	return (
		options.iterator === '++' ? (
			options.operator === '<' ? counter < options.target-1 :
			counter <= options.target-1
		) : (
			options.operator === '>' ? counter-1 > options.target :
			counter-1 >= options.target
		)
	);
}



/*
	parsing different tags
*/

function ParseFor(html, foundedDirectives){

	// each founded
	for (var i = foundedDirectives.length - 1; i >= 0; i--) {

		var current 	= foundedDirectives[i];

		var options = parseForExpression(current.match(matches.expression)[0]);
		var data = parseData(current);

		var template = current
				.replace(matches.forOpen, '')
				.replace(matches.forClose, '')
				.replace(matches.startTab, '');

		var result = '';

		for (var counter = options.value; eval("counter "+options.operator+" "+options.target); eval("counter"+options.iterator)){
			var isNotLast = checkLastItem(counter, options);
			var resultTemplate = parseTemplate(template, options, counter, isNotLast);
			resultTemplate = evaluateTemplate(resultTemplate, options, data);
			result += resultTemplate;
		}

		replaceRegExp = new RegExp(escapeSpecialChars(current), "gim");

		html = html.replace(replaceRegExp, result);
	};
	return html;
}

function reg(i){
	tab = function(){
		str = '';
		var _i = 0;
		while (_i < i){
			str += '\\t';
			_i++;
		}
		return str;
	}
	return new RegExp('(?:^('+tab(i)+')<for[^>]*>([\\s\\S]*?)^('+tab(i)+')<\/for>)', 'gim');
}

function generateForExpression(html){
	var i = 0;
	while (i < 10){
		i++;
		if (html.match(reg(i))){
			html = ParseFor(html, html.match(reg(i)));
			return generateForExpression(html);
		}
	}
	return html;
}


module.exports = generateForExpression;
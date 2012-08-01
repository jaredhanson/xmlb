/**
 * Module dependencies.
 */
var fs = require('fs')
  , builder = require('xmlbuilder');


/**
 * Render an XML builder file at the given `path` and callback `fn(err, str)`.
 *
 * @param {String} path
 * @param {Object|Function} options or callback
 * @param {Function} fn
 * @api public
 */
function renderFile(path, options, fn) {
  var key = path + ':string';
  
  if ('function' == typeof options) {
    fn = options, options = {};
  }
  
  try {
    options.filename = path;
    var str = options.cache
      ? exports.cache[key] || (exports.cache[key] = fs.readFileSync(path, 'utf8'))
      : fs.readFileSync(path, 'utf8');
    exports.render(str, options, fn);
  } catch (err) {
    fn(err);
  }
}


/**
 * Export `renderFile` as module function.
 *
 * @api public
 */
exports = module.exports = renderFile;

/**
 * Template function cache.
 */
exports.cache = {};


/**
 * Factory function to create new `XMLBuilder`.
 *
 * @return {xmlbuilder.XMLBuilder}
 * @api private
 */
function factory() {
  return builder.create();
}

/**
 * Parse the given `str` of XML builder and return a function body.
 *
 * @param {String} str
 * @param {Object} options
 * @return {String}
 * @api private
 */
function parse(str, options) {
  var doc = options.document || 'xml'
    , pretty = options.pretty || false
    , js = str;
  
  return ''
    + 'var ' + doc + ' = factory();\n'
    + (options.self
      ? 'var self = locals || {};\n' + js
      : 'with (locals || {}) {\n' + js + '\n}\n')
    + 'return ' + doc + '.toString({ pretty: ' + pretty + ' })';
}

/**
 * Re-throw the given `err` in context to the `str` of XML builder, `filename`,
 * and `lineno`.
 *
 * @param {Error} err
 * @param {String} str
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */
function rethrow(err, str, filename, lineno) {
  var context = 3
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);
  
  // NOTE: Due to the fact that this "template" is not being parsed line by
  //       line, `lineno` here is always 1.  If there is an elegant apprach to
  //       determining the offending line, it is TBD; despite this, the error is
  //       made more useful by including the context and filename.
  
  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? ' >> ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');
  
  // Alter exception message
  err.path = filename;
  err.message = (filename || 'xmlb') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
}

/**
 * Compile a `Function` representation of the given XML builder `str`.
 *
 * Options:
 *
 *   - `compileDebug` when `false` debugging code is stripped from the compiled template
 *
 * @param {String} str
 * @param {Options} options
 * @return {Function}
 * @api public
 */
exports.compile = function(str, options) {
  options = options || {};
  
  var input = JSON.stringify(str)
    , filename = options.filename
      ? JSON.stringify(options.filename)
      : 'undefined'
    , fn;
  
  if (options.compileDebug !== false) {
    fn = [
        'var __stack = { lineno: 1, input: ' + input + ', filename: ' + filename + ' };'
      , 'try {'
      , parse(str, options)
      , '} catch (err) {'
      , '  rethrow(err, __stack.input, __stack.filename, __stack.lineno);'
      , '}'
    ].join('\n');
  } else {
    fn = parse(str, options);
  }
  
  fn = new Function('locals, rethrow, factory', fn);
  return function(locals) {
    return fn(locals, rethrow, factory);
  };
}

/**
 * Render the given `str` of XML builder and invoke the callback `fn(err, str)`.
 *
 * Options:
 *
 *   - `cache`    enable template caching
 *   - `filename` filename required for caching
 *
 * @param {String} str
 * @param {Object|Function} options or fn
 * @param {Function} fn
 * @api public
 */
exports.render = function(str, options, fn) {
  if ('function' == typeof options) {
    fn = options, options = {};
  }

  // cache requires .filename
  if (options.cache && !options.filename) {
    return fn(new Error('the "filename" option is required for caching'));
  }
  
  try {
    var path = options.filename;
    var tmpl = options.cache
      ? exports.cache[path] || (exports.cache[path] = exports.compile(str, options))
      : exports.compile(str, options);
    fn(null, tmpl(options));
  } catch (err) {
    fn(err);
  }
}


/**
 * Express support.
 */
exports.__express = renderFile;

/*global Arenite:true*/
/*jshint evil:true*/
// Utility function to interpret the annotations.
Arenite.AnnotationProcessor = function (arenite) {
  var _processAnnotations = function (text) {
    var regex = /@arenite-instance\s+["']([^"']+)["']\s*(.*);\s*(@arenite-init\s+["']([^"']+)["']\s*(.*);)*\s*(@arenite-start\s+["']([^"']+)["']\s*(.*);)*\s*\*\/\s*([\w.]+)/g;
    var match;
    while ((match = regex.exec(text))) {
      _processAnnotation(match);
    }
  };

  var _processArgAnnotation = function (match) {
    var args = [];
    var split = match.split(',');
    split.forEach(function (arg) {
      var argPair = arg.split(":");
      var argObj = {};
      argObj[argPair[0].trim()] = argPair[0].trim() === 'ref' ? argPair[1].trim() : eval(argPair[1].trim());
      args.push(argObj);
    });
    return args;
  };

  var _processAnnotation = function (match) {
    var instanceName = match[1];
    var namespace = match[9];

    if (!arenite.config.context) {
      arenite.config.context = {instances: {}};
    }

    //instance
    arenite.config.context.instances[instanceName] = {namespace: namespace};
    if (match[2]) {
      arenite.config.context.instances[instanceName].args = _processArgAnnotation(match[2]);
    }

    // init
    if (match[4]) {
      arenite.config.context.instances[instanceName].init = {func: match[4]};
      if (match[5]) {
        arenite.config.context.instances[instanceName].init.args = _processArgAnnotation(match[5]);
      }
    }

    // start
    if (match[7]) {
      var start = {instance: instanceName, func: match[7]};
      if (match[8]) {
        start.args = _processArgAnnotation(match[8]);
      }
      if (!arenite.config.context.start) {
        arenite.config.context.start = [];
      }
      arenite.config.context.start.push(start);
    }
  };

  return {
    annotation: {
      //###annotation.processAnnotations
      // Interpret the annotations specified in a given source.
      //<pre><code>
      // processAnnotations(text)
      //</pre></code>
      //where *<b>text</b>* is the text(source) to be analysed
      processAnnotations: _processAnnotations
    }
  };

};
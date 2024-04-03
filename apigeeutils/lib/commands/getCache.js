const util = require('util'),
      defaults = require('../defaults'),
      options = require('../options'),
      command_utils = require('./command-utils');

var descriptor = defaults.defaultDescriptor({
  environment: {
    name: 'Environment',
    shortOption: 'e',
    required: true,
    prompt: true
  },
  cache: {
    name: 'Cache Resource',
    shortOption: 'z',
    required: true
  }
});

module.exports.descriptor = descriptor;

module.exports.run = function(opts, cb) {
  options.validateSync(opts, descriptor);
  if (opts.debug) {
    console.log('getCache: %j', opts);
  }
  var uri = util.format('%s/v1/o/%s/e/%s/caches/%s',
                        opts.baseuri, opts.organization, opts.environment, opts.cache);
  let requestOptions = {
        uri,
        method: 'GET',
        json: true
      };
  command_utils.run('getCache', opts, requestOptions, cb);
};

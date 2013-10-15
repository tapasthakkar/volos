var oauthModule = require('..');
var mgmtSpi = require('../../apigee-management');
var runtimeSpi = require('../../apigee-runtime');
var fixtures = require('../../common/createfixtures');
var testOpts = require('../../common/testconfig');

var assert = require('assert');
var url = require('url');
var querystring = require('querystring');

var DefaultTokenLifetime = 3600000;
var DefaultRedirectUri = 'http://example.org';

describe('Apigee Runtime SPI', function() {
  var mgmt;
  var runtime;
  var oauth;

  var developer;
  var app;
  var key;
  var secret;
  var authCode;
  var authHeader;

  var accessToken;
  var refreshToken;

  this.timeout(10000);

  before(function(done) {
    runtime = new runtimeSpi(testOpts);
    oauth = new oauthModule(runtime, {
      validGrantTypes: [ 'authorization_code', 'implicit_grant', 'password', 'client_credentials' ],
      passwordCheck: function(user, pass) {
        return (user === 'foo') && (pass === 'bar');
      }
    });

    var creator = new fixtures();
    creator.createFixtures(function(err, newApp) {
      if (err) {
        console.error('Error creating fixtures: %j', err);
      }
      assert(!err);
      app = newApp;
      key = app.credentials[0].key;
      secret = app.credentials[0].secret;
      authHeader = 'Basic ' + (new Buffer(key + ':' + secret).toString('base64'));
      done();
    });
  });

  it('Generate authorization code', function(done) {
    var qs = {
      response_type: 'code',
      client_id: key,
      redirect_uri: DefaultRedirectUri
    };
    oauth.authorize(querystring.stringify(qs), function(err, result) {
      if (err) {
        console.error('%j', err);
      }
      assert(!err);
      assert(result);
      var parsed = querystring.parse(result);
      assert(parsed.code);
      authCode = parsed.code;
      done();
    });
  });

  it('Get token using authorization code', function(done) {
    var qs = {
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: DefaultRedirectUri
    };
    oauth.generateToken(querystring.stringify(qs),
      { authorizeHeader: authHeader }, function(err, result) {
      if (err) {
        console.error('%s', err);
      }
      assert(!err);
      assert(result);
      assert(result.access_token);
      assert(result.refresh_token);
      accessToken = result.access_token;
      refreshToken = result.refresh_token;
      // Delay before verifying
      setTimeout(done(), 1000);
    });
  });

  it('Verify token', function(done) {
    oauth.verifyToken('Bearer ' + accessToken, function(err, result) {
      if (err) {
        console.error('%s', err);
      }
      assert(!err);
      assert(result);
      console.log('Verify result: %j', result);
      done();
    });
  });

  it('Refresh token', function(done) {
    var qs = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    };
    oauth.refreshToken(querystring.stringify(qs),
      { authorizeHeader : authHeader }, function(err, result) {
      if (err) {
        console.error('%s', err);
      }
      assert(!err);
      assert(result);
      assert(result.access_token);
      accessToken = result.access_token;
      // Delay before verifying
      setTimeout(done(), 1000);
      });
  });

  it('Verify token again', function(done) {
    oauth.verifyToken('Bearer ' + accessToken, function(err, result) {
      if (err) {
        console.error('%s', err);
      }
      assert(!err);
      assert(result);
      console.log('Verify result: %j', result);
      done();
    });
  });

  it('Invalidate token', function(done) {
    var qs = {
      token: accessToken,
      token_type_hint: 'accesstoken'
    };
    oauth.invalidateToken(querystring.stringify(qs),
      { authorizeHeader: authHeader }, function(err, result) {
      if (err) {
        console.error('%s', err);
      }
      assert(!err);
      done();
      });
  });

  it('Generate implicit grant token', function(done) {
    var qs = {
      response_type: 'token',
      client_id: key,
      redirect_uri: DefaultRedirectUri
    };
    oauth.authorize(querystring.stringify(qs), function(err, result) {
      if (err) {
        console.error('%s', err);
      }
      assert(!err);
      assert(result);
      done();
    });
  });

  it('Get token using password', function(done) {
    var qs = {
      grant_type: 'password',
      username: 'foo',
      password: 'bar'
    };
    oauth.generateToken(querystring.stringify(qs),
                        { authorizeHeader: authHeader }, function(err, result) {
      if (err) {
        console.error('%s', err);
      }
      assert(!err);
      assert(result);
      assert(result.access_token);
      assert(result.refresh_token);
      done();
    });
  });

  it('Get token using client credentials', function(done) {
    var qs = {
      grant_type: 'client_credentials'
    };
    oauth.generateToken(querystring.stringify(qs),
                        { authorizeHeader: authHeader }, function(err, result) {
      if (err) {
        console.error('%s', err);
      }
      assert(!err);
      assert(result);
      assert(result.access_token);
      done();
    });
  });
});
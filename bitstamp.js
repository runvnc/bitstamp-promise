var querystring = require("querystring");
var https = require('https');
var _ = require('underscore');
var crypto = require('crypto');
var Promise = require('bluebird');

_.mixin({
  // compact for objects
  compactObject: function(to_clean) {
    _.map(to_clean, function(value, key, to_clean) {
      if (value === undefined)
        delete to_clean[key];
    });
    return to_clean;
  }
});

var Bitstamp = function(key, secret, client_id) {
  this.key = key;
  this.secret = secret;
  this.client_id = client_id;
  this.lastNonce = -1;
  _.bindAll.apply(_, [this].concat(_.functions(this)));
}

Bitstamp.prototype._request = function(method, path, data, args) {
  var options = {
    host: 'www.bitstamp.net',
    path: path,
    method: method,
    agent: false,
    headers: {
      'User-Agent': 'Mozilla/4.0 (compatible; Bitstamp node.js client)'
    }
  };

  if(method === 'post') {
    options.headers['Content-Length'] = data.length;
    options.headers['content-type'] = 'application/x-www-form-urlencoded';
  }

  return new Promise(function(resolve, reject) {
    var req = https.request(options, function(res) {
      res.setEncoding('utf8');
      var buffer = '';
      res.on('data', function(data) {
        buffer += data;
      });
      res.on('end', function() {
        if (res.statusCode !== 200) {
          reject(new Error('Bitstamp error ' + res.statusCode + ': ' + (res.statusCode === 404 ? 'Not found' : buffer)));
        }
        try {
          var json = JSON.parse(buffer);
        } catch (err) {
          return reject(err);
        }
        resolve(json);
      });
    });

    req.on('error', function(err) {
      reject(err);
    });

    req.on('socket', function (socket) {
      socket.setTimeout(5000);
      socket.on('timeout', function() {
        req.abort();
      });
    });

    req.end(data);
  });

}

// if you call new Date to fast it will generate
// the same ms, helper to make sure the nonce is
// truly unique (supports up to 999 calls per ms).
Bitstamp.prototype._generateNonce = function() {
  var now = new Date().getTime();
  return now + '';

  /*
  if(now !== this.last)
    this.nonceIncr = -1;

  this.last = now;
  this.nonceIncr++;

  // add padding to nonce incr
  // @link https://stackoverflow.com/questions/6823592/numbers-in-the-form-of-001
  var padding =
    this.nonceIncr < 10 ? '000' :
      this.nonceIncr < 100 ? '00' :
        this.nonceIncr < 1000 ?  '0' : '';
  return now + padding + this.nonceIncr; */
}

Bitstamp.prototype._get = function(market, action, args) {
  args = _.compactObject(args);

  if(market)
    var path = '/api/v2/' + action + '/' + market;
  else
    // some documented endpoints (eg `https://www.bitstamp.net/api/eur_usd/`)
    // do not go via the v2 api.
    var path = '/api/' + action;

  path += (querystring.stringify(args) === '' ? '/' : '/?') + querystring.stringify(args);
  return this._request('get', path, undefined, args)
}

Bitstamp.prototype._post = function(market, action, args, legacy_endpoint) {
  if(!this.key || !this.secret || !this.client_id)
    return Promise.reject('Must provide key, secret and client ID to make this API request.');

  if(legacy_endpoint)
    var path = '/api/' + action + '/';
  else {
    if(market)
      var path = '/api/v2/' + action + '/' + market + '/';
    else
      var path = '/api/v2/' + action + '/';
  }

  var nonce = this.checkNonce()+''; //_generateNonce();
  this.lastNonce = nonce;
  var message = nonce + this.client_id + this.key;
  
  var signer = crypto.createHmac('sha256', new Buffer(this.secret, 'utf8'));
  var signature = signer.update(message).digest('hex').toUpperCase();

  args = _.extend({
    key: this.key,
    signature: signature,
    nonce: nonce
  }, args);

  args = _.compactObject(args);
  var data = querystring.stringify(args);

  return this._request('post', path, data, args);
}

Bitstamp.prototype.setNextNonce = function (nonce) {
  this.nonce = nonce;
}

Bitstamp.prototype.checkNonce = function() {
  if (!this.nonce || this.nonce*1 <= this.lastNonce*1)
    throw new Error("Bitstamp invalid nonce. Last:"+this.lastNonce+" attempt:"+this.nonce);
  return this.nonce;
}

//
// Public API
//

Bitstamp.prototype.transactions = function(market, options) {
  return this._get(market, 'transactions', options);
}

Bitstamp.prototype.ticker = function(market) {
  return this._get(market, 'ticker');
}

Bitstamp.prototype.ticker_hour = function(market) {
  return this._get(market, 'ticker_hour');
}

Bitstamp.prototype.order_book = function(market, group) {
  return this._get(market, 'order_book', {group: group});
}

// This API calls are removed from the documentation as of `Sat Jun 11 2016 10:10:07`
// Bitstamp.prototype.bitinstant = function() {
//   return this._get('bitinstant');
// }

Bitstamp.prototype.eur_usd = function() {
  return this._get(null, 'eur_usd');
}

//
// Private API
// (you need to have key / secret / client ID set)
//

Bitstamp.prototype.balance = function(market) {
  return this._post(market, 'balance');
}

Bitstamp.prototype.user_transactions = function(market, options) {
  return this._post(market, 'user_transactions', options);
}

Bitstamp.prototype.open_orders = function(market) {
  return this._post(market, 'open_orders');
}

Bitstamp.prototype.order_status = function (id) {
  return this._post(null, 'order_status', {id: id}, true);
};

Bitstamp.prototype.cancel_order = function(id) {
  return this._post(null, 'cancel_order', {id: id}, true);
}

Bitstamp.prototype.cancel_all_orders = function() {
  return this._post(null, 'cancel_all_orders', null, true);
}

Bitstamp.prototype.buy = function(market, amount, price, limit_price) {
  return this._post(market, 'buy', {
    amount: amount,
    price: price,
    limit_price: limit_price
  });
}

Bitstamp.prototype.buyMarket = function(market, amount) {
  return this._post(market, 'buy/market', {
    amount: amount
  });
}

Bitstamp.prototype.sell = function(market, amount, price, limit_price) {
  return this._post(market, 'sell', {
    amount: amount,
    price: price,
    limit_price: limit_price
  });
}

Bitstamp.prototype.sellMarket = function(market, amount) {
  return this._post(market, 'sell/market', {
    amount: amount
  });
}

Bitstamp.prototype.withdrawal_requests = function() {
  return this._post(null, 'withdrawal_requests', null, true);
}

Bitstamp.prototype.bitcoin_withdrawal = function(amount, address, instant) {
  return this._post(null, 'bitcoin_withdrawal', {
    amount: amount,
    address: address,
    instant: instant
  }, true);
}

Bitstamp.prototype.bitcoin_deposit_address = function() {
  return this._post(null, 'bitcoin_deposit_address', null, true);
}

Bitstamp.prototype.unconfirmed_btc = function() {
  return this._post(null, 'unconfirmed_btc', null, true);
}


// the API documentation is wrong as of `Sat Jun 11 2016 10:10:07`.
// It doesn't corectly list this call. Therefor not sure if all
// arguments are correct.
Bitstamp.prototype.ripple_withdrawal = function(amount, address, currency) {
  return this._post(null, 'ripple_withdrawal', {
    amount: amount,
    address: address,
    currency: currency
  }, true);
}

Bitstamp.prototype.ripple_address = function() {
  return this._post(null, 'ripple_address', null, true);
}

Bitstamp.prototype.transfer_to_main = function(amount, currency, subAccount) {
  return this._post(null, 'transfer-to-main', {
    amount: amount,
    currency: currency,
    subAccount: subAccount
  }, true);
}

Bitstamp.prototype.transfer_from_main = function(amount, currency, subAccount) {
  return this._post(null, 'transfer-from-main', {
    amount: amount,
    currency: currency,
    subAccount: subAccount
  }, true);
}

module.exports = Bitstamp;

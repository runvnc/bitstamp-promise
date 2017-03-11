var Bitstamp = require('./bitstamp');

var publicBitstamp = new Bitstamp();

// publicBitstamp.transactions('btceur', {time: 'hour'}).then(function(result) { console.log(result) });
// publicBitstamp.ticker('btceur').then(function(result) { console.log(result) });
// publicBitstamp.ticker_hour('btceur').then(function(result) { console.log(result) });
// publicBitstamp.order_book('btcusd', false).then(function(result) { console.log(result) });
// publicBitstamp.eur_usd().then(function(result) { console.log(result) });;

var key = 'your-key';
var secret = 'your-secret';
var client_id = 'your-bitstamp-user-id';
var privateBitstamp = new Bitstamp(key, secret, client_id);

//    commented out for your protection

// privateBitstamp.balance().then(function(result) { console.log(result) });
// privateBitstamp.user_transactions('btceur', {limit: 10, offset: 5, sort: 'asc'}).then(function(result) { console.log(result) });
// privateBitstamp.open_orders('btcusd').then(function(result) { console.log(result) });
// privateBitstamp.order_status(id).then(function(result) { console.log(result) });
// privateBitstamp.cancel_order(id).then(function(result) { console.log(result) });
// privateBitstamp.cancel_all_orders().then(function(result) { console.log(result) });
// privateBitstamp.buy('btcusd', amount, price, limit_price).then(function(result) { console.log(result) });
// privateBitstamp.sell('btcusd', amount, price, limit_price).then(function(result) { console.log(result) });
// privateBitstamp.withdrawal_requests().then(function(result) { console.log(result) });
// privateBitstamp.bitcoin_withdrawal(amount, address).then(function(result) { console.log(result) });
// privateBitstamp.bitcoin_deposit_address().then(function(result) { console.log(result) });
// privateBitstamp.unconfirmed_btc().then(function(result) { console.log(result) });
// privateBitstamp.ripple_withdrawal(amount, address, currency).then(function(result) { console.log(result) });
// privateBitstamp.ripple_address().then(function(result) { console.log(result) });
// privateBitstamp.transfer_to_main(amount, currency, subAccount).then(function(result) { console.log(result) });
// privateBitstamp.transfer_from_main(amount, currency, subAccount).then(function(result) { console.log(result) });

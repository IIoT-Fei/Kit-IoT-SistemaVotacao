var events = require('events'),
    util   = require('util');

/*
 * Capacitive sensor
 */

var Capacitive = function (options) {
  if (!options || !options.arduino) {
    throw new Error('Must supply required options to Capacitive');
  }

  this.arduino = options.arduino;
  this.pin     = options.pin || '2';
  this.arduino.pinMode(this.pin, 'in');
  this.value   = 0;
  
  setInterval(function () {
    this.arduino.capacitive(this.pin);
  }.bind(this), options.throttle || 1000);

  this.arduino.on('data', function (message) {
    var m = message.slice(0, -1).split('::'),
        pin, data, thisPin;

    if (!m.length) {
      return;
    }

    pin     = m[0];
    thisPin = this.arduino.normalizePin(this.pin);

    if (m.length === 2 && pin === thisPin) {
      data = m[1];
      this.emit('read', data);
    }



  }.bind(this));
};

util.inherits(Capacitive, events.EventEmitter);

module.exports = Capacitive;


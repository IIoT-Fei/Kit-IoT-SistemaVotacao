var events = require('events'),
    util   = require('util'),
    serial = require('serialport');

/*
 * Arduino class
 */
var Arduino = function (options) {
  this.debug       = options && options.debug || false;
  this.baudrate    = options && options.baudrate || 115200;
  this.errorMsg    = 'Não foi possível encontrar o Arduino';
  this.writeBuffer = [];

  var self = this;

  this.detect(function (err, serial) {
    if (err) {
      if(self.listeners('error').length) {
        self.emit('error', err);

      } else {
        throw new Error(err);
      }

    } else {
      self.serial = serial;
      self.emit('connected');

      self.serial.on('data', function(data) {
        self.emit('data', data);
      });

      setTimeout(function () {
        self.sendClearingBytes();

        if (self.writeBuffer.length > 0) {
          self.processWriteBuffer();
        }

        self.emit('ready');
      }, 1000);
    }
  });
};

util.inherits(Arduino, events.EventEmitter);


Arduino.prototype.detect = function (callback) {
  var rport = /usb|acm|^com/i,
      self  = this, ports;

  serial.list(function (err, result) {
    var ports, length, possible, found;

    ports = result.filter(function (val) {
      var available = true;

      // Match only ttyUSB#, cu.usbmodem#, COM#
      if (!rport.test(val.comName)) {
        available = false;
      }

      return available;

    }).map(function (val) {
      return {
        comName     : val.comName,
        manufacturer: val.manufacturer
      };
    });

    length = ports.length;

    if (!ports.length) {
      err = new Error(self.errorMsg);
    }

    while (ports.length) {
      possible = ports.pop();

      try {
        temp = new serial.SerialPort(possible.comName, {
          baudrate: self.baudrate,
          parser  : serial.parsers.readline('\n')
        });

      } catch (e) {
        err = e;
      }

      if (!err) {
        found = temp;
        self.manufacturer = possible.manufacturer;
        break;

      } else {
        err = new Error(self.errorMsg);
      }
    }

    callback(err, found);
  });
};

/*
 * The board will eat the first 4 bytes of the session
 */
Arduino.prototype.sendClearingBytes = function () {
  this.serial.write('00000000');
};

/*
 * Process the writeBuffer (messages attempted before serial was ready)
 */
Arduino.prototype.processWriteBuffer = function () {
  while (this.writeBuffer.length > 0) {
    this.write(this.writeBuffer.shift());
  }
};

/*
 * Low-level serial write
 */
Arduino.prototype.write = function (m) {
  if (this.serial) {
    this.serial.write('!' + m + '.');

  } else {
    this.writeBuffer.push(m);
  }
};

/*
 * Add a 0 to the front of a single-digit pin number
 */
Arduino.prototype.normalizePin = function (pin) {
  return this.lpad(2, '0', pin);
};

Arduino.prototype.normalizeVal = function(val) {
	return this.lpad(3, '0', val);
};

Arduino.prototype.lpad = function(len, chr, str) {
  return (Array(len + 1).join(chr || ' ') + str).substr(-len);
};

/*
 * Set a pin's mode
 * val == out = 001
 * val == in  = 000
 */
Arduino.prototype.pinMode = function (pin, val) {
  pin = this.normalizePin(pin);
  val = (val == 'out' ? this.normalizeVal(1) : this.normalizeVal(0));

  this.write('00' + pin + val);
};

Arduino.prototype.dWrite = function (pin, val) {
  pin = this.normalizePin(pin);
  val = this.normalizeVal(val);

  this.write('01' + pin + val);
};

Arduino.prototype.dRead = function (pin) {
  pin = this.normalizePin(pin);

  this.write('02' + pin + this.normalizeVal(0));
};

Arduino.prototype.aRead = function (pin) {
	pin = this.normalizePin(pin);

	this.write('04' + pin + this.normalizeVal(0));
};

Arduino.prototype.aWrite = function (pin, val) {
	pin = this.normalizePin(pin);
	val = this.normalizeVal(val);

	this.write('03' + pin + val);
};

Arduino.prototype.capacitive = function (pin) {
  pin = this.normalizePin(pin);

  this.write('05' + pin + this.normalizeVal(0));
};

module.exports = Arduino;

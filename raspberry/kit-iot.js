var kit     = require('./kit'),
    request = require('request'),
    io      = require('socket.io'),
    log     = require('single-line-log').stdout,
    token   = new kit.Token(),
    nao = 0,
    sim = 0,
    flag = -2;

//Kit IoT
var KitIoT = function (console) {
  this.server = new kit.Server({ port: '4000', console: console });
  this.io     = io.listen(this.server.http, { log: false });
  this.token  = token;

  //If is console start connect to the arduino and start the script
  if (console) {
    this.isConsole = true;
    this.connect();
    this.start();
  }
};

//Connect
KitIoT.prototype.connect = function () {
  var self = this;

  if (!this.arduino) {
    this.arduino     = new kit.Arduino();
    this.button      = new kit.Button({ arduino: this.arduino, pin: 5 });
    this.temperature = new kit.Sensor({ arduino: this.arduino, pin: 'A0' });
    this.light       = new kit.Sensor({ arduino: this.arduino, pin: 'A1' });
    this.capacitive  = new kit.Capacitive({  arduino: this.arduino, pin: 2 });

    this.button.value = 0;

    //Button
    this.button.on('down', function () {
      self.button.value = 1;
      self.io.sockets.emit('button', self.button.value);

    }).on('up', function () {
      self.button.value = 0;
      self.io.sockets.emit('button', self.button.value);
    });

    //Luminosity
    this.light.on('read', function (m) {
      self.light.value = m;
    });

    //Temperature
    this.temperature.on('read', function (m) {
      self.temperature.value = m;
    });

    //Capacitive
    this.capacitive.on('read', function (m) {
      self.capacitive.value = m;
    });

    //On arduino error
    this.arduino.on('error', function (e) {
      self.disconnect();
    });

    //On uncaught exception kill process
    process.on('uncaughtException', function (err) {
      console.log(err);
      self.disconnect();
    });
  }
};

//Start loop to send and save data
KitIoT.prototype.start = function () {
  var self = this;

  var doUpdateDashboard = function () {
    var data = self.getSensorValues();

    if (self.isConsole) {
      log(
        '*----------------------*\n' +
        '*      Dashboard       *\n' +
        '*----------------------*\n' +
        '   botão: ' + data.button + '\n' +
        '   luz: '+ data.light + '\n' +
        '   temperatura: '+ data.temperature + '\n' +
        '   capacitivo: '+ data.capacitive + '\n' +
        '*----------------------*\n'
      );

    } else {
      self.io.sockets.emit('data', data);
    }

  };

  var doSaveData = function () {
    var data = self.getSensorValues();
    self.saveData(data);
  };

  doUpdateDashboard();
  doSaveData();

  self.loop = setInterval(doSaveData, 1000);
  self.loopDash = setInterval(doUpdateDashboard, 5000);
};

//Save data to SBC
KitIoT.prototype.saveData = function (data) {
  	if(data.light<500)
	{
		flag++;
	}
	if(data.light>500 && flag>0)
	{
		if(data.button)
		{
			sim = sim + 1;
		}
		else
		{
			nao = nao + 1;
		}
		flag = 0;
	}
	var self    = this,
      URL     = 'http://dca.telefonicabeta.com:8002',
      rawBody = '|||unknown||chave|'+ data.button +'#|||temperature||temperatura|'+ sim +'#|||illuminance||luminosidade|'+ data.light +'#|||presence||capacitivo|'+ nao,
      tokenId = token.getToken(),
      apiKey  = token.getApikey();

  if (!tokenId) {
    self.io.sockets.emit('no-internetConnection', { msg: 'API token não encontrado' });

  } else {
    request({
      method: 'POST',
      url   : URL + '/idas/2.0?apikey='+ apiKey +'&ID=kit-iot-4g',
      body  : rawBody

    }, function (err, res, body) {
      if (!err) {
        if (res.statusCode === 200) {
          self.io.sockets.emit('internetConnection', { msg: 'Conectado na nuvem' });

        } else {
          self.io.sockets.emit('no-internetConnection', { msg: 'Erro ao salvar os dados do Kit' });
        }
      } else {
        if (err.code === 'EHOSTUNREACH') {
          self.io.sockets.emit('no-internetConnection', { msg: 'Sem conexão com a internet' });
        }
      }
    });
  }
};

//Clear loop
KitIoT.prototype.clearLoop = function (l) {
  clearInterval(l);
};

//Disconnect
KitIoT.prototype.disconnect = function () {
  this.clearLoop(this.loop);
  this.clearLoop(this.loopDash);
  this.io.sockets.emit('disconnect');
};

//Logout
KitIoT.prototype.logout = function () {
  this.clearLoop(this.loop);
  this.clearLoop(this.loopDash);
  this.io.sockets.emit('logout');
};

//Get sensor values
KitIoT.prototype.getSensorValues = function () {
  return {
    button     : (this.button.value || 0),
    light      : (this.light.value || 0),
    temperature: (( 5.0 * parseFloat(this.temperature.value || 0) * 100.0) / 1024.0).toFixed(0), // to celsius
    capacitive : (this.capacitive.value || 0)
  };
};

module.exports = KitIoT;

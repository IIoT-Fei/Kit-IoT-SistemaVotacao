var fs   = require('fs'),
    path = require('path');

//Toekn manager
var Token = function () {
  this.file = path.resolve(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/kit-iot-4g.json';
};

//Get kit configuration
Token.prototype.getConfig = function () {
  var fileContent;

  if (fs.existsSync(this.file)) {
    fileContent = fs.readFileSync(this.file, 'utf8');
    fileContent = JSON.parse(fileContent);
  } else {
    fileContent = {
              "name":     null,
              "usuario":  null,
              "password": null,
              "email":    null,
              "tel":      null,
              "token":    null,
              "apikey":   null
            };
  }
  return fileContent;
};

Token.prototype.getToken = function () {
  return this.getConfig().token;
};

Token.prototype.getApikey = function () {
  return this.getConfig().apikey;
};


//Save token
Token.prototype.saveConfig = function (jsonConfig) {
  if (this.getToken()) {
    fs.unlinkSync(this.file);
  }

  fs.writeFileSync(this.file, JSON.stringify(jsonConfig, null, 4));
};

module.exports = Token;

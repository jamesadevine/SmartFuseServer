
/* 
-----------GENERAL IMPORTS-----------
*/
var express = require('express'); //express framework!
var logger = require('morgan');
var app = express();  //create the app object
app.use(logger('dev'));
var cookieParser = require('cookie-parser');  //used to 
var session = require('express-session'); //used for managing sessions
var uuid = require('node-uuid');  //used to generate UUIDs
var moment = require('moment'); //clever date library
var fs = require("fs"); //used to interact with the file system

var mongoose = require('mongoose'); //allows interation with MongoDB

//connect to MongoDB!
mongoose.connect('mongodb://localhost/smartfuse');
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

//create instances of the various managers
var userManager = require('./managers/usermanager.js');
var fuseManager = require('./managers/fusemanager.js');
var energyManager = require('./managers/energymanager.js');
var hubManager = require('./managers/hubmanager.js');

//instantiate managers...
userManager.init(mongoose,uuid);
hubManager.init(mongoose,uuid);
fuseManager.init(mongoose,uuid,fs,moment);
energyManager.init();

//create the project name 
var projectName = "Smart Fuse -";

//set up the app!
app.set('view engine', 'jade');

app.use(cookieParser());

//create the session generator
app.use(session({secret: 'J@m3sD3V1n3',
                 saveUninitialized: true,
                 resave: true}));

//create the body parser to automatically pass request parameters
var bodyParser = require('body-parser');
//set the limit to 50mb for image upload
app.use( bodyParser.json({limit: '50mb'}));       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

//set CORS
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
};

app.use(allowCrossDomain);

//set the public DIR
app.use(express.static(__dirname + '/public'));


/*
  --------------------SERVER OBJECT----------------------
*/

var server = app.listen(8000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Server listening at http://%s:%s', host, port);
});

var io = require('socket.io')(server);

io.on('connection', function(socket){
  console.info('New client connected (id=' + socket.id + ').');

  socket.on('setUserID',function(userData){
    socket.join(userData.userid);
    console.log(userData);
  });
});

/*
  --------------------COMMON FUNCTIONS----------------------
*/

var commonFunctions ={
  logRequest:function(location,body){
    var logString = "";

    for(var key in body)
      logString+=" || "+key+": "+body[key];
    
    console.log(location+":"+logString);
  },

  //returns true if all params are there
  checkParams:function(request,required){
    for(var i =0;i<required.length;i++){
      if(typeof request[required[i]] === 'undefined')
        return false;
    }
    return true;
  }
};


/*
  --------------------SETUP ROUTES----------------------
*/

require('./routes/user.js')(app,commonFunctions,userManager,fuseManager,energyManager);
require('./routes/fuse.js')(app,commonFunctions,fuseManager,io);
require('./routes/fuses.js')(app,commonFunctions,fuseManager,userManager);
require('./routes/hub.js')(app,commonFunctions,hubManager);
require('./site.js')(app,userManager,projectName);



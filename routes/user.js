module.exports = function(app,commonFunctions,userManager,fuseManager,energyManager){

  /*
    --------------------USER LOGIN---------------------
  */

  app.get('/api/user/', function (req, res) {

    var required = ["email","password"];
    var allParams = commonFunctions.checkParams(req.query,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }
    
    commonFunctions.logRequest("/api/user/login",req.query);

    var callback = function(result){
      if(result===-1){
        res.status(403).json({error:"User credentials incorrect"});
      }else{
        result=result.toObject();
        req.session.userID = result.id;
        result.energy = energyManager.getEnergyStats(result.countryCode);
        res.status(200).json({success:"User logged in!",user:result});
      }
    };

    userManager.login(req.query.email,req.query.password,callback);
  }),

  /*
    --------------------USER EDIT---------------------
  */

  app.put('/api/user/', function (req, res) {

    var required = ["userID","name","email","countryCode","houseSize"];
    var allParams = commonFunctions.checkParams(req.body,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }
    
    commonFunctions.logRequest("/api/user/",req.body);

    var callback = function(result){
      if(result===-1){
        res.status(500).json({error:"User could not be updated"});
      }else{
        res.status(200).json({success:"User updated!"});
      }
    };

    userManager.update(req.body.userID,req.body.name,req.body.email,req.body.countryCode,req.body.houseSize,callback);
  }),

  /*
    --------------------USER DELETE---------------------
  */

  app.delete('/api/user/', function (req, res) {
    var required = ["userID"];
    var allParams = commonFunctions.checkParams(req.body,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }

    commonFunctions.logRequest("/api/user",req.body);

    var callback = function(result){
      if(result)
        res.status(200).json({success:"User removed"});
      else
        res.status(500).json({error:"User couldn't be removed"});
    };
    userManager.remove(req.body.userID,callback);
    
  }),

  /*
    --------------------USER REGISTER---------------------
  */

  app.post('/api/user/', function (req, res) {
    var required = ["email","password","name"];
    var allParams = commonFunctions.checkParams(req.body,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }

    commonFunctions.logRequest("/api/user/",req.body);

    var callback = function(result,user){
      if(result===-1){
        res.status(400).json({error:"User already registered!"});
      }else{
        req.session.userID = user.id;
        res.status(201).json({success:"User registered!",user:user});
      }
    };

    userManager.add(req.body.email,req.body.name,req.body.password,callback);
  });
};
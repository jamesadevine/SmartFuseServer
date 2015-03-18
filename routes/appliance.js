module.exports = function(app,commonFunctions,applianceManager,io){

  /*
    --------------------ADD appliance (DEPRECATED)----------------------
  */
  app.post('/api/appliance/add', function (req, res) {

    var required = ["userID","applianceID","applianceName"];
    var allParams = commonFunctions.checkParams(req.body,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }
    commonFunctions.logRequest("/api/appliance/add",req.body);
    var callback = function(result){
      if(result===-1){
        res.status(403).json({error:"appliance already exists"});
      }else{
        res.status(200).json({success:"appliance added",appliance:result});
      }
    };
    applianceManager.add(req.body.userID,req.body.applianceID,req.body.applianceName,callback);
    
  }),

  /*
    --------------------appliance image upload----------------------
  */

  app.post('/api/appliance/upload', function (req, res) {

    var required = ["userID","applianceID","hubID","image"];
    var allParams = commonFunctions.checkParams(req.body,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }

    commonFunctions.logRequest("/api/appliance/upload",req.body);

    var fullUrl = req.protocol + '://' + req.get('host');

    var base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
    var callback = function(result){
      console.log("RESULT ",result);
      if(result!==-1)
        res.status(201).json({success:"Image uploaded"});
      else
        res.status(400).json({error:"Image upload failed"});
    };
    applianceManager.uploadImage(req.body.userID,req.body.applianceID,req.body.hubID,base64Data,fullUrl,callback);
    
  }),

  /*
    --------------------appliance edit----------------------
  */

  app.put('/api/appliance/', function (req, res) {

    var required = ["userID","applianceID","hubID","applianceName","applianceDescription"];
    var allParams = commonFunctions.checkParams(req.body,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }

    commonFunctions.logRequest("/api/appliance",req.body);

    var callback = function(result){
      if(result)
        res.status(200).json({success:"appliance edited"});
      else
        res.status(403).json({error:"appliance couldn't be edited"});
    };

    applianceManager.editappliance(req.body.userID,req.body.applianceID,req.body.hubID,req.body.applianceName,req.body.applianceDescription,callback);
    
  }),

  /*
    --------------------appliance add data----------------------
  */

  app.post('/api/appliance/', function (req, res) {
    var required = ["userID","applianceID","applianceVal","hubID"];
    var allParams = commonFunctions.checkParams(req.body,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }

    commonFunctions.logRequest("/api/appliance/",req.body);

    var callback = function(result,data){
      if(result===-1){
        res.status(404).json({error:"appliance not found"});
      }else{
        io.sockets.in(req.body.userID).emit("dataAdded",{applianceID:req.body.applianceID,hubID:req.body.hubID,value:data});//
        res.status(201).json({success:"appliance data added"});
      }
    };
    applianceManager.addData(req.body.hubID,req.body.userID,req.body.applianceID,req.body.applianceVal,callback);
    
  }),

  /*
    --------------------appliance delete----------------------
  */

  app.delete('/api/appliance/', function (req, res) {
    var required = ["userID","applianceID","hubID"];
    var allParams = commonFunctions.checkParams(req.body,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }

    commonFunctions.logRequest("/api/appliance",req.body);

    var callback = function(result){
      if(result)
        res.status(200).json({success:"appliance removed"});
      else
        res.status(403).json({error:"appliance couldn't be removed"});
    };
    applianceManager.remove(req.body.userID,req.body.applianceID,req.body.hubID,callback);
    
  }),

  /*
    --------------------GET appliance----------------------
  */

  app.get('/api/appliance', function (req, res) {

    var required = ["userID","applianceID","hubID"];
    var allParams = commonFunctions.checkParams(req.query,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }

    commonFunctions.logRequest("/api/appliance",req.query);

    var callback = function(result){
      if(result === -1){
        res.status(404).json({error:"appliance not found"});
      }else{
        res.status(200).json({success:"appliance retrieved",appliance:result});
      }
    };
    applianceManager.getappliance(req.query.userID,req.query.applianceID,req.query.hubID,callback);
  }),

  /*
    --------------------appliance summary----------------------
  */

  app.get('/api/appliance/summary', function (req, res) {
    var required = ["userID","applianceID","hubID"];
    var allParams = commonFunctions.checkParams(req.query,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }

    commonFunctions.logRequest("/api/appliance/summary",req.query);

    var callback = function(result){
      if(result === -1){
        res.status(404).json({error:"appliance not found"});
      }else{
        res.status(200).json({success:"appliance summary retrieved",summary:result});
      }
    };
    applianceManager.getSevenDaySummary(req.query.userID,req.query.applianceID,req.query.hubID,callback);
  });
};
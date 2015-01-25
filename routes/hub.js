module.exports = function(app,commonFunctions,hubManager){

  /*
    --------------------HUB LINK----------------------
  */

  app.post('/api/hub', function (req, res) {

    var required = ["hubID","userID"];
    var allParams = commonFunctions.checkParams(req.body,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }
    
    commonFunctions.logRequest("/api/hub",req.body);

    var callback = function(result){
      if(result===-1){
        res.status(400).json({error:"Hub couldn't be added"});
      }else{
        res.status(200).json({success:"Hub added!"});
      }
    };

    hubManager.linkHub(req.body.userID,req.body.hubID,callback);
  }),

  /*
    --------------------HUB DELETE----------------------
  */

  app.delete('/api/hub', function (req, res) {

    var required = ["hubID"];
    var allParams = commonFunctions.checkParams(req.body,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }
    
    commonFunctions.logRequest("/api/hub",req.body);

    var callback = function(result){
      if(result===-1){
        res.status(400).json({error:"Hub couldn't be removed"});
      }else{
        res.status(200).json({success:"Hub removed!"});
      }
    };

    hubManager.remove(req.body.hubID,callback);
  }),

  /*
    --------------------HUB RETRIEVE----------------------
  */

  app.get('/api/hub', function (req, res) {


    var required = ["macaddr"];
    var allParams = commonFunctions.checkParams(req.query,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }
    
    commonFunctions.logRequest("/api/hub",req.query);

    var callback = function(result,hub){
      if(result===-1){
        res.status(400).json({error:"Hub not linked",hub:hub});
      }else{
        res.status(200).json({success:"Hub retrieved!",hub:hub});
      }
    };

    hubManager.retrieve(req.query.macaddr,callback);
  }),

  /*
    --------------------HUBS LIST----------------------
  */

  app.get('/api/hubs', function (req, res) {


    var required = ["userID"];
    var allParams = commonFunctions.checkParams(req.query,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }
    
    commonFunctions.logRequest("/api/hubs",req.query);

    var callback = function(result,hubs){
      if(result===-1){
        res.status(400).json({error:"Hubs couldn't be retrieved"});
      }else{
        res.status(200).json({success:"Hubs retrieved",hubs:hubs});
      }
    };

    hubManager.getHubs(req.query.userID,callback);
  })
};
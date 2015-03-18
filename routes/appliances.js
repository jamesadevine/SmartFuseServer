module.exports = function(app,commonFunctions,applianceManager,userManager,hubManager){
  /*
    --------------------appliances FETCH----------------------
  */
  app.get('/api/appliances', function (req, res) {

    var required = ["userID"];
    var allParams = commonFunctions.checkParams(req.query,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }


    commonFunctions.logRequest("/api/appliances",req.query);
    var outerCallback = function(result,hubs){
      var callback = function(appliances){

        var returnObject = {};
        console.log(hubs);
        console.log(appliances);
        for(var i=0;i<hubs.length;i++){
          var hubsappliances = appliances.filter(function(el){
            return el.hubID==hubs[i].id;
          });
          console.log('hubsappliances',hubsappliances,hubs[i].name);
          returnObject[String(hubs[i].name)]=hubsappliances;
        }

        res.status(200).json({success:"appliances retrieved",appliances:returnObject});
      };

      applianceManager.getappliancesByOwner(req.query.userID,callback);
    };
    hubManager.getHubs(req.query.userID,outerCallback);
    
    
  });

  /*
    --------------------appliances Summary----------------------
  */
  app.get('/api/appliances/summary', function (req, res) {
    var required = ["userID","date"];
    var allParams = commonFunctions.checkParams(req.query,required);
    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }
    commonFunctions.logRequest("/api/appliances/summary",req.query);
    var callback = function(result){
      res.status(200).json({success:"appliance summary retrieved",summary:result});
    };
    var callback2 = function(user){
      console.log(user);
      if(user === null)
        res.status(404).json({error:"user not found"});
      else
        applianceManager.getSummaryData(user,req.query.userID,req.query.date,callback);
    };
    userManager.get(req.query.userID,callback2);
    
  });
};
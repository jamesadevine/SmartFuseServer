module.exports = function(app,commonFunctions,fuseManager,userManager){
  /*
    --------------------Fuses FETCH----------------------
  */
  app.get('/api/fuses', function (req, res) {

    var required = ["userID"];
    var allParams = commonFunctions.checkParams(req.query,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }

    commonFunctions.logRequest("/api/fuses",req.query);

    var callback = function(result){
      res.status(200).json({success:"Fuses retrieved",fuses:result});
    };
    fuseManager.getFusesByOwner(req.query.userID,callback);
    
  });

  /*
    --------------------Fuses Summary----------------------
  */
  app.get('/api/fuses/summary', function (req, res) {
    var required = ["userID","date"];
    var allParams = commonFunctions.checkParams(req.query,required);
    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }
    commonFunctions.logRequest("/api/fuses/summary",req.query);
    var callback = function(result){
      res.status(200).json({success:"Fuse summary retrieved",summary:result});
    };
    var callback2 = function(user){
      fuseManager.getSummaryData(user,req.query.userID,req.query.date,callback);
    };
    userManager.get(req.query.userID,callback2);
    
  });
};
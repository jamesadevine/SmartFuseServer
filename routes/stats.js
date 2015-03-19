module.exports = function(app,commonFunctions,energyManager){

  /*
    --------------------GET STATS----------------------
  */

  //retrieve all statistics
  app.get('/api/stats', function (req, res) {

    var required = ["date"];
    var allParams = commonFunctions.checkParams(req.query,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }
    
    commonFunctions.logRequest("/api/stats",req.query);

    var callback = function(result,stats){
      if(result===-1){
        res.status(404).json({error:"Stats are not available for this date.",stats:stats});
      }else{
        res.status(200).json({success:"Stats retrieved!",stats:stats});
      }
    };

    energyManager.getFullStats(req.query.date,callback);
  });

  //retrieve current statistics only
  app.get('/api/stats/current', function (req, res) {

    var required = ["date"];
    var allParams = commonFunctions.checkParams(req.query,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }
    
    commonFunctions.logRequest("/api/stats/current",req.query);

    var callback = function(result,stats){
      if(result===-1){
        res.status(404).json({error:"Stats are not available for this date.",stats:stats});
      }else{
        res.status(200).json({success:"Stats retrieved!",stats:stats});
      }
    };

    energyManager.getFullStats(req.query.date,callback,'current');
  });

  //retrieve historic statistics
  app.get('/api/stats/historic', function (req, res) {

    var required = ["date"];
    var allParams = commonFunctions.checkParams(req.query,required);

    if(!allParams){
      res.status(400).json({error:"Missing a parameter"});
      return;
    }
    
    commonFunctions.logRequest("/api/stats/historic",req.query);

    var callback = function(result,stats){
      if(result===-1){
        res.status(404).json({error:"Stats are not available for this date.",stats:stats});
      }else{
        res.status(200).json({success:"Stats retrieved!",stats:stats});
      }
    };

    energyManager.getFullStats(req.query.date,callback,'historic');
  });


};
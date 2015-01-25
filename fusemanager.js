module.exports = {
  init:function (mongoinstance,uuid,fs,moment){

    //object vars
    this.mongoose=mongoinstance;
    this.uuid = uuid;
    this.fs = fs;
    this.moment=moment;
    this.energyManager =require('./energymanager');

    //mongoose model for mongo db!
    this.Fuse = this.mongoose.model('Fuse',{
      id:String,
      name:String,
      icon:String,
      description:String,
      ownerID:String,
      data:[{ value: Number, date: String, time:String,samples:Number,sum:Number}],
      online:Boolean,
      lastUpdated:Date
    });

    //used to delete Fuses (wipe the database)
    //this.Fuse.remove().exec();
  },

  //DEPRECATED: Adds a fuse to the database
  add:function(ownerid,fuseid,name,callback){
    var newFuse = new this.Fuse({id:fuseid,name:name,ownerID:ownerid,data:[],online:true,lastUpdated:new Date()});
    this.Fuse.findOne({ownerID:ownerid,id:fuseid},function (err, fuse) {
      if (err){
        callback(-1);
        return;
      }
        
      if(fuse === null){
        console.log("doesn'texists");
        newFuse.save(function (err, fuse) {
          callback(fuse);
        });
      }else{
        console.log("exists");
        callback(-1);
      }
    });
    
  },
  //removes a fuse from the database
  remove:function (ownerid,fuseid,callback){
    this.Fuse.remove({ownerID:ownerid,id:fuseid},function (err) {
      if (err)
        callback(false);
      else
        callback(true);
    });
  },
  //creates a Fuse if no record is found,
  //adds data to a Fuse if a record is found!
  addData:function (ownerid,fuseid,value,callback){
    var moment = this.moment();

    var timestamp = moment.format();
    var dateString = moment.format('DD-MM-YYYY');
    var timeString = moment.format('HH:mm:ss');
    //get the nearest 10 minute, rounds down
    var remainder = (10 - moment.minute()) % 10;
    var nearestTen = moment.add(remainder,"minutes").format("HH:mm");
    var Fuse = this.Fuse;
    
    this.Fuse.findOne({ownerID:ownerid,id:fuseid},function (err,fuse) {
      if (err){
        console.log(err);
        callback(-1,null);
        return;
      }else{
        //check if the fuse doesn't exist
        if(fuse === null){
          //add a new fuse if it doesn't exist!!
          var newFuse = new Fuse({
            name:'Fuse '+fuseid,
            id:fuseid,
            description:"Change the fuse description to something more meaningful",
            icon:'img/appliances/help.png',
            online:true,
            ownerID:ownerid,
            lastUpdated:timestamp,
            data:[{value:value,date:dateString,time:nearestTen,samples:1,sum:value}]
          });

          //save the fuse to mongo!
          newFuse.save(function (err, fuse) {
            if (err)
              callback(-1,null);
            else
              callback(true,value);
          });

        }else{
          //fuse has been found, add the data
          var currentData = fuse.data;
          var match = currentData.filter(function(el){
              return el.date === dateString && el.time === nearestTen;
          })[0];

          if(match=== null||typeof match === 'undefined'){
            //add new datapoint
            var newDataPoint = {
              value:value,
              date:dateString,
              time:nearestTen,
              samples:1,
              sum:value
            };
            currentData.push(newDataPoint);

          }else{
            console.log(Number.MAX_VALUE);
            //update average
            match.samples++;
            match.sum=match.sum+Number(value);
            match.value = Number(match.sum/match.samples).toFixed(2);
          }
          //save the data to mongo!
          fuse.save(function (err, fuse) {
            if (err)
              callback(-1,null);
            else
              callback(true,value);
          });
        }
      }
    });
  },
  //summarises the average for each fuse over a day
  getSummaryData:function(user,ownerid,date,callback){

    //create a moment object for the target date
    var targetDate = this.moment(date,"DD-MM-YYYY");

    //get a local instance of energyManager
    var energyManager = this.energyManager;

    //find all fuses belonging to the user
    this.Fuse.find({ownerID:ownerid,'data.date':targetDate.format('DD-MM-YYYY')},function (err,fuses) {

      if (err){
        console.log(err);
        callback(-1);
        return;
      }else{

        var summaryData = [];

        //go through each fuse and get relevant data
        for(var i = 0;i<fuses.length;i++){
          var currentFuse = fuses[i].toObject();
          console.log(currentFuse);
          var dataToAdd = {
            name:currentFuse.name,
            id:currentFuse.id,
            data:currentFuse.data.filter(function(el){
              return el.date === targetDate.format('DD-MM-YYYY');
            })
          };
          summaryData.push(dataToAdd);
        }

        //fetch the country stats from energy manager
        var stats = energyManager.getEnergyStats(user.countryCode);

        //calculate a rough daily price to base info on.
        var dailyPrice = Number(stats.price[user.houseSize])/30;

        //initialise empty arrays
        var names=[];
        var datapoints = [];
        var datapoints2 = [];
        var tempDatapoint = [];
        var tempDatapoint2= [];

        //loop through all data and calculate the data
        for(var i = 0;i<summaryData.length;i++){

          var currentSummary = summaryData[i];

          //add to the list of names
          names.push(currentSummary.name);

          //calulate the totals
          var total = 0;
          for(var j = 0;j<currentSummary.data.length;j++){
            total+=currentSummary.data[j].value;
          }

          //calculate the average energy consumption
          tempDatapoint.push(Number(total/currentSummary.data.length).toFixed(2));

          //calculate the number of kwatts
          var kwatts = (Number(total/currentSummary.data.length) * 3)/1000;

          //calculate the daily price for the current fuse
          tempDatapoint2.push((dailyPrice*kwatts).toFixed(2));
        }

        //wrap the generated data
        datapoints.push(tempDatapoint);
        datapoints2.push(tempDatapoint2);

        //return the summary object back to the user.
        callback({
              labels:names,
              energyData:datapoints,
              priceData:datapoints2
            });
      }

      
      
    });
  },
  //returns the average energy consumption for the past seven days for the selected fuse.
  getSevenDaySummary:function(ownerid,fuseid,callback){

    //get a local reference to the dateGenerator function 
    var dateGenerator = this.dateGenerator;
    
    //find the fuse
    this.Fuse.findOne({ownerID:ownerid,id:fuseid},function (err,fuse) {
      if (err){
        console.log(err);
        callback(-1);
        return;
      }else{

        //get past 7 days
        var targetDates = dateGenerator(7);

        //create empty arrays
        var summaryData = [];
        var names =[]

        //get the fuse date relating to the selected date range
        var data = fuse.data.filter(function(el){
          return targetDates.indexOf(el.date)>-1;
        });

        //loop through each date...
        for(var i=0;i<targetDates.length;i++){

          //get the fuse data for the current targetDate
          var day = data.filter(function(el){
            return el.date==targetDates[i];
          });

          //calculate the total
          var dayTotal=0;
          for(var j =0;j<day.length;j++){
            dayTotal+= day[j].value;
          }

          //add to the name array
          names.push(targetDates[i]);

          //push to the summary array
          if(dayTotal>0)
            summaryData.push(Number(dayTotal/day.length).toFixed(2));
          else
            summaryData.push(Number(0).toFixed(2));

        }

        //wrap the summaryData
        var outerWrap =[];
        outerWrap.push(summaryData);

        //return the summary data to the user.
        callback({
          labels:names,
          energyData:outerWrap
        });
      }
    });
  },
  //gets all fuses for the user...
  getFusesByOwner:function (ownerid,callback){

    //find all fuses
    this.Fuse.find({ownerID:ownerid},function (err, fuses) {
      if (err) return [];

      //set each fuses data to undefined so that we don't return it...
      for(var i=0;i<fuses.length;i++)
        fuses[i].data=undefined;

      //return the data to the client
      callback(fuses);
    });

  },
  //get a particular fuse
  getFuse:function (ownerid,fuseid,callback){
    //find the fuse!
    this.Fuse.findOne({ownerID:ownerid,id:fuseid},function (err, fuse) {

      //return error if we can't find the fuse
      //otherwise return the fuse 
      if (err||fuse===null){
          callback(-1);
          return;
      }else
        callback(fuse);
    });
  },
  //saves a base64 image to the server in png format
  uploadImage:function(ownerid,fuseid,b64string,url,callback){

    //create relevant variables
    var directory = "/images/"+ownerid+"/";
    var filename = fuseid+".png";
    var location = url+directory+filename;

    //get a local reference to a javascript file system object
    var fs = this.fs;

    //find the selected fuse
    this.Fuse.findOne({ownerID:ownerid,id:fuseid}, function(err,fuse){
      //check for errors
      if (err||fuse===null){
          callback(-1);
          return;
      }else{
        //create a callback function reference to handle success!
        var folderCreated = function(){

          //write the base 64 string to a file stream, and return success or fail
          fs.writeFile('./public'+directory+filename, b64string, {encoding:'base64',mode:'0777'}, function(err) {
            if (err)
              callback(-1);
            else{
              //update icon for this fuse
              fuse.icon = location;
              //save the new fuse
              fuse.save(function(err){
                if (err)
                  callback(-1);
                else
                  callback(true);
              });
            }
          });
        };

        //attempt to make the folder
        fs.mkdir('./public'+directory, '0777', function(err) {
          if (err) {
            //if the error code means folder exists...
            if (err.code == 'EEXIST')
              folderCreated(); //call folder created
            else
              callback(-1); //callback with error
          }else{
            folderCreated(); //the folder was created
          }
        });
        
      }
    });
  },
  //generates X number of dates (used in getSevenDaySummary)
  dateGenerator:function(numberOfDays){
    var moment = require('moment');
    var dateArray = [];
    for(var i=0;i<numberOfDays;i++)
      dateArray.push(moment().subtract(i,'days').format("DD-MM-YYYY"));
    return dateArray;
  },
  //edits a fuse based on the data provided
  editFuse:function(ownerid,fuseid,fuseName,description,callback){
    this.Fuse.findOne({ownerID:ownerid,id:fuseid}, function(err,fuse){
      
      if (err||fuse===null){
          callback(-1);
          return;
      }

      fuse.name = fuseName;
      fuse.description = description;
      fuse.save(function(err){
        if (err)
          callback(-1);
        else
          callback(true);
      });
    });
  },

};







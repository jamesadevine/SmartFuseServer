module.exports = {
  init:function (mongoinstance,uuid,fs,moment){
    this.mongoose=mongoinstance;
    this.uuid = uuid;
    this.fs = fs;
    this.moment=moment;
    this.energyManager =require('./energymanager');
    this.Fuse = this.mongoose.model('Fuse',{
      id:String,
      name:String,
      icon:String,
      description:String,
      ownerID:String,
      data:[{ value: Number, date: String}],
      online:Boolean,
      lastUpdated:Date
    });
    //this.Fuse.remove().exec();
  },
  add:function(ownerid,fuseid,name,callback){
    var newFuse = new this.Fuse({id:fuseid,name:name,ownerID:ownerid,data:[],online:true,lastUpdated:new Date()});
    this.Fuse.findOne({ownerID:ownerid,id:fuseid},function (err, fuse) {
      if (err)
        callback(-1);
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
  remove:function (ownerid,fuseid,callback){
    this.Fuse.remove({ownerID:ownerid,id:fuseid},function (err) {
      if (err)
        callback(false);
      else
        callback(true);
    });
  },
  addData:function (ownerid,fuseid,value,callback){
    var moment = this.moment();
    var timestamp = moment.format();
    var dateString = moment.format('DD-MM-YYYY');
    var timeString = moment.format('HH:mm:ss');
    
    this.Fuse.findOneAndUpdate({ownerID:ownerid,id:fuseid},{name:'Fuse '+fuseid,description:"Change the fuse description to something more meaningful",icon:'img/appliances/help.png', online:true, lastUpdated: timestamp,$set:{lastUpdated:timestamp},$push:{data:{value:value,date:dateString,time:timeString}}},{upsert:true},function (err) {
      if (err){
        console.log(err);
        callback(-1,null);
      }else{
        callback(true,value);
      }
    });
  },
  getSummaryData:function(user,ownerid,date,callback){
    //var moment = this.moment();
    var targetDate = this.moment(date,"DD-MM-YYYY");

    var energyManager = this.energyManager;

    this.Fuse.find({ownerID:ownerid,'data.date':targetDate.format('DD-MM-YYYY')},function (err,fuses) {

      if (err){
        console.log(err);
        callback(-1);
      }else{
        var summaryData = [];

        for(var i = 0;i<fuses.length;i++){
          var currentFuse = fuses[i].toObject();
          var dataToAdd = {
            name:currentFuse.name,
            id:currentFuse.id,
            data:currentFuse.data.filter(function(el){
              return el.date === targetDate.format('DD-MM-YYYY');
            })
          };
          summaryData.push(dataToAdd);
        }

        var stats = energyManager.getEnergyStats(user.countryCode);

        var dailyPrice = Number(stats.price[user.houseSize])/30;

        var names=[];
        var datapoints = [];
        var datapoints2 = [];
        var tempobject = [];
        var tempobject2 = [];

        for(var i = 0;i<summaryData.length;i++){
          var currentSummary = summaryData[i];
          
          names.push(currentSummary.name);
          var total = 0;
          for(var j = 0;j<currentSummary.data.length;j++){
            total+=currentSummary.data[j].value;
          }

          tempobject.push(Number(total/currentSummary.data.length).toFixed(2));

          var kwatts = (Number(total/currentSummary.data.length) * 3)/1000;

          console.log("daily ",dailyPrice," kwatts ",kwatts);
          tempobject2.push((dailyPrice*kwatts).toFixed(2));
        }
        datapoints.push(tempobject);
        datapoints2.push(tempobject2);

        callback({
              labels:names,
              energyData:datapoints,
              priceData:datapoints2
            });
      }

      
      
    });
  },
  getSevenDaySummary:function(ownerid,fuseid,callback){
    var dateGenerator = this.dateGenerator;
    this.Fuse.findOne({ownerID:ownerid,id:fuseid},function (err,fuse) {
      if (err){
        console.log(err);
        callback(-1);
      }else{
        var targetDates = dateGenerator(7);

        var summaryData = [];
        var names =[]

        var data = fuse.data.filter(function(el){
          return targetDates.indexOf(el.date)>-1;
        });

        for(var i=0;i<targetDates.length;i++){
          var day = data.filter(function(el){
            return el.date==targetDates[i];
          });
          var dayTotal=0;
          for(var j =0;j<day.length;j++){
            dayTotal+= day[j].value;
          }
          names.push(targetDates[i]);
          if(dayTotal>0)
            summaryData.push(Number(dayTotal/day.length).toFixed(2));
          else
            summaryData.push(Number(0).toFixed(2));

        }

        var outerWrap =[];
        outerWrap.push(summaryData);
        callback({
          labels:names,
          energyData:outerWrap
        });
      }
    });
  },
  getFusesByOwner:function (ownerid,callback){
    this.Fuse.find({ownerID:ownerid},function (err, fuses) {
      if (err) return console.error(err);

      for(var i=0;i<fuses.length;i++)
        fuses[i].data=undefined;
      callback(fuses);
    });

  },
  getFuse:function (ownerid,fuseid,callback){
    this.Fuse.findOne({ownerID:ownerid,id:fuseid},function (err, fuse) {
      if (err) callback(-1);
      if(fuse === null)
        callback(-1);
      else
        callback(fuse);
    });
  },
  uploadImage:function(ownerid,fuseid,b64string,url,callback){
    var directory = "/images/"+ownerid+"/";
    var filename = fuseid+".png";
    var location = url+directory+filename;

    var fs = this.fs;

    this.Fuse.findOne({ownerID:ownerid,id:fuseid}, function(err,fuse){
      if (err)
        callback(-1);
      else if(fuse === null)
        callback(-1);
      else{
        var folderCreated = function(){
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
  dateGenerator:function(numberOfDays){
    var moment = require('moment');
    var dateArray = [];
    for(var i=0;i<numberOfDays;i++)
      dateArray.push(moment().subtract(i,'days').format("DD-MM-YYYY"));
    return dateArray;
  },
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







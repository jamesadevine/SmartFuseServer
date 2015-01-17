module.exports = {
  init:function (mongoinstance,uuid,fs,moment){
    this.mongoose=mongoinstance;
    this.uuid = uuid;
    this.fs = fs;
    this.moment=moment;
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
    console.log(dateString);
    this.Fuse.findOneAndUpdate({ownerID:ownerid,id:fuseid},{name:'Fuse '+fuseid,description:"Change the fuse description to something more meaningful",icon:'img/appliances/questionmark.png', online:true, lastUpdated: timestamp,$set:{lastUpdated:timestamp},$push:{data:{value:value,date:dateString}}},{upsert:true},function (err) {
      if (err){
        console.log(err);
        callback(-1);
      }else{
        callback(true);
      }
    });
  },
  getSummaryData:function(ownerid,date,callback){
    //var moment = this.moment();
    var targetDate = this.moment(date,"DD-MM-YYYY");

    console.log(targetDate.format('DD-MM-YYYY'));
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
        console.log(summaryData);
        callback(summaryData);
      }

      
      
    });
  },
  getFusesByOwner:function (ownerid,callback){
    this.Fuse.find({ownerID:ownerid},function (err, fuses) {
      if (err) return console.error(err);
      console.log("fuses owner: ",ownerid," fuses: ",fuses);
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
      console.log("fuses owner: ",ownerid," fuses: ",fuse);
      
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
            console.log("fs err ",err);
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
        console.log('./public'+directory);
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
  editFuse:function(ownerid,fuseid,fuseName,description,callback){
    this.Fuse.findOne({ownerID:ownerid,id:fuseid}, function(err,fuse){
      
      if (err||fuse===null){
          callback(-1);
          return;
      }

      console.log("edit| fuse: ",fuse);
      fuse.name = fuseName;
      fuse.description = description;
      fuse.save(function(err){
        if (err)
          callback(-1);
        else
          callback(true);
      });
    });
  }
};





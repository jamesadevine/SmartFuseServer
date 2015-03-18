
var cheerio = require('cheerio');
var xmlParser = require('xml2js').parseString;

var schedule = require('node-schedule');

var generationLookup ={
  COAL:{
    color:"#000000",
    normalText:"Coal"
  },
  NUCLEAR:{
    color:"#00FF00",
    normalText:"Nuclear"
  },
  WIND:{
    color:"#ADD8E6",
    normalText:"Wind"
  },
  OIL:{
    color:"#3B3131",
    normalText:"Oil"
  },
  OCGT:{
    color:"#B6B6B4",
    normalText:"Open-Cycle Gas"
  },
  CCGT:{
    color:"#726E6D",
    normalText:"Combined-Cycle Gas"
  },
  INTEW:{
    color:"#008000",
    normalText:"East-West Irish Interconnector"
  },
  INTFR:{
    color:"#0000ff",
    normalText:"French Interconnector"
  },
  INTIRL:{
    color:"#ffa500",
    normalText:"Irish (Moyle) Interconnector"
  },
  INTNED:{
    color:"#ff0033",
    normalText:"Netherlands Interconnector"
  },
  NPSHYD:{
    color:"#58FAF4",
    normalText:"Non-Pumped-Storage Hydro"
  },
  PS:{
    color:"#0000A0",
    normalText:"Pumped Storage Hydro"
  },
  OTHER:{
    color:"#FFA500",
    normalText:"Other (including biomass)"
  }
};

module.exports = {
  init:function(mongoose,request,moment){
    this.mongoose = mongoose;
    this.cheerio = cheerio;
    this.request = request;
    this.moment=moment;

    this.EnergyStats = this.mongoose.model('EnergyStats',{
      date:String,
      currentPrice:{
        DayBaseGbp: String,
        DayBaseEur: String,
        TotalVolume: String,
        SparkSpread: String
      },
      currentGeneration:{
        time:String,
        total:String,
        color:String,
        normalText:String,
        data:{}
      },
      currentCarbon:{
        value:String,
        generation:String,
        status:String,
        saving:String,
        unit:String
      },
      historicGeneration:{
        period:String,
        total:String,
        data:{}
      },
      historicPrice:{},
      historicCarbon:{
        title:String,
        data:[{
          time:String,
          value:String
        }]
      }
    });
    
    //this.EnergyStats.remove().exec();

    this.carbonScraperURL = 'http://www.earth.org.uk/_gridCarbonIntensityGB.xml';
    this.currentEnergyScraperURL = 'http://www.nordpoolspot.com/api/marketdata/page/1639';
    this.currentGenerationScraperURL = 'http://www.bmreports.com/bsp/additional/soapfunctions.php?element=generationbyfueltypetable';
    this.historicEnergyScraperURL = 'http://www.nordpoolspot.com/api/marketdata/page/4708';

    var rule = new schedule.RecurrenceRule();

    rule.minute = [0,15,30,45];

    (function(self){
      self.carbonScraper();
      
    })(this);

    schedule.scheduleJob(rule, (function(self){
      return function(){
        self.carbonScraper();
      };
    })(this));

    schedule.scheduleJob(rule, (function(self){
      return function(){
        self.currentEnergyScraper();
      };
    })(this));
    schedule.scheduleJob(rule, (function(self){
      return function(){
        self.historicEnergyScraper();
      };
    })(this));
    schedule.scheduleJob(rule, (function(self){
      return function(){
        self.generationScraper();
      };
    })(this));




  },
  carbonScraper:function(){
    var parent = this;
    this.request(this.carbonScraperURL, function(error, response, html){
      // First we'll check to make sure no errors occurred when making the request
      if(!error){

        //parse the xml and filter out any unexpected characters in tags and attribs
        xmlParser(html,{
            trim:true,
            normalize:true,
            tagNameProcessors:[transformName],
            attrNameProcessors:[transformName]
          },
          function(err,result){
            console.log("ERROR: ",err,result);

            if(typeof result == 'undefined')
              return;

            //get the latest and historic data  
            var latest = result.results.latest[0];
            var historic = result.results.generationintensity[0].sample;

            //build the current data object
            var currentData ={
              unit:'gCO2/kWh',
              value:latest.carbonintensity[0],
              generation:latest.generation[0],
              status:result.results.status[0],
              saving:result.results.saving[0]
            };

            var historicData = {
              title:"Recent mean GMT hourly generation intensity gCO2/kWh",
              data:[]
            };

            for(var i = 0;i<historic.length;i++)
              historicData.data.push({time:historic[i].hour[0],value:historic[i].carbonintensity[0]});

            historicData.data.reverse();

            parent.updateEnergyStats({currentCarbonData:currentData,historicCarbonData:historicData},function(err,result){
              if(!err)
                console.log('Failed to save to mongo');
              else
                console.log('Data added');
            });
          }
        );
      }
    });
  },
  currentEnergyScraper:function(){
    var parent = this;

    this.request(this.currentEnergyScraperURL, function(error, response, html){
        // First we'll check to make sure no errors occurred when making the request
        var data ={};
        if(!error){
            var jsonResponse = JSON.parse(html);
            var todaysPrices = jsonResponse.data.Rows[1].Columns;
            for(var i =0;i<todaysPrices.length; i++)
              data[todaysPrices[i].Name]=todaysPrices[i].Value.replace(',','.');

            parent.updateEnergyStats({currentPriceData:data},function(err,result){
              if(!err)
                console.log('Failed to save to mongo');
              else
                console.log('Data added');
            });
        }
        
    });
  },
  historicEnergyScraper:function(){

    var parent = this;

    this.request(this.historicEnergyScraperURL, function(error, response, html){
        // First we'll check to make sure no errors occurred when making the request
        var data ={};
        if(!error){
            var jsonResponse = JSON.parse(html);
            var rows = jsonResponse.data.Rows;
            for(var i=0;i<24;i++){
              
              var historicPriceColumns = rows[i].Columns;
              //console.log('prices ',historicPriceColumns);
              for(var j =1;j<historicPriceColumns.length; j++){
                if(!data[i])
                  data[i]=[];
                data[i].push({
                  date:historicPriceColumns[j].Name,
                  value:historicPriceColumns[j].Value.replace(',','.')
                });
              }
                
            }
            
            parent.updateEnergyStats({historicPriceData:data},function(err,result){
              if(!err)
                console.log('Failed to save to mongo');
              else
                console.log('Data added');
            });
        }
    });
  },
  generationScraper:function(){
    
    var parent = this;

    this.request(this.currentGenerationScraperURL, function(error, response, html){
        // First we'll check to make sure no errors occurred when making the request
        var data ={};
        if(!error){
          
          xmlParser(html,{
            trim:true,
            normalize:true,
            tagNameProcessors:[transformName],
            attrNameProcessors:[transformName]
          },function(err,result){

            
            

            var instantaneousVals = result.generationbyfueltypetable.inst[0];

            var datetime = instantaneousVals.$.at.split(' ');
            var time = datetime[1];
            var currentTotal = instantaneousVals.$.total;

            //process current data
            var currentGenerationStats = {time:time,total:currentTotal,data:[]};
            for(var i=0;i<instantaneousVals.fuel.length;i++){

              var temp = generationLookup[instantaneousVals.fuel[i].$.type];
              
              currentGenerationStats.data.push({
                type: instantaneousVals.fuel[i].$.type,
                val: instantaneousVals.fuel[i].$.val,
                color:temp.color,
                normalText:temp.normalText,
                percent: instantaneousVals.fuel[i].$.pct,
              });
            }

            var last24hrsVals = result.generationbyfueltypetable.last24h[0];
            var period = last24hrsVals.$.at;
            var historicTotal = last24hrsVals.$.total;
            //get data from the last 24hrs
            var historicGenerationData = {period:period,total:historicTotal,data:[]};

            for(var j=0;j<last24hrsVals.fuel.length;j++){

              var temp = generationLookup[last24hrsVals.fuel[j].$.type];

              historicGenerationData.data.push({
                type: last24hrsVals.fuel[j].$.type,
                val: last24hrsVals.fuel[j].$.val,
                color:temp.color,
                normalText:temp.normalText,
                percent: last24hrsVals.fuel[j].$.pct,
              });
            }

            parent.updateEnergyStats({currentGenerationStats:currentGenerationStats,historicGenerationStats:historicGenerationData},function(err,result){
              if(!err)
                console.log('Failed to save to mongo');
              else
                console.log('Data added');
            });

          });
          
          
        }
    });
  },
  updateEnergyStats:function(values,callback){
    var moment = this.moment();
    var dateString = moment.format('DD-MM-YYYY');
    var EnergyStats = this.EnergyStats;
    
    this.EnergyStats.findOne({date:dateString},function (err,stats) {
      if (err){
        console.log(err);
        callback(-1,null);
        return;
      }else{
        //check if the stats doesn't exist
        if(stats === null){
          //add a new stat if it doesn't exist!!
          var newStats = new EnergyStats({
            date:dateString,
            currentPrice:(values.currentPriceData)?values.currentPriceData:'',
            historicPrice:(values.historicPriceData)?values.historicPriceData:'',
            currentCarbon:(values.currentCarbonData)?values.currentCarbonData:'',
            historicCarbon:(values.historicCarbonData)?values.historicCarbonData:'',
            currentGeneration:(values.currentGenerationStats)?values.currentGenerationStats:'',
            historicGeneration:(values.historicGenerationStats)?values.historicGenerationStats:''
          });

          //save the stats to mongo!
          newStats.save(function (err, stats) {
            if (err)
              callback(-1,null);
            else
              callback(true,null);
          });

        }else{
          //stats has been found, add the data
          if(values.currentPriceData)
            stats.currentPrice = values.currentPriceData;

          if(values.historicPriceData)
            stats.historicPrice = values.historicPriceData;

          if(values.currentCarbonData)
            stats.currentCarbon = values.currentCarbonData;

          if(values.historicCarbonData)
            stats.historicCarbon = values.historicCarbonData;

          if(values.currentGenerationStats)
            stats.currentGeneration = values.currentGenerationStats;

          if(values.historicGenerationStats)
            stats.historicGeneration = values.historicGenerationStats;



          //save the data to mongo!
          stats.save(function (err, stats) {
            console.log(err);
            if (err)
              callback(-1,null);
            else
              callback(true,null);
          });
        }
      }
    });
  },
  getFullStats: function(date,callback,filter){
    var targetDate = this.moment(date,"DD-MM-YYYY");
    this.EnergyStats.find({date:targetDate.format('DD-MM-YYYY')},function (err,stats) {
      if (err){
        console.log(err);
        callback(-1,{});
        return;
      }else{
        if(!stats.length){
          callback(-1,{});
          return;
        }

        if(filter == 'current'){
          stats[0].historicPrice = undefined;
          stats[0].historicCarbon = undefined;
          stats[0].historicGeneration = undefined;
        }

        if(filter == 'historic'){
          stats[0].currentCarbon = undefined;
          stats[0].currentGeneration = undefined;
          stats[0].currentPrice = undefined;
        }
        
        callback(true,stats[0]);
        return;
      }
    });
  },
  getCurrentPrice: function(callback){
    var targetDate = this.moment();
    console.log(targetDate.format('DD-MM-YYYY'));
    this.EnergyStats.find({date:targetDate.format('DD-MM-YYYY')},function (err,stats) {
      console.log("STATS ",stats);
        callback(true,stats.currentPrice);
        return;
    });
  },
  getEnergyStats:function(countryCode){
    var energyStats={
      uk:{
        //annual average
        //http://www.ukpower.co.uk/home_energy/average-energy-bill
        average:{
          small:2000,
          medium:3200,
          large:4900
        },
        //monthly average price
        price:{
          small:53,
          medium:77,
          large:107
        }
      },
      us:{
      }
    };
    //returns the energy stats for the respective countries
    return energyStats[countryCode];
  }
};
function transformName(name){
  //filter out the crap that some api's return...
  return name.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
}


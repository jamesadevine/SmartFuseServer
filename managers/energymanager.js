
var cheerio = require('cheerio');
var xmlParser = require('xml2js').parseString;

module.exports = {
  init:function(mongoose,request,moment){
    this.mongoose = mongoose;
    this.cheerio = cheerio;
    this.request = request;
    this.moment=moment;

    this.interval = 15; //minutes...

    this.EnergyStats = this.mongoose.model('EnergyStats',{
      date:String,
      currentPriceData:{
        DayBaseGbp: String,
        DayBaseEur: String,
        TotalVolume: String,
        SparkSpread: String
      },
      currentGenerationStats:{
        date:String,
        time:String,
        total:String,
        data:{}
      },
      historicPriceData:{},
      currentCarbonData:{
        value:String,
        unit:String,
        color:String
      },
      historicCarbonData:{
        title:String,
        data:[{
          time:String,
          value:String
        }]
      }
    });

    this.carbonScraperURL = 'http://www.earth.org.uk/_gridCarbonIntensityGB.html';
    this.currentEnergyScraperURL = 'http://www.nordpoolspot.com/api/marketdata/page/1639';
    this.currentGenerationScraperURL = 'http://www.bmreports.com/bsp/additional/soapfunctions.php?element=generationbyfueltypetable';
    this.historicEnergyScraperURL = 'http://www.nordpoolspot.com/api/marketdata/page/4708';

    setInterval((function(self){
      return function(){
        self.carbonScraper();
      };
    })(this), this.interval * 60 * 1000);

    setInterval((function(self){
      return function(){
        self.currentEnergyScraper();
      };
    })(this), this.interval * 60 * 1000);
    setInterval((function(self){
      return function(){
        self.historicEnergyScraper();
      };
    })(this),this.interval * 60 * 1000);
    setInterval((function(self){
      return function(){
        self.currentGenerationScraper();
      };
    })(this),this.interval * 60 * 1000);
  },
  carbonScraper:function(object){
    carbonValRegex = new RegExp(/[0-9]{2,5}/);
    carbonUnitRegex = new RegExp(/[A-Za-z]*[0-9]*(\/)+[A-Za-z]*/);
    console.log(this.carbonScraperURL);
    var parent = this;
    this.request(this.carbonScraperURL, function(error, response, html){
      // First we'll check to make sure no errors occurred when making the request
      if(!error){
        var $ = cheerio.load(html);
        var found = $('big span');
        var value = carbonValRegex.exec(found.text())[0];
        var unit = carbonUnitRegex.exec(found.text())[0];
        var color = found.css('color');
        
        var title = '';
        var data = [];

        var rows = $('tr').each(function(i,element){
          var row = $(this).prev();
          switch(i){
            case 4:
              title=row.text();
              break;
            case 5:
              var children = row.children('th').each(function(x,element){
                data.push({
                  time:$(this).text()
                });
              });
              break;
            case 6:
              var values = row.children('td').each(function(x,element){
                data[x].value = $(this).text();
              });
              break;
            default:
              return;
          }
        });

        var currentData = {
          value:value,
          unit:unit,
          color:color
        };

        var historicData = {
          title:title,
          data:data
        };

        parent.updateEnergyStats({currentCarbonData:currentData,historicCarbonData:historicData},function(err,result){
          if(!err)
            console.log('Failed to save to mongo');
          else
            console.log('Data added');
        });

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
  currentGenerationScraper:function(){
    function transformName(name){
      return name.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
    }
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
            var date = datetime[0];
            var time = datetime[1];
            var total = instantaneousVals.$.total;
            var data = {date:date,time:time,total:total,data:[]};
            for(var i=0;i<instantaneousVals.fuel.length;i++){
              data.data.push({
                type: instantaneousVals.fuel[i].$.type,
                val: instantaneousVals.fuel[i].$.val,
                percent: instantaneousVals.fuel[i].$.pct,
              });
            }
            parent.updateEnergyStats({currentGenerationStats:data},function(err,result){
              if(!err)
                console.log('Failed to save to mongo');
              else
                console.log('Data added');
            });
            console.log(data);
            console.log(time,total);
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
          var newFuse = new EnergyStats({
            date:dateString,
            currentPriceData:(values.currentPriceData)?values.currentPriceData:'',
            historicPriceData:(values.historicPriceData)?values.historicPriceData:'',
            currentCarbonData:(values.currentCarbonData)?values.currentCarbonData:'',
            historicCarbonData:(values.historicCarbonData)?values.historicCarbonData:'',
            currentGenerationStats:(values.currentGenerationStats)?values.currentGenerationStats:''
          });

          //save the fuse to mongo!
          newFuse.save(function (err, fuse) {
            if (err)
              callback(-1,null);
            else
              callback(true,null);
          });

        }else{
          //stats has been found, add the data
          if(values.currentPriceData)
            stats.currentPriceData = values.currentPriceData;

          if(values.historicPriceData)
            stats.historicPriceData = values.historicPriceData;

          if(values.currentCarbonData)
            stats.currentCarbonData = values.currentCarbonData;

          if(values.historicCarbonData)
            stats.historicCarbonData = values.historicCarbonData;

          if(values.currentGenerationStats)
            stats.currentGenerationStats = values.currentGenerationStats;

          //save the data to mongo!
          stats.save(function (err, stats) {
            if (err)
              callback(-1,null);
            else
              callback(true,null);
          });
        }
      }
    });
  },
  getFullStats: function(date,callback){
    var targetDate = this.moment(date,"DD-MM-YYYY");
    this.EnergyStats.find({date:targetDate.format('DD-MM-YYYY')},function (err,stats) {
      if (err){
        console.log(err);
        callback(-1,{});
        return;
      }else{
        callback(true,stats);
        return;
      }
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
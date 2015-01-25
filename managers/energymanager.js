
module.exports = {
  init:function(){

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
/* eslint-disable linebreak-style */

const covid19ImpactEstimator = (data) => {

  const toDays = () => {
    let { timeToElapse } = data;
    if (data.periodType === 'weeks') {
      timeToElapse = data.timeToElapse * 7;
    } else if (data.periodType === 'months') {
      timeToElapse = data.timeToElapse * 30;
    }
    return timeToElapse;
  };


  const currentlyInfected = (type) => (
    Math.trunc(data.reportedCases * type)
  );

  const infectionsByRequestedTime = (type) => {
    const factor = Math.trunc(toDays / 3);
    return Math.trunc(currentlyInfected(type) * (2 ** factor));
  };

  const severeCasesByRequestedTime = (type) => (
    Math.trunc(infectionsByRequestedTime(type) * 0.15)
  );

  const hospitalBedsByRequestedTime = (type) => (
    Math.trunc((data.totalHospitalBeds * 0.35) - severeCasesByRequestedTime(type))
  );

  const casesForICUByRequestedTime = (type) => (
    Math.trunc(infectionsByRequestedTime(type) * 0.05)
  );

  const casesForVentilatorByRequestedTime = (type) => (
    Math.trunc(infectionsByRequestedTime(type) * 0.02)
  );

  const dollarsInFlight = (type) => (
    Number((infectionsByRequestedTime(type) * data.region.avgDailyIncomeInUSD
    * data.region.avgDailyIncomePopulation * timeToElapse).toFixed(2))
  );

  const impact = {
    currentlyInfected: currentlyInfected(10),
    infectionsByRequestedTime: infectionsByRequestedTime(10),
    severeCasesByRequestedTime: severeCasesByRequestedTime(10),
    hospitalBedsByRequestedTime: hospitalBedsByRequestedTime(10),
    casesForICUByRequestedTime: casesForICUByRequestedTime(10),
    casesForVentilatorByRequestedTime: casesForVentilatorByRequestedTime(10),
    dollarsInFlight: dollarsInFlight(10)
  };

  const severeImpact = {
    currentlyInfected: currentlyInfected(50),
    infectionsByRequestedTime: infectionsByRequestedTime(50),
    severeCasesByRequestedTime: severeCasesByRequestedTime(50),
    hospitalBedsByRequestedTime: hospitalBedsByRequestedTime(50),
    casesForICUByRequestedTime: casesForICUByRequestedTime(50),
    casesForVentilatorByRequestedTime: casesForVentilatorByRequestedTime(50),
    dollarsInFlight: dollarsInFlight(50)
  };

  return {
    data,
    estimate: { impact, severeImpact }
  };
};

module.exports = { covid19ImpactEstimator };

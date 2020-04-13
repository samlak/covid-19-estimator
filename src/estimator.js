/* eslint-disable linebreak-style */

const toDays = (data) => {
  let { timeToElapse } = data;
  if (data.periodType === 'weeks') {
    timeToElapse = data.timeToElapse * 7;
  } else if (data.periodType === 'months') {
    timeToElapse = data.timeToElapse * 30;
  }
  return timeToElapse;
};

const currentlyInfected = (data, type) => (
  Math.trunc(data.reportedCases * type)
);

const infectionsByRequestedTime = (data, type) => {
  const factor = Math.trunc(toDays(data) / 3);
  return Math.trunc(currentlyInfected(data, type) * (2 ** factor));
};

const severeCasesByRequestedTime = (data, type) => (
  Math.trunc(infectionsByRequestedTime(data, type) * 0.15)
);

const hospitalBedsByRequestedTime = (data, type) => (
  Math.trunc((data.totalHospitalBeds * 0.35) - severeCasesByRequestedTime(data, type))
);

const casesForICUByRequestedTime = (data, type) => (
  Math.trunc(infectionsByRequestedTime(data, type) * 0.05)
);

const casesForVentilatorByRequestedTime = (data, type) => (
  Math.trunc(infectionsByRequestedTime(data, type) * 0.02)
);

const dollarsInFlight = (data, type) => (
  Number((infectionsByRequestedTime(data, type) * data.region.avgDailyIncomeInUSD
  * data.region.avgDailyIncomePopulation * toDays(data)).toFixed(2))
);


const covid19ImpactEstimator = (data) => {
  const impact = {
    currentlyInfected: currentlyInfected(data, 10),
    infectionsByRequestedTime: infectionsByRequestedTime(data, 10),
    severeCasesByRequestedTime: severeCasesByRequestedTime(data, 10),
    hospitalBedsByRequestedTime: hospitalBedsByRequestedTime(data, 10),
    casesForICUByRequestedTime: casesForICUByRequestedTime(data, 10),
    casesForVentilatorByRequestedTime: casesForVentilatorByRequestedTime(data, 10),
    dollarsInFlight: dollarsInFlight(data, 10)
  };

  const severeImpact = {
    currentlyInfected: currentlyInfected(data, 50),
    infectionsByRequestedTime: infectionsByRequestedTime(data, 50),
    severeCasesByRequestedTime: severeCasesByRequestedTime(data, 50),
    hospitalBedsByRequestedTime: hospitalBedsByRequestedTime(data, 50),
    casesForICUByRequestedTime: casesForICUByRequestedTime(data, 50),
    casesForVentilatorByRequestedTime: casesForVentilatorByRequestedTime(data, 50),
    dollarsInFlight: dollarsInFlight(data, 50)
  };

  return {
    data,
    estimate: { impact, severeImpact }
  };
};

module.exports = { covid19ImpactEstimator };

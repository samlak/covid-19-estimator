/* eslint-disable linebreak-style */
/* eslint-disable max-len */

const impact = {};
const severeImpact = {};

const currentlyInfectedEstimate = (data) => {
  const { reportedCases, periodType } = data;
  let { timeToElapse } = data;

  if (periodType === 'weeks') {
    timeToElapse *= 7;
  }

  if (periodType === 'months') {
    timeToElapse *= 30;
  }

  data.timeToElapse = timeToElapse;

  const powerFactor = Math.trunc(timeToElapse / 3);

  impact.currentlyInfected = reportedCases * 10;

  impact.infectionsByRequestedTime = Math.trunc(impact.currentlyInfected * (2 ** powerFactor));

  severeImpact.currentlyInfected = reportedCases * 50;

  severeImpact.infectionsByRequestedTime = Math.trunc(severeImpact.currentlyInfected * (2 ** powerFactor));
};

const severeCasesByRequestedTime = (data) => {
  const { timeToElapse } = data;

  const powerFactor = Math.trunc(timeToElapse / 3);

  impact.severeCasesByRequestedTime = Math.trunc((15 / 100) * impact.currentlyInfected * (2 ** powerFactor));

  severeImpact.severeCasesByRequestedTime = Math.trunc((15 / 100) * (severeImpact.currentlyInfected * (2 ** powerFactor)));
};

const hospitalBedsByRequestedTime = (data) => {
  const { totalHospitalBeds } = data;

  const availableBeds = (35 / 100) * totalHospitalBeds;

  impact.hospitalBedsByRequestedTime = Math.trunc(availableBeds - impact.severeCasesByRequestedTime);

  severeImpact.hospitalBedsByRequestedTime = Math.trunc(availableBeds - severeImpact.severeCasesByRequestedTime);
};

const casesForICUByRequestedTime = () => {
  impact.casesForICUByRequestedTime = Math.trunc(impact.infectionsByRequestedTime * (5 / 100));

  severeImpact.casesForICUByRequestedTime = Math.trunc(severeImpact.infectionsByRequestedTime * (5 / 100));
};

const casesForVentilatorsByRequestedTime = () => {
  impact.casesForVentilatorsByRequestedTime = Math.trunc(impact.infectionsByRequestedTime * (2 / 100));
  severeImpact.casesForVentilatorsByRequestedTime = Math.trunc(severeImpact.infectionsByRequestedTime * (2 / 100));
};

const dollarsInFlight = (data) => {
  const { region } = data;
  const { timeToElapse } = data;
  impact.dollarsInFlight = Number(((impact.infectionsByRequestedTime * region.avgDailyIncomePopulation * region.avgDailyIncomeInUSD) * timeToElapse).toFixed(2));
  severeImpact.dollarsInFlight = Number(((severeImpact.infectionsByRequestedTime * region.avgDailyIncomePopulation * region.avgDailyIncomeInUSD) * timeToElapse).toFixed(2));
};

const covid19ImpactEstimator = (data) => {
  const estimator = () => {
    currentlyInfectedEstimate(data);
    severeCasesByRequestedTime(data);
    hospitalBedsByRequestedTime(data);
    casesForICUByRequestedTime(data);
    casesForVentilatorsByRequestedTime();
    dollarsInFlight(data);
  };

  estimator(data);

  return ({
    data,
    impact,
    severeImpact
  });
};

module.exports = { covid19ImpactEstimator };

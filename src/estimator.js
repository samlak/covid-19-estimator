/* eslint-disable linebreak-style */

const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const EasyXml = require('easyxml');

const app = express();
const port = process.env.PORT || 3000;
const NS_PER_SEC = 1e9;
const MS_PER_NS = 1e-6;

app.use(bodyParser.json());

const serializer = new EasyXml({
  singularize: true,
  rootElement: 'response',
  dateFormat: 'ISO',
  manifest: true
});

// Function

const convertToDays = (periodType, timeToElapse) => {
  switch (periodType) {
    case 'weeks':
      return timeToElapse * 7;
    case 'months':
      return timeToElapse * 30;
    default:
      return timeToElapse;
  }
};

const fifteenPercent = (infectionsByRequestedTime) => Math.trunc(0.15 * infectionsByRequestedTime);

const availableBeds = (totalHospitalBeds, severeCasesByRequestedTime) => {
  const availableBedSpace = 0.35 * totalHospitalBeds;
  return Math.trunc(availableBedSpace - severeCasesByRequestedTime);
};

const ICUcare = (infectionsByRequestedTime) => Math.trunc(0.05 * infectionsByRequestedTime);

const ventilators = (infectionsByRequestedTime) => Math.trunc(0.02 * infectionsByRequestedTime);

const dollarsInFlightCalc = (
  infectionsByRequestedTime,
  avgDailyIncome,
  avgDailyIncomePercent,
  days
) => {
  const value = (infectionsByRequestedTime * avgDailyIncome * avgDailyIncomePercent) * days;
  return Number(value.toFixed(2));
};

const covid19ImpactEstimator = (data) => {
  const outputData = {
    data: null,
    impact: {},
    severeImpact: {}
  };

  const {
    timeToElapse,
    reportedCases,
    periodType,
    totalHospitalBeds
  } = data;
  const { avgDailyIncomeInUSD, avgDailyIncomePopulation } = data.region;
  const { impact, severeImpact } = outputData;
  outputData.data = data;
  impact.currentlyInfected = reportedCases * 10;
  severeImpact.currentlyInfected = reportedCases * 50;
  const days = convertToDays(periodType, timeToElapse);
  const factor = 2 ** Math.trunc(days / 3);
  impact.infectionsByRequestedTime = impact.currentlyInfected * factor;
  severeImpact.infectionsByRequestedTime = severeImpact.currentlyInfected * factor;
  impact.severeCasesByRequestedTime = fifteenPercent(
    impact.infectionsByRequestedTime
  );
  severeImpact.severeCasesByRequestedTime = fifteenPercent(
    severeImpact.infectionsByRequestedTime
  );
  impact.hospitalBedsByRequestedTime = availableBeds(
    totalHospitalBeds,
    impact.severeCasesByRequestedTime
  );
  severeImpact.hospitalBedsByRequestedTime = availableBeds(
    totalHospitalBeds,
    severeImpact.severeCasesByRequestedTime
  );
  impact.casesForICUByRequestedTime = ICUcare(impact.infectionsByRequestedTime);
  severeImpact.casesForICUByRequestedTime = ICUcare(
    severeImpact.infectionsByRequestedTime
  );
  impact.casesForVentilatorsByRequestedTime = ventilators(
    impact.infectionsByRequestedTime
  );
  severeImpact.casesForVentilatorsByRequestedTime = ventilators(
    severeImpact.infectionsByRequestedTime
  );
  impact.dollarsInFlight = dollarsInFlightCalc(
    impact.infectionsByRequestedTime,
    avgDailyIncomePopulation,
    avgDailyIncomeInUSD,
    days
  );
  severeImpact.dollarsInFlight = dollarsInFlightCalc(
    severeImpact.infectionsByRequestedTime,
    avgDailyIncomePopulation,
    avgDailyIncomeInUSD,
    days
  );
  return outputData;
};

// Backend

const fetchLogs = () => {
  try {
    const noteString = fs.readFileSync('logs.txt').toString();
    return noteString;
  } catch (e) {
    return '';
  }
};

const addLogs = (method, path, status, time) => {
  let logs = fetchLogs();
  const log = `${method}\t\t${path}\t\t${status}\t\t${time}\n`;
  logs += log;
  fs.writeFileSync('logs.txt', logs);
};


app.post('/api/v1/on-covid-19', async (req, res) => {
  const time = process.hrtime();
  try {
    const estimator = covid19ImpactEstimator(req.body);
    res.status(200).send(estimator);
  } catch (e) {
    res.status(400).send({
      error: 'There was an error with your input. Make sure you insert the parameters correctly'
    });
  }
  const diff = process.hrtime(time);
  const responseTime = `${(diff[0] * NS_PER_SEC + diff[1]) * MS_PER_NS} ms`;
  addLogs(req.method, req.path, res.statusCode, responseTime);
});

app.post('/api/v1/on-covid-19/json', async (req, res) => {
  const time = process.hrtime();
  try {
    const estimator = covid19ImpactEstimator(req.body);
    res.header('Content-Type', 'application/json');
    res.status(200).send(estimator);
  } catch (e) {
    res.status(400).send({
      error: 'There was an error with your input. Make sure you insert the parameters correctly'
    });
  }
  const diff = process.hrtime(time);
  const responseTime = `${(diff[0] * NS_PER_SEC + diff[1]) * MS_PER_NS} ms`;
  addLogs(req.method, req.path, res.statusCode, responseTime);
});

app.post('/api/v1/on-covid-19/xml', async (req, res) => {
  const time = process.hrtime();
  try {
    const estimator = serializer.render(covid19ImpactEstimator(req.body));
    res.header('Content-Type', 'text/xml');
    res.status(200).send(estimator);
  } catch (e) {
    res.status(400).send(
      serializer.render({
        error: 'There was an error with your input. Make sure you insert the parameters correctly'
      })
    );
  }
  const diff = process.hrtime(time);
  const responseTime = `${(diff[0] * NS_PER_SEC + diff[1]) * MS_PER_NS} ms`;
  addLogs(req.method, req.path, res.statusCode, responseTime);
});

app.get('/api/v1/on-covid-19/logs', async (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.status(200).send(fetchLogs());
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening on port ${port}`);
});


// module.exports = covid19ImpactEstimator;
export default covid19ImpactEstimator;

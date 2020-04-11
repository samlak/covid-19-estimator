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

const covid19ImpactEstimator = (data) => {
  let { timeToElapse } = data;

  if (data.periodType === 'weeks') {
    timeToElapse = data.timeToElapse * 7;
  } else if (data.periodType === 'months') {
    timeToElapse = data.timeToElapse * 30;
  }

  const infectionsByRequestedTimeCalculation = (currentlyInfected) => {
    const factor = Math.trunc(timeToElapse / 3);
    return Math.trunc(currentlyInfected * (2 ** factor));
  };

  const impact = {
    currentlyInfected: data.reportedCases * 10,
    get infectionsByRequestedTime() {
      return infectionsByRequestedTimeCalculation(this.currentlyInfected);
    },
    get severeCasesByRequestedTime() {
      return Math.trunc(this.infectionsByRequestedTime * 0.15);
    },
    get hospitalBedsByRequestedTime() {
      return Math.trunc((data.totalHospitalBeds * 0.35) - this.severeCasesByRequestedTime);
    },
    get casesForICUByRequestedTime() {
      return Math.trunc(this.infectionsByRequestedTime * 0.05);
    },
    get casesForVentilatorByRequestedTime() {
      return Math.trunc(this.infectionsByRequestedTime * 0.02);
    },
    get dollarsInFlight() {
      return Number((this.infectionsByRequestedTime * data.region.avgDailyIncomeInUSD
      * data.region.avgDailyIncomePopulation * timeToElapse).toFixed(2));
    }
  };

  const severeImpact = {
    currentlyInfected: data.reportedCases * 50,
    get infectionsByRequestedTime() {
      return infectionsByRequestedTimeCalculation(this.currentlyInfected);
    },
    get severeCasesByRequestedTime() {
      return Math.trunc(this.infectionsByRequestedTime * 0.15);
    },
    get hospitalBedsByRequestedTime() {
      return Math.trunc((data.totalHospitalBeds * 0.35) - this.severeCasesByRequestedTime);
    },
    get casesForICUByRequestedTime() {
      return Math.trunc(this.infectionsByRequestedTime * 0.05);
    },
    get casesForVentilatorByRequestedTime() {
      return Math.trunc(this.infectionsByRequestedTime * 0.02);
    },
    get dollarsInFlight() {
      return Number((this.infectionsByRequestedTime * data.region.avgDailyIncomeInUSD
      * data.region.avgDailyIncomePopulation * timeToElapse).toFixed(2));
    }
  };

  return {
    data,
    estimate: {
      impact: {
        currentlyInfected: impact.currentlyInfected,
        infectionsByRequestedTime: impact.infectionsByRequestedTime,
        severeCasesByRequestedTime: impact.severeCasesByRequestedTime,
        hospitalBedsByRequestedTime: impact.hospitalBedsByRequestedTime,
        casesForICUByRequestedTime: impact.casesForICUByRequestedTime,
        casesForVentilatorByRequestedTime: impact.casesForVentilatorByRequestedTime,
        dollarsInFlight: impact.dollarsInFlight
      },
      severeImpact: {
        currentlyInfected: severeImpact.currentlyInfected,
        infectionsByRequestedTime: severeImpact.infectionsByRequestedTime,
        severeCasesByRequestedTime: severeImpact.severeCasesByRequestedTime,
        hospitalBedsByRequestedTime: severeImpact.hospitalBedsByRequestedTime,
        casesForICUByRequestedTime: severeImpact.casesForICUByRequestedTime,
        casesForVentilatorByRequestedTime: severeImpact.casesForVentilatorByRequestedTime,
        dollarsInFlight: severeImpact.dollarsInFlight
      }
    }
  };
};

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

// console.log(fetchLogs());

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
  console.log(`Listening to port ${port}`);
});

module.exports = { covid19ImpactEstimator };

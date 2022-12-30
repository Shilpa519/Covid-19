const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Hai Shilpa, Server Started!");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertingStateToCamelCase = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertingDistrictToCamelCase = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertingStateStatsToCamelCase = (dbObject) => {
  return {
    totalCases: dbObject.cases,
    totalCured: dbObject.cured,
    totalActive: dbObject.active,
    totalDeaths: dbObject.deaths,
  };
};

//GET States API

app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachItem) => convertingStateToCamelCase(eachItem))
  );
});

//GET State API

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE
    state_id = ${stateId};`;
  const stateArray = await db.get(getStateQuery);
  response.send(convertingStateToCamelCase(stateArray));
});

//CREATE District

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const postDistrictQuery = `INSERT INTO district(district_name,
        state_id,cases,cured,active,deaths) VALUES ('${districtName}',
        ${stateId},${cases},${cured},${active},${deaths});`;
  const dbResponse = await db.run(postDistrictQuery);
  const districtId = dbResponse.lastDB;
  response.send("District Successfully Added");
});

//GET District

app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id=
    ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(convertingDistrictToCamelCase(district));
});

//DELETE District

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district 
    WHERE district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//UPDATE District

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `UPDATE district SET district_name='${districtName}',
    state_id = ${stateId},cases = ${cases},cured = ${cured},
    active=${active},deaths=${deaths} WHERE district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//GET State Statistics

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStats = `SELECT * FROM district WHERE state_id = ${stateId};`;
  const stats = await db.get(getStateStats);
  response.send(convertingStateStatsToCamelCase(stats));
});

//GET State Name

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateName = `SELECT state_id FROM district
     WHERE district_id = ${districtId};`;
  const { stateId } = await db.get(getStateName);
  response.send({ stateId });
});

module.exports = app;

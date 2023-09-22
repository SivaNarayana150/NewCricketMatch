const express = require("express");
const path = require("path");

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

app.use(express.json());

let db = null;

const initializeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log(
        "Server Running SUccessfully at http://localhost:3001/cricketMatchDetails.db"
      );
    });
  } catch (e) {
    console.log(`DB error message: ${e.message}`);
    process.exit(1);
  }
};
initializeDatabaseAndServer();

// API 1 Returns a list of all the players in the player table

//convert Object SnakeCase to Camel Case
const convertPlayersListObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const listOfAllPlayersQuery = `
    SELECT * FROM 
    player_details;`;
  const dbResponse = await db.all(listOfAllPlayersQuery);
  response.send(
    dbResponse.map((finalResponse) => convertPlayersListObject(finalResponse))
  );
});

//API 2 Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getASpecifiedPlayerQuery = `
    SELECT 
    *
    FROM 
    player_details
    WHERE player_id=${playerId};`;
  const dbResponse = await db.get(getASpecifiedPlayerQuery);
  response.send(convertPlayersListObject(dbResponse));
});

// API 3 Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updateASpecifiedPlayerQuery = `
    UPDATE 
    player_details
    SET
   
   player_name='${playerName}';`;
  const dbResponse = await db.run(updateASpecifiedPlayerQuery);
  response.send("Player Details Updated");
});

//API 4 Returns the match details of a specific match

const convertSnakeCaseToCamelCaseMatch = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const toGetParticularMatchQuery = `
    SELECT *
    FROM
    match_details
    WHERE match_id=${matchId};`;
  const dbResponse = await db.get(toGetParticularMatchQuery);
  response.send(convertSnakeCaseToCamelCaseMatch(dbResponse));
});

// API 5 Returns a list of all the matches of a player

const NaturalJoinObjectConverter = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const toMatchPlayerQuery = `
    SELECT 
    * FROM 
    player_match_score NATURAL JOIN match_details
    WHERE player_id=${playerId};`;

  const dbResponse = await db.all(toMatchPlayerQuery);
  response.send(dbResponse.map((each) => NaturalJoinObjectConverter(each)));
});

//API 6 Returns a list of players of a specific match
const NaturalJoinObjectConverterPlayer = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const matchesQuery = `
    SELECT *
    FROM
   player_match_score NATURAL JOIN player_details 
   WHERE match_id=${matchId};`;

  const dbResponse = await db.all(matchesQuery);
  response.send(
    dbResponse.map((each) => NaturalJoinObjectConverterPlayer(each))
  );
});

// API 7 Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const gettingQueryOfStats = `
    SELECT 
    player_id as playerId,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM player_match_score
    NATURAL JOIN player_details
    WHERE player_id=${playerId};`;
  const playersMatchesDetails = await db.get(gettingQueryOfStats);
  response.send(playersMatchesDetails);
});
module.exports = app;

import axios from "axios";
import * as sqlite from "sqlite3";

type ApiResponse = {
  last_updated: number;
  data: {
    bikes: BikeLocation[];
  };
  ttl: number;
};
type BikeLocation = {
  bike_id: string;
  lat: number;
  lon: number;
  is_reserved: boolean;
  is_disabled: boolean;
};

const pollBird = (statement: sqlite.Statement) => async () => {
  const response = await axios.get<ApiResponse>(
    "https://mds.bird.co/gbfs/arlingtonco/free_bikes"
  );
  const payload = response.data;
  const timestamp = payload.last_updated;

  console.log(`polling at ${Date.now()}, last updated at ${timestamp}`);

  payload.data.bikes.forEach(
    ({ bike_id, lat, lon, is_disabled, is_reserved }) => {
      statement.run([bike_id, lat, lon, is_reserved, is_disabled, timestamp]);
    }
  );
};

const main = async () => {
  const db = new sqlite.Database("./mydb.db");

  // async
  db.run(
    `CREATE TABLE IF NOT EXISTS scooter_events (bike_id TEXT, lat NUMERIC, lon NUMERIC, is_reserved BOOLEAN, is_disabled BOOLEAN, timestamp NUMERIC);`
  );

  const statement = db.prepare(
    `INSERT INTO scooter_events VALUES (?, ?, ?, ?, ?, ?);`
  );

  setInterval(pollBird(statement), 60000);
};

main();

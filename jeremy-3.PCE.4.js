// install pg and import it
import pg from 'pg';

const { Client } = pg;
// config the links to your database
const pgConnectionConfigs = {
  name: 'jeremylim',
  host: 'localhost',
  database: 'jeremylim',
  port: '5432',
};
// create a variable that conects with your database using the configs above
const client = new Client(pgConnectionConfigs);
// connect your database
client.connect();
// Declare modes that will determine the SQL query
const mode = process.argv[2];
const LOG = 'log';
const REPORT = 'report';
const EDIT = 'edit';
// write your sql query
const getSQLQuery = () => {
  let sqlQuery = '';
  let inputData = '';
  if (mode === LOG) {
    sqlQuery = 'INSERT INTO meal_details (type, description, amount_of_alcohol, was_hungry_before_eating) VALUES ($1, $2, $3, $4) RETURNING *';
    inputData = [`${process.argv[3]}`, `${process.argv[4]}`, `${process.argv[5]}`, `${process.argv[6]}`];
  } else if (mode === REPORT) {
    sqlQuery = 'SELECT * FROM meal_details';
  } else if (mode === EDIT) {
    console.log('entered edit mode');
    sqlQuery = `UPDATE meal_details SET ${process.argv[3]}= '${process.argv[4]}' WHERE id='${process.argv[5]}' RETURNING *`;
  }
  else {
    console.log('Mode entered is invalid; ent16121er \'log\' or \'report\'');
  }
  return {
    sqlQuery,
    inputData,
  };
};
const { sqlQuery, inputData } = getSQLQuery();
// execute the sql query
client.query(sqlQuery, inputData, (err, result) => {
  if (err) {
    console.log(`Error: ${err}`);
  } else {
    console.table(result.rows);
  }
  client.end();
  console.log('Ended the connection');
});

import pg from 'pg';

const { Client } = pg;

// set the way we will connect to the server
const pgConnectionConfigs = {
  user: 'aljt',
  host: 'localhost',
  database: 'cat_owners',
  port: 5432, // Postgres server always runs on this port
};

// create the var we'll use
const client = new Client(pgConnectionConfigs);

// make the connection to the server
client.connect();

// Declare modes that will determine the SQL query
const mode = process.argv[2];
const CREATE_OWNER = 'create-owner';
const CREATE_CAT = 'create-cat';
const CATS = 'cats';
const OWNERS = 'owners';

// helper functions ================================================
// 1st sql query according to mode chosen
const getSQLQuery = () => {
  let sqlQuery = '';
  let inputData = '';

  if (mode === CREATE_OWNER) {
    sqlQuery = 'INSERT INTO owners (name) VALUES ($1) RETURNING *';
    inputData = [`${process.argv[3]}`];
  } else if (mode === CREATE_CAT) {
    sqlQuery = 'INSERT INTO cats (owner_id, name) VALUES ($1, $2) RETURNING *';
    inputData = [`${process.argv[3]}`, `${process.argv[4]}`];
  } else if (mode === CATS) {
    sqlQuery = 'SELECT * FROM cats WHERE owner_id=1';
  } else if (mode === OWNERS) {
    sqlQuery = 'SELECT * FROM owners';
  }
  else {
    console.log('Mode entered is invalid; please enter \'create-owner\' or \'create-cat\'');
  }

  return {
    sqlQuery,
    inputData,
  };
};

// program logic ====================================================
const { sqlQuery, inputData } = getSQLQuery();

// execute the 1st sql query
client.query(sqlQuery, inputData, (err, result) => {
  if (err) {
    console.log(`Error: ${err}`);

    client.end();
    console.log('Ended the connection');
  } else if (mode === CATS) {
    // display the cat entries
    console.table(result.rows);

    const ownerId = result.rows[0].owner_id;

    const ownerNameQuery = `SELECT * FROM owners WHERE id='${ownerId}'`;

    // logic for 2nd query
    client.query(ownerNameQuery, (ownerNameQueryError, ownerNameQueryResult) => {
      // this error is anything that goes wrong with the query
      if (ownerNameQueryError) {
        console.error('ownerNameQuery query error', ownerNameQueryError);
        return;
      }

      // display only the entries in the owners table that match the ownerId of the cats selected
      // (see line 39)
      console.table(ownerNameQueryResult.rows);

      // console.log the cat names and their owner name
      console.log('Cats:');
      result.rows.forEach((catRow) => {
        const output = `${catRow.id}. ${catRow.name} , Owner: ${ownerNameQueryResult.rows[0].name}`;

        console.log(output);
      });

      client.end();
      console.log('Ended the connection');
    });
  } else if (mode === OWNERS) {
    const catNamesQuery = 'SELECT * FROM cats';

    // logic for 2nd query
    client.query(catNamesQuery, (catNamesQueryError, catsNamesQueryResult) => {
      // this error is anything that goes wrong with the query
      if (catNamesQueryError) {
        console.error('catNamesQueryError query error', catNamesQueryError);
        return;
      }

      // console.log the owners and their cat names
      console.log('Owners:');
      result.rows.forEach((ownerName) => {
        console.log(`${ownerName.id}. ${ownerName.name}`);
        console.log(' - Cats:');

        // print the cats owned by that owner
        catsNamesQueryResult.rows.forEach((catName) => {
          if (catName.owner_id === ownerName.id) {
            console.log(`   - ${catName.name}`);
          }
        });
      });

      client.end();
      console.log('Ended the connection');
    });
  }
  else {
    // show the entries in the table
    console.table(result.rows);

    client.end();
    console.log('Ended the connection');
  }
});

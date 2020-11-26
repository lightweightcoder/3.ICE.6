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
let catName = '';
let numCatsOwned;

// helper functions ================================================
// 1st sql query according to mode chosen
const getSQLQuery = () => {
  let sqlQuery = '';
  let inputData = '';

  if (mode === CREATE_OWNER) {
    sqlQuery = 'INSERT INTO owners (name) VALUES ($1) RETURNING *';

    inputData = [`${process.argv[3]}`];
  } else if (mode === CREATE_CAT) {
    sqlQuery = 'SELECT id FROM owners WHERE name=$1';

    inputData = [`${process.argv[3]}`];

    // eslint-disable-next-line prefer-destructuring
    catName = process.argv[4];
  } else if (mode === CATS) {
    sqlQuery = 'SELECT cats.id, cats.name AS cat_name, cats.owner_id, owners.name AS owner_name FROM cats INNER JOIN owners ON cats.owner_id = owners.id';
  } else if (mode === OWNERS) {
    if (process.argv[3] && !Number.isNaN(process.argv[3])) {
      // This is for (Get Owners with Specific Number of Cats) secion

      // eslint-disable-next-line prefer-destructuring
      numCatsOwned = process.argv[3];

      sqlQuery = 'SELECT owner_id FROM cats';
    } else {
      // this is for (Get List of Owners and Respective Cats) section
      sqlQuery = 'SELECT owners.id, owners.name AS owner_name, cats.name AS cat_name, cats.owner_id FROM cats INNER JOIN owners ON cats.owner_id = owners.id';
    }
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
    // display the cat and owners entries
    console.table(result.rows);
    client.end();
    console.log('Ended the connection');
  } else if (mode === OWNERS) {
    if (sqlQuery === 'SELECT owner_id FROM cats') {
      // display the owner_ids in cats table
      console.table(result.rows);

      // object to store the number of cats for each owner
      // keys: owner_id , value: number of cats owned
      const ownerIdAndNumOfCats = {};

      // logic to store the number of cats for each owner
      for (let i = 0; i < result.rows.length; i += 1) {
        // get the current owner_id in the cats table
        const current = result.rows[i].owner_id;

        if (!ownerIdAndNumOfCats[current]) {
          // if key (owner_id) does not exist, add the key
          ownerIdAndNumOfCats[current] = 1;
        } else {
          // if key exists, then increment the value (num of cats) by 1
          ownerIdAndNumOfCats[current] += 1;
        }
      }

      console.log('ownerIdObj:', ownerIdAndNumOfCats);

      // to store owner_ids that have the number of cats indicated in process.argv[3]
      const filteredOwnerIds = [];

      // convert the object into an array so we can use the forEach method
      // each array element is an array where the 1st value is the key and the
      // 2nd value is the value of the key
      const ownerIdAndNumOfCatsArray = Object.entries(ownerIdAndNumOfCats);

      // iterate each array element
      // if the number of cats owned by that owner_id (value) is the same as numCatsOwned,
      // push the owner_id (key) into filteredOwnerIds
      ownerIdAndNumOfCatsArray.forEach(([key, value]) => {
        if (value === Number(numCatsOwned)) {
          filteredOwnerIds.push(key);
        }
      });

      if (filteredOwnerIds.length > 0) {
      // for each owner_id that has the number of cats same as numCatsOwned,
      // extract the owner name from owners table and display it
        filteredOwnerIds.forEach((ownerId, index) => {
          // set the 2nd sql query
          const secondSqlQuery = `SELECT name FROM owners WHERE id=${ownerId}`;

          // execute the 2nd sql query
          client.query(secondSqlQuery, (secondQueryErr, secondQueryResult) => {
            if (secondQueryErr) {
              console.log(`Error: ${secondQueryErr}`);

              client.end();
              console.log('Ended the connection');
              return;
            }

            // display the owner name
            console.log('owner name: ', secondQueryResult.rows[0].name);

            // end the connection after printing out all the owners
            if (index === filteredOwnerIds.length - 1) {
              client.end();
              console.log('Ended the connection');
            }
          });
        });
      } else {
      // there are no owners with same number of cats as numCatsOwned
        console.log(`There are no owners with ${numCatsOwned} cat(s)`);

        client.end();
        console.log('Ended the connection');
      }
    } else if (sqlQuery === 'SELECT owners.id, owners.name AS owner_name, cats.name AS cat_name, cats.owner_id FROM cats INNER JOIN owners ON cats.owner_id = owners.id') {
      // display the cat and owner entries
      console.table(result.rows);
      client.end();
      console.log('Ended the connection');
    }
  } else if (mode === CREATE_CAT) {
    // get the owner id which matches the owner name (process.argv[3])
    const ownerId = result.rows[0].id;

    // set the values for the 2nd sql query
    const values = [`${catName}`, ownerId];

    // set the 2nd sql query
    const secondSqlQuery = 'INSERT INTO cats (name, owner_id) VALUES ($1, $2) RETURNING *';

    // execute the 2nd sql query
    client.query(secondSqlQuery, values, (secondQueryErr, secondQueryResult) => {
      if (secondQueryErr) {
        console.log(`Error: ${secondQueryErr}`);

        client.end();
        console.log('Ended the connection');
      }

      // print out the cat entry which was inserted into cats
      console.table(secondQueryResult.rows);

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

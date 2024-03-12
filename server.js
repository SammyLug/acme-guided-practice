// acme_notes_categories_db
// console.log("hello world")

const pg = require('pg');
const express = require('express');
const app = express();
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_notes_categories_db');
const port = process.env.PORT || 3000

app.use(express.json());
app.use(require('morgan')('dev'));
 
// USE GET to retrieve category data
app.get('/api/categories', async (req, res, next) => {
  try {
    const SQL = `
    SELECT * from categories
    `
    const response = await client.query(SQL)
    res.send(response.rows)
  } catch (ex) {
    next(ex)
  }
});

// USE GET to retrieve notes data 
app.get('/api/notes', async (req, res, next) => {
  try {
    const SQL = `
    SELECT * from notes ORDER BY created_at DESC;
    `
    const response = await client.query(SQL)
    res.send(response.row)
  } catch (ex) {
    next (ex)
  }
});

// USE POST to create new data into notes 
app.post('/api/notes', async (req, res, next) => {
  try {
    const SQL = `
    INSERT INTO notes(txt, category_id)
    VALUES($1, $2)
    RETURNING *
    `
    const response = await client.query(SQL, [req.body.txt, req.body.category_id])
    res.send(response.rows[0])
  } catch (ex) {
    next(ex)
  }
});

// USE PUT to update the data 
app.put('/api/notes/:id', async (req, res, next) => {
  try {
    const SQL = `
    UPDATE notes 
    SET txt= $1, ranking= $2, category_id=$3 , updated_at = now()
    WHERE id=$4 RETURNING *
    `
    const response = await client.query(SQL, [
      req.body.txt,
      req.body.ranking,
      req.body.category_id,
      req.params.id
    ])
    res.send(response.rows[0])
  } catch (ex) {
    next(ex)
  }
});

// USE DELETE to delete data 
app.delete('/api/notes/:id', async (req, res, next) => {
  try {
    const SQL = `
    DELETE from notes 
    WHERE id = $1 
    `
    const response = await client.query(SQL, [req.params.id])
    res.sendStatus(204)
  } catch (ex) {
    next (ex)
  }
});







const init = async()=> {
  console.log('connecting to database');
  await client.connect();
  console.log('connected to database');
  let SQL = `
  DROP TABLE IF EXISTS notes;
  DROP TABLE IF EXISTS categories;

  CREATE TABLE categories(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
  );

  CREATE TABLE notes(
    id SERIAL PRIMARY KEY,
    txt VARCHAR(100) NOT NULL,
    ranking INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    category_id INTEGER REFERENCES categories(id) NOT NULL
  );
  `;
  await client.query(SQL);
  console.log('tables created')
  SQL = `
    INSERT INTO categories(name) VALUES('SQL');
    INSERT INTO categories(name) VALUES('Express');
    INSERT INTO categories(name) VALUES('Shopping');
    INSERT INTO notes(txt, ranking, category_id) VALUES('learn express', 5, (SELECT id FROM categories WHERE name ='Express'));
    INSERT INTO notes(txt, ranking, category_id) VALUES('add logging middleware', 5, (SELECT id FROM categories WHERE name ='Express'));
    INSERT INTO notes(txt, ranking, category_id) VALUES('write SQL queries', 4, (SELECT id FROM categories WHERE name ='SQL'));
    INSERT INTO notes(txt, ranking, category_id) VALUES('learn about foreign keys', 4, (SELECT id FROM categories WHERE name ='SQL'));
    INSERT INTO notes(txt, ranking, category_id) VALUES('buy a quart of milk', 2, (SELECT id FROM categories WHERE name ='Shopping'));
  `;
  await client.query(SQL);
  console.log('data seeded.');
  app.listen(port, ()=> console.log(`listening on port ${port}`))
}

init()
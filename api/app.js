const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const contactsRouter = require("./contacts/contacts.router");
const { json } = require("express");

const app = express();

app.use(json());
app.use(cors());
app.use(morgan());

app.use("/api/contacts", contactsRouter);

app.listen(process.env.PORT, () =>
  console.log(`App listening at http://localhost:${process.env.PORT}`)
);

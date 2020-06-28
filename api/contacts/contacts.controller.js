const path = require("path");
const fs = require("fs");
const { promises: fsPromise } = fs;
const Joi = require("@hapi/joi");

const contactsPath = path.join(__dirname, "../../db/contacts.json");

const getContactsList = (req, res, next) => {
  fsPromise.readFile(contactsPath).then((data) => {
    res.send(data);
  });
};

exports.getContactsList = getContactsList;

const newId = (data) => data[data.length - 1].id + 1;
const postContact = (req, res, next) => {
  fsPromise.readFile(contactsPath).then((data) => {
    const parsedData = JSON.parse(data);

    const contactToAdd = { id: newId(parsedData), ...req.body };

    const newContactsList = [...parsedData, contactToAdd];

    fsPromise
      .writeFile(contactsPath, JSON.stringify(newContactsList))
      .then(() => {
        res.status(200).send(contactToAdd);
      });
  });
};

exports.postContact = postContact;

const validateNewContact = async (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().required(),
    phone: Joi.string().required(),
  });

  const validation = await schema.validate(req.body);

  if (validation.error) {
    return res.status(400).send({
      message: `missing required ${validation.error.details[0].path[0]}`,
    });
  }

  next();
};

exports.validateNewContact = validateNewContact;

const getById = (req, res, next) => {
  fsPromise.readFile(contactsPath).then((data) => {
    const parsedData = JSON.parse(data);

    const targetContact = parsedData.find(
      ({ id }) => id === parseInt(req.params.id)
    );

    if (targetContact) {
      res.status(200).send(targetContact);
    } else {
      res.status(404).send({ message: "Not found" });
    }
  });
};

exports.getById = getById;

const removeContact = (req, res, next) => {
  fsPromise.readFile(contactsPath).then((data) => {
    const parsedData = JSON.parse(data);

    const targetContact = parsedData.find(
      ({ id }) => id === parseInt(req.params.id)
    );

    if (targetContact) {
      const newContactsList = parsedData.filter(
        ({ id }) => id !== parseInt(req.params.id)
      );

      fsPromise
        .writeFile(contactsPath, JSON.stringify(newContactsList))
        .then(() => {
          res.status(200).send({ message: "contact deleted" });
        });
    } else {
      res.status(404).send({ message: "Not found" });
    }
  });
};

exports.removeContact = removeContact;

const validateUpdateContact = async (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string(),
    email: Joi.string(),
    phone: Joi.string(),
  });

  const validation = await schema.validate(req.body);

  if (validation.error) {
    return res.status(400).send({
      message: "missing fields",
    });
  }

  next();
};

exports.validateUpdateContact = validateUpdateContact;

const updateContact = (req, res, next) => {
  fsPromise.readFile(contactsPath).then((data) => {
    const parsedData = JSON.parse(data);

    const targetContact = parsedData.find(
      ({ id }) => id === parseInt(req.params.id)
    );

    if (targetContact) {
      Object.assign(targetContact, req.body);

      fsPromise.writeFile(contactsPath, JSON.stringify(parsedData)).then(() => {
        res.status(200).send(targetContact);
      });
    } else {
      res.status(404).send({ message: "Not found" });
    }
  });
};

exports.updateContact = updateContact;

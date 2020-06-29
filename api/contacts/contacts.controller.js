const path = require("path");
const fs = require("fs");
const { promises: fsPromise } = fs;
const Joi = require("@hapi/joi");
const contactsModules = require("./contact.modules");

const contactsPath = path.join(__dirname, "../../db/contacts.json");

class contactsController {
  static getContactsList = async (req, res, next) => {
    try {
      const contactsList = await fsPromise.readFile(contactsPath);

      res.status(200).send(contactsList);
    } catch (err) {
      next(err);
    }
  };

  static postContact = async (req, res, next) => {
    try {
      const contactsList = await fsPromise.readFile(contactsPath);

      const parsedContactsList = JSON.parse(contactsList);

      const contactToAdd = {
        id: contactsModules.newId(parsedContactsList),
        ...req.body,
      };

      const newContactsList = [...parsedContactsList, contactToAdd];

      await fsPromise.writeFile(contactsPath, JSON.stringify(newContactsList));

      res.status(201).send(contactToAdd);
    } catch (err) {
      next(err);
    }
  };

  static validateNewContact = async (req, res, next) => {
    try {
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
    } catch (err) {
      next(err);
    }
  };

  static getContactById = async (req, res, next) => {
    try {
      const contactsList = await fsPromise.readFile(contactsPath);

      const parsedContactsList = JSON.parse(contactsList);

      const targetContact = parsedContactsList.find(
        ({ id }) => id === parseInt(req.params.id)
      );

      if (targetContact) {
        res.status(200).send(targetContact);
      } else {
        res.status(404).send({ message: "Not found" });
      }
    } catch (err) {
      next(err);
    }
  };

  static removeContact = async (req, res, next) => {
    try {
      const contactsList = await fsPromise.readFile(contactsPath);

      const parsedContactsList = JSON.parse(contactsList);

      const targetContact = parsedContactsList.find(
        ({ id }) => id === parseInt(req.params.id)
      );

      if (targetContact) {
        const newContactsList = parsedContactsList.filter(
          ({ id }) => id !== parseInt(req.params.id)
        );

        await fsPromise.writeFile(
          contactsPath,
          JSON.stringify(newContactsList)
        );

        res.status(200).send({ message: "contact deleted" });
      } else {
        res.status(404).send({ message: "Not found" });
      }
    } catch (err) {
      next(err);
    }
  };

  static updateContact = async (req, res, next) => {
    try {
      const contactsList = await fsPromise.readFile(contactsPath);

      const parsedContactsList = JSON.parse(contactsList);

      const targetContact = parsedContactsList.find(
        ({ id }) => id === parseInt(req.params.id)
      );

      if (targetContact) {
        Object.assign(targetContact, req.body);

        await fsPromise.writeFile(
          contactsPath,
          JSON.stringify(parsedContactsList)
        );
        res.status(200).send(targetContact);
      } else {
        res.status(404).send({ message: "Not found" });
      }
    } catch (err) {
      next(err);
    }
  };

  static validateUpdateContact = async (req, res, next) => {
    try {
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
    } catch (err) {
      next(err);
    }
  };
}

module.exports = contactsController;

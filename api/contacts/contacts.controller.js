const Joi = require("@hapi/joi");
const contactModel = require("./contact.model");
const {
  Types: { ObjectId },
} = require("mongoose");

class contactsController {
  static getContactsList = async (req, res, next) => {
    try {
      const options = {
        page: (req.query && req.query.page) || "1",
        limit: (req.query && req.query.limit) || "10",
        sort: { name: 1 },
      };

      let filterBySubscription = null;

      if (req.query && req.query.sub) {
        filterBySubscription = { subscription: req.query.sub };
      }

      const contactsList = await contactModel.paginate(
        { ...filterBySubscription },
        options
      );

      res.status(200).send(contactsList);
    } catch (err) {
      next(err);
    }
  };

  static postContact = async (req, res, next) => {
    try {
      const contactToAdd = await contactModel.create(req.body);

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
        subscription: Joi.string().required(),
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

  static validateId = (req, res, next) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      res.status(404).send({ message: "wrong Id" });
    }

    next();
  };

  static getContactById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const targetContact = await contactModel.findById(id);

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
      const { id } = req.params;

      const targetContact = await contactModel.findByIdAndRemove(id);

      if (targetContact) {
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
      const { id } = req.params;

      const targetContact = await contactModel.findByIdAndUpdate(id, req.body, {
        new: true,
      });

      if (targetContact) {
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
        subscription: Joi.string(),
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

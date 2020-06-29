const express = require("express");

const contactsController = require("./contacts.controller");

const contactsRouter = express.Router();

contactsRouter.get("/", contactsController.getContactsList);

contactsRouter.get("/:id", contactsController.getContactById);

contactsRouter.post(
  "/",
  contactsController.validateNewContact,
  contactsController.postContact
);

contactsRouter.delete("/:id", contactsController.removeContact);

contactsRouter.patch(
  "/:id",
  contactsController.validateUpdateContact,
  contactsController.updateContact
);

module.exports = contactsRouter;

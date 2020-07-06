const express = require("express");
const userController = require("./user.controller");

const userRouter = express.Router();

userRouter.post(
  "/auth/register",
  userController.validateUserObject,
  userController.userRegister
);

userRouter.post(
  "/auth/login",
  userController.validateUserObject,
  userController.validatePassword,
  userController.userLogin
);

userRouter.post(
  "/auth/logout",
  userController.validateToken,
  userController.userLogout
);

userRouter.get(
  "/users/current",
  userController.validateToken,
  userController.getCurrentUser
);

userRouter.patch(
  "/users",
  userController.validateToken,
  userController.updateSubscription
);

module.exports = userRouter;

const express = require("express");
const path = require("path");
const userController = require("./user.controller");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: "api/tmp",

  filename: function (req, file, cb) {
    const fileExt = path.parse(file.originalname).ext;
    cb(null, Date.now() + fileExt);
  },
});

const upload = multer({ storage });

const userRouter = express.Router();

userRouter.post(
  "/auth/register",
  userController.validateUserObject,
  userController.userRegister
);

userRouter.get(
  "/auth/verify/:verificationToken",
  userController.verificateEmail
);

userRouter.post(
  "/auth/login",
  userController.validateUserObject,
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
  userController.validateUpdateSubscription,
  userController.updateSubscription
);

userRouter.patch(
  "/users/avatars",
  upload.single("avatar"),
  userController.validateToken,
  userController.updateAvatar
);

module.exports = userRouter;

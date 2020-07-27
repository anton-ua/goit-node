const userModel = require("./user.model");
const path = require("path");
const bcrypt = require("bcrypt");
const Joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");
const Avatar = require("avatar-builder");
const { promises: fsPromise } = require("fs");
const imagemin = require("imagemin");
const imageminJpegtran = require("imagemin-jpegtran");
const imageminPngquant = require("imagemin-pngquant");
const { v4: uuidv4 } = require("uuid");
const sgMail = require("@sendgrid/mail");

class userController {
  static userRegister = async (req, res, next) => {
    try {
      const existUser = await userModel.findOne({ email: req.body.email });

      if (existUser) {
        return res.status(409).send({ message: "Email in use" });
      }

      const avatarURL = await this.avatarGenerator(req.body.email);

      const passwordHash = await bcrypt.hash(
        req.body.password,
        +process.env.BCRYPT_SALT_ROUNDS
      );

      const verificationToken = uuidv4();

      this.sendVerificationEmail(req.body.email, verificationToken);

      const userToAdd = {
        email: req.body.email,
        passwordHash,
        avatarURL,
        verificationToken,
      };

      const user = await userModel.create(userToAdd);
      res.status(201).json({
        id: user._id,
        email: user.email,
        subscription: user.subscription,
        avatarURL: user.avatarURL,
      });
    } catch (err) {
      next(err);
    }
  };

  static avatarGenerator = async (email) => {
    const catAvatar = Avatar.catBuilder(256);

    const avatarPath = path.join(__dirname, "../public/images");

    const avatarName = Date.now() + ".png";

    const avatar = await catAvatar.create(email);

    await fsPromise.writeFile(avatarPath + "/" + avatarName, avatar);

    return `http://localhost:${process.env.PORT}/images/${avatarName}`;
  };

  static sendVerificationEmail = (email, verificationToken) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: email,
      from: process.env.EMAIL,
      subject: "Verification",
      text: `http://localhost:${process.env.PORT}/verify/${verificationToken}`,
      html: `<p>Please, <a href=http://localhost:${process.env.PORT}/auth/verify/${verificationToken}>click</a> to verify your email</p>`,
    };

    sgMail.send(msg);
  };

  static verificateEmail = async (req, res, next) => {
    try {
      const user = await userModel.findOne(req.params);

      if (!user) {
        return res.status(404).send("User not found");
      }

      await userModel.findByIdAndUpdate(user._id, { verificationToken: null });

      res.status(200).send("Your email verified");
    } catch (err) {
      next(err);
    }
  };

  static validateUserObject = async (req, res, next) => {
    try {
      const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required(),
      });

      const validateUser = schema.validate(req.body);

      if (validateUser.error) {
        return res.status(400).send(validateUser.error.details[0].message);
      }

      next();
    } catch (err) {
      next(err);
    }
  };

  static userLogin = async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await userModel.findOne({ email });

      if (!user) {
        return res.status(401).send({ message: "Email or password is wrong" });
      }

      const isPassValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPassValid) {
        return res.status(401).send({ message: "Email or password is wrong" });
      }

      const token = await jwt.sign({ id: user._id }, process.env.JWT_SECRET);

      await userModel.findByIdAndUpdate(user._id, {
        token,
      });

      res.status(200).send({
        token,
        user: {
          id: user.id,
          email: user.email,
          subscription: user.subscription,
          avatarUrl: user.avatarURL,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  static validateUser = async (email, password) => {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(401).send({ message: "Email or password is wrong" });
    }

    const isPassValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPassValid) {
      return res.status(401).send({ message: "Email or password is wrong" });
    }

    req.body = user;

    return true;
  };

  static validateToken = async (req, res, next) => {
    try {
      const authorizationHeader = req.get("Authorization") || "";
      const token = authorizationHeader.replace("Bearer ", "");

      const verifyToken = await jwt.verify(token, process.env.JWT_SECRET).id;

      const user = await userModel.findById(verifyToken);

      if (!user || !user.token) {
        return res.status(401).json({ message: "Not authorized" });
      }

      req.id = user._id;
      req.email = user.email;
      req.subscription = user.subscription;
      req.avatarURL = user.avatarURL;

      next();
    } catch (err) {
      next(err);
    }
  };

  static userLogout = async (req, res, next) => {
    try {
      await userModel.findByIdAndUpdate(req.id, { token: null });

      res.status(209).send();
    } catch (err) {
      next(err);
    }
  };

  static getCurrentUser = async (req, res, next) => {
    try {
      res.status(200).send({
        user: {
          id: req.id,
          email: req.email,
          subscription: req.subscription,
          avatarUrl: req.avatarURL,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  static updateSubscription = async (req, res, next) => {
    try {
      await userModel.findByIdAndUpdate(req.id, { $set: req.body });

      res.status(200).send({
        id: req.id,
        email: req.email,
        subscription: req.body.subscription,
        avatarUrl: req.avatarURL,
      });
    } catch (err) {
      next(err);
    }
  };

  static validateUpdateSubscription = async (req, res, next) => {
    try {
      const schema = Joi.object({
        subscription: Joi.string().required().valid("free", "pro", "premium"),
      });

      const validate = schema.validate(req.body);

      if (validate.error) {
        return res.status(400).send(validate.error.details[0].message);
      }

      next();
    } catch (err) {
      next(err);
    }
  };

  static updateAvatar = async (req, res, next) => {
    try {
      await this.minifyImage(req.file.path);

      const path = `http://localhost:${process.env.PORT}/images/${req.file.filename}`;

      await userModel.findByIdAndUpdate(req.id, { $set: { avatarURL: path } });

      res.status(200).send({ avatarURL: path });
    } catch (err) {
      next(err);
    }
  };

  static minifyImage = async (tmpFilePath) => {
    await imagemin([tmpFilePath], {
      destination: "api/public/images",
      plugins: [
        imageminJpegtran(),
        imageminPngquant({
          quality: [0.6, 0.8],
        }),
      ],
    });

    await fsPromise.unlink(tmpFilePath);
  };
}

module.exports = userController;

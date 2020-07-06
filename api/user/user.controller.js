const userModel = require("./user.model");
const bcrypt = require("bcrypt");
const Joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");

class userController {
  static userRegister = async (req, res, next) => {
    try {
      const existUser = await userModel.findOne({ email: req.body.email });

      if (existUser) {
        return res.status(409).send({ message: "Email in use" });
      }

      const passwordHash = await bcrypt.hash(
        req.body.password,
        +process.env.BCRYPT_SALT_ROUNDS
      );

      const userToAdd = { email: req.body.email, passwordHash };

      const user = await userModel.create(userToAdd);
      res.status(201).json({
        id: user._id,
        email: user.email,
        subscription: user.subscription,
      });
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
      const user = await userModel.findOne({ email: req.body.email });

      const token = await jwt.sign({ id: user._id }, process.env.JWT_SECRET);

      await userModel.findByIdAndUpdate(user._id, {
        token,
      });

      res.status(200).send({
        token,
        user: { email: user.email, subscription: user.subscription },
      });
    } catch (err) {
      next(err);
    }
  };

  static validatePassword = async (req, res, next) => {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).send({ message: "Email or password is wrong" });
    }

    next();
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
      res
        .status(200)
        .send({ user: { email: req.email, subscription: req.subscription } });
    } catch (err) {
      next(err);
    }
  };

  static updateSubscription = async (req, res, next) => {
    try {
      await userModel.findByIdAndUpdate(req.id, {
        subscription: req.body.subscription,
      });

      res.status(200).send({
        id: req.id,
        email: req.email,
        subscription: req.body.subscription,
      });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = userController;

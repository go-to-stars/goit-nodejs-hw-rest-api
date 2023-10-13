const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const { User } = require("../models");
const { HttpError, ctrlWrapper } = require("../helpers");
const { SECRET_KEY } = process.env;
const fs = require("fs").promises;
const path = require("path");
const Jimp = require("jimp");
const { v4: uuidv4 } = require("uuid");
const avatarsDir = path.join(__dirname, "../", "public");
const sendEmail = require("../services/emailService");
require("dotenv").config();

const register = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, "Email in use");
  }

  const verificationToken = uuidv4();
  const hashPassword = await bcrypt.hash(password, 12);
  const avatarURL = gravatar.url(email);

  const response = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
    verificationToken,
  });

  if (!response) {
    throw HttpError(404, "Not found");
  }

  const htmlText = `<a target="_blank" href="http://localhost:3000/users/verify/${verificationToken}" style="display: block; margin: 20px auto; padding: 6px 20px; color:#fff; font-size:18px; background-color: #4056b4; text-align: center; text-decoration: none; border: 1px solid #4056b4; border-radius: 10px;">Click to confirm email</a>`;

  const emailOptions = {
    from: process.env.POST_AUTH_USER,
    to: email,
    subject: "Email confirmation",
    html: htmlText,
  };

  sendEmail(emailOptions);

  res.status(201).json({
    user: {
      email: response.email,
      subscription: response.subscription,
      avatarURL: response.avatarURL,
      verificationToken: response.verificationToken,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !user.verify) {
    throw HttpError(401, "Email is wrong or not verified");
  }

  const passwordCompare = await bcrypt.compare(password, user.password);

  if (!passwordCompare) {
    throw HttpError(401, "Email or password is wrong");
  }

  const payload = {
    id: user._id,
  };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "24h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.status(200).json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;

  res.status(200).json({
    email,
    subscription,
  });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });

  res.status(204).json();
};

const updateSubskription = async (req, res) => {
  if (!req.body) {
    throw HttpError(400, "Email or password is wrong");
  }
  const { _id: id } = req.user;
  const { subscription } = req.body;
  const response = await User.findByIdAndUpdate(
    id,
    { subscription },
    { new: true }
  );
  res.status(200).json({
    message: `Subscription set to '${response.subscription}'`,
    user: {
      email: response.email,
      subscription: response.subscription,
    },
  });
};

const updateAvatar = async (req, res) => {
  const { _id } = req.user;

  if (!req.file) {
    throw HttpError(401, "File is missing");
  }
  const { path: tempUpload, filename } = req.file;
  const avatarURL = path.join("avatars", `${filename}`);
  const result = path.join(avatarsDir, avatarURL);

  const image = await Jimp.read(req.file.path);

  await image
    .autocrop()
    .cover(250, 250, Jimp.HORIZONTAL_ALIGN_CENTER || Jimp.VERTICAL_ALIGN_MIDDLE)
    .normalize()
    .writeAsync(req.file.path);

  try {
    await fs.rename(tempUpload, result);
  } catch (error) {
    await fs.unlink(tempUpload);
    throw error;
  }

  const user = await User.findByIdAndUpdate(_id, {
    avatarURL,
  });

  if (!user) {
    throw HttpError(401, "Not authorized");
  }

  res.status(200).json({
    avatarURL: avatarURL,
  });
};

const verificationToken = async (req, res) => {
  const { verificationToken } = req.params;

  const user = await User.findOne({
    verificationToken: verificationToken,
  });

  if (!user) {
    throw HttpError(404, "User not found");
  }

  await User.findByIdAndUpdate(user._id, {
    verificationToken: null,
    verify: true,
  });

  res.status(200).json({
    message: "Verification successful",
  });
};

const updateVerification = async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user || user.verificationToken === undefined) {
    throw HttpError(404, "User not found");
  }
  const verificationToken = user.verificationToken;

  if (user.verificationToken === null) {
    throw HttpError(400, "Verification has already been passed");
  }

  const htmlText = `<a target="_blank" href="http://localhost:3000/users/verify/${verificationToken}" style="display: block; margin: 20px auto; padding: 6px 20px; color:#fff; font-size:18px; background-color: #4056b4; text-align: center; text-decoration: none; border: 1px solid #4056b4; border-radius: 10px;">Click to confirm email</a>`;

  const emailOptions = {
    from: process.env.POST_AUTH_USER,
    to: email,
    subject: "Email confirmation",
    html: htmlText,
  };

  sendEmail(emailOptions);

  res.status(200).json({
    message: "Verification email sent",
  });
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateSubskription: ctrlWrapper(updateSubskription),
  updateAvatar: ctrlWrapper(updateAvatar),
  verificationToken: ctrlWrapper(verificationToken),
  updateVerification: ctrlWrapper(updateVerification),
};

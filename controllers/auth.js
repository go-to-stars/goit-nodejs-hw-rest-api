const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const { User } = require("../models");
const { HttpError, ctrlWrapper } = require("../helpers");
const { SECRET_KEY } = process.env;
const fs = require("fs").promises;
const path = require("path");
// const ShortUniqueId = require("short-unique-id");
// const uid = new ShortUniqueId();
const Jimp = require("jimp");
// const publicAvatarDir = path.resolve("public");
const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const register = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 12);
  const avatarURL = gravatar.url(email);

  const response = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
  });

  if (!response) {
    throw HttpError(404, "Not found");
  }

  res.status(201).json({
    user: {
      email: response.email,
      subscription: response.subscription,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(401, "Email or password is wrong");
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
    throw HttpError(401, "Not authorized");
  }
  const { path: tempUpload, filename } = req.file;
  const avatarURL = `${filename}`;
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

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateSubskription: ctrlWrapper(updateSubskription),
  updateAvatar: ctrlWrapper(updateAvatar),
};

const { model, Schema } = require("mongoose");
const { handleMongooseError } = require("../helpers");
const Joi = require("joi");

const emailRegexp = /^[-\w.]+@([A-z0-9][-A-z0-9]+\.)+[A-z]{2,4}$/;

const userSchema = new Schema(
  {
    password: {
      type: String,
      minlength: 7,
      required: [true, "Set password for user"],
    },
    email: {
      type: String,
      match: emailRegexp,
      unique: true,
      required: [true, "Email is required"],
    },
    subscription: {
      type: String,
      enum: ["starter", "pro", "business"],
      default: "starter",
    },
    token: {
      type: String,
      default: "",
    },
    avatarURL: String,
    verify: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      required: [true, "Verify token is required"],
    },
  },
  { versionKey: false, timestamps: true }
);

userSchema.post("save", handleMongooseError);

const User = model("user", userSchema);

const registerSchema = Joi.object({
  password: Joi.string().min(7).required().messages({
    "any.required": `missing required password field`,
    "string.empty": `"password" cannot be empty`,
  }),
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net", "ua", "uk", "ca", "org"] },
    })
    .pattern(emailRegexp)
    .required()
    .messages({
      "any.required": `missing required email field`,
      "string.empty": `"email" cannot be empty`,
    }),
});

const loginSchema = Joi.object({
  password: Joi.string().min(7).required().messages({
    "any.required": `missing required password field`,
    "string.empty": `"password" cannot be empty`,
  }),
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net", "ua", "uk", "ca", "org"] },
    })
    .pattern(emailRegexp)
    .required()
    .messages({
      "any.required": `missing required email field`,
      "string.empty": `"email" cannot be empty`,
    }),
});

const subscriptionSchema = Joi.object({
  subscription: Joi.string()
    .valid("starter", "pro", "business")
    .required()
    .messages({
      "any.required": `missing required subscription field`,
      "string.empty": `"subscription" cannot be empty`,
    }),
});

const verificationSchema = Joi.object({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net", "ua", "uk", "ca", "org"] },
    })
    .pattern(emailRegexp)
    .required()
    .messages({
      "any.required": `missing required field email`,
      "string.empty": `"email" cannot be empty`,
    }),
});

const schemasUser = {
  registerSchema,
  loginSchema,
  subscriptionSchema,
  verificationSchema,
};

module.exports = { User, schemasUser };

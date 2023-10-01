const express = require("express");
const router = express.Router();
const { auth: ctrl } = require("../../controllers");
const { validateBody, authenticate } = require("../../middlewares");
const { ctrlWrapper } = require("../../helpers");
const { schemasUser } = require("../../models");

router.post(
  "/register",
  validateBody(schemasUser.registerSchema),
  ctrlWrapper(ctrl.register)
);

router.post(
  "/login",
  validateBody(schemasUser.loginSchema),
  ctrlWrapper(ctrl.login)
);

router.get("/current", authenticate, ctrlWrapper(ctrl.getCurrent));

router.post("/logout", authenticate, ctrlWrapper(ctrl.logout));

router.patch(
  "/",
  authenticate,
  validateBody(schemasUser.subscriptionSchema),
  ctrlWrapper(ctrl.updateSubskription)
);

module.exports = router;

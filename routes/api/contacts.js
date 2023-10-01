const express = require("express");
const router = express.Router();
const { contacts: ctrl } = require("../../controllers");
const {
  validateBody,
  isValidId,
  validateFavorite,
  authenticate,
} = require("../../middlewares");
const { schemasContact } = require("../../models");

router.get("/", authenticate, ctrl.getContacts);

router.get("/:id", authenticate, isValidId, ctrl.getContactsById);

router.post(
  "/",
  authenticate,
  validateBody(schemasContact.addSchema),
  ctrl.addContact
);

router.delete("/:id", authenticate, isValidId, ctrl.deleteContact);

router.put(
  "/:id",
  authenticate,
  isValidId,
  validateBody(schemasContact.addSchema),
  ctrl.updateContact
);

router.patch(
  "/:id/favorite",
  authenticate,
  isValidId,
  validateFavorite(schemasContact.updateFavoriteSchema),
  ctrl.updateFavorite
);

module.exports = router;

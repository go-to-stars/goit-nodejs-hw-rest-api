const multer = require("multer");
const HttpError = require("../helpers/HttpError");
const path = require("path");
const ShortUniqueId = require("short-unique-id");
const uid = new ShortUniqueId();

const projectDir = path.parse(__dirname).dir;
const tempDir = path.join(projectDir, "tmp");

const multerConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {    
    const extension = file.mimetype.split("/")[1];
    cb(null, `${req.user.id}-${uid.rnd(21)}.${extension}`);
  },
});

const upload = multer({
  storage: multerConfig,
  fileFilter: function fileFilter(req, file, cb) {
    if (file.mimetype.includes("image")) {
      cb(null, true);
    } else {
      cb(new HttpError(400, "Wrong format"));
    }
  },
  limits: {
    fieldNameSize: 100,
    fileSize: 3 * 1024 * 1024,
  },
});

module.exports = upload;

const express = require('express');
const router = express.Router();
const UploadController = require('../controller/uploads');
const multer = require('multer');
const upload = multer();
// Upload ảnh qua API
router.post('/upload',
  upload.single('file'), // <---- QUAN TRỌNG
  UploadController.uploadImage
);


module.exports = router;
const axios = require('axios');
const FormData = require('form-data');

class UploadController {
  static async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const form = new FormData();
      form.append('source', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });

      const response = await axios.post('https://freeimage.host/api/1/upload?key=6d207e02198a847aa98d0a2a901485a5', form, {
        headers: form.getHeaders()
      });

      if (response.data.success) {
        return res.json({
          success: true,
          url: response.data.image.url
        });
      }

      throw new Error('Upload failed');
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({
        error: error.response?.data?.error?.message || 'Image upload failed'
      });
    }
  }
}

module.exports = UploadController;
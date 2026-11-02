import multer from 'multer';

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter(req, file, callback) {
    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!tiposPermitidos.includes(file.mimetype)) {
      return callback(
        new Error('Formato inválido. Envie JPG, PNG ou WEBP.')
      );
    }

    callback(null, true);
  }
});

const uploadAvatar = (req, res, next) => {
  upload.single('avatar')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          mensagem: 'A imagem deve ter no máximo 5 MB.'
        });
      }

      return res.status(400).json({
        mensagem: 'Erro ao enviar a imagem.'
      });
    }

    if (error) {
      return res.status(400).json({
        mensagem: error.message
      });
    }

    next();
  });
};

export default uploadAvatar;
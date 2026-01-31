import { Router } from 'express';
import { generateStandardFileName, getUploadUrl } from '../services/backblaze.service';

const router = Router();

router.post('/presigned', async (req, res) => {
  try {
    const { filename, contentType, size, metadata } = req.body;

    if (!filename || !metadata) {
      return res.status(400).json({ error: 'Filename e metadata são obrigatórios' });
    }

    const { fileName, folderPath, fullPath } = generateStandardFileName(filename, {
      area: metadata.area || 'GERAL',
      nucleo: metadata.nucleo,
      tema: metadata.tema || 'GERAL',
      status: metadata.status || 'ENTRADA_BRUTO',
    });

    console.log('Nome padronizado:', fileName);
    console.log('Path completo:', fullPath);

    const uploadData = await getUploadUrl(fullPath);

    res.json({
      success: true,
      data: {
        presignedUrl: uploadData.uploadUrl,
        authorizationToken: uploadData.authorizationToken,
        fileName: fileName,
        filePath: fullPath,
        folderPath: folderPath,
        headers: {
          'Authorization': uploadData.authorizationToken,
          'X-Bz-File-Name': encodeURIComponent(fullPath),
          'Content-Type': contentType || 'application/octet-stream',
          'X-Bz-Content-Sha1': 'do_not_verify',
        }
      }
    });

  } catch (error: any) {
    console.error('Erro ao gerar presigned URL:', error);
    res.status(500).json({ error: 'Erro ao gerar URL de upload', details: error.message });
  }
});

router.post('/complete', async (req, res) => {
  try {
    const { filePath, metadata } = req.body;
    console.log('Upload completado:', filePath);
    console.log('Metadados:', metadata);

    res.json({
      success: true,
      data: {
        message: 'Upload confirmado',
        filePath: filePath,
        url: `https://f005.backblazeb2.com/file/Drive-mkt-RC/${filePath}`,
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao confirmar upload', details: error.message });
  }
});

router.get('/test', async (req, res) => {
  try {
    const { authorizeB2 } = await import('../services/backblaze.service');
    const auth = await authorizeB2();
    
    res.json({
      success: true,
      message: 'Conexão com Backblaze B2 OK',
      data: { apiUrl: auth.apiUrl, downloadUrl: auth.downloadUrl }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Falha na conexão com B2', details: error.message });
  }
});

export default router;

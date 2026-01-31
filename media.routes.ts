import { Router } from 'express';
import { listFiles, getDownloadUrl } from '../services/backblaze.service';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { prefix = '', limit = '100' } = req.query;
    const files = await listFiles(prefix as string);
    
    const medias = files.map((file: any) => ({
      id: file.fileId,
      fileName: file.fileName,
      size: file.contentLength,
      uploadedAt: file.uploadTimestamp,
      ...parseFileName(file.fileName),
    }));

    res.json({ success: true, data: medias, total: medias.length });

  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao listar mídias', details: error.message });
  }
});

router.get('/:id/url', async (req, res) => {
  try {
    const { id } = req.params;
    const { validFor = '3600' } = req.query;
    const url = await getDownloadUrl(id, parseInt(validFor as string));
    res.json({ success: true, data: { url, expiresIn: validFor } });

  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao gerar URL', details: error.message });
  }
});

function parseFileName(filePath: string) {
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];
  const nameParts = fileName.split('_');
  
  if (nameParts.length >= 8) {
    return {
      ano: nameParts[0],
      mes: nameParts[1],
      dia: nameParts[2],
      area: nameParts[3],
      nucleo: nameParts[4],
      tema: nameParts[5],
      status: nameParts[6],
      uuid: nameParts[7]?.split('.')[0],
      extensao: nameParts[7]?.split('.')[1],
    };
  }
  
  return { fileName };
}

export default router;

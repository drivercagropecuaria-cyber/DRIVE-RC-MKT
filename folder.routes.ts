import { Router } from 'express';
import { FOLDER_STRUCTURE } from '../services/backblaze.service';

const router = Router();

router.get('/', (req, res) => {
  const folders = [
    { id: 'entrada', name: '00 - Entrada (Bruto)', slug: FOLDER_STRUCTURE.ENTRADA, description: 'Uploads iniciais aguardando classificação', icon: '📥' },
    { id: 'catalogado', name: '01 - Catalogado', slug: FOLDER_STRUCTURE.CATALOGADO, description: 'Arquivos classificados e organizados', icon: '📁' },
    { id: 'producao', name: '02 - Em Produção', slug: FOLDER_STRUCTURE.PRODUCAO, description: 'Arquivos em edição ou pós-produção', icon: '✂️' },
    { id: 'publicado', name: '03 - Publicado', slug: FOLDER_STRUCTURE.PUBLICADO, description: 'Arquivos aprovados e publicados', icon: '✅' },
    { id: 'arquivado', name: '04 - Arquivado', slug: FOLDER_STRUCTURE.ARQUIVADO, description: 'Backup e arquivos históricos', icon: '📦' },
  ];

  res.json({ success: true, data: folders });
});

router.get('/:slug/medias', async (req, res) => {
  try {
    const { slug } = req.params;
    const { listFiles } = await import('../services/backblaze.service');
    const files = await listFiles(`${slug}/`);
    
    res.json({ success: true, data: files, folder: slug });

  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao listar mídias da pasta', details: error.message });
  }
});

export default router;

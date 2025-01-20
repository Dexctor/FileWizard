/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { Settings } from '../../image-optimizer/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'avif'] as const;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const format = formData.get('format') as string;
    const settingsJson = formData.get('settings') as string;
    const settings: Settings | null = settingsJson ? JSON.parse(settingsJson) : null;
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier uploadé' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux' }, { status: 400 });
    }

    const targetFormat = format === 'jpg' ? 'jpeg' : format;
    if (!SUPPORTED_FORMATS.includes(targetFormat as any)) {
      return NextResponse.json({ error: 'Format de sortie non supporté' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let outputBuffer: Buffer;

    try {
      // Configuration de base de Sharp
      let sharpInstance = sharp(buffer, {
        failOnError: false, // Plus permissif avec les images corrompues
      });

      // Obtenir les métadonnées de l'image source
      const metadata = await sharpInstance.metadata();
      
      // Configuration commune
      if (settings?.autoResize && settings?.maxWidth) {
        sharpInstance = sharpInstance.resize({
          width: settings.maxWidth,
          withoutEnlargement: true,
          fit: 'inside',
        });
      }

      // Prétraitement commun pour assurer la compatibilité
      sharpInstance = sharpInstance
        .toColorspace('srgb') // Espace couleur standard
        .removeAlpha() // Supprime la transparence si présente
        .flatten({ background: '#ffffff' }); // Fond blanc pour la transparence

      // Conversion selon le format cible
      switch (targetFormat) {
        case 'jpeg':
          outputBuffer = await sharpInstance
            .jpeg({
              quality: settings?.quality || 80,
              mozjpeg: true,
              chromaSubsampling: '4:4:4',
              force: true, // Force la conversion même si déjà en JPEG
            })
            .toBuffer();
          break;

        case 'png':
          outputBuffer = await sharpInstance
            .png({
              compressionLevel: 9,
              quality: settings?.quality || 100,
              colors: 256,
              force: true,
            })
            .toBuffer();
          break;

        case 'webp':
          outputBuffer = await sharpInstance
            .webp({
              quality: settings?.quality || 80,
              effort: 6,
              lossless: settings?.quality === 100,
              force: true,
            })
            .toBuffer();
          break;

        case 'avif':
          outputBuffer = await sharpInstance
            .avif({
              quality: settings?.quality || 80,
              effort: 6,
              lossless: settings?.quality === 100,
              force: true,
            })
            .toBuffer();
          break;

        default:
          throw new Error(`Format non supporté: ${format}`);
      }

      // Vérifications finales
      if (!outputBuffer || outputBuffer.length === 0) {
        throw new Error('Échec de la conversion: buffer vide');
      }

      const outputMetadata = await sharp(outputBuffer).metadata();
      const outputFormat = outputMetadata.format;
      
      if (!outputFormat || outputFormat !== targetFormat) {
        console.error(`Format attendu: ${targetFormat}, obtenu: ${outputFormat}`);
        throw new Error('Format de sortie incorrect');
      }

      return new NextResponse(outputBuffer, {
        headers: {
          'Content-Type': `image/${targetFormat}`,
          'Content-Disposition': `attachment; filename="converted.${targetFormat}"`,
        },
      });

    } catch (conversionError) {
      console.error('Erreur détaillée:', conversionError);
      return NextResponse.json(
        { error: `Erreur de conversion: ${(conversionError as Error).message}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erreur générale:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 
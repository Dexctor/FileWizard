import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { Settings } from '../../image-optimizer/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Créer une nouvelle instance Sharp pour chaque conversion
    const processedImage = sharp(buffer, {
      failOnError: true, // Échoue explicitement en cas d'erreur
      sequentialRead: true // Lecture séquentielle pour plus de stabilité
    });

    // Appliquer les paramètres de redimensionnement si nécessaire
    if (settings?.autoResize && settings?.maxWidth) {
      await processedImage.resize({
        width: settings.maxWidth,
        withoutEnlargement: true,
        fit: 'inside',
      });
    }

    try {
      let outputBuffer;
      
      // Forcer la conversion en supprimant l'alpha pour PNG
      if (format === 'png') {
        outputBuffer = await processedImage
          .removeAlpha()
          .toColorspace('srgb')
          .png({
            compressionLevel: 6,
            palette: false,
            colors: 256,
            quality: settings?.quality || 100,
            effort: 7,
            progressive: false,
          })
          .toBuffer();
      } else {
        switch (format) {
          case 'webp':
            outputBuffer = await processedImage
              .webp({
                quality: settings?.quality || 80,
                effort: 6,
              })
              .toBuffer();
            break;
          case 'avif':
            outputBuffer = await processedImage
              .avif({
                quality: settings?.quality || 80,
                effort: 6,
              })
              .toBuffer();
            break;
          case 'jpeg':
          case 'jpg':
            outputBuffer = await processedImage
              .jpeg({
                quality: settings?.quality || 80,
                mozjpeg: true,
              })
              .toBuffer();
            break;
          default:
            throw new Error(`Format non supporté: ${format}`);
        }
      }

      if (!outputBuffer || outputBuffer.length === 0) {
        throw new Error('La conversion a échoué : buffer vide');
      }

      // Vérifier le format du buffer de sortie
      const metadata = await sharp(outputBuffer).metadata();
      if (metadata.format !== format) {
        throw new Error(`Format de sortie incorrect : ${metadata.format} au lieu de ${format}`);
      }

      return new NextResponse(outputBuffer, {
        headers: {
          'Content-Type': `image/${format}`,
          'Content-Disposition': `attachment; filename="converted.${format}"`,
        },
      });

    } catch (conversionError) {
      console.error('Erreur lors de la conversion:', conversionError);
      return NextResponse.json(
        { error: `Erreur de conversion : ${(conversionError as Error).message}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erreur générale:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement : ' + (error as Error).message },
      { status: 500 }
    );
  }
} 
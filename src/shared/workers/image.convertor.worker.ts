import Jimp from 'jimp';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { WorkerChild } from 'worker-thread-manager';
import Path from 'path';
import type { IImageConvertorWorkerEndMessage, IImageConvertorWorkerSendMessage, TImageDimensions } from '../managers/image-convertor/image.convertor.interface';
import config from '../config/config';

async function onTask(msg: IImageConvertorWorkerSendMessage) : Promise<IImageConvertorWorkerEndMessage> {
  let resolver: Promise<string>;
  if (msg.mime === 'image/gif') {
    resolver = gifConvert(msg.path);
  }
  else {
    resolver = convert(msg.path, msg.dimensions, msg.mime);
  }

  try {
    const path = await resolver;
    return { status: 'success', path };
  } catch (e) {
    return { error: e.stack, status: 'error' };
  }
}

// Starts the child
// It take WorkerSendMessage as input, returns a WorkerEndMessage,
// and take nothing as startup argument (workerData is empty).
new WorkerChild<IImageConvertorWorkerSendMessage, IImageConvertorWorkerEndMessage, void>({ onTask }).listen();


/* -- Utility functions -- */

async function gifConvert(path: string) {
  const pathData = Path.parse(path);
  const newpath = config.UPLOAD.FILE_PROCESSING + '/' + pathData.name + '.mp4';

  const state = new Promise((resolve, reject) => {
    ffmpeg()
      .outputOption('-fflags +genpts')
      .addInput(path)
      .inputFormat('gif')
      .outputOptions([
        '-profile:v main',
        '-c:v libx264',
        '-c:a copy',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
        '-crf 27',
        '-brand mp42',
        '-filter:v crop=\'floor(in_w/2)*2:floor(in_h/2)*2\''
      ])
      .toFormat('mp4')
      .save(newpath)
      .on('error', (err, stdout, stderr) => {
        if (err.message !== 'Incorrect ratio')
          console.log('Cannot process video: ' + err.message, stdout, stderr);

        reject(err);
      })
      .on('end', resolve);
  });

  try {
    await state;
    // dont erase previous gif: it could be used for twitter send
  } catch (e) {
    await fs.promises.unlink(newpath);
    throw e;
  }

  return newpath;
}

async function convert(path: string, dimensions: TImageDimensions, mime: string) {
  // Crop and compress.
  let image = await Jimp.read(path);

  if ('fixed' in dimensions) {
    const [x, y] = dimensions.fixed;
    image = image.cover(x, y); // resize and cover
  }
  // Keep dimensions, but verify if scale is valid
  else if ('could_resize' in dimensions) {
    const width = image.getWidth();
    const height = image.getHeight();

    const ratio = width / height;
    if (ratio < 0.6 || ratio > 10) {
      throw new Error('Incorrect ratio');
    }

    if (width >= height && width > 1500) {
      image = image.resize(1500, Jimp.AUTO);
    }
    else if (height > width && height > 1500) {
      image = image.resize(Jimp.AUTO, 1500);
    }
  }
  else {
    throw new Error('Invalid dimensions object: ' + JSON.stringify(dimensions));
  }

  if (mime === 'image/jpeg') {
    image = image.quality(85);
  }
  else {
    image = image.deflateLevel(7);
  }

  // Overwrite previous image
  // save
  await image.writeAsync(path);

  return path;
}

import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';
import multer from 'multer';
import { ErrorService } from '../modules/errors/error.service';
import { EApiError } from '../modules/errors/error.enum';

@Catch(Error)
export class ErrorFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Handle sent HttpExceptions
    if (exception instanceof HttpException) {
      let resp: any = exception.getResponse();

      if (resp && resp.statusCode && !resp.code) {
        // Nest exception
        if (resp.statusCode === 404) {
          // Endpoint not found
          resp = ErrorService.makeContent(EApiError.PageNotFound);
        }
        else {
          resp = ErrorService.makeContent(EApiError.BadRequest);
        }
      }

      response
        .status(exception.getStatus())
        .json(resp);

      return;
    }
    else if (exception instanceof multer.MulterError) {
      // For file send error, send a invalid file error
      const error = ErrorService.makeContent(EApiError.InvalidSentFile);

      response
        .status(error.statusCode)
        .json(error);

      return;
    }

    // For other errors, send a classic 500 http error
    const error = ErrorService.makeContent(EApiError.ServerError);

    Logger.error(exception.stack);

    response
      .status(error.statusCode)
      .json(error);
  }
}

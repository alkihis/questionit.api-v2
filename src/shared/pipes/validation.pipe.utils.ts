import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';
import { ErrorService } from '../modules/errors/error.service';
import { EApiError } from '../modules/errors/error.enum';

export function getValidationPipe(options?: ValidationPipeOptions) {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    exceptionFactory: errors => {
      return ErrorService.create(EApiError.InvalidParameter, { invalidProperties: errors.map(e => e.property) });
    },
    ...options,
  });
}

import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

export function getValidationPipe(options?: ValidationPipeOptions) {
  return new ValidationPipe({ transform: true, whitelist: true, ...options });
}

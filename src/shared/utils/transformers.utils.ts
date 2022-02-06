import { TransformFnParams } from 'class-transformer';

export type TClassTransformerFn = (params: TransformFnParams) => any;

export const BooleanTransformer: TClassTransformerFn = ({ value }) => typeof value === 'boolean' ? value : (value === 'true' || value === 't' || value === '1');

export const NumberTransformer: TClassTransformerFn = ({ value }) => typeof value === 'number' ? value : Number(value);

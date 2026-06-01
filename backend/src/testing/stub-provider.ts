import { type Type } from '@nestjs/common';

export function stubProvider<T>(provide: Type<T>) {
  return {
    provide,
    useValue: {},
  };
}

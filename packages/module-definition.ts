import { DynamicModule, ForwardReference } from '@/common';
import { Type } from '@/common/interfaces';

export type ModuleDefinition =
  | ForwardReference
  | Type<unknown>
  | DynamicModule
  | Promise<DynamicModule>;

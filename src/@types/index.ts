import type {ethers} from 'ethers';

export type WrappedContract<T extends ethers.Contract> = T & {
  readonly [key in keyof T]: (...args: Array<any>) => Promise<string>;
};


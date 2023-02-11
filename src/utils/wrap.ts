import type { ethers } from 'ethers';

import type { WrappedContract } from '../@types';

import { serialize } from './serialize';

export function wrap<
  Contract extends ethers.Contract
>(contract: Contract): WrappedContract<Contract> {
  return new Proxy(
    {...contract},
    {
      get(target: Contract, maybeFunctionName: string | symbol): any {
        if (typeof maybeFunctionName !== 'string')
          throw new Error(`Unable to access property "${String(maybeFunctionName)}".`);

        const ref = target[maybeFunctionName];

        if (typeof ref !== 'function') return ref;

        const abi = contract.interface.getFunction(maybeFunctionName);

        if (!abi) return ref /* std */;

        return async (...args: Array<any>): Promise<string> => serialize({
          __contract: target,
          tx: await target.populateTransaction[maybeFunctionName]!(...args),
        });
      }
    }
  );
}

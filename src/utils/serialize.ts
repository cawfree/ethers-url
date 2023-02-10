import {ethers} from 'ethers';

import type {WrappedContract} from '../@types';
import {PREFIX_PAY, SCHEMA_LONG} from '../constants';

import {bigNumberToDecimal, maybeBigNumber} from './number';

const invalidAddressError = (to: unknown) =>
  new Error(`Expected valid "to" address, encountered "${String(to)}".`);

// TODO: implement a robust scheme.
export const isValidEns = (to: string) => to.endsWith('.eth') && to.length > '.eth'.length;

const normalizeTargetAddress = (to: string) => {
  if (isValidEns(to)) return to;

  if (!ethers.utils.isAddress(to)) throw invalidAddressError(to);

  return ethers.utils.getAddress(to);
};

const paramSerializationThunk = <T>({
  param,
  serialize,
}: {
  readonly param: string;
  readonly serialize: (data: T) => string;
})  => (data: T | undefined) => {
  if (!data) return '';
  return `${param}=${serialize(data)}`;
}

const serializeValue = paramSerializationThunk({
  param: 'value',
  serialize: bigNumberToDecimal,
});

const serializeGasPrice = paramSerializationThunk({
  param: 'gasPrice',
  serialize: bigNumberToDecimal,
});

const serializeGasLimit = paramSerializationThunk({
  // gasLimit is permitted to be abbreviated to gas.
  param: 'gas',
  serialize: bigNumberToDecimal,
});

const serializeMaxFeePerGas = paramSerializationThunk({
  param: 'maxFeePerGas',
  serialize: bigNumberToDecimal,
});

const serializeMaxPriorityFeePerGas = paramSerializationThunk({
  param: 'maxPriorityFeePerGas',
  serialize: bigNumberToDecimal,
});

const serializeChainId = (chainId: number | undefined) => {
  if (typeof chainId !== 'number') return '';

  return `@${String(chainId)}`;
};

export const getTransactionPrefix = (to: string) => {
  if (to.startsWith('0x')) return '';

  return PREFIX_PAY;
};

export const functionArgumentToParam = (
  paramType: ethers.utils.ParamType,
  result: ethers.utils.Result[number],
): string => {

  const value = paramType.type === 'bool'
    ? Number(result)
    : String(result);

  return `${paramType.type}=${value}`;
};

export const getMaybeInvocation = (
  contract: ethers.Contract | undefined,
  data: string | undefined,
): readonly string[] => {
  if (!contract || !data) return [];

  if (!maybeBigNumber(data)) return [];

  const decodedData = contract.interface.parseTransaction({data});

  const {
    name: functionName,
    args,
    functionFragment,
  } = decodedData;

  const {inputs} = functionFragment;

  const params = inputs.map((paramType, i) => functionArgumentToParam(paramType, args[i]));

  return [functionName, ...params];
};

export function serialize({
  tx,
  __contract: maybeContract = undefined,
}: {
  readonly tx: Partial<ethers.Transaction>;
  readonly __contract?: ethers.Contract;
}) {
  const {to: maybeTo} = tx;

  if (typeof maybeTo !== 'string' || !maybeTo.length)
    throw invalidAddressError(maybeTo);

  const to = normalizeTargetAddress(maybeTo.trim());

  const valueParam = serializeValue(tx.value);
  const gasPriceParam = serializeGasPrice(tx.gasPrice);
  const gasLimitParam = serializeGasLimit(tx.gasLimit);
  const maxFeePerGasParam = serializeMaxFeePerGas(tx.maxFeePerGas);
  const maxPriorityFeePerGasParam = serializeMaxPriorityFeePerGas(tx.maxPriorityFeePerGas);

  const maybePrefix = getTransactionPrefix(to);

  const [
    maybeFunctionInvocation,
    ...maybeInvocationArguments
  ] = getMaybeInvocation(maybeContract, tx.data);

  const parameters = [
    ...maybeInvocationArguments,
    valueParam,
    gasPriceParam,
    gasLimitParam,
    maxFeePerGasParam,
    maxPriorityFeePerGasParam,
  ].filter(e => e.length);

  return `${
    SCHEMA_LONG
  }:${
    maybePrefix.length ? `${maybePrefix}-` : maybePrefix
  }${
    to
  }${
    maybeFunctionInvocation ? `/${maybeFunctionInvocation}` : ''
  }${
    serializeChainId(tx.chainId)
  }${
    parameters.length ? '?' : ''
  }${
    parameters.join('&')
  }`;
}

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

        if (!abi)
          throw new Error(`Expected ABIFunction "${
            maybeFunctionName
          }", encountered "${
            String(abi)
          }".`);

        return async (...args: Array<any>): Promise<string> => serialize({
          __contract: target,
          tx: await target.populateTransaction[maybeFunctionName]!(...args),
        });
      }
  });
}

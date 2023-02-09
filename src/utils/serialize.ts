import {ethers} from 'ethers';

import {SCHEMA_SHORT} from '../constants';
import {bigNumberToDecimal} from "./number";

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

const serializeChainId = paramSerializationThunk({
  param: 'chainId',
  serialize: (value: number) => String(value),
});

export function serialize({
  tx,
}: {
  readonly tx: Partial<ethers.Transaction>;
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
  const chainIdParam = serializeChainId(tx.chainId);

  const parameters = [
    valueParam,
    gasPriceParam,
    gasLimitParam,
    maxFeePerGasParam,
    maxPriorityFeePerGasParam,
    chainIdParam,
  ].filter(e => e.length);

  const url = `${
    SCHEMA_SHORT
  }:${
    to
  }${
    parameters.length ? '?' : ''
  }${
    parameters.join('&')
  }`;

  return {url};
}

import {ethers} from 'ethers';

import type {SerializableTransaction} from '../@types';

import {PREFIX_PAY, SCHEMA_LONG} from '../constants';
import {bigNumberToDecimal} from './number';

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

export function serialize({
  tx,
}: {
  readonly tx: SerializableTransaction;
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

  const parameters = [
    valueParam,
    gasPriceParam,
    gasLimitParam,
    maxFeePerGasParam,
    maxPriorityFeePerGasParam,
  ].filter(e => e.length);

  const maybePrefix = getTransactionPrefix(to);

  const url = `${
    SCHEMA_LONG
  }:${
    maybePrefix.length ? `${maybePrefix}-` : maybePrefix
  }${
    to
  }${
    serializeChainId(tx.chainId)
  }${
    parameters.length ? '?' : ''
  }${
    parameters.join('&')
  }`;

  return {url};
}

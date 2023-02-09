import 'jest';

import { ethers } from 'ethers';

import {bigNumberToDecimal, isValidEns, SCHEMA_SHORT, serialize} from '../src';

describe('ethers-url', () => {
  it('jest', expect(true).toBeTruthy);

  describe('isValidEns', () => {
    expect(isValidEns('cawfree.eth')).toBeTruthy();
  });

  describe('bigNumberToDecimal', () => {
    expect(bigNumberToDecimal(ethers.BigNumber.from('2014000000000000000'))).toBe('2.014e18');
  });

  describe('serialize', () => {

    it('to:invalid', () => {
      expect(() => serialize({tx: {}})).toThrowErrorMatchingSnapshot();
      expect(() => serialize({tx: {to: ''}})).toThrowErrorMatchingSnapshot();
      // @ts-expect-error invalid_type
      expect(() => serialize({tx: {to: null}})).toThrowErrorMatchingSnapshot();
      expect(() => serialize({tx: {to: '<invalid>'}})).toThrowErrorMatchingSnapshot();
    });

    it('to:valid:address', () => {
      const {address: to} = ethers.Wallet.createRandom();
      const {url} = serialize({
        tx: {to},
      });
      expect(url).toBe(`${SCHEMA_SHORT}:${to}`);
    });

    it('to:valid:ens', () => {
      const to = 'cawfree.eth';
      const {url} = serialize({
        tx: {to},
      });
      expect(url).toBe(`${SCHEMA_SHORT}:${to}`);
    });

    it('to:valid:address:value', () => {
      const {address: to} = ethers.Wallet.createRandom();
      const {url} = serialize({
        tx: {
          to,
          value: ethers.utils.parseEther('1'),
        },
      });
      expect(url).toBe(`${SCHEMA_SHORT}:${to}?value=1e18`);
    });

    it('to:valid:address:value:gasLimit:gasPrice:maxFeePerGas:maxPriorityFeePerGas', () => {
      const {address: to} = ethers.Wallet.createRandom();
      const {url} = serialize({
        tx: {
          to,
          value: ethers.utils.parseEther('1'),
          gasLimit: ethers.utils.parseEther('0.5'),
          gasPrice: ethers.utils.parseEther('0.25'),
          maxFeePerGas: ethers.utils.parseEther('0.125'),
          maxPriorityFeePerGas: ethers.utils.parseEther('0.0625'),
        },
      });
      // TODO: check for gas and gasLimit on reconstruction
      expect(url).toBe(`${SCHEMA_SHORT}:${to}?value=1e18&gasPrice=2.5e17&gas=5e17&maxFeePerGas=1.25e17&maxPriorityFeePerGas=6.25e16`);
    });
    it('to:valid:chainId', () => {
      const {address: to} = ethers.Wallet.createRandom();
      const {url} = serialize({
        tx: {
          to,
          chainId: 1,
        },
      });
      expect(url).toBe(`${SCHEMA_SHORT}:${to}@1`);
    });
  });
});


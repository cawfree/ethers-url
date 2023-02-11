import 'jest';

import { ethers } from 'ethers';
import qrcode from 'qrcode';

import erc20 from '../__fixtures__/erc20.abi.json';
import delegatecash from '../__fixtures__/delegatecash.abi.json';

import {
  bigNumberToDecimal,
  isValidEns,
  PREFIX_PAY,
  SCHEMA_LONG,
  serialize,
  wrap,
} from '../src';

const qr = async (url: string) => {
  const code = (await qrcode.toString(url, { type:'terminal' }));

  console.log(url);
  console.log(code);

  return code;
};

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
      const url = serialize({
        tx: {to},
      });
      expect(url).toBe(`${SCHEMA_LONG}:${to}`);
    });

    it('to:valid:ens', () => {
      const to = 'cawfree.eth';
      const url = serialize({
        tx: {to},
      });
      expect(url).toBe(`${SCHEMA_LONG}:${PREFIX_PAY}-${to}`);
    });

    it('to:valid:address:value', () => {
      const {address: to} = ethers.Wallet.createRandom();
      const url = serialize({
        tx: {
          to,
          value: ethers.utils.parseEther('1'),
        },
      });
      expect(url).toBe(`${SCHEMA_LONG}:${to}?value=1e18`);
    });

    it('to:valid:address:value:gasLimit:gasPrice:maxFeePerGas:maxPriorityFeePerGas', () => {
      const {address: to} = ethers.Wallet.createRandom();
      const url = serialize({
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
      expect(url).toBe(`${SCHEMA_LONG}:${to}?value=1e18&gasPrice=2.5e17&gas=5e17&maxFeePerGas=1.25e17&maxPriorityFeePerGas=6.25e16`);
    });
    it('to:valid:chainId', () => {
      const {address: to} = ethers.Wallet.createRandom();
      const url = serialize({
        tx: {
          to,
          chainId: 1,
        },
      });
      expect(url).toBe(`${SCHEMA_LONG}:${to}@1`);
    });

    it('qr:cawfree.eth:0.042', async () => {
      const url = serialize({
        tx: {
          to: 'cawfree.eth',
          value: ethers.utils.parseEther('0.042'),
        },
      });

      expect(await qr(url)).toMatchSnapshot();
    });

    it('qr:0xBd2B3396cdc1980457c91f4058D6FfcbDaF7F846:0.042', async () => {
      const url = serialize({
        tx: {
          to: '0xBd2B3396cdc1980457c91f4058D6FfcbDaF7F846',
          value: ethers.utils.parseEther('0.042'),
        },
      });

      expect(await qr(url)).toMatchSnapshot();
    });

    it('donation link', async () => {
      const url = serialize({
        tx: {
          to: 'cawfree.eth',
        },
      });
      expect(url).toBe('ethereum:pay-cawfree.eth');
    });

    it('wrapped:weth', async () => {
      const weth = new ethers.Contract('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', erc20);
      const wrappedWeth = wrap(weth);

      const sendSomeWrappedEth = await wrappedWeth.transfer(
        ethers.utils.getAddress('0x8e23ee67d1332ad560396262c48ffbb01f93d052'),
        ethers.BigNumber.from('1'),
      );

      await qr(sendSomeWrappedEth);

      expect(sendSomeWrappedEth).toBe(
        'ethereum:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/transfer?address=0x8e23Ee67d1332aD560396262C48ffbB01F93D052&uint256=1'
      );
    });

    it('wrapped:req', async () => {
      const weth = new ethers.Contract('0x8f8221afbb33998d8584a2b05749ba73c37a938a', erc20);
      const wrappedWeth = wrap(weth);

      const sendSomeReq = await wrappedWeth.transfer(
        ethers.utils.getAddress('0x8e23ee67d1332ad560396262c48ffbb01f93d052'),
        ethers.BigNumber.from('1'),
      );

      await qr(sendSomeReq);

      expect(sendSomeReq).toBe(
        'ethereum:0x8f8221aFbB33998d8584A2B05749bA73c37a938a/transfer?address=0x8e23Ee67d1332aD560396262C48ffbB01F93D052&uint256=1'
      );
    });

    it('wrapped:delegatecash', async () => {
      const dc = new ethers.Contract('0x00000000000076a84fef008cdabe6409d2fe638b', delegatecash);
      const wrappedDc = wrap(dc);

      const addressToDelegateTo = '0x312e71162Df834A87a2684d30562b94816b0f072';
      const sewerPass = '0x764aeebcf425d56800ef2c84f2578689415a2daa';

      const pleaseDelegateToMe = await wrappedDc.delegateForContract(
        addressToDelegateTo,
        sewerPass,
        true,
      );

      await qr(pleaseDelegateToMe);

      expect(pleaseDelegateToMe).toBe(
        'ethereum:0x00000000000076A84feF008CDAbe6409d2FE638B/delegateForContract?address=0x312e71162Df834A87a2684d30562b94816b0f072&address=0x764AeebcF425d56800eF2c84F2578689415a2DAa&bool=1'
      );

    });
  });
});


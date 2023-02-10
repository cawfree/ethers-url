import {ethers} from 'ethers';
import BigNumber from 'bignumber.js';

export const bigNumberToDecimal = (num: ethers.BigNumber) =>
  new BigNumber(num.toString(), 10).toExponential().replace('e+', 'e');

export const maybeBigNumber = (data: string): ethers.BigNumber | null => {
  try {
    return ethers.BigNumber.from(data);
  } catch (e) {
    return null;
  }
};

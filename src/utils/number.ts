import type {ethers} from 'ethers';
import BigNumber from 'bignumber.js';

export const bigNumberToDecimal = (num: ethers.BigNumber) =>
  new BigNumber(num.toString(), 10).toExponential().replace('e+', 'e');

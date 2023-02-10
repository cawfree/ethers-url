## [`ethers-url`](https://github.com/cawfree/ethers-url)
🦄 🐝 [__Ethereum URL__](https://eips.ethereum.org/EIPS/eip-681) parsing and generation using [`ethers`](https://github.com/ethers-io/ethers.js).

### 🚀 getting started

You can download [`ethers-url`](https://github.com/cawfree/ethers-url) from [__Yarn__](https://yarnpkg.com):

```shell
yarn add ethers@5.7.2 bignumber.js ethers-url
```

Next, it's easy to take any existing contract interactions you're using and generate the corresponding URL:

```typescript
import {ethers} from 'ethers';
import {wrap} from 'ethers-url';

// This is a proxy of the Contract.
// Traditionally, where you'd usually invoke transactions, you will now receive equivalent transaction URLs.
const wrappedWeth = wrap(
  new ethers.Contract('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', erc20)
);

const erc20TokenTransferUrl = await wrappedWeth.transfer(
  ethers.utils.getAddress('0x8e23ee67d1332ad560396262c48ffbb01f93d052'),
  ethers.BigNumber.from('1'),
); // 'ethereum:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/transfer?address=0x8e23Ee67d1332aD560396262C48ffbB01F93D052&uint256=1'
```

### 🙏 attribution

Huge thanks to [`@brunobar79`](https://twitter.com/brunobar79) for his compliant implementations of [__EIP-681__](https://eips.ethereum.org/EIPS/eip-681) and [__EIP-831__](https://eips.ethereum.org/EIPS/eip-831):
- [`eth-url-parser`](https://github.com/brunobar79/eth-url-parser)
- [`eip681-link-generator`](https://github.com/brunobar79/eip681-link-generator)

### ✌️ license
[__CC0-1.0__](./LICENSE)

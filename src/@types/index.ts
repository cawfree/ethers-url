import type {ethers} from 'ethers';

export type SerializableTransaction = Partial<ethers.Transaction> & Required<Pick<ethers.Transaction, 'to'>>;

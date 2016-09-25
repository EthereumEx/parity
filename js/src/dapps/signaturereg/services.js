// Copyright 2015, 2016 Ethcore (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

import * as abis from '../../json';
import { api } from './parity';

const sortEvents = (a, b) => b.blockNumber.cmp(a.blockNumber) || b.logIndex.cmp(a.logIndex);

const logToEvent = (log) => {
  const key = api.util.sha3(JSON.stringify(log));
  const { blockNumber, logIndex, transactionHash, transactionIndex, params, type } = log;

  return {
    type: log.event,
    state: type,
    blockNumber,
    logIndex,
    transactionHash,
    transactionIndex,
    params,
    key
  };
};

export function attachInterface (callback) {
  return api.ethcore
    .registryAddress()
    .then((registryAddress) => {
      console.log(`the registry was found at ${registryAddress}`);

      const registry = api.newContract(abis.registry, registryAddress).instance;

      return Promise
        .all([
          registry.getAddress.call({}, [api.util.sha3('signaturereg'), 'A']),
          api.personal.listAccounts(),
          api.personal.accountsInfo()
        ]);
    })
    .then(([address, addresses, infos]) => {
      console.log(`signaturereg was found at ${address}`);
      address = '0x2b7E4db4AD1B3D550Ac6111C122EE9cf65c14AcB';

      const contract = api.newContract(abis.signaturereg, address);

      return {
        address,
        contract,
        instance: contract.instance,
        accounts: addresses.reduce((accounts, address) => {
          const info = infos[address];

          accounts[address] = {
            address,
            name: info.name || 'Unnamed',
            uuid: info.uuid
          };
          return accounts;
        }, {})
      };
    })
    .catch((error) => {
      console.error('attachInterface', error);
    });
}

export function attachBlockNumber (instance, callback) {
  return api.subscribe('eth_blockNumber', (error, blockNumber) => {
    if (error) {
      console.error('blockNumber', error);
      return;
    }

    instance.totalSignatures
      .call()
      .then((totalSignatures) => {
        callback({
          blockNumber,
          totalSignatures
        });
      })
      .catch((error) => {
        console.error('totalSignatures', error);
      });
  });
}

export function attachEvents (contract, callback) {
  const blocks = { '0': {} };
  let mined = [];
  let pending = [];
  let events = [];

  const options = {
    fromBlock: 0,
    toBlock: 'pending',
    limit: 50
  };

  return contract.subscribe('Registered', options, (error, _logs) => {
    if (error) {
      console.error('events', error);
      return;
    }

    if (_logs.length) {
      const logs = _logs.map(logToEvent);

      mined = logs
        .filter((log) => log.state === 'mined')
        .map((log) => {
          const blockNumber = log.blockNumber.toString();

          if (!blocks[blockNumber]) {
            blocks[blockNumber] = {};
            getBlock(blockNumber).then((block) => {
              Object.assign(blocks[blockNumber], block);
            });
          }

          return Object.assign(log, { block: blocks[blockNumber] });
        })
        .reverse()
        .concat(mined)
        .sort(sortEvents);

      pending = logs
        .filter((log) => log.state === 'pending')
        .reverse()
        .concat(pending.filter((event) => {
          return !logs.find((log) => {
            const isMined = (log.state === 'mined') && (log.transactionHash === event.transactionHash);
            const isPending = (log.state === 'pending') && (log.key === event.key);

            return isMined || isPending;
          });
        }))
        .sort(sortEvents);

      events = pending.concat(mined);
    }

    callback({ events });
  });
}

export function getBlock (blockNumber) {
  return api.eth.getBlockByNumber(blockNumber);
}

export function callRegister (instance, id, options = {}) {
  return instance.register.call(options, [id]);
}

export function postRegister (instance, id, options = {}) {
  return instance.register
    .estimateGas(options, [id])
    .then((gas) => {
      options.gas = gas.mul(1.2).toFixed(0);
      instance.register.postTransaction(options, [id]);
    });
}
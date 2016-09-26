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

import BigNumber from 'bignumber.js';
import React, { Component, PropTypes } from 'react';

import Input from '../Form/Input';

import styles from './methodDecoding.css';

const CONTRACT_CREATE = '0x60606040';

export default class Method extends Component {
  static contextTypes = {
    api: PropTypes.object.isRequired,
    contracts: PropTypes.object.isRequired
  }

  static propTypes = {
    input: PropTypes.string
  }

  state = {
    signature: null,
    paramdata: null,
    name: null,
    inputs: null
  }

  componentDidMount () {
    const { input } = this.props;

    this.lookup(input);
  }

  componentWillReceiveProps (newProps) {
    const { input } = this.props;

    if (newProps.input === input) {
      return;
    }

    this.lookup(input);
  }

  render () {
    const { name } = this.state;

    if (!name) {
      return null;
    }

    return (
      <div className={ styles.method }>
        <div className={ styles.name }>
          { name }
        </div>
        <div className={ styles.inputs }>
          { this.renderInputs() }
        </div>
      </div>
    );
  }

  renderInputs () {
    const { inputs } = this.state;

    return inputs.map((input, index) => {
      return (
        <Input
          disabled
          key={ index }
          className={ styles.input }
          value={ this.renderValue(input.value) }
          label={ input.type } />
      );
    });
  }

  renderValue (value) {
    const { api } = this.context;

    if (api.util.isInstanceOf(value, BigNumber)) {
      return value.toFormat(0);
    } else if (api.util.isArray(value)) {
      return api.util.bytesToHex(value);
    }

    return value.toString();
  }

  lookup (input) {
    const { api, contracts } = this.context;

    if (!input) {
      return;
    }

    const { signature, paramdata } = api.util.decodeCallData(input);

    if (!signature || signature === CONTRACT_CREATE) {
      return;
    }

    this.setState({ signature, paramdata });

    contracts.signatureReg
      .lookup(signature)
      .then(([method, owner]) => {
        let inputs = null;
        let name = null;

        if (method && method.length) {
          const abi = api.util.methodToAbi(method);

          name = abi.name;
          inputs = api.util
            .decodeMethodInput(abi, paramdata)
            .map((value, index) => {
              const type = abi.inputs[index].type;

              return { type, value };
            });
        }

        this.setState({ method, name, inputs });
      })
      .catch((error) => {
        console.error('lookup', error);
      });
  }
}

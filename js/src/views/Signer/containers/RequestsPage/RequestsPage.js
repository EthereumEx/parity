import BigNumber from 'bignumber.js';
import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Container, ContainerTitle } from '../../../../ui';

import { RequestPendingWeb3, RequestFinishedWeb3 } from '../../components';
import * as RequestsActions from '../../actions/requests';

import styles from './RequestsPage.css';

class RequestsPage extends Component {
  static propTypes = {
    signerRequests: PropTypes.shape({
      pending: PropTypes.array.isRequired,
      finished: PropTypes.array.isRequired
    }).isRequired,
    actions: PropTypes.shape({
      startConfirmRequest: PropTypes.func.isRequired,
      startRejectRequest: PropTypes.func.isRequired
    }).isRequired
  };

  render () {
    const { pending, finished } = this.props.signerRequests;

    if (!pending.length && !finished.length) {
      return this.renderNoRequestsMsg();
    }

    return (
      <div>
        { this.renderPendingRequests() }
        { this.renderFinishedRequests() }
      </div>
    );
  }

  _sortRequests = (a, b) => {
    return new BigNumber(b.id).cmp(a.id);
  }

  renderPendingRequests () {
    const { pending } = this.props.signerRequests;

    if (!pending.length) {
      return;
    }

    const items = pending.sort(this._sortRequests).map(this.renderPending);

    return (
      <Container>
        <ContainerTitle title='Pending Requests' />
        <div className={ styles.items }>
          { items }
        </div>
      </Container>
    );
  }

  renderFinishedRequests () {
    const { finished } = this.props.signerRequests;

    if (!finished.length) {
      return;
    }

    const items = finished.sort(this._sortRequests).map(this.renderFinished);

    return (
      <Container>
        <ContainerTitle title='Finished Requests' />
        <div className={ styles.items }>
          { items }
        </div>
      </Container>
    );
  }

  renderPending = (data) => {
    const { actions } = this.props;
    const { payload, id, isSending } = data;

    return (
      <RequestPendingWeb3
        className={ styles.request }
        onConfirm={ actions.startConfirmRequest }
        onReject={ actions.startRejectRequest }
        isSending={ isSending || false }
        key={ id }
        id={ id }
        payload={ payload }
      />
    );
  }

  renderFinished = (data) => {
    const { payload, id, result, msg, status, error } = data;

    return (
      <RequestFinishedWeb3
        className={ styles.request }
        result={ result }
        key={ id }
        id={ id }
        msg={ msg }
        status={ status }
        error={ error }
        payload={ payload }
        />
    );
  }

  renderNoRequestsMsg () {
    return (
      <Container>
        <div className={ styles.noRequestsMsg }>
          There are no requests requiring your confirmation.
        </div>
      </Container>
    );
  }
}

function mapStateToProps (state) {
  return state;
}

function mapDispatchToProps (dispatch) {
  return {
    actions: bindActionCreators(RequestsActions, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RequestsPage);
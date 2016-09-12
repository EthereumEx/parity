import React, { Component, PropTypes } from 'react';
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar';

import styles from './actionbar.css';

export default class Actionbar extends Component {
  static propTypes = {
    title: PropTypes.string,
    buttons: PropTypes.array,
    children: PropTypes.node,
    className: PropTypes.string
  };

  render () {
    const { children, className } = this.props;
    const classes = `${styles.actionbar} ${className}`;

    return (
      <Toolbar className={ classes }>
        { this.renderTitle() }
        { this.renderButtons() }
        { children }
      </Toolbar>
    );
  }

  renderButtons () {
    const { buttons } = this.props;

    if (!buttons || !buttons.length) {
      return null;
    }

    return (
      <ToolbarGroup
        className={ styles.toolbuttons }>
        { buttons }
      </ToolbarGroup>
    );
  }

  renderTitle () {
    const { title } = this.props;

    return (
      <ToolbarTitle
        className={ styles.tooltitle }
        text={ title } />
    );
  }
}
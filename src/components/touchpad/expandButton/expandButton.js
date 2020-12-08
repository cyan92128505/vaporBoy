// Desktop Layout for vaporboy
import { Component } from "preact";

import { Pubx } from "../../../services/pubx";
import { PUBX_CONFIG } from "../../../pubx.config";

export default class ExpandButton extends Component {
  constructor() {
    super();
    this.setState({
      layout: {},
    });
  }

  componentDidMount() {
    const pubxLayoutSubscriberKey = Pubx.subscribe(
      PUBX_CONFIG.LAYOUT_KEY,
      (newState) => {
        // Finally set the state
        this.setState({
          ...this.state,
          layout: {
            ...this.state.layout,
            ...newState,
          },
        });
      }
    );
  }

  componentWillUnmount() {
    // unsubscribe from the state
    Pubx.unsubscribe(
      PUBX_CONFIG.LAYOUT_KEY,
      this.state.pubxLayoutSubscriberKey
    );
  }

  render() {
    let fullscreenIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M0 0h24v24H0z" fill="none" />
        <path
          class="expand-button__icon"
          d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
        />
      </svg>
    );

    if (this.state.layout.expanded) {
      fullscreenIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none" />
          <path
            class="expand-button__icon"
            d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"
          />
        </svg>
      );
    }

    return (
      <button
        class="expand-button"
        onClick={() => this.props.onClick()}
        aria-label="expand"
      >
        {fullscreenIcon}
      </button>
    );
  }
}

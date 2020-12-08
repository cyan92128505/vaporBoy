import { Component } from "preact";
import { WasmBoy } from "wasmboy";
import FileSaver from "file-saver";

import { Pubx } from "../../../services/pubx";
import { PUBX_CONFIG } from "../../../pubx.config";

import { NOTIFICATION_MESSAGES } from "../../../notification.messages";

const packageJson = require("../../../../package.json");

export default class OutputStateList extends Component {
  constructor() {
    super();
    this.setState({});
  }

  componentDidMount() {
    this.setState({
      saveStates: {
        ...Pubx.get(PUBX_CONFIG.SAVES_STATES_KEY),
      },
      controlPanel: {
        ...Pubx.get(PUBX_CONFIG.CONTROL_PANEL_KEY),
      },
    });
  }

  checkStateVersion(saveState) {
    FileSaver.saveAs(
      JSON.stringify(saveState),
      packageJson.displayName +
        packageJson.version +
        "-" +
        saveState.date +
        ".json"
    );
  }

  loadState(saveState) {
    const loadStatePromise = new Promise((resolve, reject) => {
      WasmBoy.loadState(saveState)
        .then(() => {
          WasmBoy.play()
            .then(() => {
              this.state.controlPanel.hideControlPanel();
              Pubx.get(PUBX_CONFIG.NOTIFICATION_KEY).showNotification(
                NOTIFICATION_MESSAGES.LOAD_STATE
              );
              resolve();
            })
            .catch((error) => {
              console.error(error);
              Pubx.get(PUBX_CONFIG.NOTIFICATION_KEY).showNotification(
                NOTIFICATION_MESSAGES.ERROR_RESUME_ROM
              );
              reject();
            });
        })
        .catch((error) => {
          console.error(error);
          Pubx.get(PUBX_CONFIG.NOTIFICATION_KEY).showNotification(
            NOTIFICATION_MESSAGES.ERROR_LOAD_STATE
          );
          reject();
        });
    });

    Pubx.get(PUBX_CONFIG.LOADING_KEY).addPromiseToStack(loadStatePromise);
  }

  render() {
    const saveStates = [];
    if (this.state.saveStates && this.state.saveStates.saveStates) {
      // Sort our save states by newest
      this.state.saveStates.saveStates.sort((a, b) => {
        if (a.date > b.date) {
          return -1;
        }

        if (a.date < b.date) {
          return 1;
        }

        return 0;
      });

      // Add them to our sae state DOM array
      this.state.saveStates.saveStates.forEach((saveState) => {
        const saveStateDate = new Date(saveState.date);

        let saveStateVersionElement = <div />;
        if (saveState.vaporBoyVersion) {
          saveStateVersionElement = (
            <div>VaporBoy Version: {saveState.vaporBoyVersion}</div>
          );
        }

        saveStates.push(
          <li>
            <button
              onClick={() => this.checkStateVersion(saveState)}
              aria-label={`Load Save State from ${saveStateDate.toLocaleString()}`}
            >
              <div>
                <img src={saveState.screenshotCanvasDataURL} />
              </div>
              <div>Date: {saveStateDate.toLocaleString()}</div>
              <div>isAuto: {saveState.isAuto.toString()}</div>
              {saveStateVersionElement}
            </button>
          </li>
        );
      });
    }

    return (
      <div class="load-state-list">
        <ul>{saveStates}</ul>
      </div>
    );
  }
}

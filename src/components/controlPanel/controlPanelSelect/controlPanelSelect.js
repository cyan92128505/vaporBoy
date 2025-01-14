import { Component } from "preact";
import { WasmBoy } from "wasmboy";

import { Pubx } from "../../../services/pubx";
import { PUBX_CONFIG } from "../../../pubx.config";

import { NOTIFICATION_MESSAGES } from "../../../notification.messages";

import ROMSourceSelector from "../ROMSourceSelector/ROMSourceSelector";
import LoadStateList from "../loadStateList/loadStateList";
import OutputStateList from "../outputStateList/outputStateList";
import VaporBoyOptions from "../vaporBoyOptions/vaporBoyOptions";
import VaporBoyEffects from "../vaporBoyEffects/vaporBoyEffects";
import About from "../about/about";
import Install from "../install/install";
import Legacy from "../legacy/legacy";

export default class ControlPanelSelect extends Component {
  constructor() {
    super();
  }

  componentDidMount() {
    // Subscribe to our save states for enabling/disabling loading
    const pubxSaveStatesSubscriberKey = Pubx.subscribe(
      PUBX_CONFIG.SAVES_STATES_KEY,
      (newState) => {
        this.setState({
          ...this.state,
          saveStates: {
            ...this.state.saveStates,
            ...newState,
          },
        });
      }
    );

    this.setState({
      collection: {
        ...Pubx.get(PUBX_CONFIG.ROM_COLLECTION_KEY),
      },
      saveStates: {
        ...Pubx.get(PUBX_CONFIG.SAVES_STATES_KEY),
      },
      controlPanel: {
        ...Pubx.get(PUBX_CONFIG.CONTROL_PANEL_KEY),
      },
      speed: {
        ...Pubx.get(PUBX_CONFIG.SPEED_KEY),
      },
      pubxSaveStatesSubscriberKey,
    });
  }

  componentWillUnmount() {
    // unsubscribe from the state
    Pubx.unsubscribe(
      PUBX_CONFIG.SAVES_STATES_KEY,
      this.state.pubxSaveStatesSubscriberKey
    );
  }

  shouldDisableLoadStates() {
    if (!WasmBoy.isReady()) {
      return true;
    }

    if (!this.state.saveStates || !this.state.saveStates.saveStates) {
      return true;
    }

    return false;
  }

  saveState() {
    WasmBoy.saveState()
      .then(() => {
        WasmBoy.play()
          .then(() => {
            this.state.controlPanel.hideControlPanel();
            Pubx.get(PUBX_CONFIG.NOTIFICATION_KEY).showNotification(
              NOTIFICATION_MESSAGES.SAVE_STATE
            );
          })
          .catch((error) => {
            console.error(error);
            Pubx.get(PUBX_CONFIG.NOTIFICATION_KEY).showNotification(
              `${NOTIFICATION_MESSAGES.SAVE_STATE} ${NOTIFICATION_MESSAGES.ERROR_RESUME_ROM}`
            );
          });
      })
      .catch((error) => {
        console.error(error);
        Pubx.get(PUBX_CONFIG.NOTIFICATION_KEY).showNotification(
          NOTIFICATION_MESSAGES.ERROR_SAVE_STATE
        );
      });
  }

  uploadState(e) {
    let file = e.target.files[0];
    try {
      alert(!!file ? file.length : "ERROR File");
      let saveState = JSON.parse(file);
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
    } catch (error) {
      console.log(error);
    }
  }

  toggleSpeed() {
    this.state.speed.toggleSpeed();
    let speed = this.state.speed.getSpeed();
    WasmBoy.setSpeed(speed);

    this.state.controlPanel.hideControlPanel();
    Pubx.get(PUBX_CONFIG.NOTIFICATION_KEY).showNotification(
      NOTIFICATION_MESSAGES.TOGGLE_SPEED
    );
  }

  viewROMSourceSelector() {
    this.state.controlPanel.addComponentToControlPanelViewStack(
      "Select a ROM",
      <ROMSourceSelector />
    );
  }

  viewOutputStateList() {
    this.state.controlPanel.addComponentToControlPanelViewStack(
      "Output State",
      <OutputStateList />
    );
  }

  viewLoadStateList() {
    this.state.controlPanel.addComponentToControlPanelViewStack(
      "Load State",
      <LoadStateList />
    );
  }

  viewOptions() {
    this.state.controlPanel.addComponentToControlPanelViewStack(
      "Options",
      <VaporBoyOptions />
    );
  }

  viewEffects() {
    this.state.controlPanel.addComponentToControlPanelViewStack(
      "Effects",
      <VaporBoyEffects />
    );
  }

  viewAbout() {
    this.state.controlPanel.addComponentToControlPanelViewStack(
      "About",
      <About />
    );
  }

  viewInstall() {
    this.state.controlPanel.addComponentToControlPanelViewStack(
      "Install",
      <Install />
    );
  }

  viewLegacy() {
    this.state.controlPanel.addComponentToControlPanelViewStack(
      "Legacy",
      <Legacy />
    );
  }

  playROM() {
    WasmBoy.play();
    this.state.controlPanel.hideControlPanel();
    Pubx.get(PUBX_CONFIG.NOTIFICATION_KEY).showNotification(
      NOTIFICATION_MESSAGES.RESUME_ROM
    );
  }

  pauseROM() {
    WasmBoy.pause();
    this.state.controlPanel.hideControlPanel();
    Pubx.get(PUBX_CONFIG.NOTIFICATION_KEY).showNotification(
      NOTIFICATION_MESSAGES.PAUSE_ROM
    );
  }

  reloadVaporBoy() {
    if (window !== undefined && window.gtag) {
      gtag("event", "reload");
    }
    window.location.reload(true);
  }

  render() {
    let playPause = (
      <button
        onclick={() => this.playROM()}
        disabled={!WasmBoy.isReady()}
        aria-label="Resume Playing"
      >
        <div>▶️</div>
        <div>Resume Playing</div>
      </button>
    );
    if (WasmBoy.isPlaying()) {
      playPause = (
        <button
          onclick={() => this.pauseROM()}
          disabled={!WasmBoy.isReady()}
          aria-label="Pause ROM"
        >
          <div>⏸️</div>
          <div>Pause ROM</div>
        </button>
      );
    }

    // Also check if we should show PWA Install
    let install = (
      <button onclick={() => this.viewInstall()} aria-label="Install">
        <div>⬇️</div>
        <div>Install</div>
      </button>
    );
    // This will show if you are in the PWA view
    // https://stackoverflow.com/questions/41742390/javascript-to-check-if-pwa-or-mobile-web
    // https://developer.mozilla.org/en-US/docs/Web/CSS/@media/display-mode
    if (Pubx.get(PUBX_CONFIG.LAYOUT_KEY).mobile) {
      if (
        window.matchMedia("(display-mode: fullscreen)").matches ||
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.fullscreen ||
        window.navigator.standalone
      ) {
        install = "";
      }
    }

    // Get our current speed
    let speed = 1.0;
    if (this.state.speed) {
      speed = this.state.speed.getSpeed();
    }

    return (
      <div class="control-panel-select">
        <ul class="control-panel-select__grid">
          <li class="control-panel-select__grid__item">
            <button
              onclick={() => this.viewROMSourceSelector()}
              aria-label="Select a ROM"
            >
              <div>🎮</div>
              <div>Select a ROM</div>
            </button>
          </li>
          <li class="control-panel-select__grid__item">
            <button
              onclick={() => this.saveState()}
              disabled={!WasmBoy.isReady()}
              aria-label="Save State for current loaded ROM"
            >
              <div>💾</div>
              <div>Save State</div>
            </button>
          </li>
          <li class="control-panel-select__grid__item">
            <button
              onclick={() => this.viewLoadStateList()}
              disabled={this.shouldDisableLoadStates()}
              aria-label="Load State for current loaded ROM"
            >
              <div>📂</div>
              <div>Load State</div>
            </button>
          </li>
          <li class="control-panel-select__grid__item">
            <button
              onclick={() => this.viewOutputStateList()}
              disabled={this.shouldDisableLoadStates()}
              aria-label="Output State for current loaded ROM"
            >
              <div>📂</div>
              <div>Output State</div>
            </button>
          </li>
          <li class="control-panel-select__grid__item">
            <div class="file-input">
              <label
                for="file-input"
                className={WasmBoy.isReady() ? "" : "disabled"}
              >
                <div>💾</div>
                <div>Upload State</div>
              </label>
              <input
                id="file-input"
                type="file"
                name="image"
                onChange={this.uploadState}
                disabled={!WasmBoy.isReady()}
                placeholder="Update State for current loaded ROM"
                style="display: none;"
              />
            </div>
          </li>
          <li class="control-panel-select__grid__item">
            <button
              onclick={() => this.toggleSpeed()}
              disabled={!WasmBoy.isPlaying()}
              aria-label={`Toggle Speed - Current: ${speed}x`}
            >
              <div>⚡</div>
              <div>{`Toggle Speed - Current: ${speed}x`}</div>
            </button>
          </li>
          <li class="control-panel-select__grid__item">
            <button
              onclick={() => this.viewOptions()}
              aria-label="Configure Options"
            >
              <div>⚙️</div>
              <div>Configure Options</div>
            </button>
          </li>
          <li class="control-panel-select__grid__item">
            <button
              onclick={() => this.viewEffects()}
              aria-label="Configure Effects"
            >
              <div>✨</div>
              <div>Configure Effects</div>
            </button>
          </li>
          <li class="control-panel-select__grid__item">{playPause}</li>
          <li class="control-panel-select__grid__item">
            <button onclick={() => this.viewAbout()} aria-label="About">
              <div>ℹ️</div>
              <div>About</div>
            </button>
          </li>
          <li class="control-panel-select__grid__item">
            <button onclick={() => this.reloadVaporBoy()} aria-label="About">
              <div>♻️</div>
              <div>Reload</div>
            </button>
          </li>
          <li class="control-panel-select__grid__item">
            <button onclick={() => this.viewLegacy()} aria-label="Legacy">
              <div>🗝️</div>
              <div>Legacy</div>
            </button>
          </li>
          <li class="control-panel-select__grid__item">{install}</li>
        </ul>
      </div>
    );
  }
}

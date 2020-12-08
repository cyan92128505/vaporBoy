import { Component } from "preact";
import { WasmBoy } from "wasmboy";

import { Pubx } from "../../../services/pubx";
import { PUBX_CONFIG } from "../../../pubx.config";

import { NOTIFICATION_MESSAGES } from "../../../notification.messages";

import Cartridge from "../cartridge/cartridge";

import { AVAILABLE_GAMES } from "./availableGames";

export default class Homebrew extends Component {
  constructor() {
    super();
    this.setState({});
  }

  componentDidMount() {
    this.setState({
      controlPanel: {
        ...Pubx.get(PUBX_CONFIG.CONTROL_PANEL_KEY),
      },
    });
  }

  loadROM(availableGame) {
    const loadHomebrewTask = async () => {
      await WasmBoy.pause();
      await WasmBoy.loadROM(availableGame.ROMPath);
      await WasmBoy.play();

      Pubx.get(PUBX_CONFIG.NOTIFICATION_KEY).showNotification(
        NOTIFICATION_MESSAGES.LOAD_ROM
      );
      this.state.controlPanel.hideControlPanel();

      if (window !== undefined && window.gtag) {
        gtag("event", "homebrew_load");
      }
    };

    const loadHomebrewPromise = loadHomebrewTask();
    loadHomebrewPromise.catch((error) => {
      console.error(error);
      Pubx.get(PUBX_CONFIG.NOTIFICATION_KEY).showNotification(
        NOTIFICATION_MESSAGES.ERROR_LOAD_ROM
      );
    });
    Pubx.get(PUBX_CONFIG.LOADING_KEY).addPromiseToStack(loadHomebrewPromise);
  }

  showHomebrewInfo(game) {
    Pubx.get(PUBX_CONFIG.CONFIRMATION_MODAL_KEY).showConfirmationModal({
      title: `Homebrew Info - ${game.title}`,
      contentElement: game.infoElement,
    });
  }

  render() {
    let homebrewROMs = [];
    AVAILABLE_GAMES.forEach((game) => {
      homebrewROMs.push(
        <li class="ROM-list__item" aria-label={game.title}>
          <div class="ROM-list__item__cartridge">
            <Cartridge
              imageUrl={game.imagePath}
              onClick={() => {
                this.loadROM(game);
              }}
              ariaLabel={game.title}
            />
          </div>
          <div class="ROM-list__item__label">{game.title}</div>
          <div class="ROM-list__item__list-button">
            <button
              class="list-button--info"
              onClick={() => this.showHomebrewInfo(game)}
              aria-label={`Information about ${game.title}`}
            >
              i
            </button>
          </div>
        </li>
      );
    });

    return (
      <div>
        <ul class="ROM-list">{homebrewROMs}</ul>
      </div>
    );
  }
}

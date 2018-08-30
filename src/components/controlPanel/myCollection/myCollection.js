import { Component } from "preact";
import { WasmBoy } from "wasmboy";

import { Pubx } from "../../../services/pubx";
import { PUBX_CONFIG } from "../../../pubx.config";

import { NOTIFICATION_MESSAGES } from "../../../notification.messages";

import Cartridge from "../cartridge/cartridge";
import ROMScraper from "../ROMScraper/ROMScraper";

export default class MyCollection extends Component {
  constructor() {
    super();
    this.setState({});
  }

  componentDidMount() {
    this.setState({
      collection: {
        ...Pubx.get(PUBX_CONFIG.ROM_COLLECTION_KEY)
      },
      controlPanel: {
        ...Pubx.get(PUBX_CONFIG.CONTROL_PANEL_KEY)
      }
    });
  }

  getROMImageUrl(collectionROM) {
    return collectionROM.imageAsDataURL;
  }

  getROMTitle(collectionROM) {
    return collectionROM.titleAsString;
  }

  loadROM(collectionROM) {
    const loadROMTask = async () => {
      await WasmBoy.pause();
      await WasmBoy.loadROM(collectionROM.ROM);
      console.log("Wasmboy Ready!");
      await WasmBoy.play();

      Pubx.get(PUBX_CONFIG.NOTIFICATION_KEY).showNotification(
        NOTIFICATION_MESSAGES.LOAD_ROM
      );
      this.state.controlPanel.hideControlPanel();
    };

    const loadROMPromise = loadROMTask();
    loadROMPromise.catch(() => {
      Pubx.get(PUBX_CONFIG.NOTIFICATION_KEY).showNotification(
        NOTIFICATION_MESSAGES.ERROR_LOAD_ROM
      );
    });

    Pubx.get(PUBX_CONFIG.LOADING_KEY).addPromiseToStack(loadROMPromise);
  }

  editROM(collectionROM) {
    // Load the ROM, and then launch the editor
    const editRomTask = async () => {
      await WasmBoy.pause();
      await WasmBoy.loadROM(collectionROM.ROM);

      Pubx.publish(PUBX_CONFIG.CONTROL_PANEL_KEY, {
        viewStack: [
          {
            title: `ROM Scraper - ${collectionROM.titleAsString}`,
            view: <ROMScraper rom={collectionROM.ROM} />
          }
        ],
        required: true
      });
    };
    Pubx.get(PUBX_CONFIG.LOADING_KEY).addPromiseToStack(editROMTask());
  }

  render() {
    let collectionROMs = [];
    if (this.state.collection && this.state.collection.collection) {
      Object.keys(this.state.collection.collection).forEach(
        collectionROMKey => {
          const collectionROM = this.state.collection.collection[
            collectionROMKey
          ];

          collectionROMs.push(
            <li class="ROM-list__item">
              <div class="ROM-list__item__cartridge">
                <Cartridge
                  imageUrl={this.getROMImageUrl(collectionROM)}
                  onClick={() => {
                    this.loadROM(collectionROM);
                  }}
                />
              </div>
              <div class="ROM-list__item__label">
                {this.getROMTitle(collectionROM)}
              </div>
              <div class="ROM-list__item__list-button">
                <button
                  class="list-button--edit"
                  onClick={() => this.editROM(collectionROM)}
                >
                  ✏️
                </button>
              </div>
            </li>
          );
        }
      );
    }

    return (
      <div>
        <ul class="ROM-list">{collectionROMs}</ul>
      </div>
    );
  }
}

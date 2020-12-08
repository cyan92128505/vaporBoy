import { Component } from "preact";
import { WasmBoy } from "wasmboy";

import { Pubx } from "../../../services/pubx";
import { PUBX_CONFIG } from "../../../pubx.config";

import { NOTIFICATION_MESSAGES } from "../../../notification.messages";

import { ROMCollection } from "../../../services/ROMCollection";

import SearchInput from "./searchInput/searchInput";
import ManualInput from "./manualInput/manualInput";

export default class ROMScraper extends Component {
  constructor() {
    super();

    this.setState({
      ROMScraper: {
        ...Pubx.get(PUBX_CONFIG.ROM_SCRAPER_KEY),
      },
      controlPanel: {
        ...Pubx.get(PUBX_CONFIG.CONTROL_PANEL_KEY),
      },
      submitting: false,
    });
  }

  componentDidMount() {
    const pubxROMScraperSubscriberKey = Pubx.subscribe(
      PUBX_CONFIG.ROM_SCRAPER_KEY,
      (newState) => {
        this.setState({
          ...this.state,
          ROMScraper: {
            ...newState,
          },
        });
      }
    );

    this.setState({
      ...this.state,
      pubxROMScraperSubscriberKey: pubxROMScraperSubscriberKey,
    });
  }

  componentWillUnmount() {
    // unsubscribe from the state
    Pubx.unsubscribe(
      PUBX_CONFIG.ROM_SCRAPER_KEY,
      this.state.pubxROMScraperSubscriberKey
    );
  }

  setActiveTabIndex(activeTabIndex) {
    Pubx.publish(PUBX_CONFIG.ROM_SCRAPER_KEY, {
      activeTabIndex: activeTabIndex,
      ROMInfo: {},
    });
  }

  shouldDisableSubmit() {
    return (
      !this.state.ROMScraper ||
      !this.state.ROMScraper.ROMInfo ||
      Object.keys(this.state.ROMScraper.ROMInfo) <= 0 ||
      !this.state.ROMScraper.ROMInfo.title
    );
  }

  skipAddToCollection() {
    // If Skip, simply play the ROM
    const playROMTask = async () => {
      await WasmBoy.play();

      Pubx.get(PUBX_CONFIG.NOTIFICATION_KEY).showNotification(
        NOTIFICATION_MESSAGES.LOAD_ROM
      );
      this.state.controlPanel.hideControlPanel();
    };
    const playROMPromise = playROMTask();
    playROMPromise.catch((error) => {
      console.error(error);
      Pubx.get(PUBX_CONFIG.NOTIFICATION_KEY).showNotification(
        NOTIFICATION_MESSAGES.ERROR_LOAD_ROM
      );
    });

    Pubx.get(PUBX_CONFIG.LOADING_KEY).addPromiseToStack(playROMPromise);
  }

  addROMToCollection() {
    const addROMToCollectionTask = async () => {
      await ROMCollection.saveCurrentWasmBoyROMToCollection(
        this.state.ROMScraper.ROMInfo.title,
        this.state.ROMScraper.ROMInfo.imageDataURL
      );
      ROMCollection.updateCollection();
      await WasmBoy.play();

      Pubx.get(PUBX_CONFIG.NOTIFICATION_KEY).showNotification(
        `${NOTIFICATION_MESSAGES.ADD_ROM_TO_COLLECTION}

        ${NOTIFICATION_MESSAGES.LOAD_ROM}`
      );
      this.state.controlPanel.hideControlPanel();
    };
    const addROMToCollectionPromise = addROMToCollectionTask();
    addROMToCollectionPromise.catch((error) => {
      console.error(error);
      Pubx.get(PUBX_CONFIG.NOTIFICATION_KEY).showNotification(
        NOTIFICATION_MESSAGES.ERROR_ADD_ROM_TO_COLLECTION
      );
    });
    Pubx.get(PUBX_CONFIG.LOADING_KEY).addPromiseToStack(
      addROMToCollectionPromise
    );
  }

  componentDidUpdate() {
    // Focus on our text [a11y]

    // Dont re focus if we are focused on an input element
    if (
      document.activeElement &&
      document.activeElement.tagName.toLowerCase() === "input"
    ) {
      return;
    }
    const focusElement = document.querySelector(".ROMScraper button");
    if (focusElement) {
      focusElement.focus();
    }
  }

  render() {
    let currentTabElement = <div />;
    let searchTabAria = "Open Search Tab";
    let manualTabAria = "Open Manual Input Tab";
    if (this.state.ROMScraper.activeTabIndex === 0) {
      currentTabElement = <SearchInput />;
      searchTabAria = `Current Tab - ${searchTabAria}`;
    } else if (this.state.ROMScraper.activeTabIndex === 1) {
      currentTabElement = <ManualInput />;
      manualTabAria = `Current Tab - ${manualTabAria}`;
    }

    return (
      <div class="ROMScraper">
        <div class="aesthetic-windows-95-tabbed-container">
          <div class="aesthetic-windows-95-tabbed-container-tabs">
            <div
              class={
                "aesthetic-windows-95-tabbed-container-tabs-button " +
                (this.state.ROMScraper.activeTabIndex === 0 ? "is-active" : "")
              }
            >
              <button
                onClick={() => this.setActiveTabIndex(0)}
                aria-label={searchTabAria}
              >
                Search
              </button>
            </div>
            <div
              class={
                "aesthetic-windows-95-tabbed-container-tabs-button " +
                (this.state.ROMScraper.activeTabIndex === 1 ? "is-active" : "")
              }
            >
              <button
                onClick={() => this.setActiveTabIndex(1)}
                aria-label={manualTabAria}
              >
                Manual Input
              </button>
            </div>
          </div>

          <div class="aesthetic-windows-95-container">
            {currentTabElement}

            <div class="ROMScraper__submit">
              <div class="aesthetic-windows-95-button">
                <button
                  onClick={() => this.skipAddToCollection()}
                  aria-label="Skip ROM Scrape, and play ROM"
                >
                  Skip
                </button>
              </div>

              <div class="aesthetic-windows-95-button">
                <button
                  disabled={this.shouldDisableSubmit()}
                  onClick={() => this.addROMToCollection()}
                  aria-label="Submit ROM"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

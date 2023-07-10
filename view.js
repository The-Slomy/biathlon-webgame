import { TimeConverter } from "./modules/utils.js";

export default class View {
  //Namespaces for DOM elements stored in the object
  $ = {};

  $$ = {};

  constructor() {
    this.$.startBtn = this.#qs('[data-id="start-btn"]');
    this.$.stopBtn = this.#qs('[data-id="stop-btn"]');
    this.$.resetBtn = this.#qs('[data-id="reset-btn"]');
    this.$.oneSpeed = this.#qs('[data-id="x1-btn"]');
    this.$.fiveSpeed = this.#qs('[data-id="x5-btn"]');
    this.$.tenSpeed = this.#qs('[data-id="x10-btn"]');
    this.$.time = this.#qs('[data-id="stopwatch-time"]');

    this.$$.intermediateContentList = this.#qsAll(
      '[data-id="intermediate-content"]'
    );
    this.$$.shootingContentList = this.#qsAll('[data-id="shooting-content"]');
  }
  //Methods updating UI
  displayTime(ms) {
    this.$.time.textContent = TimeConverter.displayStandardTimeFromMs(ms);
  }

  render(shootingItemList, intermediateItemList, stopwatchSpeed) {
    this.#resetResultDisplay();

    //Order intermediatesList
    let orderedInterList = [];
    if (intermediateItemList) {
      orderedInterList = intermediateItemList.sort((time1, time2) => {
        if (time1.time < time2.time) {
          return -1;
        } else if (time1.time > time2.time) {
          return 1;
        } else return 0;
      });
    }

    if (shootingItemList)
      shootingItemList.forEach((item) => {
        this.#appendShootingItem(
          item.fullName,
          item.shootingDetail,
          item.currentTurn,
          stopwatchSpeed,
          item.skierId
        );
      });
    if (orderedInterList)
      orderedInterList.forEach((item) => {
        const currentTurnList = intermediateItemList.filter(
          (filterItem) => filterItem.currentTurn === item.currentTurn
        );

        const isFirst =
          currentTurnList.map((arr) => arr.skierId).indexOf(item.skierId) === 0;

        let time = 0;
        if (!isFirst) {
          time = item.time * 1000 - currentTurnList[0].time * 1000;
        } else {
          time = item.time * 1000;
        }

        this.#appendIntermediateTime(
          item.fullName,
          time,
          item.currentTurn,
          isFirst
        );
      });
  }

  //Private methods

  #appendIntermediateTime(fullName, time, turnIndex, isFirst) {
    //Create the elements to append
    const skierIntermediateDiv = document.createElement("div");
    skierIntermediateDiv.setAttribute("class", "turn-item");
    const skierName = document.createElement("p");
    skierName.textContent = fullName;
    const skierTime = document.createElement("p");
    skierTime.textContent = isFirst
      ? TimeConverter.displayStandardTimeFromMs(time)
      : `+ ${TimeConverter.displayStandardTimeFromMs(time)}`;

    //Append the elements to the intermediate div
    skierIntermediateDiv.appendChild(skierName);
    skierIntermediateDiv.appendChild(skierTime);

    this.$$.intermediateContentList[turnIndex].appendChild(
      skierIntermediateDiv
    );
  }

  #appendShootingItem(
    fullName,
    shootingDetails,
    turnIndex,
    stopwatchSpeed,
    skierId
  ) {
    //Create the elements to display
    const skierShootingDiv = document.createElement("div");
    skierShootingDiv.setAttribute("class", "shooting-item");
    const skierName = document.createElement("p");
    skierName.textContent = fullName;
    const targetsDiv = document.createElement("div");
    targetsDiv.setAttribute("class", "shooting-targets");
    targetsDiv.setAttribute("id", `${skierId}` + `${turnIndex}`);
    shootingDetails.shotsSuccess.forEach(() => {
      const target = document.createElement("span");
      target.setAttribute("class", "target");
      targetsDiv.appendChild(target);
    });
    //Append elements
    skierShootingDiv.appendChild(skierName);
    skierShootingDiv.appendChild(targetsDiv);
    this.$$.shootingContentList[turnIndex].appendChild(skierShootingDiv);

    //Re-iterate through shots list to animate result
    const shotElements = document.getElementById(
      `${skierId}` + `${turnIndex}`
    ).childNodes;

    if (shootingDetails.alreadyRendered) {
      for (let i = 0; i < Array.from(shotElements).length; i++) {
        const success = shootingDetails.shotsSuccess[i];
        if (success) {
          shotElements[i].classList.add("success");
        } else shotElements[i].classList.add("missed");
      }
    } else {
      const timer = (ms) => new Promise((res) => setTimeout(res, ms));
      async function showResult() {
        for (let i = 0; i < Array.from(shotElements).length; i++) {
          let timerDuration;
          //If this is the first target, set timer to preparation time, otherwise to interval
          if (i === 0) {
            timerDuration =
              (shootingDetails.preparationTime * 1000) / stopwatchSpeed;
          } else {
            timerDuration =
              (shootingDetails.shotsInterval[i] * 1000) / stopwatchSpeed;
          }
          await timer(timerDuration);

          const success = shootingDetails.shotsSuccess[i];
          if (success) {
            shotElements[i].classList.add("success");
          } else shotElements[i].classList.add("missed");
        }
      }
      showResult();
    }
  }

  #resetResultDisplay() {
    this.$$.intermediateContentList.forEach((item) => {
      item.replaceChildren();
    });
    this.$$.shootingContentList.forEach((item) => {
      item.replaceChildren();
    });
  }

  //Event listeners
  bindStartStopwatch(handler) {
    this.$.startBtn.addEventListener("click", handler);
  }

  bindStopStopwatch(handler) {
    this.$.stopBtn.addEventListener("click", handler);
  }

  bindResetStopwatch(handler) {
    this.$.resetBtn.addEventListener("click", handler);
  }

  bindx1Speed(handler) {
    this.$.oneSpeed.addEventListener("click", handler);
  }

  bindx5Speed(handler) {
    this.$.fiveSpeed.addEventListener("click", handler);
  }

  bindx10Speed(handler) {
    this.$.tenSpeed.addEventListener("click", handler);
  }

  //DOM helpers
  #qs(selector) {
    const el = document.querySelector(selector);

    if (!el) throw new Error("Element not found");
    return el;
  }

  #qsAll(selector) {
    const elList = document.querySelectorAll(selector);

    if (!elList) throw new Error("Element not found");
    return elList;
  }
}

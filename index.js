//Import race module classes
import { Sprint } from "./modules/race.js";

//Import person module classes
import { Skier } from "./modules/person.js";

//Import utils
import { Stopwatch } from "./modules/utils.js";

//Import MVC classes
import View from "./view.js";
import State from "./state.js";

function init() {
  // Prepare the data
  const sprint = new Sprint(500);

  const mFourcade = new Skier(1, "Martin", "Fourcade", 35, "France");
  const jBoe = new Skier(2, "Johaness", "Boe", 26, "Norway");

  const skiers = [jBoe, mFourcade];

  jBoe.abilities = {
    skiingSpeed: 9.8,
    shootingSpeed: 7.5,
    shootingAccuracy: 8.5,
    shootingPreparationTime: 8.3,
  };

  mFourcade.abilities = {
    skiingSpeed: 9.3,
    shootingSpeed: 8.5,
    shootingAccuracy: 9.9,
    shootingPreparationTime: 7,
  };

  try {
    jBoe.fatigue = 3;
  } catch (error) {
    console.error(error);
  }

  try {
    mFourcade.fatigue = 1;
  } catch (error) {
    console.error(error);
  }

  skiers.forEach((skier) => {
    try {
      sprint.addskierListItem(skier.raceObject);
    } catch (error) {
      console.error(error);
    }
  });

  skiers.forEach((skier, index) => {
    try {
      const skierId = skier.raceObject.id;
      sprint.setStartingPosition(index, skierId);
    } catch (error) {
      console.error(error);
    }
  });

  // Prepare MVC model

  const view = new View();
  const state = new State(
    sprint.startlist,
    sprint.runRace(),
    sprint.startingPositionList,
    sprint.raceRules
  );

  state.getIntermediates();
  const stopwatch = new Stopwatch();

  //Events handlers
  view.bindStartStopwatch(() => {
    stopwatch.startStopwatch();
  });

  view.bindStopStopwatch(() => {
    stopwatch.stopStopwatch();
  });

  view.bindResetStopwatch(() => {
    stopwatch.resetStopwatch();

    state.resetState();

    view.displayTime(stopwatch.ms);
  });

  view.bindx1Speed(() => {
    stopwatch.speed = 1;
  });

  view.bindx5Speed(() => {
    stopwatch.speed = 5;
  });

  view.bindx10Speed(() => {
    stopwatch.speed = 10;
  });

  //Event listener
  window.addEventListener("tick", () => {
    view.displayTime(stopwatch.ms);

    state.checkIfAddItem(stopwatch.ms);
  });

  state.addEventListener("statechange", () => {
    view.render(
      state.shootingsState,
      state.intermediatesState,
      stopwatch.speed
    );
    state.updateShootingIsRendered(state.shootingsState);
  });
}

window.addEventListener("load", init);

// NOTE : small bug left in this app -> if a shooting item that rendered is still looping through
// its targets and another element renders meanwhile, the shooting element will rerender with all the targets filled directly
// (due to how the design is done)
// -> To fix this, instead of looping through each target with a time (which decorelates the targets from the stopwatch), each target should
// be treated as an intermediate element and be rendered based on when shot (check on stopwatch)

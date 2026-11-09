
// =====================================================
// EXPERIMENT 1E
// 12 TARGET HAND TRACKING + BLE
//
// 3 ROWS x 4 COLUMNS
//
// Index fingertip activates each circle once.
//
// Activated target = Yellow
// RESET = All circles reset + BLE "R"
// =====================================================

// =====================================================
// HANDPOSE
// =====================================================

let handPose;
let video;
let hands = [];

// =====================================================
// TARGETS
// =====================================================

let targets = [];

const TARGET_COUNT = 12;

const TARGET_COLUMNS = 4;
const TARGET_ROWS = 3;

let targetDiameter = 100;
let targetRadius = 50;

// =====================================================
// RESET BUTTON
// =====================================================

let resetButton;

// =====================================================
// SETUP
// =====================================================

async function setup() {

  createCanvas(
    windowWidth,
    windowHeight
  );

  // BLE
  bleSetup();

  // RESET BUTTON
  resetButton =
    createButton("RESET");

  resetButton.id("resetButton");

  resetButton.mousePressed(
    resetExperiment
  );

  // LOAD HANDPOSE
  handPose =
    await ml5.handPose();

  // SELFIE CAMERA
  video =
    createCapture(
      {
        video: {
          facingMode: "user"
        },
        audio: false
      }
    );

  video.size(640, 480);
  video.hide();

  // CREATE TARGETS
  createTargets();

  // START HAND TRACKING
  handPose.detectStart(
    video,
    gotHands
  );
}

// =====================================================
// CREATE 12 TARGETS - 3 ROWS x 4 COLUMNS
// =====================================================

function createTargets() {

  let oldStates =
    targets.map(t => t.activated);

  targets = [];

  // Fit circles to screen
  targetDiameter = Math.min(
    100,
    width * 0.15,
    height * 0.18
  );

  targetRadius =
    targetDiameter / 2;

  const xPositions = [
    width * 0.14,
    width * 0.38,
    width * 0.62,
    width * 0.86
  ];

  const yPositions = [
    height * 0.25,
    height * 0.50,
    height * 0.75
  ];

  for (
    let row = 0;
    row < TARGET_ROWS;
    row++
  ) {

    for (
      let col = 0;
      col < TARGET_COLUMNS;
      col++
    ) {

      let index =
        row * TARGET_COLUMNS + col;

      targets.push({
        x: xPositions[col],
        y: yPositions[row],
        activated:
          oldStates[index] || false
      });
    }
  }
}

// =====================================================
// DRAW
// =====================================================

function draw() {

  background(0);

  // ===================================================
  // MIRRORED SELFIE CAMERA
  // ===================================================

  if (video && video.elt.readyState >= 2) {

    push();

    translate(width, 0);
    scale(-1, 1);

    image(
      video,
      0,
      0,
      width,
      height
    );

    pop();
  }

  // ===================================================
  // HAND TRACKING
  // ===================================================

  for (
    let i = 0;
    i < hands.length;
    i++
  ) {

    let hand = hands[i];

    // Draw all hand landmarks
    for (
      let j = 0;
      j < hand.keypoints.length;
      j++
    ) {

      let keypoint =
        hand.keypoints[j];

      let scaledX = map(
        keypoint.x,
        0,
        640,
        0,
        width
      );

      let scaledY = map(
        keypoint.y,
        0,
        480,
        0,
        height
      );

      let mirroredX =
        width - scaledX;

      let mirroredY =
        scaledY;

      // GREEN HAND KEYPOINT
      noStroke();
      fill(0, 255, 0);

      circle(
        mirroredX,
        mirroredY,
        10
      );
    }

    // =================================================
    // INDEX FINGERTIP ACTIVATES TARGETS
    // =================================================

    if (hand.keypoints.length > 8) {

      let fingertip =
        hand.keypoints[8];

      let fingertipX =
        width - map(
          fingertip.x,
          0,
          640,
          0,
          width
        );

      let fingertipY =
        map(
          fingertip.y,
          0,
          480,
          0,
          height
        );

      for (
        let t = 0;
        t < targets.length;
        t++
      ) {

        let target =
          targets[t];

        if (target.activated) {
          continue;
        }

        let distance = dist(
          fingertipX,
          fingertipY,
          target.x,
          target.y
        );

        if (distance <= targetRadius) {

          activateTarget(t);
        }
      }
    }
  }

  // DRAW TARGETS
  drawTargets();
}

// =====================================================
// ACTIVATE TARGET ONCE
// =====================================================

function activateTarget(index) {

  if (
    targets[index].activated
  ) {
    return;
  }

  // Do not activate before BLE is connected
  if (!bleConnected) {
    return;
  }

  targets[index].activated = true;

  let servoNumber =
    index + 1;

  console.log(
    "TARGET ACTIVATED:",
    servoNumber
  );

  sendServoCommand(
    servoNumber
  );
}

// =====================================================
// DRAW TARGETS
// =====================================================

function drawTargets() {

  for (
    let i = 0;
    i < targets.length;
    i++
  ) {

    let target =
      targets[i];

    if (target.activated) {

      // Activated = Yellow
      fill(255, 215, 70, 210);

      stroke(255);
      strokeWeight(5);

    } else {

      // Not activated
      fill(255, 255, 255, 60);

      stroke(255, 255, 255, 220);
      strokeWeight(3);
    }

    circle(
      target.x,
      target.y,
      targetDiameter
    );

    // Target number
    noStroke();

    if (target.activated) {
      fill(40);
    } else {
      fill(255);
    }

    textAlign(CENTER, CENTER);

    textSize(
      Math.min(24, targetDiameter * 0.32)
    );

    textStyle(BOLD);

    text(
      i + 1,
      target.x,
      target.y
    );

    textStyle(NORMAL);
  }
}

// =====================================================
// RESET EXPERIMENT
// =====================================================

function resetExperiment() {

  console.log("RESET");

  for (
    let i = 0;
    i < targets.length;
    i++
  ) {

    targets[i].activated = false;
  }

  sendResetCommand();
}

// =====================================================
// HANDPOSE CALLBACK
// =====================================================

function gotHands(results) {

  hands = results;
}

// =====================================================
// WINDOW RESIZE
// =====================================================

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );

  createTargets();
}

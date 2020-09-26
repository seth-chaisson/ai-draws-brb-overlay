import config from "./config";
import modelNames from "./modelNames";
import tmi from "tmi.js";
// import { Howl, Howler } from "howler";

const client = new tmi.Client({
  connection: {
    secure: true,
    reconnect: true,
  },
  channels: [config.channelName],
});

client.connect();

/**
 * @param {import('p5')} p5
 */
let font = null;
let model = null;
let newStroke = null;
let next_pen = "",
  pen = "down";
let x, y;
let modelType = "";
let aiBuffer;
let nextStrokeTimer = null;
let afterDrawTimer = null;
let numberOfDraws = 0;
let modelHint = "";
let modelValidGuess = "";
let highScores = [];
let scoreImg, easelImg;
let firstRun = true;
let loadingNextModel = true;
let prevAwnser = "";

export default function sketch(p5) {
  client.on("message", (channel, tags, message, self) => {
    if (message.trim().toLowerCase() === modelValidGuess) {
      console.log(`winner:${tags.username}!!!!`);

      updateHighScores(tags.username);
      loadRandomModel();
    }
  });

  p5.preload = () => {
    // splatSfx = new Howl({ src: ["../images/splat.wav"] });
    loadRandomModel();
    font = p5.loadFont("../assets/Roboto-Black.ttf");
    scoreImg = p5.loadImage("../assets/scorebackground.png");
    easelImg = p5.loadImage("../assets/easel.png");

    // splatImg = p5.loadImage("../images/splat.png");
  };

  p5.setup = async () => {
    p5.textFont(font);
    p5.textAlign(p5.CENTER, p5.TOP);
    p5.frameRate(60);
    p5.createCanvas(p5.windowWidth, p5.windowHeight);
    aiBuffer = p5.createGraphics(config.easel.width, config.easel.height);
  };

  p5.mousePressed = () => {};

  p5.draw = () => {
    if (firstRun === true) return;
    p5.clear();
    p5.fill(255);
    p5.strokeWeight(2);

    p5.image(easelImg, 0, 0, easelImg.width / 2, easelImg.height / 1.5);
    p5.image(aiBuffer, 340, 40, aiBuffer.width * 0.8, aiBuffer.height * 0.75);

    if (loadingNextModel) {
      p5.textSize(20);
      p5.fill(0, 255, 0);
      p5.text(`Correct Anwser: ${prevAwnser}`, 370, 300);
    }

    // p5.text(`number of tries:${numberOfDraws}`, 200, 500);
    if (numberOfDraws > config.numRedrawsForHint) {
      p5.textSize(15);
      p5.textAlign(p5.LEFT, p5.TOP);
      p5.fill(0);
      p5.stroke(1);
      //p5.text(`hint:  ${modelHint}`, 300, 40, 400, 400);
      p5.fill(255);

      p5.text(`hint:  ${modelHint}`, 300, 40, 400, 400);

      p5.textAlign(p5.CENTER, p5.TOP);
    }
    if (numberOfDraws > config.numRedrawsForQuit) loadRandomModel();

    if (newStroke != null) {
      let newx = x + newStroke.x;
      let newy = y + newStroke.y;

      aiBuffer.stroke(0);
      aiBuffer.strokeWeight(4);
      if (pen === "down") aiBuffer.line(x, y, newx, newy);

      x = newx;
      y = newy;
      pen = next_pen;
      newStroke = null;
      if (pen === "end") {
        clearInterval(nextStrokeTimer);
        afterDrawTimer = setTimeout(() => {
          numberOfDraws++;
          resetDraw();
          model.reset();
          startNextStrokeTimer();
        }, config.afterDrawTime);
      }
    }
    drawScoreBoard();
  };

  function startNextStrokeTimer() {
    nextStrokeTimer = setInterval(() => {
      nextStroke();
    }, config.nextStrokeTime);
  }

  function resetDraw() {
    pen = "down";
    x = aiBuffer.width / 2;
    y = aiBuffer.height / 2;
    aiBuffer.clear();
    aiBuffer.background(255, 255, 255, 0);
  }

  function nextStroke() {
    model.generate((err, res) => {
      newStroke = { x: res.dx * 0.5, y: res.dy * 0.5 };
      next_pen = res.pen;
    });
  }

  function modelReady() {
    firstRun = false;
    loadingNextModel = false;
    console.log("model ready");
    resetDraw();
    model.reset();

    startNextStrokeTimer();
    numberOfDraws++;
  }

  function loadRandomModel() {
    clearInterval(nextStrokeTimer);
    clearTimeout(afterDrawTimer);
    loadingNextModel = true;
    prevAwnser = modelValidGuess;

    let randomIndex = Math.floor(Math.random() * modelNames.length);
    modelType = modelNames[randomIndex][0];
    modelHint = modelNames[randomIndex][1];
    modelValidGuess = modelNames[randomIndex][2];

    console.log(`model Type: ${modelType}`);
    console.log(`model hint: ${modelHint}`);
    console.log(`model validGuess: ${modelValidGuess}`);

    console.log(modelType);
    model = ml5.sketchRNN(modelType, () => {
      setTimeout(modelReady, config.loadingTimeOut);
    });
    numberOfDraws = 0;
  }

  function updateHighScores(userName) {
    //update  high scorelist
    let playerIndex = highScores.findIndex((e) => e.userName === userName);

    if (playerIndex === -1) {
      highScores.push({ userName: userName, score: 1 });
    } else {
      highScores[playerIndex] = {
        userName: highScores[playerIndex].userName,
        score: highScores[playerIndex].score + 1,
      };
    }
  }
  function drawScoreBoard() {
    // draw scoreboard
    if (highScores.length > 0) {
      let sbPos = { x: (p5.windowWidth / 3) * 2, y: p5.windowHeight / 2 };
      let sbCenterx =
        (p5.windowWidth / 3) * 2 +
        (p5.windowWidth - (p5.windowWidth / 3) * 2) / 2;
      p5.image(scoreImg, sbPos.x, sbPos.y);

      p5.textSize(20);
      p5.fill(0);
      p5.stroke(10);
      p5.text("HIGH SCORES", sbCenterx, sbPos.y);
      p5.fill(255);
      p5.stroke(5);
      p5.text("HIGH SCORES", sbCenterx, sbPos.y);

      highScores = highScores.sort((a, b) => {
        return -1 * (a.score - b.score);
      });

      for (let x = 0; x < 5; x++) {
        if (x >= highScores.length) break;

        p5.fill(0);
        p5.stroke(10);
        p5.text(
          `${highScores[x].score} -- ${highScores[x].userName}`,
          sbCenterx,
          sbPos.y + 50 + x * 40
        );
        p5.fill(255);
        p5.stroke(5);
        p5.text(
          `${highScores[x].score} -- ${highScores[x].userName}`,
          sbCenterx,
          sbPos.y + 50 + x * 40
        );
      }
    }
  }
}

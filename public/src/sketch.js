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

export default function sketch(p5) {
  client.on("message", (channel, tags, message, self) => {
    if (message.trim().toLowerCase() === modelType) {
      console.log(`winner:${tags.username}!!!!`);
      clearInterval(nextStrokeTimer);
      clearTimeout(afterDrawTimer);
      loadRandomModel();
    }
  });

  p5.preload = () => {
    // splatSfx = new Howl({ src: ["../images/splat.wav"] });
    loadRandomModel();
    font = p5.loadFont("../assets/Roboto-Black.ttf");
    // splatImg = p5.loadImage("../images/splat.png");
  };

  p5.setup = async () => {
    p5.textFont(font);
    p5.textSize(config.fontSize);
    p5.textAlign(p5.CENTER, p5.TOP);
    p5.frameRate(60);
    p5.createCanvas(p5.windowWidth, p5.windowHeight);
    aiBuffer = p5.createGraphics(config.easel.width, config.easel.height);
  };

  p5.mousePressed = () => {};

  p5.draw = () => {
    p5.background(100);
    p5.image(aiBuffer, 0, 0, aiBuffer.width, aiBuffer.height);

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
          resetDraw();
          model.reset();
          startNextStrokeTimer();
        }, config.afterDrawTime);
      }
    }
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
    aiBuffer.background(255);
  }

  function nextStroke() {
    model.generate((err, res) => {
      newStroke = { x: res.dx * 0.5, y: res.dy * 0.5 };
      next_pen = res.pen;
    });
  }

  function modelReady() {
    console.log("model ready");
    resetDraw();
    model.reset();

    startNextStrokeTimer();
  }

  function loadRandomModel() {
    modelType = modelNames[Math.floor(Math.random() * modelNames.length)][0];
    console.log(modelType);
    model = ml5.sketchRNN(modelType, modelReady);
  }
}

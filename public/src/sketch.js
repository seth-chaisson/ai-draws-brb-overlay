import config from "./config";
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

export default function sketch(p5) {
  client.on("message", (channel, tags, message, self) => {});

  p5.preload = () => {
    // splatSfx = new Howl({ src: ["../images/splat.wav"] });

    font = p5.loadFont("../assets/Roboto-Black.ttf");
    // splatImg = p5.loadImage("../images/splat.png");
  };

  p5.setup = async () => {
    p5.frameRate(60);
    p5.createCanvas(p5.windowWidth, p5.windowHeight);
    p5.textFont(font);
    p5.textSize(config.fontSize);
    p5.textAlign(p5.CENTER, p5.TOP);
  };

  p5.mousePressed = () => {};

  p5.draw = () => {
    p5.clear();
    p5.stroke(100);
    p5.text("it works!!!", 100, 100);
  };
}

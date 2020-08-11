const express = require("express");
const { spawn, exec, execSync } = require("child_process");
const { message } = require("statuses");
const fs = require("fs").promises;
const app = express();

const CAMERA = "/dev/video0";

let ffmpegArgs = [
  "-f", // format = v4l2
  "v4l2",
  "-i", // input = /dev/video0
  CAMERA,
  "-c:v", // video codec = libx264
  "libx264",
  "-crf", // constant rate factor = 23(default)
  "23",
  "-pix_fmt", // Required for compatibility
  "yuv420p",
  "-hls_time", // hls segment length
  "2",
  "-hls_list_size", // set maximum list size = 3
  "5",
  "-hls_delete_threshold", // set maximum segment number = hls_list_size+hls_delete_threshold = 4
  "1",
  "-hls_flags", // remove outdated segments
  "delete_segments",
  "-f", // output format = hls
  "hls",
  "public/video.m3u8", // output file
];

async function main() {
  console.log("Set permission of camera device ");
  console.log(execSync(`sudo chmod 777 ${CAMERA}`).toString());
  console.log("Initialize video");
  console.log(execSync(`rm -f ${__dirname}/public/*.ts`).toString());
  console.log(execSync(`rm -f ${__dirname}/public/*.m3u8`).toString());
  console.log("Start streaming");

  let argStr = "";
  ffmpegArgs.forEach((arg) => (argStr += arg + " "));
  console.log("Run : ffmpeg " + argStr);

  let ffmpeg = spawn("ffmpeg", ffmpegArgs);
  ffmpeg.on("exit", () => console.log("ffmpeg finished"));
  ffmpeg.on("error", console.error);
  ffmpeg.on("disconnect", () => console.log("disconnect"));
  ffmpeg.on("message", () => console.log("message"));
}

main();

// Set static directory
app.use(express.static(__dirname + "/public"));

// Index page
app.get("/", (req, res) => {
  res.redirect("/index.html");
});

app.listen(3000, () => {
  console.log("Server started");
});

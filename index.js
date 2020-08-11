const express = require("express");
const { spawn } = require("child_process");

const app = express();

let ffmpegArgs = [
  "-f", // format = v4l2
  "v4l2",
  "-s",
  "640x480",
  "-i", // input from video device
  "/dev/video0",
  "-c:v",
  "h264",
  "-crf",
  "22",
  "-hls_time", // hls segment time=8
  "8",
  //   "-hls_list_size", // set maximum list size = 3
  //   "3",
  //   "-hls_delete_threshold", // set maximum segment number = hls_list_size+hls_delete_threshold = 4
  //   "1",
  //   "-hls_flags", // remove outdated segments
  //   "delete_segments",
  "-f", // output format = hls
  "hls",
  "public/video.m3u8", // output file
];

spawn("ffmpeg", ffmpegArgs);

app.use(express.static(__dirname + "/public"));

// Index page
app.get("/", (req, res) => {
  res.redirect("/index.html");
});

app.listen(3000, () => {
  console.log("Server started");
});

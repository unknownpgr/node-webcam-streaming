# node_webcam_streaming
## Node+FFmepg webcam live streaming server / client
### How to use
- Download index.js(server) and index.html(client)
- Execute server with nodejs(execute with superuser for getting video permission)
- Connect to localhost:1415 with chrome
### Server structure
- Record from webcam (/dev/video0)
- Convert stream codec from mjpeg to webm with ffmpeg
- Split stream into chunk files with nodejs
- Send chunk files to client
### Client structre
- Create mediaSource and link it to video tag
- Request chunk files from server
- Feed chunk files to mediaSource
### Dependency
- express
- ffmpeg
const express = require('express')
const { spawn } = require('child_process')
const { exec } = require('child_process')
const { Writable } = require('stream')

const app = express()
const BUFFER_SIZE = 100 * 1024

//Get video device permission
exec('sudo chmod 777 /dev/video0', (err, stdout, stderr) => {
    if (err) console.log('Can\'t get webcam device permission : ' + err)
    else console.log('Successfully got webcam device permission')
})

//Video processing setting
var videoProcess = undefined
var lastRequest = 0
var lastUsing = 0

//Buffer setting
var bufferList = []
var dataReceiver = undefined

//Get DataReceiver : DataReceiver collects the chunks until they are of a certain size
function getDataReceiver(maxBufferSize, callback, showError = false) {
    var dataReceiver = new Writable({
        write(chunk, encoding, cb) {
            if (this.currentPosition + chunk.length > maxBufferSize) {                          // If buffer will be full
                callback(this.tempBuffer.slice(0, this.currentPosition))                        // Process cureent buffer
                this.tempBuffer = Buffer.alloc(this.maxBufferSize)                              // Allocate new buffer
                this.currentPosition = 0                                                        // Set cursor position
                var copied = chunk.copy(this.tempBuffer, this.currentPosition, 0, chunk.length) // Copy buffer to tempBuffer
                this.currentPosition += copied                                                  // Move cursor
            } else {                                                                            // If buffer is free enough
                var copied = chunk.copy(this.tempBuffer, this.currentPosition, 0, chunk.length) // Copy buffer to tempBuffer
                this.currentPosition += copied                                                  // Move position    
            }
            cb()
        }
    })
    dataReceiver.maxBufferSize = maxBufferSize
    dataReceiver.currentPosition = 0
    dataReceiver.tempBuffer = Buffer.alloc(maxBufferSize)
    if (showError) dataReceiver.on('error', console.error)
    return dataReceiver
}

// Index page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

// Get video
app.get('/video/:requestTime', (req, res) => {
    console.log()

    lastUsing = Date.now()
    var requestTime = req.params.requestTime
    console.log('Requested : ' + requestTime)

    //Start
    if (!videoProcess) {
        console.log('Turn on the webcam')
        if (bufferList.length > 0) {
            console.log('buffer is not empty')
            bufferList.shift()
        }
        dataReceiver = getDataReceiver(BUFFER_SIZE, buf => bufferList.push(buf))
        videoProcess = spawn('ffmpeg', '-f v4l2 -framerate 25 -video_size 640x480 -i /dev/video0 -c:v libvpx -crf 10 -b:v 1M -c:a libvorbis -f webm -'.split(' '))
        videoProcess.stdout.pipe(dataReceiver)
    }

    // After the webCam is turned on
    if (videoProcess && requestTime > lastRequest) {    // Check if video available and current request is proper order
        lastRequest = requestTime                       // Update time
        if (bufferList.length > 0) {
            const buffer = bufferList.shift()
            const head = {
                'Content-Length': buffer.length,
                'Content-Type': 'video/mp4'
            }
            res.writeHead(200, head)
            res.write(buffer)
            res.end()
            console.log('send : ' + buffer.length)
            console.log('buffer list : ' + bufferList.length)
            return
        }
    }

    //On error
    console.log('No data : ' + bufferList.length)
    const head = {
        'Content-Length': 0,
        'Content-Type': 'video/mp4',
    }
    res.writeHead(200, head)
    res.end()
})

app.get('/close', (req, res) => {
    closeCam(() => {
        res.json({ success: true })
    })
})

function closeCam(callback) {
    //Initialize video
    if (!videoProcess) return callback()
    if (callback) videoProcess.on('exit', callback)
    videoProcess.kill()
    videoProcess = undefined
    lastRequest = 0
    lastUsing = 0

    //Initialize buffer
    bufferList = []
    dataReceiver = undefined
    console.log('Webcam closed')
}

// Close stream when not using the webcam
setInterval(() => { if (videoProcess && ((Date.now() - lastUsing) > 3000)) closeCam() }, 1000);

app.listen(1415, () => { console.log('Server started') })
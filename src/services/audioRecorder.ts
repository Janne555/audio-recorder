const MIME_TYPE = 'audio/webm'

function recordAudio(stream: MediaStream): { stop: () => void, blob: Promise<Blob> } {
  const chunks: Blob[] = []
  const mediaRecorder = new MediaRecorder(stream, { mimeType: MIME_TYPE })
  const controller = new AbortController()
  let shouldStop = false

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data)
    }

    if (shouldStop) {
      controller.abort()
    }
  }

  const stop = () => {
    mediaRecorder.stop()
    shouldStop = true
  }

  const blob = new Promise<Blob>((resolve, reject) => {
    controller.signal.addEventListener("abort", () => {
      resolve(new Blob(chunks, { type: MIME_TYPE }))
    })
  })

  mediaRecorder.start()

  return {
    blob,
    stop
  }
}

export {
  recordAudio
}
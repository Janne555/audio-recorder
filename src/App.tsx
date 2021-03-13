import React from 'react';
import './App.css';
import Dexie from 'dexie'
import audioRecorder from './services/audioRecorder'

type Recording = {
  blob: Blob
  name: string
}

class Database extends Dexie {
  recordings: Dexie.Table<Recording, number>

  constructor() {
    super("database")
    this.version(1).stores({
      recordings: '++id'
    })

    this.recordings = this.table("recordings")
  }
}

const database = new Database()

function useRecording() {
  const [isReady, setIsReady] = React.useState(false)
  const [isRecording, setIsRecording] = React.useState(false)
  const [error, setError] = React.useState<Error>()

  React.useEffect(() => {
    if (audioRecorder.state !== "idle") {
      return
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        audioRecorder.setStream(stream)
        setIsReady(true)
      })
      .catch(error => {
        if (error instanceof Error) {
          setError(error)
        } else {
          setError(new Error("Failed to get stream"))
        }
      })
  }, [])

  function start() {
    if (audioRecorder.state !== "ready") {
      return
    }

    audioRecorder.start()
    setIsRecording(true)
  }

  function stop() {
    if (audioRecorder.state !== "recording") {
      return
    }

    audioRecorder.stop()
    setIsRecording(false)
  }

  const getBlob = React.useCallback(() => audioRecorder.getBlob(), [])

  return {
    start,
    stop,
    getBlob,
    isRecording,
    isReady,
    error
  }
}

function App() {
  const audioRef = React.useRef<HTMLAudioElement>(null)
  const { error, isRecording, isReady, start, stop, getBlob } = useRecording()

  React.useEffect(() => {
    getBlob().then(blob => {
      if (audioRef.current) {
        const url = URL.createObjectURL(blob)
        audioRef.current.src = url
      }
    })
  }, [getBlob])

  const handleRecord = async () => {
    if (isRecording) {
      stop()
    } else {
      start()
    }
  }

  return (
    <div className="App">
      <h1>Audio Recorder</h1>
      <button disabled={!isReady} onClick={handleRecord}>{isRecording ? "Stop" : "Record"}</button>
      <audio controls ref={audioRef} />
    </div>
  );
}

export default App;

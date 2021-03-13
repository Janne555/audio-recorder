import React from 'react';
import './App.css';
import Dexie from 'dexie'
import { recordAudio } from './services/audioRecorder'
import { useMutation, useQuery, useQueryClient } from 'react-query';

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

function useRecorder() {
  const stopSignal = React.useRef<() => void>()
  const [isRecording, setIsRecording] = React.useState(false)
  const [error, setError] = React.useState<Error>()
  const queryClient = useQueryClient()

  const { mutate } = useMutation((blob: Blob) => database.recordings.add({ blob, name: `${new Date().toLocaleString()}` }), {
    onSuccess: () => queryClient.invalidateQueries("recordings")
  })

  function start() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const { stop, blob } = recordAudio(stream)
        stopSignal.current = stop
        setIsRecording(true)
        return blob
      })
      .then(blob => {
        mutate(blob)
        return navigator.mediaDevices.getUserMedia({ audio: true })
      })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop())
      })
      .catch(error => setError(error))
  }

  function stop() {
    stopSignal.current?.()
    stopSignal.current = undefined
    setIsRecording(false)
  }

  return {
    start,
    stop,
    isRecording,
    error
  }
}

function useRecordings() {
  const { data: recordings = [] } = useQuery('recordings', () => database.recordings.toArray())

  return {
    recordings
  }
}

function App() {
  const audioRef = React.useRef<HTMLAudioElement>(null)
  const { isRecording, start, stop } = useRecorder()
  const { recordings } = useRecordings()
  const [blob, setBlob] = React.useState<Blob>()

  React.useEffect(() => {
    let url: string | undefined = undefined
    if (audioRef.current && blob) {
      url = URL.createObjectURL(blob)
      audioRef.current.src = url
      audioRef.current.play()
    }

    return () => { url && URL.revokeObjectURL(url) }
  }, [blob])

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
      <button onClick={handleRecord}>{isRecording ? "Stop" : "Record"}</button>
      <audio controls ref={audioRef} />
      <ul>
        {recordings.map(recording => (
          <li key={recording.name}>
            {recording.name}
            <button onClick={() => setBlob(recording.blob)}>Play</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

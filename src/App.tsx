import React from 'react';
import './App.css';
import useRecorder from './hooks/useRecorder'
import RecordingList from './components/RecordingList'
import { useQuery } from 'react-query';
import storageService from './services/storageService';

function App() {
  storageService.getRecordings().then(console.log)
  const audioRef = React.useRef<HTMLAudioElement>(null)
  const { isRecording, start, stop } = useRecorder()
  const [recordingId, setRecordingId] = React.useState<number>()
  const { data: recording, refetch } = useQuery('selected-recording', () => storageService.getRecording(recordingId))

  React.useEffect(() => {
    refetch()
  }, [recordingId])

  React.useEffect(() => {
    let url: string | undefined = undefined
    if (audioRef.current && recording) {
      url = URL.createObjectURL(recording.blob)
      audioRef.current.src = url
      audioRef.current.play()
    }

    return () => { url && URL.revokeObjectURL(url) }
  }, [recording])

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

      <RecordingList onSelect={id => setRecordingId(id)} />
    </div>
  );
}

export default App;

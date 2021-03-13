import React from 'react';
import './App.css';
import useRecorder from './hooks/useRecorder'
import RecordingList from './components/RecordingList'
import Player from './components/Player'
import storageService from './services/storageService';

function App() {
  storageService.getRecordings().then(console.log)
  const { isRecording, start, stop } = useRecorder()
  const [recordingId, setRecordingId] = React.useState<number>()


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
      <Player recordingId={recordingId} />
      <RecordingList onSelect={id => setRecordingId(id)} />
    </div>
  );
}

export default App;

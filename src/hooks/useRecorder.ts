import { useMutation, useQueryClient } from 'react-query';
import React from 'react';
import { recordAudio } from '../services/audioRecorder'
import { Recording } from '../types';
import storageService from '../services/storageService';

function useRecorder() {
  const stopSignal = React.useRef<() => void>()
  const [isRecording, setIsRecording] = React.useState(false)
  const [error, setError] = React.useState<Error>()
  const queryClient = useQueryClient()

  const { mutate } = useMutation((blob: Blob) => {
    const recording: Recording = { blob, name: `${new Date().toLocaleString()}` }
    return storageService.addRecording(recording)
  }, {
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

export default useRecorder
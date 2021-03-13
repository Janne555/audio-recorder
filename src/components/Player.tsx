import React from 'react'
import useRecording from '../hooks/useRecording';

type Props = {
  recordingId?: number
}

function Player({ recordingId }: Props) {
  const audioRef = React.useRef<HTMLAudioElement>(null)
  const { recording } = useRecording(recordingId)

  React.useEffect(() => {
    let url: string | undefined = undefined
    if (audioRef.current && recording) {
      url = URL.createObjectURL(recording.blob)
      audioRef.current.src = url
      audioRef.current.play()
    }

    return () => { url && URL.revokeObjectURL(url) }
  }, [recording])

  return (
    <div>
      <audio controls ref={audioRef} />
    </div>
  )
}

export default Player
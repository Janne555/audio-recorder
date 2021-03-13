import React from 'react'
import { useQuery } from 'react-query';
import storageService from '../services/storageService'

type Props = {
  onSelect: (id?: number) => void
}

function RecordingList({ onSelect }: Props) {
  const { data: recordings = [] } = useQuery('recordings', () => storageService.getRecordings())

  return (
    <ul>
      {recordings.map(recording => (
        <li key={recording.name}>
          {recording.name}
          <button onClick={() => onSelect(recording.id)}>Play</button>
        </li>
      ))}
    </ul>
  )
}

export default RecordingList
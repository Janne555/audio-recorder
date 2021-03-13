import React from 'react';
import { useQuery } from 'react-query';
import storageService from '../services/storageService';
import { Recording } from '../types';


function useRecording(recordingId?: number): { recording?: Recording } {
  const { data: recording, refetch } = useQuery('selected-recording', () => storageService.getRecording(recordingId))

  React.useEffect(() => {
    refetch()
  }, [recordingId, refetch])

  return {
    recording
  }
}

export default useRecording
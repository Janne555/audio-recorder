import { Recording } from "../types";
import database from "./database";

function getRecordings(): Promise<Omit<Recording, 'blob'>[]> {
  return database.recordings.toArray()
    .then(recordings => {
      return recordings.map(({ blob, ...recording }) => recording)
    })
}

function addRecording(recording: Recording): Promise<number> {
  return database.recordings.add(recording)
}

function getRecording(id?: number): Promise<Recording | undefined> {
  if (id == null) {
    return Promise.resolve(undefined)
  } else {
    return database.recordings.get(id)
  }
}

const storageService = {
  getRecordings,
  addRecording,
  getRecording
}

export default storageService
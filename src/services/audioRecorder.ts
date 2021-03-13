const MIME_TYPE = 'audio/webm'

type StateName = "idle" | "recording" | "stopped" | "ready"

type Callback = (error?: Error, blob?: Blob) => void

interface IAudioRecorderState {
  readonly state: StateName

  reset: (audioRecorder: AudioRecorderContext) => void

  setStream: (stream: MediaStream, audioRecorder: AudioRecorderContext) => void

  start: (audioRecorder: AudioRecorderContext) => void

  stop: (audioRecorder: AudioRecorderContext) => void

  getBlob: (audioRecorder: AudioRecorderContext) => Promise<Blob>
}

abstract class AudioRecorderState {
  private _state: StateName
  protected blob?: Blob
  protected callbacks: Set<(error?: Error, blob?: Blob) => void>

  constructor(stateName: StateName, callbacks: Set<Callback>) {
    this.callbacks = callbacks
    this._state = stateName
  }

  setStream = (stream: MediaStream, audioRecorder: AudioRecorderContext): void => {
    throw new Error(`Cant set stream in ${this._state} state`)
  }

  start = (audioRecorder: AudioRecorderContext): void => {
    throw new Error(`Cant start recording in ${this._state} state`)
  }

  stop = (audioRecorder: AudioRecorderContext): void => {
    throw new Error(`Cant stop recording in ${this._state} state`)
  }

  getBlob = () => {
    if (this.blob) {
      return Promise.resolve(this.blob)
    } else {
      return new Promise<Blob>((resolve, reject) => {
        this.callbacks.add((error, blob) => {
          console.log(error, blob)
          if (blob) {
            resolve(blob)
          } else {
            reject(error)
          }
        })
      })
    }
  }

  get state() {
    return this._state
  }
}

interface IAudioRecorder {
  readonly state: StateName

  start: () => void
  stop: () => void
  getBlob: () => Promise<Blob>
  setStream: (stream: MediaStream) => void
  reset: () => void
}

class IdleAudioRecorder extends AudioRecorderState implements IAudioRecorderState {
  constructor(callbacks: Set<Callback>) {
    super("idle", callbacks)
  }

  reset = (audioRecorder: AudioRecorderContext) => {
    audioRecorder.setState(new IdleAudioRecorder(this.callbacks))
  }

  setStream = (stream: MediaStream, audioRecorder: AudioRecorderContext) => {
    audioRecorder.setState(new ReadyAudioRecorder(stream, this.callbacks))
  }
}

class ReadyAudioRecorder extends AudioRecorderState implements IAudioRecorderState {
  private stream: MediaStream

  constructor(stream: MediaStream, callbacks: Set<Callback>) {
    super("ready", callbacks)
    this.stream = stream
  }

  reset = (audioRecorder: AudioRecorderContext) => {
    audioRecorder.setState(new IdleAudioRecorder(this.callbacks))
  }

  start = (audioRecorder: AudioRecorderContext) => {
    audioRecorder.setState(new RecordingAudioRecorder(this.stream, this.callbacks))
  }
}

class RecordingAudioRecorder extends AudioRecorderState implements IAudioRecorderState {
  private chunks: Blob[] = []
  private mediaRecorder: MediaRecorder

  constructor(stream: MediaStream, callbacks: Set<Callback>) {
    super("recording", callbacks)
    this.mediaRecorder = new MediaRecorder(stream, { mimeType: MIME_TYPE })
    this.mediaRecorder.ondataavailable = this.handleData
    this.mediaRecorder.onerror = this.handleError
    this.mediaRecorder.start()
  }

  reset = (audioRecorder: AudioRecorderContext) => {
    this.mediaRecorder.ondataavailable = null
    this.mediaRecorder.onerror = null
    this.mediaRecorder.stop()
    audioRecorder.setState(new IdleAudioRecorder(this.callbacks))
  }

  private handleData = (event: BlobEvent) => {
    if (event.data.size > 0) {
      this.chunks.push(event.data)
    }
  }

  private handleError = (error: MediaRecorderErrorEvent) => {
    console.error(error)
    throw error
  }

  stop = (audioRecorder: AudioRecorderContext) => {
    audioRecorder.setState(new StoppedAudioRecorder(this.chunks, this.mediaRecorder, this.callbacks))
  }
}

class StoppedAudioRecorder extends AudioRecorderState implements IAudioRecorderState {
  private chunks: Blob[] = []
  private mediaRecorder: MediaRecorder

  constructor(chunks: Blob[], mediaRecorder: MediaRecorder, callbacks: Set<Callback>) {
    super("stopped", callbacks)
    this.chunks = chunks
    this.mediaRecorder = mediaRecorder
    this.mediaRecorder.ondataavailable = this.handleData
    this.mediaRecorder.onerror = this.handleError
    this.mediaRecorder.stop()
  }

  reset = (audioRecorder: AudioRecorderContext) => {
    this.mediaRecorder.ondataavailable = null
    this.mediaRecorder.onerror = null
    this.mediaRecorder.stop()
    audioRecorder.setState(new IdleAudioRecorder(this.callbacks))
  }

  private handleData = (event: BlobEvent) => {
    console.log(event)
    if (event.data.size > 0) {
      this.chunks.push(event.data)
    }

    const blob = new Blob(this.chunks, { type: MIME_TYPE })
    this.blob = blob

    this.callbacks.forEach(cb => cb(undefined, blob))
  }

  private handleError = (error: MediaRecorderErrorEvent) => {
    this.callbacks.forEach(cb => cb(error.error))
  }
}

class AudioRecorderContext implements IAudioRecorder {
  private stateObj: IAudioRecorderState
  constructor() {
    this.stateObj = new IdleAudioRecorder(new Set())
  }

  setState(state: IAudioRecorderState) {
    console.log(state)
    this.stateObj = state
  }

  start = () => this.stateObj.start(this)
  stop = () => this.stateObj.stop(this)
  getBlob = () => this.stateObj.getBlob(this)
  setStream = (stream: MediaStream) => this.stateObj.setStream(stream, this)
  reset = () => this.stateObj.reset(this)

  get state() {
    return this.stateObj.state
  }
}

const audioRecorder: IAudioRecorder = new AudioRecorderContext()

export default audioRecorder
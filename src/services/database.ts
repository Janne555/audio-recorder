import Dexie from 'dexie'
import { Recording } from '../types'

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

export default database
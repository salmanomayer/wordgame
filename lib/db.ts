import { query } from "./postgres"

export type DbQueryResult<T = any> = {
  rows: T[]
  rowCount?: number | null
  error: unknown | null
}

export const db = {
  query: async <T = any>(text: string, params?: any[]): Promise<DbQueryResult<T>> => {
    try {
      const res = await query(text, params)
      return { rows: (res?.rows ?? []) as T[], rowCount: res?.rowCount, error: null }
    } catch (error) {
      console.error("Database Error:", error)
      return { rows: [], rowCount: 0, error }
    }
  },
}

// Alias adminDb to db since they shared the same implementation
export const adminDb = db
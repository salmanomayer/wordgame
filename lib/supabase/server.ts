import { query } from "../postgres"

export type DbQueryResult<T = any> = {
  rows: T[]
  error: unknown | null
}

export const db = {
  query: async <T = any>(text: string, params?: any[]): Promise<DbQueryResult<T>> => {
    try {
      const res = await query(text, params)
      return { rows: (res?.rows ?? []) as T[], error: null }
    } catch (error) {
      return { rows: [], error }
    }
  },
}

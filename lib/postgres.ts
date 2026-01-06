import { Pool } from "pg"

let pool: Pool

export function getPgPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING,
    })
  }
  return pool
}

export async function query(text: string, params?: any[]) {
  const client = await getPgPool().connect()
  try {
    const res = await client.query(text, params)
    return res
  } finally {
    client.release()
  }
}

export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await getPgPool().connect()
  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

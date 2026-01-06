"use server"

import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/supabase/admin"

export async function GET(_request: NextRequest) {
  try {
    await adminDb.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INTEGER PRIMARY KEY,
        title TEXT,
        logo_url TEXT,
        footer_text TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    await adminDb.query(`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS admin_footer_text TEXT`)
    await adminDb.query(
      `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS admin_footer_links JSONB DEFAULT '[]'::jsonb`,
    )
    const { rows } = await adminDb.query("SELECT * FROM site_settings LIMIT 1")
    const defaults = {
      title: "Word Game",
      logo_url: "",
      footer_text: `© ${new Date().getFullYear()} Word Game. All rights reserved.`,
      admin_footer_text: "",
      admin_footer_links: [],
    }
    return NextResponse.json(rows[0] ? rows[0] : defaults)
  } catch (error) {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
  }
}

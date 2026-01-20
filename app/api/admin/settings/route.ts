"use server"

import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/admin-middleware"
import { adminDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
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
  })
}

export async function PATCH(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const body = await request.json()
      const title = body.title ?? null
      const logo_url = body.logo_url ?? null
      const footer_text = body.footer_text ?? null
      const admin_footer_text = body.admin_footer_text ?? null
      const admin_footer_links = Array.isArray(body.admin_footer_links) ? body.admin_footer_links : []

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
      await adminDb.query(
        `INSERT INTO site_settings (id, title, logo_url, footer_text, admin_footer_text, admin_footer_links, updated_at)
         VALUES (1, $1, $2, $3, $4, $5::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           logo_url = EXCLUDED.logo_url,
           footer_text = EXCLUDED.footer_text,
           admin_footer_text = EXCLUDED.admin_footer_text,
           admin_footer_links = EXCLUDED.admin_footer_links,
           updated_at = NOW()`,
        [title, logo_url, footer_text, admin_footer_text, JSON.stringify(admin_footer_links)],
      )
      const { rows } = await adminDb.query("SELECT * FROM site_settings LIMIT 1")
      return NextResponse.json(rows[0])
    } catch (error) {
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }
  })
}

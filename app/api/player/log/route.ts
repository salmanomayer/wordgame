import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action = "login" } = body

    // Get IP address from headers
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown"

    // Get user agent
    const userAgent = request.headers.get("user-agent") || ""

    // Parse browser and device info from user agent
    const browser = parseUserAgent(userAgent).browser
    const device = parseUserAgent(userAgent).device
    const os = parseUserAgent(userAgent).os

    // Try to get geolocation from IP (using free API)
    let geoData = { country: null, city: null, region: null, latitude: null, longitude: null }
    if (ip && ip !== "unknown" && ip !== "::1" && ip !== "127.0.0.1") {
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,regionName,lat,lon`)
        if (geoResponse.ok) {
          const geo = await geoResponse.json()
          geoData = {
            country: geo.country,
            city: geo.city,
            region: geo.regionName,
            latitude: geo.lat,
            longitude: geo.lon,
          }
        }
      } catch (geoError) {
        console.error("[v0] Geolocation error:", geoError)
      }
    }

    // Insert log
    const { error } = await supabase.from("player_logs").insert({
      player_id: user.id,
      ip_address: ip,
      user_agent: userAgent,
      browser,
      device,
      os,
      country: geoData.country,
      city: geoData.city,
      region: geoData.region,
      latitude: geoData.latitude,
      longitude: geoData.longitude,
      action,
    })

    if (error) {
      console.error("[v0] Log insert error:", error)
      return NextResponse.json({ error: "Failed to log activity" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Player log error:", error)
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 })
  }
}

function parseUserAgent(ua: string) {
  let browser = "Unknown"
  let device = "Desktop"
  let os = "Unknown"

  // Detect browser
  if (ua.includes("Firefox")) browser = "Firefox"
  else if (ua.includes("SamsungBrowser")) browser = "Samsung Browser"
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera"
  else if (ua.includes("Edg")) browser = "Edge"
  else if (ua.includes("Chrome")) browser = "Chrome"
  else if (ua.includes("Safari")) browser = "Safari"

  // Detect device
  if (ua.includes("Mobile") || ua.includes("Android")) device = "Mobile"
  else if (ua.includes("Tablet") || ua.includes("iPad")) device = "Tablet"

  // Detect OS
  if (ua.includes("Windows")) os = "Windows"
  else if (ua.includes("Mac OS")) os = "macOS"
  else if (ua.includes("Linux")) os = "Linux"
  else if (ua.includes("Android")) os = "Android"
  else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) os = "iOS"

  return { browser, device, os }
}

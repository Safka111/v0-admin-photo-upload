import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

const ADMIN_COOKIE_NAME = "admin_session"
const HOMEPAGE_CATEGORY = "__homepage__"
const TOTAL_SLOTS = 17

async function isAuthenticated(request: NextRequest) {
  const authHeader = request.headers.get("x-admin-password")
  const adminPassword = process.env.ADMIN_PASSWORD

  if (authHeader && authHeader === adminPassword) {
    return true
  }

  const cookieStore = await cookies()
  const session = cookieStore.get(ADMIN_COOKIE_NAME)
  return session?.value === "authenticated"
}

// GET - Fetch all homepage image overrides as a slot -> url map (public)
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("gallery_images")
      .select("sort_order, image_url")
      .eq("category", HOMEPAGE_CATEGORY)

    if (error) {
      console.error("Error fetching homepage images:", error)
      return NextResponse.json({ error: "Failed to fetch homepage images" }, { status: 500 })
    }

    const overrides: Record<number, string> = {}
    for (const row of data || []) {
      if (row.sort_order && row.image_url) {
        overrides[row.sort_order] = row.image_url
      }
    }

    return NextResponse.json({ overrides })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to fetch homepage images" }, { status: 500 })
  }
}

// POST - Set/replace a homepage image for a given slot (1-17)
export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slot, image_url } = await request.json()

    const slotNum = Number(slot)
    if (!slotNum || slotNum < 1 || slotNum > TOTAL_SLOTS) {
      return NextResponse.json({ error: "Invalid slot" }, { status: 400 })
    }
    if (!image_url) {
      return NextResponse.json({ error: "Missing image_url" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if an override already exists for this slot
    const { data: existing } = await supabase
      .from("gallery_images")
      .select("id")
      .eq("category", HOMEPAGE_CATEGORY)
      .eq("sort_order", slotNum)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await supabase
        .from("gallery_images")
        .update({ image_url })
        .eq("id", existing.id)

      if (error) {
        console.error("Error updating homepage image:", error)
        return NextResponse.json({ error: "Failed to update homepage image" }, { status: 500 })
      }
    } else {
      const { error } = await supabase.from("gallery_images").insert({
        category: HOMEPAGE_CATEGORY,
        image_url,
        title: `Homepage Slot ${slotNum}`,
        prompt: "homepage",
        sort_order: slotNum,
      })

      if (error) {
        console.error("Error inserting homepage image:", error)
        return NextResponse.json({ error: "Failed to save homepage image" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to save homepage image" }, { status: 500 })
  }
}

// DELETE - Reset a homepage slot back to its default image
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const slotNum = Number(searchParams.get("slot"))

    if (!slotNum || slotNum < 1 || slotNum > TOTAL_SLOTS) {
      return NextResponse.json({ error: "Invalid slot" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from("gallery_images")
      .delete()
      .eq("category", HOMEPAGE_CATEGORY)
      .eq("sort_order", slotNum)

    if (error) {
      console.error("Error resetting homepage image:", error)
      return NextResponse.json({ error: "Failed to reset homepage image" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to reset homepage image" }, { status: 500 })
  }
}

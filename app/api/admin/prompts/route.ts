import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"

const ADMIN_COOKIE_NAME = "admin_session"

async function isAuthenticated(request: NextRequest) {
  // First check header-based auth
  const authHeader = request.headers.get("x-admin-password")
  const adminPassword = process.env.ADMIN_PASSWORD
  
  if (authHeader && authHeader === adminPassword) {
    return true
  }
  
  // Fall back to cookie-based auth
  const cookieStore = await cookies()
  const session = cookieStore.get(ADMIN_COOKIE_NAME)
  return session?.value === "authenticated"
}

// GET - Fetch all prompts
export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data: prompts, error } = await supabase
      .from("gallery_images")
      .select("*")
      .neq("category", "__homepage__")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching prompts:", error)
      return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 })
    }

    return NextResponse.json({ prompts })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 })
  }
}

// POST - Create a new prompt
export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { category, image_url, title, prompt, sort_order } = await request.json()

    if (!category || !image_url || !title || !prompt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("gallery_images")
      .insert({
        category,
        image_url,
        title,
        prompt,
        sort_order: sort_order || 0,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating prompt:", error)
      return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 })
    }

    return NextResponse.json({ prompt: data })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 })
  }
}

// PUT - Update a prompt
export async function PUT(request: NextRequest) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, category, image_url, title, prompt, sort_order } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Prompt ID required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const updateData: Record<string, unknown> = {}
    if (category !== undefined) updateData.category = category
    if (image_url !== undefined) updateData.image_url = image_url
    if (title !== undefined) updateData.title = title
    if (prompt !== undefined) updateData.prompt = prompt
    if (sort_order !== undefined) updateData.sort_order = sort_order

    const { data, error } = await supabase
      .from("gallery_images")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating prompt:", error)
      return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 })
    }

    return NextResponse.json({ prompt: data })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 })
  }
}

// DELETE - Delete a prompt
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Prompt ID required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from("gallery_images")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting prompt:", error)
      return NextResponse.json({ error: "Failed to delete prompt: " + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to delete prompt" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

const ADMIN_COOKIE_NAME = "admin_session"

async function isAuthenticated() {
  const cookieStore = await cookies()
  const session = cookieStore.get(ADMIN_COOKIE_NAME)
  return session?.value === "authenticated"
}

// This is the existing prompt data that will be migrated
// You can add more prompts here before running the migration
const existingPrompts = [
  {
    category: "Beauty",
    image_url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00021.png-IYAVYlEmoPFO4qfcy0JdrAeYRt9ntW.jpeg",
    title: "GHD Hair Styling Luxury",
    prompt: "She is standing in a grand marble luxury bathroom, medium close-up framing from chest up. She runs a GHD Gold hair straightener — pale pink and black body with rose gold ghd logo detail — slowly through a section of her long golden blonde hair, gliding it downward with a smooth elegant motion. Her head is slightly tilted to one side to give access to the hair section being straightened. Expression calm and focused, lips softly closed. Her makeup is flawless — sculpted brows, smoky eye, defined cheekbones, glossy lips. Warm golden wall sconces on both sides cast soft balanced light. Plush pink robe. Ultra-realistic 4K editorial mood, luxury hair styling atmosphere, cinematic soft light. Negative prompt: dark hair, brunette, curly hair, messy hair, wrong tool, cartoonish, plastic skin, distorted hands, distorted straightener, harsh shadows, flat lighting, full body, low resolution, text artifacts, watermark.",
  },
  {
    category: "Beauty",
    image_url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00022.png-GBGPt4j12fNVVNQUdUIGUz1gzGUxpo.jpeg",
    title: "YSL Lip Gloss Application",
    prompt: "She is standing in a grand marble luxury bathroom, tight medium close-up framing from bust up, face prominently centered. She holds the YSL lip gloss bottle open in one hand — transparent glass cylinder with silver YSL logo and silver chrome cap, peachy pink liquid visible inside. With the other hand she delicately applies the round doe-foot applicator to her full lips, mouth slightly open in a relaxed, sensual expression, eyes gazing straight into the camera with confidence. Her makeup is absolutely flawless — sculpted brows, smoky golden eye, perfectly defined cheekbones. Her long golden blonde hair is immaculate — sleek, mirror-glossy, perfectly straight, falling like silk over both shoulders. Warm golden wall sconces on both sides cast soft symmetrical light. Plush pink robe. Ultra-realistic 4K editorial mood, final beauty touch atmosphere, cinematic soft light, extreme beauty close-up. Negative prompt: dark hair, brunette, messy hair, capped bottle, wand missing, cartoonish, plastic skin, distorted hands, distorted bottle, wrong logo, harsh shadows, flat lighting, full body, low resolution, text artifacts, watermark.",
  },
  {
    category: "Beauty",
    image_url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00023.png-lNaRDBmMeXmlDca1hnRagrxYRTtvi3.jpeg",
    title: "Golden Hour Serum Ritual",
    prompt: "A close-up eye-level portrait of a young Caucasian woman with striking dyed yellow hair. She applies a clear liquid skincare serum from a dropper directly to her cheek, the dropper held in her uplifted right hand. Her light skin, pronounced eyebrows, and full lips are accentuated by the dappled sunlight casting shadows across her face, creating a play of light and dark that adds dimensionality and highlights her freckles. She has a visible tattoo with a floral and serpent design on her neck and wears a thin black strapped top, gold hoop earrings, and layered gold necklaces, including one with a daisy-shaped pendant. The shallow depth of field blurs the softly lit bathroom background, keeping focus on her face and the skincare product. The image displays a warm color palette with golden sunlight and yellow hair contrasting against natural skin tones. The mood is intimate, highlighting a beauty or skincare routine in a soft, contemporary style, likely taken with a modern digital camera or smartphone.",
  },
  {
    category: "Beauty",
    image_url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00024.png-bcb1bRBElnT5DU0Dnj60ErD5lYUefI.jpeg",
    title: "Mirror Reflection Lip Gloss",
    prompt: "She is standing in front of a large round mirror with a brushed gold frame, applying lip gloss with a wand applicator, reflected in the mirror, three-quarter upper body framing, soft warm bathroom light from above, steam-lit atmosphere, beige and cream ribbed tile walls, matte black shower fixtures visible in background, handheld shot with slight natural tilt, ultra-realistic 4K editorial beauty mood, golden hour warmth, skin luminosity, intimate morning routine feel. Outfit base color: pink. Negative prompt: cartoonish, flat lighting, overexposed, plastic skin, stiff pose, symmetrical framing, studio backdrop, full body, blurry background, cluttered scene.",
  },
  {
    category: "Beauty",
    image_url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00025.png-bEzcthSRVU3jRBqtP6Ymq3HfpSJetk.jpeg",
    title: "Behind-the-Scenes Glam Studio",
    prompt: "She is seated facing the camera in a professional glam studio, two makeup artists' hands working simultaneously — one applying blush with a large fluffy brush to her cheek, one lining her lips with a fine detail brush, a third hand holding a paddle hairbrush near her shoulder, direct soft studio light, neutral warm grey seamless backdrop, upper body framing, slightly low angle, sharp focus on face, ultra-realistic 4K editorial beauty campaign mood, behind-the-scenes luxury glam atmosphere. Outfit base color: black. Negative prompt: cartoonish, plastic skin, overexposed, flat lighting, single brush only, empty hands, blurry backdrop, full body, cluttered background, stiff expression, symmetrical pose.",
  },
  {
    category: "Beauty",
    image_url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00026.png-w2ae17FJb0jjBDPqLtfWJ2a5masoWF.jpeg",
    title: "Hair Rollers Morning Selfie",
    prompt: "She is taking a selfie from slightly below eye level, large velcro hair rollers set throughout her hair secured with black clips, direct gaze into camera, confident neutral expression, standing in a walk-in closet with open white shelving units visible in background, natural daylight from a window behind her, soft overexposed background creating depth separation, upper body close-up framing, handheld selfie angle with slight upward tilt, ultra-realistic 4K candid editorial mood, raw morning energy, skin texture visible, no makeup look. Outfit base color: black. Negative prompt: cartoonish, plastic skin, studio lighting, flat background, hair down, no rollers, blurry face, overposed, symmetrical framing, artificial bokeh, stiff expression.",
  },
  {
    category: "Beauty",
    image_url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00027.png-cascy0GjqWaRpAdezKBOcChGCkwFSs.jpeg",
    title: "Matcha Wellness Morning",
    prompt: "She is standing in a luxury open-plan kitchen, holding a tall glass of iced matcha latte with a metal straw in one hand, silver hydrogel under-eye patches applied to both eyes, fluffy pink bubble headband pushing hair back, slight attitude in expression — lips slightly parted, eyes looking sideways at camera, three-quarter upper body framing, natural daylight from ceiling recessed lights, warm wood cabinetry and marble countertops visible in background, candid selfie-style angle, ultra-realistic 4K editorial wellness lifestyle mood, effortless morning energy. Outfit base color: cream/white. Negative prompt: cartoonish, plastic skin, studio backdrop, flat lighting, no eye patches, empty hands, blurry background, overposed, symmetrical framing, stiff expression, no headband.",
  },
]

export async function POST() {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Check how many prompts already exist
    const { count: existingCount } = await supabase
      .from("gallery_images")
      .select("*", { count: "exact", head: true })

    if (existingCount && existingCount > 0) {
      return NextResponse.json({
        message: `Database already has ${existingCount} prompts. Migration skipped to avoid duplicates.`,
        migrated: 0,
        existing: existingCount,
      })
    }

    // Insert all prompts
    const promptsToInsert = existingPrompts.map((p, index) => ({
      ...p,
      sort_order: index,
    }))

    const { data, error } = await supabase
      .from("gallery_images")
      .insert(promptsToInsert)
      .select()

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: "Migration failed: " + error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: `Successfully migrated ${data?.length || 0} prompts`,
      migrated: data?.length || 0,
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}

export async function GET() {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    const { count } = await supabase
      .from("gallery_images")
      .select("*", { count: "exact", head: true })

    return NextResponse.json({
      promptCount: count || 0,
      pendingMigration: existingPrompts.length,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to get migration status" }, { status: 500 })
  }
}

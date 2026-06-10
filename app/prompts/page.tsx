"use client"

import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Copy, X, ArrowLeft, Send, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Number of items to load per batch for infinite scroll
// Desktop shows 5 columns, so load enough to fill multiple rows
const ITEMS_PER_BATCH = 30

// Type for prompt data from database
interface PromptItem {
  id: string
  category: string
  image_url: string
  title: string
  prompt: string
  sort_order: number
  created_at: string
}

// Legacy type for hardcoded data (for fallback)
interface LegacyPromptItem {
  id: number
  category: string
  image: string
  title: string
  prompt: string
}

// Cookie utilities
const COOKIE_NAME = "prompt_bank_access"

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const cookies = document.cookie.split(";")
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split("=").map(c => c.trim())
    if (cookieName === name) {
      return cookieValue
    }
  }
  return null
}

// Categories for filtering
const categories = ["All", "Podcast", "Lifestyle", "Beauty", "Fashion", "Fitness", "Portrait", "The Everyday", "Campaign", "Editorial", "Selfie"]

// Prompt gallery data
const promptGallery = [
  // BEAUTY CATEGORY (17 prompts)
  {
    id: 1,
    category: "Beauty",
    image: "https://picsum.photos/seed/beauty1/400/500",
    title: "Glowing Skin Close-up",
    prompt: "Professional beauty portrait, extreme close-up shot, glowing dewy skin, natural makeup look, soft diffused studio lighting, clean minimal background, beauty campaign aesthetic, sharp focus on facial features, high-end skincare advertisement style, 8K resolution, subtle highlight on cheekbones",
  },
  {
    id: 2,
    category: "Beauty",
    image: "https://picsum.photos/seed/beauty2/400/500",
    title: "Makeup Application",
    prompt: "Beauty tutorial style portrait, applying lip gloss with applicator, glowing sun-kissed skin, professional makeup look, natural window lighting from side, clean minimal background, beauty content creator aesthetic, focus on lips and product",
  },
  {
    id: 3,
    category: "Beauty",
    image: "https://picsum.photos/seed/beauty3/400/500",
    title: "Natural Glow Makeup",
    prompt: "Professional makeup portrait, applying foundation with brush, high messy bun hairstyle, dewy glowing skin, natural beauty look, soft studio lighting, beauty tutorial thumbnail style, clean white background, skincare advertisement quality",
  },
  {
    id: 4,
    category: "Beauty",
    image: "https://picsum.photos/seed/beauty4/400/500",
    title: "Soft Glam Portrait",
    prompt: "Soft glam beauty portrait, flawless base makeup, subtle smokey eye, nude lip, hair pulled back elegantly, butterfly lighting setup, creamy skin texture, high-end beauty editorial, magazine cover quality, pristine skin detail",
  },
  {
    id: 5,
    category: "Beauty",
    image: "https://picsum.photos/seed/beauty5/400/500",
    title: "Highlighter Glow",
    prompt: "Beauty close-up focusing on highlighted cheekbones, wet-look dewy skin, professional makeup artistry, strong cheekbone contour, luminous skin, editorial beauty lighting, chrome highlight effect, glass skin aesthetic",
  },
  {
    id: 6,
    category: "Beauty",
    image: "https://picsum.photos/seed/beauty6/400/500",
    title: "Red Lip Classic",
    prompt: "Classic beauty portrait, bold red lipstick, vintage Hollywood glamour, porcelain skin, winged eyeliner, elegant updo hairstyle, soft focus background, timeless beauty aesthetic, old Hollywood lighting",
  },
  {
    id: 7,
    category: "Beauty",
    image: "https://picsum.photos/seed/beauty7/400/500",
    title: "Skincare Editorial",
    prompt: "Clean skincare editorial portrait, minimal makeup, radiant healthy skin, water droplets on face, fresh dewy look, spa aesthetic, wellness brand photography, natural lighting, hydrated skin texture",
  },
  {
    id: 8,
    category: "Beauty",
    image: "https://picsum.photos/seed/beauty8/400/500",
    title: "Bronzed Goddess",
    prompt: "Sun-kissed bronzed beauty portrait, warm golden tones, beach goddess aesthetic, natural glowing tan, subtle bronze eyeshadow, glossy lips, golden hour lighting simulation, summer beauty campaign",
  },
  {
    id: 9,
    category: "Beauty",
    image: "https://picsum.photos/seed/beauty9/400/500",
    title: "Eyeshadow Focus",
    prompt: "Close-up eye makeup portrait, colorful eyeshadow palette, precise blending technique, dramatic eye look, perfect brows, false lashes, beauty detail shot, makeup artist portfolio quality",
  },
  {
    id: 10,
    category: "Beauty",
    image: "https://picsum.photos/seed/beauty10/400/500",
    title: "Blush Application",
    prompt: "Beauty tutorial portrait, applying blush with fluffy brush, rosy cheeks, fresh-faced makeup look, soft feminine aesthetic, natural daylight, beauty influencer content style, approachable beauty",
  },
  {
    id: 11,
    category: "Beauty",
    image: "https://picsum.photos/seed/beauty11/400/500",
    title: "Lip Liner Precision",
    prompt: "Close-up lip makeup portrait, precise lip liner application, ombre lip technique, plump glossy lips, beauty detail macro shot, professional makeup artistry, cosmetics advertisement quality",
  },
  {
    id: 12,
    category: "Beauty",
    image: "https://picsum.photos/seed/beauty12/400/500",
    title: "Brow Perfection",
    prompt: "Eyebrow grooming portrait, brushing brows with spoolie, natural fluffy brow look, laminated brow effect, clean beautiful face, brow product advertisement, precise detail focus",
  },
  {
    id: 13,
    category: "Beauty",
    image: "https://picsum.photos/seed/beauty13/400/500",
    title: "Mascara Moment",
    prompt: "Mascara application beauty portrait, lengthening lashes, eyes looking up, doe-eyed effect, volumizing mascara, beauty routine moment, intimate close-up, cosmetics brand aesthetic",
  },
  {
    id: 14,
    category: "Beauty",
    image: "https://picsum.photos/seed/beauty14/400/500",
    title: "Glass Skin",
    prompt: "Korean glass skin beauty portrait, ultra-dewy luminous skin, minimal makeup, poreless complexion, hydrating skincare glow, K-beauty aesthetic, clean girl look, translucent skin quality",
  },
  {
    id: 15,
    category: "Beauty",
    image: "https://picsum.photos/seed/beauty15/400/500",
    title: "Contour Queen",
    prompt: "Contouring tutorial portrait, sculpted cheekbones, defined jawline, professional face sculpting, cream contour technique, beauty guru aesthetic, transformation makeup style",
  },
  {
    id: 16,
    category: "Beauty",
    image: "https://picsum.photos/seed/beauty16/400/500",
    title: "Fresh Face Morning",
    prompt: "Morning skincare routine portrait, fresh-faced no makeup look, applying serum droplets, healthy radiant skin, bathroom mirror selfie aesthetic, authentic beauty moment, natural lighting",
  },
  {
    id: 17,
    category: "Beauty",
    image: "https://picsum.photos/seed/beauty17/400/500",
    title: "Glossy Lips Focus",
    prompt: "Extreme close-up glossy lips portrait, high-shine lip gloss, plump hydrated lips, lip care aesthetic, beauty detail macro photography, cosmetics product shot style, mirror-like reflection",
  },
  {
    id: 18,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00021.png-IYAVYlEmoPFO4qfcy0JdrAeYRt9ntW.jpeg",
    title: "GHD Hair Styling Luxury",
    prompt: "She is standing in a grand marble luxury bathroom, medium close-up framing from chest up. She runs a GHD Gold hair straightener — pale pink and black body with rose gold ghd logo detail — slowly through a section of her long golden blonde hair, gliding it downward with a smooth elegant motion. Her head is slightly tilted to one side to give access to the hair section being straightened. Expression calm and focused, lips softly closed. Her makeup is flawless — sculpted brows, smoky eye, defined cheekbones, glossy lips. Warm golden wall sconces on both sides cast soft balanced light. Plush pink robe. Ultra-realistic 4K editorial mood, luxury hair styling atmosphere, cinematic soft light. Negative prompt: dark hair, brunette, curly hair, messy hair, wrong tool, cartoonish, plastic skin, distorted hands, distorted straightener, harsh shadows, flat lighting, full body, low resolution, text artifacts, watermark.",
  },
  {
    id: 19,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00022.png-GBGPt4j12fNVVNQUdUIGUz1gzGUxpo.jpeg",
    title: "YSL Lip Gloss Application",
    prompt: "She is standing in a grand marble luxury bathroom, tight medium close-up framing from bust up, face prominently centered. She holds the YSL lip gloss bottle open in one hand — transparent glass cylinder with silver YSL logo and silver chrome cap, peachy pink liquid visible inside. With the other hand she delicately applies the round doe-foot applicator to her full lips, mouth slightly open in a relaxed, sensual expression, eyes gazing straight into the camera with confidence. Her makeup is absolutely flawless — sculpted brows, smoky golden eye, perfectly defined cheekbones. Her long golden blonde hair is immaculate — sleek, mirror-glossy, perfectly straight, falling like silk over both shoulders. Warm golden wall sconces on both sides cast soft symmetrical light. Plush pink robe. Ultra-realistic 4K editorial mood, final beauty touch atmosphere, cinematic soft light, extreme beauty close-up. Negative prompt: dark hair, brunette, messy hair, capped bottle, wand missing, cartoonish, plastic skin, distorted hands, distorted bottle, wrong logo, harsh shadows, flat lighting, full body, low resolution, text artifacts, watermark.",
  },
  {
    id: 20,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00023.png-lNaRDBmMeXmlDca1hnRagrxYRTtvi3.jpeg",
    title: "Golden Hour Serum Ritual",
    prompt: "A close-up eye-level portrait of a young Caucasian woman with striking dyed yellow hair. She applies a clear liquid skincare serum from a dropper directly to her cheek, the dropper held in her uplifted right hand. Her light skin, pronounced eyebrows, and full lips are accentuated by the dappled sunlight casting shadows across her face, creating a play of light and dark that adds dimensionality and highlights her freckles. She has a visible tattoo with a floral and serpent design on her neck and wears a thin black strapped top, gold hoop earrings, and layered gold necklaces, including one with a daisy-shaped pendant. The shallow depth of field blurs the softly lit bathroom background, keeping focus on her face and the skincare product. The image displays a warm color palette with golden sunlight and yellow hair contrasting against natural skin tones. The mood is intimate, highlighting a beauty or skincare routine in a soft, contemporary style, likely taken with a modern digital camera or smartphone.",
  },
  {
    id: 21,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00024.png-bcb1bRBElnT5DU0Dnj60ErD5lYUefI.jpeg",
    title: "Mirror Reflection Lip Gloss",
    prompt: "She is standing in front of a large round mirror with a brushed gold frame, applying lip gloss with a wand applicator, reflected in the mirror, three-quarter upper body framing, soft warm bathroom light from above, steam-lit atmosphere, beige and cream ribbed tile walls, matte black shower fixtures visible in background, handheld shot with slight natural tilt, ultra-realistic 4K editorial beauty mood, golden hour warmth, skin luminosity, intimate morning routine feel. Outfit base color: pink. Negative prompt: cartoonish, flat lighting, overexposed, plastic skin, stiff pose, symmetrical framing, studio backdrop, full body, blurry background, cluttered scene.",
  },
  {
    id: 22,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00025.png-bEzcthSRVU3jRBqtP6Ymq3HfpSJetk.jpeg",
    title: "Behind-the-Scenes Glam Studio",
    prompt: "She is seated facing the camera in a professional glam studio, two makeup artists' hands working simultaneously — one applying blush with a large fluffy brush to her cheek, one lining her lips with a fine detail brush, a third hand holding a paddle hairbrush near her shoulder, direct soft studio light, neutral warm grey seamless backdrop, upper body framing, slightly low angle, sharp focus on face, ultra-realistic 4K editorial beauty campaign mood, behind-the-scenes luxury glam atmosphere. Outfit base color: black. Negative prompt: cartoonish, plastic skin, overexposed, flat lighting, single brush only, empty hands, blurry backdrop, full body, cluttered background, stiff expression, symmetrical pose.",
  },
  {
    id: 23,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00026.png-w2ae17FJb0jjBDPqLtfWJ2a5masoWF.jpeg",
    title: "Hair Rollers Morning Selfie",
    prompt: "She is taking a selfie from slightly below eye level, large velcro hair rollers set throughout her hair secured with black clips, direct gaze into camera, confident neutral expression, standing in a walk-in closet with open white shelving units visible in background, natural daylight from a window behind her, soft overexposed background creating depth separation, upper body close-up framing, handheld selfie angle with slight upward tilt, ultra-realistic 4K candid editorial mood, raw morning energy, skin texture visible, no makeup look. Outfit base color: black. Negative prompt: cartoonish, plastic skin, studio lighting, flat background, hair down, no rollers, blurry face, overposed, symmetrical framing, artificial bokeh, stiff expression.",
  },
  {
    id: 24,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00027.png-cascy0GjqWaRpAdezKBOcChGCkwFSs.jpeg",
    title: "Matcha Wellness Morning",
    prompt: "She is standing in a luxury open-plan kitchen, holding a tall glass of iced matcha latte with a metal straw in one hand, silver hydrogel under-eye patches applied to both eyes, fluffy pink bubble headband pushing hair back, slight attitude in expression — lips slightly parted, eyes looking sideways at camera, three-quarter upper body framing, natural daylight from ceiling recessed lights, warm wood cabinetry and marble countertops visible in background, candid selfie-style angle, ultra-realistic 4K editorial wellness lifestyle mood, effortless morning energy. Outfit base color: cream/white. Negative prompt: cartoonish, plastic skin, studio backdrop, flat lighting, no eye patches, empty hands, blurry background, overposed, symmetrical framing, stiff expression, no headband.",
  },
  {
    id: 100,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00001%20%281%29.png-z4KpRnKMnf7yLWYpZtQmTH1crls7j4.jpeg",
    title: "Gucci Eye Patch Editorial",
    prompt: `Ultra-close-up beauty editorial photograph of a woman's eye, extreme macro shot, hyper-realistic skin texture visible in every pore, professional studio lighting.

Framing: extreme close-up macro beauty shot, single eye centered slightly above midframe, partial cheekbone and brow visible, cropped tightly — forehead cut at top, nose cut at bottom, temples cut at sides, straight-on slightly elevated angle, camera parallel to face, macro 100mm equivalent, razor-sharp focus on iris and lash line, slight natural bokeh on skin edges.

Skin: photorealistic human skin with visible pores, micro-fine peach fuzz, subtle sebaceous shine on the cheekbone highlight zone, warm medium-deep brown complexion, golden undertones, natural skin variation — slightly darker under eye, lighter on brow bone, natural satin finish, not airbrushed, real skin imperfections retained, micro-capillary warmth near the eye socket, 8K dermatological realism — individual pores, skin grain, subtle texture mapping.

Eye: deep warm brown iris with golden amber limbal ring, specular catchlight visible at 11 o'clock position, intense direct slightly sensual gaze — confident and editorial, bright sclera with subtle natural vein detail, not overexposed, almond-shaped eye, full upper lid visible, lower waterline exposed.

Makeup: warm champagne-gold shimmer on the mobile lid, finely milled micro-glitter particles catching light, blended seamlessly, soft warm bronze blended into the crease for depth, subtle gold highlight inner corner, precise black liquid liner with a sharp elongated cat-eye wing, crisp edge, voluminous black false lashes, dramatically long and fanned, individual lash clusters visible, slight natural curl upward — full glam editorial lashes, natural mascara on real lower lashes, full slightly arched well-groomed natural brow, individual hairs visible, dark brown-black softly defined.

Eye Patch: luxury under-eye gel patch / hydrogel eye mask, placed directly under the eye, curved upper edge touching the lower lash line, extending across the full under-eye and upper cheekbone area, classic crescent / half-moon eye patch silhouette, satin-finish fabric eye patch with slight translucency and soft sheen, warm beige / tan / camel — classic GG canvas background color, official GUCCI GG Supreme monogram pattern — interlocking double-G logo repeated in an all-over print, dark chocolate brown interlocking GG symbols on the beige canvas, accurate Gucci GG Supreme canvas print — each GG logo clearly legible, evenly spaced grid pattern, includes the subtle floral/diamond dividers between logos typical of GG Supreme, slightly padded fabric surface, soft specular highlight showing it is slightly raised and three-dimensional against the skin, clean smooth rounded edges with slight translucent border touching the skin naturally, the patch sits naturally on the skin, casting a very subtle soft shadow at its upper edge where it meets the lower eyelid area.

Lighting: high-end beauty editorial studio lighting, large softbox positioned front-left, creating a smooth Rembrandt-adjacent wrap, subtle specular highlight on brow bone, cheekbone, and patch surface, soft natural shadow in the eye socket, under the brow, and at the patch edge, warm neutral mood — not cold, not overly warm, clean editorial tone.

Post-processing: minimal retouching — skin texture fully preserved, no plastic smoothing, warm neutral color grade, slight desaturation of background skin tones to emphasize the eye, rich contrast in the iris and lashes, maximum sharpness on eye, lashes, and patch logo; natural roll-off on peripheral skin.

Technical: 8K ultra-high detail, luxury beauty editorial, Vogue / Harper's Bazaar aesthetic, photorealistic, not illustrated, not CGI — indistinguishable from a real photograph.`,
  },
  {
    id: 101,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00002.png-IvHuYOlRhhw5tu6qmOIH7UPpJQHEjE.jpeg",
    title: "Wellness Morning Routine",
    prompt: `She stands against a dark olive-grey wall, thick white clay face mask applied all over her face, one hand holding a clear glass of bright green matcha juice up to her lips drinking it, other hand raised making a peace sign, hair pulled back in a messy low bun, wearing a white oversized cropped graphic t-shirt with collegiate text print, light grey baggy sweatpants, toned abs visible, multiple silver ear studs and pearl drop earrings, silver link bracelet watch on wrist, soft natural side light casting subtle shadows, clean minimal background, effortless cool girl aesthetic, candid wellness morning routine vibe, hyperrealistic skin texture under clay mask, matte clay mask texture with micro cracks visible, ultra sharp detail, 4K hyperrealistic photography`,
  },
  {
    id: 102,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00003-EPfyW0RKpQza4K5rZj0RQGUKkpK8YT.png",
    title: "Luxury Getting Ready Editorial",
    prompt: `She stands in a dark luxury interior hallway, holding a pink heart-shaped handheld mirror raised at face level, gaze directed sideways off camera, lips slightly parted, soft sultry expression, platinum blonde hair styled in a sleek high French twist updo, brown cat-eye sunglasses pushed up on head, wearing a blush pink sheer mesh bustier corset mini dress, diamond tennis choker necklace, long diamond tennis pendant necklace layered, large pink oval gemstone cocktail ring, pink oval drop earrings with diamond halo, gold Rolex Datejust watch, diamond tennis bracelet, stacked gold bracelets, blinding highlight on cheekbones and nose, full glam makeup — heavy lashes, defined brows, glossy nude lips, bronzed sculpted contour, dark moody luxury apartment interior background, dark grey walls, soft warm ambient lighting, shallow depth of field, luxury nightout getting ready editorial photography, hyperrealistic skin texture, pores visible, subsurface scattering, ultra sharp jewelry and mirror detail, 4K hyperrealistic photography`,
  },
  {
    id: 103,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00004-RrHyUPBfSwGM3oAkxrzd6CPKdUr9S2.png",
    title: "Luxury Hotel Spa Editorial",
    prompt: `Luxury hotel spa editorial shot, she reclines in a white marble bathtub filled with thick white foam bubbles, arms resting over the tub edge, chin resting lightly on her hands, gaze directed sideways with dreamy soft expression, lips slightly parted, golden blonde hair pulled up in a messy high bun with a dark brown scrunchie, gold and marble print hydrogel under-eye patches applied below both eyes, delicate gold chain bracelet, thin gold ring, white square manicure, full glam natural makeup — defined brows, heavy lashes, glossy nude lips, blinding highlight, luxury five-star hotel bathroom interior, white and gold veined marble walls and surfaces, gold brass wall hooks with white hotel robe hanging, gold framed full-length mirror, luxury perfume bottles and gold skincare products on marble shelf, rolled white towels stacked, soft warm ambient lighting, hotel spa self-care editorial photography, hyperrealistic skin texture, dewy glowing skin catching warm light, foam bubbles hyperrealistic detail, ultra sharp marble and product detail, 4K hyperrealistic photography`,
  },
  {
    id: 104,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00005-K3KeHGRf1nSaSfjB3g8Tc83z9Z9tpj.png",
    title: "Luxury Makeup Routine Selfie",
    prompt: `She takes a mirror selfie in a luxury bathroom, holding a pink fluffy teddy case iPhone toward mirror, other hand applying lip gloss with a wand to her pursed lips, lips puckered in a kiss applying gloss, direct gaze into mirror, platinum blonde straight hair falling loose, pink padded quilted spa headband, transparent hydrogel under-eye patches applied below both eyes, wearing a lavender lilac fluffy soft oversized bath robe falling off one shoulder, diamond tennis choker necklace, gold Rolex Datejust watch, Cartier love bracelet gold, diamond tennis bracelet stacked, gold rings on multiple fingers, nude square manicure, luxury marble vanity counter in foreground — open black Tom Ford makeup compact, makeup brush set laid out, black zip makeup bag, gold lid skincare cream jar, white skincare products, dark grey tiled bathroom interior visible, soft warm ambient vanity lighting, getting ready beauty routine editorial photography, hyperrealistic skin texture, glossy under-eye patches catching light, ultra sharp jewelry and makeup product detail, 4K hyperrealistic photography`,
  },
  {
    id: 105,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00006.png-VG0cADyGjnP6Bv7vz61aAk4yFoMnQT.jpeg",
    title: "Cozy Morning Rhode Lip Tint",
    prompt: `Extreme close-up shot from above, she is lying down. The frame fills with her baby pink oversized crewneck sweatshirt featuring a small dark red embroidered bow and heart detail on the sleeve cuff. Her long dark wavy hair fans across the lower half of the frame. In the upper right corner her face is partially visible — only her glossy full lips and lower nose showing beneath a white silicone face mask. She holds a dark brown Rhode Peptide Lip Tint pencil with the dark brown "rhode" branded packaging visible, pressing it close to her lips. Her nails are short and natural pink. Shot from directly above, tight intimate crop, soft diffused indoor light, ultra-realistic 4K, cozy morning beauty editorial mood.

Negative prompt: blurry, distorted face, extra fingers, bad anatomy, overexposed, cartoon, CGI, unnatural skin, stiff pose, flat hair, dull hair`,
  },
  {
    id: 106,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00007.png-Z8YsRBAjVNJcQgYIGoU1hF361wlrhP.jpeg",
    title: "Serene Spa Bath Editorial",
    prompt: `She reclines inside a large freestanding oval white matte bathtub filled with thick white foam bubbles, photographed from a slight elevated angle showing the full tub. She wears a white towel twisted and wrapped around her head turban-style with all her hair tucked inside. Behind the tub a brushed silver floor-mounted freestanding tap. On the windowsill in the background: two Glov skincare bottles, a small yellow cream jar, a white Diptyque Figuier candle, and a black Diptyque candle. A Missoni multicolour zigzag chevron bath rug in warm browns, beige, black and blue tones lies on the floor in front of the tub. Warm natural light filters through white slatted blinds on the window behind. The bathroom walls and floor are warm greige tones. Ultra-realistic 4K, editorial luxury lifestyle, serene and intimate spa mood, soft natural light, no harsh shadows.`,
  },
  {
    id: 107,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00008.png-9t1fNwoyt5p5jQA19wB2SqSElUlJKx.jpeg",
    title: "Luxury Beauty Flatlay",
    prompt: `A styled beauty flatlay arranged on a marble bathroom countertop with grey veined marble wall behind. A cream quilted makeup pouch with small pink rose print sits center background. In front of it: a pink CAIA "That Dewy Look" spray bottle with gold cap, a small Clinique white tube, two Clinique glass cream jars with beige lids, and a round gold decorative candle tin with pink floral embossed lid. In the foreground an open white lined notebook lies flat showing several pink lipstick kiss marks pressed onto the page with a small "x" written in pink, and resting on the notebook a pink and gold handheld face sculpting roller tool. A brushed gold tap fixture is partially visible on the right edge. Shot from directly above, soft diffused natural light, ultra-realistic 4K, editorial beauty lifestyle aesthetic, clean and feminine luxury mood.`,
  },
  {
    id: 108,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00009.png-BA7pBMkflCXTeeB2drCcBUNFQ3vJjz.jpeg",
    title: "Hotel Getting Ready Selfie",
    prompt: `She takes a mirror selfie in a luxury hotel bathroom, holding a beige smartphone, lips slightly pursed, one arm crossed over her waist. She wears a white silk robe. Hair up in large velcro rollers. White under-eye patches on her face. Delicate heart pendant necklace, small pearl earrings. Skincare and serum bottles lined up on the marble sink counter beside her. Rolled white towels on a heated gold towel rail, glass shower visible. Warm wall sconce lighting, soft and bright. Half body mirror selfie. Luxury lifestyle editorial photography, ultra-realistic, 4K. Defined bold brows, glossy nude lips, blinding highlight on high cheekbones, long voluminous glossy blowout hair.`,
  },
  {
    id: 109,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00010.png-0yi6bu2RSlyC3DqJzVYwQ9WU3GoBUu.jpeg",
    title: "Heart Mirror Vanity Close-up",
    prompt: `Close-up shot of a pink heart-shaped handheld mirror held up by manicured hands with long nails, warm ambient light, dark moody background, luxury vanity editorial aesthetic, gold bracelets visible on wrist, ultra-realistic 4K editorial mood.

Negative prompt: full face visible, text, watermark, blurry, cartoon, low quality`,
  },
  {
    id: 110,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00011-oK5gJji6cqbJgkPQeDVkR6pbgsV1c8.png",
    title: "Parisian Street Chanel Editorial",
    prompt: `A waist-up, three-quarter angle shot captures a young adult Caucasian woman with long, sleek platinum blonde hair standing on a sunlit city street. She wears a fitted, rose pink and white boucle tweed dress with pearlescent buttons and a high neckline that has a crisp, tailored texture. Her left hand, which shows a pale pink manicure and diamond engagement ring, holds a pink, gold-accented Chanel compact mirror close to her face, while her right hand applies product to her cheek. She accessorizes with a white quilted Chanel bag boasting gold chain straps and logo medallions, and sparkling silver stud earrings. The background features an urban cityscape with stone buildings and a blurred sidewalk stretching into the distance, captured with a deep depth of field but with the subject in crisp focus. The scene is lit by soft, natural daylight providing even illumination and gentle, natural shadows, contributing to a pastel color palette dominated by blush, pale gold, white, and taupe gray. Taken with a modern digital camera, the image is high-resolution with smooth textures and fine detail, creating an elegant, aspirational, and fashion-forward mood.`,
  },
  {
    id: 111,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00012.png-cQYpLi6Qyp4XSPdJHecy5n3UbYlt3J.jpeg",
    title: "Fashion Week Backstage",
    prompt: `She is sitting in a director's chair in a busy fashion show backstage area, wearing a white fluffy robe loosely draped off one shoulder. One makeup artist's hand is applying lip gloss to her lips from the side, another hand holds a professional hair dryer blowing her hair from the other side. A third person behind her holds a makeup brush near her face. She looks directly into the camera with a calm, composed, slightly pouty expression — completely unbothered by all the hands around her. The background is full of activity — other models, makeup stations, bright vanity lights, brushes and products scattered on tables. Warm tungsten backstage lighting, slightly chaotic energy around her but she is perfectly still at the center. Vertical framing, three-quarter shot. Glamorous backstage fashion week mood. Ultra-realistic, 4K, editorial reportage style.

Negative prompt: illustration, cartoon, blurry, low quality, empty background, outdoor, cold light, text overlay, stiff pose, staged look.`,
  },
  {
    id: 112,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00013.png-EA8qu2vPo36TT7qSe1wcWclq5Mu7B1.jpeg",
    title: "Studio Getting Ready Editorial",
    prompt: `She is sitting upright in a director's chair in a clean modern studio, hands resting composed in her lap, looking directly into the camera with a calm, serious, neutral expression. One makeup artist standing behind her to the side is working on her hair with both hands, clipping a section. Another hand from the right holds a large powder brush applying makeup to her cheek. Large round vanity mirror with bright bulb lights visible in the background. Clothing rack softly blurred behind. Bright clean white studio lighting, soft and even. Vertical framing, full torso shot. Polished, professional, editorial getting-ready mood. Ultra-realistic, 4K.

Negative prompt: illustration, cartoon, blurry, low quality, outdoor, dark background, warm lighting, text overlay, smiling, casual setting, messy environment.`,
  },
  {
    id: 113,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00014.png-L4AVUuVvUUTGtACJAZlLAtc2TWiGHS.jpeg",
    title: "Backstage Candid Laughing",
    prompt: `She is sitting in a director's chair in a glamorous backstage dressing room, laughing openly with a wide genuine smile, mouth open, eyes sparkling with joy. Two pairs of hands work around her simultaneously — one pair from behind adjusting her hair on both sides of her head, another hand from the right applying a fine lip brush to the corner of her mouth. She is completely relaxed and joyful despite all the activity around her. Large vanity mirror with round bulb lights fills the background, reflecting the busy backstage crowd in black. Warm golden tungsten vanity lighting. Vertical framing, three-quarter shot. Candid, energetic, glamorous backstage mood. Ultra-realistic, 4K, editorial reportage style.

Negative prompt: illustration, cartoon, blurry, low quality, outdoor, cold light, serious expression, empty background, text overlay, staged look.`,
  },
  {
    id: 114,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00015.png-xyKiYCgVTZXmCEfBn3jaRPw132BwM7.jpeg",
    title: "Lip Gloss Beauty Campaign",
    prompt: `She is facing the camera in an extreme close-up portrait, applying lip gloss with a clear wand applicator directly to her lips, hand visible holding the gloss tube at the bottom of the frame. Her gaze is directed straight into the lens, intense and focused. Hair sleek and pulled back with two small butterfly clips on either side. Skin intensely glowing with heavy highlight on cheekbones and nose bridge, warm bronzed tone. Smoky warm brown eye makeup with full lashes. Lips full and glossy, freshly coated. A delicate gold chain necklace visible at the neck. Bright natural daylight from a window hitting her face from the side creating strong skin luminosity. Vertical framing, extreme face close-up, chin to top of head filling most of the frame. Ultra-realistic, 4K, beauty campaign macro mood.

Negative prompt: illustration, cartoon, deformed hands, extra fingers, blurry, low quality, dark lighting, artificial light, text overlay, smiling, looking away.`,
  },
  {
    id: 115,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00016.png-8yMgsXJfLdNN9g8kk4gyZ88pcc7Qbh.jpeg",
    title: "Glowing Skin Lip Gloss Portrait",
    prompt: `She is holding a lip gloss tube with a white wand applicator in her own hand, applying it to her lips herself, looking slightly off camera with a relaxed, focused expression — lips slightly parted, chin tilted subtly upward. Hair sleek and straight pulled back with two small metal clips on either side. Intensely glowing skin with warm bronze highlight on cheekbones and nose, soft warm eye makeup with full lashes. Lips full and freshly coated in a sheer nude gloss. A delicate thin gold chain necklace visible at the neck. Bright strong natural daylight coming from a window to the side creating dramatic luminosity on the skin. Background softly blurred, cool grey tones. Vertical framing, extreme face close-up portrait, chin to top of head. Beauty campaign macro mood. Ultra-realistic, 4K.

Negative prompt: illustration, cartoon, deformed hands, extra fingers, blurry, low quality, dark lighting, artificial light, text overlay, smiling, looking directly at camera, busy background.`,
  },
  {
    id: 116,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00017.png-fJRQksqUwkTdkkak7GtojGCOcwPNDr.jpeg",
    title: "On-Set Editorial Meta Shot",
    prompt: `She is standing on a photo shoot set, seen in profile and three-quarter view, looking away from the camera off to the side with a calm, composed expression. In the foreground a professional camera on a rig is partially visible with a small external monitor screen attached, showing her face displayed on the screen as if she is being filmed. Soft warm neutral grey studio backdrop behind her. Hair long and wavy falling over one shoulder. Glowing skin, soft glamour makeup. Warm directional studio light from the front creating gentle shadows. Vertical framing, chest-up shot with camera and monitor visible in the lower foreground. Meta on-set editorial mood — she and her image on screen simultaneously. Ultra-realistic, 4K.

Negative prompt: illustration, cartoon, blurry, low quality, outdoor, cold light, text overlay, smiling, looking at camera, busy background, multiple people.`,
  },
  {
    id: 117,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00018.png-ov3fU25ezU5wdU0tIuniFuAEyeSGwr.jpeg",
    title: "Luxury Morning Hair Routine",
    prompt: `She is standing in a grand marble luxury bathroom, medium close-up framing from chest up, holding a white Dyson hair dryer, blow-drying her long wet hair to the side with a slow graceful movement. She gazes softly off-camera. Warm golden wall sconces cast ambient light on the marble walls behind her. Plush pink robe loosely draped over her shoulders. Ultra-realistic 4K editorial mood, intimate morning luxury atmosphere, cinematic soft light.

Negative prompt: cartoonish, plastic skin, harsh shadows, flat lighting, full body, wide shot, low resolution, text, watermark.`,
  },
  {
    id: 118,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00019.png-6KjD369UcCoKVzTKojxvVXWzueFeZy.jpeg",
    title: "YSL Blush Luxury Routine",
    prompt: `She is standing in a grand marble luxury bathroom, medium close-up framing from chest up. In one hand she holds an open YSL blush compact — round black case with gold trim and quilted pink leather lid, YSL logo in gold visible — displayed toward the camera. With the other hand she gently sweeps a fluffy powder brush across her cheekbone with a soft, elegant motion. She gazes slightly off-camera, lips softly parted, expression relaxed and glamorous. Warm golden wall sconces on both sides cast soft balanced light on her face. Plush pink robe loosely draped over her shoulders. Ultra-realistic 4K editorial mood, intimate luxury makeup ritual atmosphere, cinematic soft light.

Negative prompt: cartoonish, plastic skin, distorted hands, distorted compact, wrong logo, harsh shadows, flat lighting, full body, wide shot, low resolution, text artifacts, watermark.`,
  },
  {
    id: 119,
    category: "Beauty",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image00020.png-2OC818h6lG374rz64jb0OLjtoD7WdI.jpeg",
    title: "Gucci Mascara Luxury Application",
    prompt: `She is standing in a grand marble luxury bathroom, tight medium close-up framing from bust up, face prominently centered. In one hand she holds the Gucci mascara tube — pale pink cylinder with gold ribbed cap, "Gucci" written in gold lettering — open without the wand. With the other hand she brings the black mascara wand close to her upper lashes, applying it with a precise upward stroke, mouth slightly open in that natural mascara-application expression. Her makeup is already fully done — sculpted brows, smoky eye, flushed cheeks, glossy lips. Her long golden blonde hair is perfectly sleek, straight and glossy, falling immaculate over her shoulders. Warm golden wall sconces on both sides cast soft balanced light. Plush pink robe. Ultra-realistic 4K editorial mood, luxury makeup ritual atmosphere, cinematic soft light, beauty close-up framing.

Negative prompt: dark hair, brunette, wand inserted in tube, capped mascara, messy hair, no makeup, cartoonish, plastic skin, distorted hands, harsh shadows, flat lighting, full body, low resolution, text artifacts, watermark.`,
  },

  // FASHION CATEGORY (17 prompts)
  {
    id: 18,
    category: "Fashion",
    image: "https://picsum.photos/seed/fashion1/400/500",
    title: "Street Style Chic",
    prompt: "High fashion editorial portrait, sleek straight hair, navy blue crop top, professional studio setup, dramatic side lighting, confident powerful pose, Vogue magazine aesthetic, urban street style, oversized blazer and heels",
  },
  {
    id: 19,
    category: "Fashion",
    image: "https://picsum.photos/seed/fashion2/400/500",
    title: "Runway Ready",
    prompt: "Runway model portrait, slicked back wet-look hair, avant-garde fashion outfit, dramatic makeup, catwalk lighting, fierce confident expression, high fashion editorial, designer clothing showcase",
  },
  {
    id: 20,
    category: "Fashion",
    image: "https://picsum.photos/seed/fashion3/400/500",
    title: "Minimalist Elegance",
    prompt: "Minimalist fashion portrait, clean lines, neutral color palette, simple elegant outfit, architectural background, editorial lighting, sophisticated modern aesthetic, less is more philosophy",
  },
  {
    id: 21,
    category: "Fashion",
    image: "https://picsum.photos/seed/fashion4/400/500",
    title: "Boho Goddess",
    prompt: "Bohemian fashion portrait, flowy maxi dress, natural wavy hair, outdoor golden hour, flower accessories, free-spirited aesthetic, earthy tones, festival fashion vibes",
  },
  {
    id: 22,
    category: "Fashion",
    image: "https://picsum.photos/seed/fashion5/400/500",
    title: "Power Suit",
    prompt: "Corporate fashion portrait, tailored power suit, boss woman aesthetic, confident pose, modern office background, professional lighting, empowered feminine style, business chic",
  },
  {
    id: 23,
    category: "Fashion",
    image: "https://picsum.photos/seed/fashion6/400/500",
    title: "Vintage Glamour",
    prompt: "Vintage fashion portrait, 1950s inspired outfit, retro hairstyle, classic red lipstick, old Hollywood glamour, film noir lighting, timeless elegance, pin-up aesthetic",
  },
  {
    id: 24,
    category: "Fashion",
    image: "https://picsum.photos/seed/fashion7/400/500",
    title: "Athleisure Queen",
    prompt: "Athleisure fashion portrait, sporty chic outfit, matching set, sneakers, urban background, street style photography, comfortable yet stylish, modern casual wear",
  },
  {
    id: 25,
    category: "Fashion",
    image: "https://picsum.photos/seed/fashion8/400/500",
    title: "Evening Elegance",
    prompt: "Evening gown portrait, elegant black dress, sophisticated updo, statement jewelry, luxury venue background, dramatic lighting, red carpet ready, glamorous event style",
  },
  {
    id: 26,
    category: "Fashion",
    image: "https://picsum.photos/seed/fashion9/400/500",
    title: "Denim Days",
    prompt: "Casual denim fashion portrait, classic jeans and white tee, effortless cool style, natural poses, daylight photography, authentic street style, timeless wardrobe staples",
  },
  {
    id: 27,
    category: "Fashion",
    image: "https://picsum.photos/seed/fashion10/400/500",
    title: "Leather Edge",
    prompt: "Edgy fashion portrait, leather jacket, rock and roll aesthetic, bold makeup, urban gritty background, moody lighting, rebellious style, punk-inspired fashion",
  },
  {
    id: 28,
    category: "Fashion",
    image: "https://picsum.photos/seed/fashion11/400/500",
    title: "Summer Breeze",
    prompt: "Summer fashion portrait, flowy sundress, straw hat, beach or garden setting, natural sunlight, carefree feminine style, vacation aesthetic, light and airy mood",
  },
  {
    id: 29,
    category: "Fashion",
    image: "https://picsum.photos/seed/fashion12/400/500",
    title: "Cozy Knits",
    prompt: "Fall fashion portrait, oversized knit sweater, warm autumn colors, cozy aesthetic, soft natural lighting, comfortable chic style, hygge vibes, seasonal fashion",
  },
  {
    id: 30,
    category: "Fashion",
    image: "https://picsum.photos/seed/fashion13/400/500",
    title: "Print Mix Master",
    prompt: "Bold pattern fashion portrait, mixed prints outfit, confident styling, fashion-forward aesthetic, editorial composition, maximalist style, pattern clash done right",
  },
  {
    id: 31,
    category: "Fashion",
    image: "https://picsum.photos/seed/fashion14/400/500",
    title: "Silk Sophistication",
    prompt: "Luxury silk fashion portrait, flowing silk dress, elegant draping, soft feminine aesthetic, studio lighting, high-end fashion photography, luxurious fabric texture",
  },
  {
    id: 32,
    category: "Fashion",
    image: "https://picsum.photos/seed/fashion15/400/500",
    title: "Urban Explorer",
    prompt: "Urban streetwear portrait, trendy outfit, city background, candid walking shot, natural street photography, contemporary style, metropolitan fashion",
  },
  {
    id: 33,
    category: "Fashion",
    image: "https://picsum.photos/seed/fashion16/400/500",
    title: "Resort Wear",
    prompt: "Resort fashion portrait, tropical print outfit, vacation destination, poolside or beach, bright natural light, luxury travel aesthetic, summer getaway style",
  },
  {
    id: 34,
    category: "Fashion",
    image: "https://picsum.photos/seed/fashion17/400/500",
    title: "Monochrome Magic",
    prompt: "Monochromatic fashion portrait, all-black or all-white outfit, clean sophisticated style, editorial lighting, minimalist aesthetic, tonal dressing, chic simplicity",
  },

  // LIFESTYLE CATEGORY (17 prompts)
  {
    id: 35,
    category: "Lifestyle",
    image: "https://picsum.photos/seed/lifestyle1/400/500",
    title: "Coffee Shop Moment",
    prompt: "Lifestyle portrait in cozy coffee shop, holding artisan latte, casual chic outfit, window seat with natural light, cafe aesthetic, warm and inviting atmosphere, authentic candid moment",
  },
  {
    id: 36,
    category: "Lifestyle",
    image: "https://picsum.photos/seed/lifestyle2/400/500",
    title: "Morning Routine",
    prompt: "Morning routine lifestyle portrait, just woken up natural beauty, white bedding, soft morning light through curtains, peaceful serene mood, authentic bedroom aesthetic",
  },
  {
    id: 37,
    category: "Lifestyle",
    image: "https://picsum.photos/seed/lifestyle3/400/500",
    title: "Work From Home",
    prompt: "Work from home lifestyle portrait, laptop and coffee, comfortable stylish loungewear, organized aesthetic desk setup, natural daylight, productive cozy atmosphere",
  },
  {
    id: 38,
    category: "Lifestyle",
    image: "https://picsum.photos/seed/lifestyle4/400/500",
    title: "Weekend Brunch",
    prompt: "Brunch lifestyle portrait, beautiful food spread, restaurant patio setting, casual weekend outfit, golden morning light, social dining aesthetic, Instagram-worthy moment",
  },
  {
    id: 39,
    category: "Lifestyle",
    image: "https://picsum.photos/seed/lifestyle5/400/500",
    title: "Bookworm Cozy",
    prompt: "Reading lifestyle portrait, cozy with book, comfortable chair or window nook, warm lighting, intellectual aesthetic, peaceful solitude, book lover vibes",
  },
  {
    id: 40,
    category: "Lifestyle",
    image: "https://picsum.photos/seed/lifestyle6/400/500",
    title: "Travel Wanderer",
    prompt: "Travel lifestyle portrait, exploring new destination, casual travel outfit, scenic background, adventure aesthetic, wanderlust vibes, authentic travel moment",
  },
  {
    id: 41,
    category: "Lifestyle",
    image: "https://picsum.photos/seed/lifestyle7/400/500",
    title: "Self-Care Sunday",
    prompt: "Self-care lifestyle portrait, face mask and robe, spa day at home, candles and plants, relaxation aesthetic, wellness routine, peaceful self-love moment",
  },
  {
    id: 42,
    category: "Lifestyle",
    image: "https://picsum.photos/seed/lifestyle8/400/500",
    title: "Cooking Creative",
    prompt: "Cooking lifestyle portrait, preparing meal in kitchen, fresh ingredients, apron and casual style, warm kitchen lighting, home chef aesthetic, culinary passion",
  },
  {
    id: 43,
    category: "Lifestyle",
    image: "https://picsum.photos/seed/lifestyle9/400/500",
    title: "Plant Parent",
    prompt: "Plant care lifestyle portrait, tending to houseplants, urban jungle home setting, natural light, green living aesthetic, plant mom vibes, nurturing moment",
  },
  {
    id: 44,
    category: "Lifestyle",
    image: "https://picsum.photos/seed/lifestyle10/400/500",
    title: "Golden Hour Walk",
    prompt: "Golden hour outdoor lifestyle portrait, casual walk in nature, warm sunset lighting, relaxed peaceful expression, natural beauty, end of day serenity",
  },
  {
    id: 45,
    category: "Lifestyle",
    image: "https://picsum.photos/seed/lifestyle11/400/500",
    title: "Art Studio Creative",
    prompt: "Creative lifestyle portrait, artist in studio, painting or creating, paint-splattered apron, artistic chaos background, creative process moment, passion project aesthetic",
  },
  {
    id: 46,
    category: "Lifestyle",
    image: "https://picsum.photos/seed/lifestyle12/400/500",
    title: "Farmers Market",
    prompt: "Farmers market lifestyle portrait, shopping for fresh produce, woven basket, outdoor market setting, authentic community moment, healthy living aesthetic",
  },
  {
    id: 47,
    category: "Lifestyle",
    image: "https://picsum.photos/seed/lifestyle13/400/500",
    title: "Journaling Moment",
    prompt: "Journaling lifestyle portrait, writing in notebook, cozy corner setting, thoughtful expression, mindfulness practice, personal reflection aesthetic, analog moment",
  },
  {
    id: 48,
    category: "Lifestyle",
    image: "https://picsum.photos/seed/lifestyle14/400/500",
    title: "Music Lover",
    prompt: "Music lifestyle portrait, listening with headphones, eyes closed enjoying music, urban setting, lost in music moment, authentic emotional connection",
  },
  {
    id: 49,
    category: "Lifestyle",
    image: "https://picsum.photos/seed/lifestyle15/400/500",
    title: "Beach Day Bliss",
    prompt: "Beach lifestyle portrait, relaxing on sand, swimwear and coverup, ocean background, summer vacation vibes, carefree beach day, sun-kissed aesthetic",
  },
  {
    id: 50,
    category: "Lifestyle",
    image: "https://picsum.photos/seed/lifestyle16/400/500",
    title: "City Explorer",
    prompt: "Urban exploration lifestyle portrait, walking city streets, stylish city outfit, architecture background, metropolitan adventure, street photography aesthetic",
  },
  {
    id: 51,
    category: "Lifestyle",
    image: "https://picsum.photos/seed/lifestyle17/400/500",
    title: "Sunset Balcony",
    prompt: "Balcony sunset lifestyle portrait, watching sunset from terrace, glass of wine, golden hour lighting, peaceful evening moment, romantic city view aesthetic",
  },

  // PODCAST CATEGORY (17 prompts)
  {
    id: 52,
    category: "Podcast",
    image: "https://picsum.photos/seed/podcast1/400/500",
    title: "Studio Interview",
    prompt: "Professional podcast studio portrait, high-end microphone setup, soundproofing panels visible, warm studio lighting, confident host pose, professional audio equipment, engaging conversation aesthetic",
  },
  {
    id: 53,
    category: "Podcast",
    image: "https://picsum.photos/seed/podcast2/400/500",
    title: "Home Studio Setup",
    prompt: "Home podcast studio portrait, cozy recording space, ring light illumination, comfortable setting, authentic creator aesthetic, bedroom or office converted studio",
  },
  {
    id: 54,
    category: "Podcast",
    image: "https://picsum.photos/seed/podcast3/400/500",
    title: "Microphone Close-up",
    prompt: "Podcast recording close-up, speaking into professional microphone, pop filter visible, focused expression, intimate recording moment, audio content creation",
  },
  {
    id: 55,
    category: "Podcast",
    image: "https://picsum.photos/seed/podcast4/400/500",
    title: "Guest Conversation",
    prompt: "Podcast interview scene, two-person setup, engaging conversation moment, professional lighting, talk show aesthetic, dynamic discussion",
  },
  {
    id: 56,
    category: "Podcast",
    image: "https://picsum.photos/seed/podcast5/400/500",
    title: "Headphones On",
    prompt: "Podcast host portrait with headphones, professional studio headphones, monitoring audio, focused listening expression, recording session aesthetic",
  },
  {
    id: 57,
    category: "Podcast",
    image: "https://picsum.photos/seed/podcast6/400/500",
    title: "Laptop Recording",
    prompt: "Podcast recording with laptop, screen visible, editing software, casual home recording setup, content creator aesthetic, digital workspace",
  },
  {
    id: 58,
    category: "Podcast",
    image: "https://picsum.photos/seed/podcast7/400/500",
    title: "Animated Discussion",
    prompt: "Animated podcast moment, expressive hand gestures, passionate speaking, dynamic energy, engaging storytelling, captivating host presence",
  },
  {
    id: 59,
    category: "Podcast",
    image: "https://picsum.photos/seed/podcast8/400/500",
    title: "Minimalist Setup",
    prompt: "Minimalist podcast studio, clean aesthetic setup, simple microphone and laptop, uncluttered background, modern creator space, sleek recording environment",
  },
  {
    id: 60,
    category: "Podcast",
    image: "https://picsum.photos/seed/podcast9/400/500",
    title: "Neon Studio",
    prompt: "Neon-lit podcast studio, colorful LED background, modern aesthetic, YouTube studio vibes, vibrant atmosphere, contemporary content creator setup",
  },
  {
    id: 61,
    category: "Podcast",
    image: "https://picsum.photos/seed/podcast10/400/500",
    title: "Reading Notes",
    prompt: "Podcast host reading show notes, preparing content, professional preparation, behind the scenes, thoughtful moment before recording",
  },
  {
    id: 62,
    category: "Podcast",
    image: "https://picsum.photos/seed/podcast11/400/500",
    title: "Laughing Moment",
    prompt: "Candid podcast laughing moment, genuine joy, authentic connection, natural humor, relatable host personality, warm inviting energy",
  },
  {
    id: 63,
    category: "Podcast",
    image: "https://picsum.photos/seed/podcast12/400/500",
    title: "Coffee and Mic",
    prompt: "Podcast setup with coffee, cozy recording atmosphere, morning show vibes, comfort and professionalism, warm beverage aesthetic",
  },
  {
    id: 64,
    category: "Podcast",
    image: "https://picsum.photos/seed/podcast13/400/500",
    title: "Standing Desk Record",
    prompt: "Standing desk podcast setup, energetic recording posture, active hosting style, modern office aesthetic, health-conscious creator",
  },
  {
    id: 65,
    category: "Podcast",
    image: "https://picsum.photos/seed/podcast14/400/500",
    title: "Outdoor Recording",
    prompt: "Outdoor podcast recording, portable setup, nature background, on-location content, field recording aesthetic, adventure podcast vibes",
  },
  {
    id: 66,
    category: "Podcast",
    image: "https://picsum.photos/seed/podcast15/400/500",
    title: "Video Podcast",
    prompt: "Video podcast setup, camera and microphone visible, multi-platform content, YouTube podcast aesthetic, professional video recording",
  },
  {
    id: 67,
    category: "Podcast",
    image: "https://picsum.photos/seed/podcast16/400/500",
    title: "Mixing Audio",
    prompt: "Podcast post-production, editing audio on computer, mixing board visible, behind the scenes, technical creator moment",
  },
  {
    id: 68,
    category: "Podcast",
    image: "https://picsum.photos/seed/podcast17/400/500",
    title: "Promo Shot",
    prompt: "Podcast promotional portrait, professional headshot style, branding background, marketing material aesthetic, show cover image quality",
  },

  // FITNESS CATEGORY (16 prompts)
  {
    id: 69,
    category: "Fitness",
    image: "https://picsum.photos/seed/fitness1/400/500",
    title: "Gym Power",
    prompt: "Gym fitness portrait, weight training pose, athletic wear, gym equipment background, strong confident expression, empowered fitness aesthetic, sweat and determination",
  },
  {
    id: 70,
    category: "Fitness",
    image: "https://picsum.photos/seed/fitness2/400/500",
    title: "Yoga Flow",
    prompt: "Yoga pose portrait, graceful asana, yoga studio or outdoor setting, peaceful focused expression, flexibility and strength, mindful movement aesthetic",
  },
  {
    id: 71,
    category: "Fitness",
    image: "https://picsum.photos/seed/fitness3/400/500",
    title: "Running Strong",
    prompt: "Running fitness portrait, outdoor jogging, athletic outfit, motion blur background, determined expression, cardio workout, active lifestyle",
  },
  {
    id: 72,
    category: "Fitness",
    image: "https://picsum.photos/seed/fitness4/400/500",
    title: "Boxing Power",
    prompt: "Boxing fitness portrait, boxing gloves and stance, punching bag or ring, intense focused expression, combat sport aesthetic, powerful and fierce",
  },
  {
    id: 73,
    category: "Fitness",
    image: "https://picsum.photos/seed/fitness5/400/500",
    title: "Pilates Grace",
    prompt: "Pilates workout portrait, reformer or mat exercise, elongated graceful pose, studio setting, controlled movement, core strength aesthetic",
  },
  {
    id: 74,
    category: "Fitness",
    image: "https://picsum.photos/seed/fitness6/400/500",
    title: "HIIT Intensity",
    prompt: "High intensity workout portrait, mid-exercise action shot, sweat visible, gym class setting, pushing limits, intense cardio moment",
  },
  {
    id: 75,
    category: "Fitness",
    image: "https://picsum.photos/seed/fitness7/400/500",
    title: "Post-Workout Glow",
    prompt: "Post-workout portrait, healthy flushed skin, satisfied expression, gym background, accomplished feeling, fitness journey aesthetic",
  },
  {
    id: 76,
    category: "Fitness",
    image: "https://picsum.photos/seed/fitness8/400/500",
    title: "Stretching Session",
    prompt: "Stretching fitness portrait, flexibility pose, warm-up or cool-down, gym mat, focused on form, athletic grace",
  },
  {
    id: 77,
    category: "Fitness",
    image: "https://picsum.photos/seed/fitness9/400/500",
    title: "Swimming Strong",
    prompt: "Swimming fitness portrait, pool setting, swimmer aesthetic, athletic form, water sport, competitive or leisure swim",
  },
  {
    id: 78,
    category: "Fitness",
    image: "https://picsum.photos/seed/fitness10/400/500",
    title: "Cycling Power",
    prompt: "Cycling fitness portrait, spin class or outdoor cycling, athletic gear, cardio intensity, endurance workout aesthetic",
  },
  {
    id: 79,
    category: "Fitness",
    image: "https://picsum.photos/seed/fitness11/400/500",
    title: "Dance Fitness",
    prompt: "Dance workout portrait, energetic movement, dance studio, joyful expression, cardio dance class, fun fitness aesthetic",
  },
  {
    id: 80,
    category: "Fitness",
    image: "https://picsum.photos/seed/fitness12/400/500",
    title: "Meditation Calm",
    prompt: "Meditation fitness portrait, peaceful seated pose, eyes closed, serene expression, mindfulness practice, mental fitness aesthetic",
  },
  {
    id: 81,
    category: "Fitness",
    image: "https://picsum.photos/seed/fitness13/400/500",
    title: "CrossFit Strong",
    prompt: "CrossFit workout portrait, functional fitness movement, box gym setting, chalk on hands, raw athletic power, gritty fitness aesthetic",
  },
  {
    id: 82,
    category: "Fitness",
    image: "https://picsum.photos/seed/fitness14/400/500",
    title: "Outdoor Workout",
    prompt: "Outdoor fitness portrait, park or beach workout, bodyweight exercise, natural setting, fresh air fitness, outdoor training aesthetic",
  },
  {
    id: 83,
    category: "Fitness",
    image: "https://picsum.photos/seed/fitness15/400/500",
    title: "Dumbbell Strength",
    prompt: "Dumbbell workout portrait, arm exercise, weight room, focused determination, strength training, muscle building aesthetic",
  },
  {
    id: 84,
    category: "Fitness",
    image: "https://picsum.photos/seed/fitness16/400/500",
    title: "Fitness Model",
    prompt: "Fitness model portrait, athletic physique showcase, professional fitness photography, athletic wear, inspirational fit body aesthetic",
  },

  // PORTRAIT CATEGORY (16 prompts)
  {
    id: 85,
    category: "Portrait",
    image: "https://picsum.photos/seed/portrait1/400/500",
    title: "Classic Headshot",
    prompt: "Professional headshot portrait, clean background, flattering lighting, confident approachable expression, corporate or creative professional, LinkedIn profile quality",
  },
  {
    id: 86,
    category: "Portrait",
    image: "https://picsum.photos/seed/portrait2/400/500",
    title: "Moody Drama",
    prompt: "Moody dramatic portrait, low-key lighting, shadows and highlights, intense gaze, artistic portrait, emotional depth, fine art photography",
  },
  {
    id: 87,
    category: "Portrait",
    image: "https://picsum.photos/seed/portrait3/400/500",
    title: "Golden Hour Magic",
    prompt: "Golden hour outdoor portrait, warm sunset backlight, natural beauty, soft romantic mood, magical lighting, golden glow on skin",
  },
  {
    id: 88,
    category: "Portrait",
    image: "https://picsum.photos/seed/portrait4/400/500",
    title: "Black and White Classic",
    prompt: "Black and white portrait, timeless monochrome aesthetic, dramatic contrast, classic photography style, emotional depth, artistic expression",
  },
  {
    id: 89,
    category: "Portrait",
    image: "https://picsum.photos/seed/portrait5/400/500",
    title: "Candid Laugh",
    prompt: "Candid laughing portrait, genuine joyful expression, natural moment, authentic emotion, unposed beauty, real happiness captured",
  },
  {
    id: 90,
    category: "Portrait",
    image: "https://picsum.photos/seed/portrait6/400/500",
    title: "Environmental Portrait",
    prompt: "Environmental portrait, subject in their element, meaningful location, contextual storytelling, authentic personality, documentary style",
  },
  {
    id: 91,
    category: "Portrait",
    image: "https://picsum.photos/seed/portrait7/400/500",
    title: "Studio Dramatic",
    prompt: "Studio dramatic portrait, professional lighting setup, black background, striking pose, high-end portrait photography, magazine quality",
  },
  {
    id: 92,
    category: "Portrait",
    image: "https://picsum.photos/seed/portrait8/400/500",
    title: "Soft Natural Light",
    prompt: "Soft natural light portrait, window lighting, gentle shadows, intimate mood, peaceful expression, ethereal quality, delicate beauty",
  },
  {
    id: 93,
    category: "Portrait",
    image: "https://picsum.photos/seed/portrait9/400/500",
    title: "Close-up Detail",
    prompt: "Extreme close-up portrait, facial detail focus, eyes and skin texture, intimate perspective, raw beauty, micro portrait photography",
  },
  {
    id: 94,
    category: "Portrait",
    image: "https://picsum.photos/seed/portrait10/400/500",
    title: "Outdoor Natural",
    prompt: "Outdoor natural portrait, park or garden setting, dappled sunlight, relaxed natural pose, approachable friendly expression, organic beauty",
  },
  {
    id: 95,
    category: "Portrait",
    image: "https://picsum.photos/seed/portrait11/400/500",
    title: "Creative Artistic",
    prompt: "Creative artistic portrait, unique angle or composition, experimental photography, artistic expression, bold creative choices, gallery-worthy",
  },
  {
    id: 96,
    category: "Portrait",
    image: "https://picsum.photos/seed/portrait12/400/500",
    title: "Silhouette Drama",
    prompt: "Silhouette portrait, backlit dramatic effect, mysterious mood, shape and form focus, artistic lighting, striking visual impact",
  },
  {
    id: 97,
    category: "Portrait",
    image: "https://picsum.photos/seed/portrait13/400/500",
    title: "Reflective Thoughtful",
    prompt: "Thoughtful reflective portrait, contemplative expression, looking away from camera, pensive mood, introspective moment, emotional depth",
  },
  {
    id: 98,
    category: "Portrait",
    image: "https://picsum.photos/seed/portrait14/400/500",
    title: "High Key Bright",
    prompt: "High key portrait, bright white background, clean minimal aesthetic, even lighting, fresh and modern look, commercial photography style",
  },
  {
    id: 99,
    category: "Portrait",
    image: "https://picsum.photos/seed/portrait15/400/500",
    title: "Freckles Natural",
    prompt: "Natural freckles portrait, embracing unique features, minimal makeup, authentic beauty, celebrating natural characteristics, skin positivity",
  },
  {
    id: 100,
    category: "Portrait",
    image: "https://picsum.photos/seed/portrait16/400/500",
    title: "Urban Portrait",
    prompt: "Urban street portrait, city background, modern metropolitan aesthetic, street photography style, confident city dweller, contemporary look",
  },
]

// Unified gallery item type that works with both database and legacy data
type GalleryItemData = {
  id: string | number
  category: string
  image: string
  title: string
  prompt: string
}

// Optimized Gallery Item Component - memoized with GPU-accelerated animations
const GalleryItem = memo(function GalleryItem({
  item,
  onClick,
  priority = false,
}: {
  item: GalleryItemData
  onClick: () => void
  priority?: boolean
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <div
      onClick={onClick}
      className="gallery-item group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-2xl bg-[#1a1a1a]"
    >
      <img
        src={item.image}
        alt={item.title}
        className={`gallery-image absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          imageLoaded && !imageError ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => {
          setImageLoaded(true)
          setImageError(false)
        }}
        onError={() => {
          setImageLoaded(true)
          setImageError(true)
          console.error("[v0] Failed to load image:", item.image)
        }}
        loading={priority ? "eager" : "lazy"}
        crossOrigin="anonymous"
      />
      {(!imageLoaded || imageError) && (
        <div className={`absolute inset-0 ${imageError ? 'bg-red-900/20' : 'bg-white/5'}`} />
      )}
      <div className="gallery-overlay absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="gallery-content absolute bottom-0 left-0 right-0 p-4">
        <span className="mb-1 inline-block rounded-full bg-[#9E3248]/30 px-2 py-0.5 text-xs text-[#C74D64]">
          {item.category}
        </span>
        <h3 className="text-sm font-medium text-white">{item.title}</h3>
      </div>
    </div>
  )
})

// Prompt Modal Component
function PromptModal({ 
  item, 
  onClose 
}: { 
  item: GalleryItemData
  onClose: () => void 
}) {
  const [copied, setCopied] = useState(false)

  // Lock body scroll when modal is open - without causing layout shift
  useEffect(() => {
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${scrollBarWidth}px`
    
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(item.prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 p-0 md:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl md:rounded-3xl bg-[#141414] border border-[#9E3248]/25 max-h-[90vh] md:max-h-[70vh] md:flex-row"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 md:right-4 md:top-4 z-10 rounded-full bg-black/50 p-1.5 md:p-2 text-white/60 transition-colors hover:bg-black/70 hover:text-white"
        >
          <X className="h-4 w-4 md:h-5 md:w-5" />
        </button>

        {/* Image - left side on desktop, top on mobile */}
        <div className="w-full shrink-0 md:w-[45%] flex items-center justify-center bg-black/20">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-auto max-h-[40vh] md:max-h-[70vh] object-contain"
            crossOrigin="anonymous"
            onError={() => console.error("[v0] Failed to load modal image:", item.image)}
          />
        </div>

        {/* Content - right side on desktop, bottom on mobile */}
        <div 
          className="flex flex-1 flex-col p-4 md:p-6 overflow-y-auto"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#9E3248]/25 px-2.5 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs font-medium text-[#C74D64]">
                {item.category}
              </span>
            </div>
            <h3 className="mt-2 md:mt-3 text-base md:text-xl font-semibold text-white">{item.title}</h3>
            
            {/* Prompt box */}
            <div className="mt-3 md:mt-4 rounded-xl bg-white/5 p-3 md:p-4">
              <p className="text-[11px] md:text-sm leading-relaxed text-white/70 whitespace-pre-wrap">{item.prompt}</p>
            </div>
          </div>

          {/* Copy button */}
          <button
            onClick={copyToClipboard}
            className="mt-3 md:mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#9E3248] py-2.5 md:py-3 text-sm font-medium text-white transition-all hover:bg-[#B33D54] shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 md:h-5 md:w-5" />
                Copied to Clipboard
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 md:h-5 md:w-5" />
                Copy Prompt
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function PromptsPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedItem, setSelectedItem] = useState<GalleryItemData | null>(null)
  const [suggestion, setSuggestion] = useState("")
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_BATCH)
  const [galleryData, setGalleryData] = useState<GalleryItemData[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>(["All"])
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Fetch prompts from database
  const fetchPrompts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/prompts")
      if (res.ok) {
        const data = await res.json()
        const prompts: PromptItem[] = data.prompts || []
        
        // Transform database format to gallery format
        const transformedData: GalleryItemData[] = prompts.map(p => ({
          id: p.id,
          category: p.category,
          image: p.image_url,
          title: p.title,
          prompt: p.prompt,
        }))
        
        setGalleryData(transformedData)
        
        // Extract unique categories
        const cats = ["All", ...new Set(prompts.map(p => p.category))]
        setAvailableCategories(cats)
      } else {
        // Fallback to hardcoded data if API fails
        const legacyData: GalleryItemData[] = promptGallery.map(p => ({
          id: p.id,
          category: p.category,
          image: p.image,
          title: p.title,
          prompt: p.prompt,
        }))
        setGalleryData(legacyData)
        setAvailableCategories(categories)
      }
    } catch (error) {
      console.error("Error fetching prompts:", error)
      // Fallback to hardcoded data
      const legacyData: GalleryItemData[] = promptGallery.map(p => ({
        id: p.id,
        category: p.category,
        image: p.image,
        title: p.title,
        prompt: p.prompt,
      }))
      setGalleryData(legacyData)
      setAvailableCategories(categories)
    } finally {
      setIsLoadingPrompts(false)
    }
  }, [])
  
  // Check authorization on mount - must run client-side only
  useEffect(() => {
    const checkAuth = () => {
      const cookieValue = getCookie(COOKIE_NAME)
      if (cookieValue === "unlocked") {
        setIsAuthorized(true)
        setIsLoading(false)
        fetchPrompts()
      } else {
        // Redirect to home if not authorized
        router.push("/")
      }
    }
    
    // Run immediately since we're already client-side
    checkAuth()
  }, [router, fetchPrompts])

  // Memoize filtered gallery to prevent recalculation on every render
  const filteredGallery = useMemo(() => {
    return selectedCategory === "All"
      ? galleryData
      : galleryData.filter(item => item.category === selectedCategory)
  }, [selectedCategory, galleryData])

  // Reset visible count when category changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_BATCH)
  }, [selectedCategory])

  // Infinite scroll - load more items when reaching the bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleCount < filteredGallery.length) {
          setVisibleCount(prev => Math.min(prev + ITEMS_PER_BATCH, filteredGallery.length))
        }
      },
      { rootMargin: '200px', threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [visibleCount, filteredGallery.length])

  // Memoize visible items
  const visibleItems = useMemo(() => {
    return filteredGallery.slice(0, visibleCount)
  }, [filteredGallery, visibleCount])

  // Memoize the item click handler
  const handleItemClick = useCallback((item: GalleryItemData) => {
    setSelectedItem(item)
  }, [])

  const handleSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (suggestion.trim()) {
      // Here you could send to an API endpoint or email service
      setSuggestionSubmitted(true)
      setSuggestion("")
      // Reset after 3 seconds
      setTimeout(() => {
        setSuggestionSubmitted(false)
      }, 3000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#9E3248]/30 border-t-[#9E3248]"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: "#5a1020",
        backgroundImage:
          "repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 22px), repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 22px)",
        backgroundAttachment: "scroll",
      }}
    >
      {/* Hero Section */}
      <section className="relative h-[50vh] w-full overflow-hidden md:h-[70vh]">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/prompt-bank-hero.jpeg"
            alt="Infinite Prompt Bank"
            fill
            className="object-cover grayscale"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#6B1B2D]/50 via-transparent to-[#5a1020]" />
        </div>

        {/* Back Button */}
        <Link
          href="/"
          className="absolute left-4 top-4 md:left-6 md:top-6 z-20 flex items-center gap-1.5 md:gap-2 rounded-full bg-[#6B1B2D]/50 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-white/80 backdrop-blur-sm transition-all hover:bg-[#9E3248]/50 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
          Back
        </Link>

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 md:px-6">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center font-serif text-4xl italic text-[#C74D64] sm:text-5xl md:text-7xl lg:text-8xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            infinite prompt
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-2 rounded-lg bg-[#9E3248] px-4 py-1 md:mt-3"
          >
            <span className="text-lg font-semibold tracking-wider text-white md:text-xl">BANK</span>
          </motion.div>
        </div>
      </section>

      {/* Prompt Gallery */}
      <section className="relative px-4 py-8 pb-24 md:px-6 md:py-16 md:pb-40">
        {/* Burgundy pinstripe background - high quality, no stretching */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/images/background_only.png')",
            backgroundSize: "auto",
            backgroundPosition: "top center",
            backgroundRepeat: "repeat",
            imageRendering: "crisp-edges",
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl">
          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-6 flex flex-wrap justify-center gap-1.5 md:mb-12 md:gap-2"
          >
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all md:px-6 md:py-2 md:text-sm ${
                  selectedCategory === category
                    ? "bg-[#9E3248] text-white"
                    : "bg-white/10 text-white/70 hover:bg-[#9E3248]/30 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>

          {/* Gallery Grid - Optimized with CSS containment and lazy loading */}
          {isLoadingPrompts ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#9E3248]" />
              <p className="mt-4 text-sm text-white/40">Loading prompts...</p>
            </div>
          ) : galleryData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-white/60">No prompts available yet.</p>
            </div>
          ) : (
            <>
              <div 
                className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5"
                style={{ 
                  contain: 'layout style',
                  contentVisibility: 'auto',
                }}
              >
                {visibleItems.map((item, index) => (
                  <GalleryItem
                    key={item.id}
                    item={item}
                    onClick={() => handleItemClick(item)}
                    priority={index < 15} // First 15 items load eagerly (3 rows on desktop)
                  />
                ))}
              </div>

              {/* Load More Trigger for Infinite Scroll */}
              {visibleCount < filteredGallery.length && (
                <div
                  ref={loadMoreRef}
                  className="flex justify-center py-8"
                >
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#9E3248]/30 border-t-[#9E3248]" />
                </div>
              )}

              {/* Prompt Count */}
              <p className="mt-8 text-center text-sm text-white/40">
                Showing {visibleItems.length} of {filteredGallery.length} prompts
              </p>
            </>
          )}

          {/* Suggestion Section */}
          <div className="mx-auto mt-12 md:mt-20 w-full max-w-xl border-t border-[#9E3248]/25 pt-8 md:pt-12 text-center px-2">
            <h3 className="text-lg md:text-xl font-semibold text-white">
              Have an idea?
            </h3>
            <p className="mt-2 text-xs md:text-sm text-white/50">
              Want to see something specific in the prompt gallery? Share your idea below.
            </p>
            
            <AnimatePresence mode="wait">
              {suggestionSubmitted ? (
                <motion.div
                  key="thanks"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 py-4"
                >
                  <Check className="h-5 w-5 text-green-400" />
                  <span className="text-green-400">Thanks for your suggestion!</span>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSuggestionSubmit}
                  className="mt-4 md:mt-6"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:gap-3">
                    <input
                      type="text"
                      value={suggestion}
                      onChange={(e) => setSuggestion(e.target.value)}
                      placeholder="E.g., More vintage film prompts..."
                      className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 md:px-5 md:py-3 text-sm text-white placeholder:text-white/30 focus:border-[#9E3248]/40 focus:outline-none"
                    />
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={!suggestion.trim()}
                      className="flex items-center justify-center gap-2 rounded-full bg-[#9E3248]/30 px-5 py-2.5 md:py-3 text-sm font-medium text-white transition-colors hover:bg-[#9E3248]/50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" />
                      <span className="hidden sm:inline">Send</span>
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Prompt Modal */}
      <AnimatePresence>
        {selectedItem && (
          <PromptModal item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

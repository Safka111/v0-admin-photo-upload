"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Lock, 
  LogOut, 
  Upload, 
  Trash2, 
  Plus, 
  X, 
  Image as ImageIcon,
  Loader2,
  Check,
  AlertCircle,
  Database
} from "lucide-react"
import Image from "next/image"

interface Prompt {
  id: string
  category: string
  image_url: string
  title: string
  prompt: string
  sort_order: number
  created_at: string
}

const CATEGORIES = [
  "Beauty",
  "Fashion", 
  "Lifestyle",
  "Food",
  "Travel",
  "Fitness",
  "Interior",
  "Portrait",
  "Product",
  "Nature",
  "The Everyday",
  "Campaign",
  "Editorial",
  "Selfie"
]

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [password, setPassword] = useState("")
  const [authToken, setAuthToken] = useState("") // Store password for API calls
  const [authError, setAuthError] = useState("")
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [isAddingPrompt, setIsAddingPrompt] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  
  // Form state
  const [newPrompt, setNewPrompt] = useState({
    category: "Beauty",
    image_url: "",
    title: "",
    prompt: "",
    sort_order: 0,
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewImageError, setPreviewImageError] = useState(false)
  const [previewImageRetries, setPreviewImageRetries] = useState(0)

  // Check authentication on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/auth")
      if (res.ok) {
        setIsAuthenticated(true)
        fetchPrompts()
      }
    } catch (error) {
      console.error("Auth check error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        setIsAuthenticated(true)
        setAuthToken(password) // Store for API calls
        setPassword("")
        fetchPrompts()
      } else {
        const data = await res.json()
        setAuthError(data.error || "Invalid password")
      }
    } catch (error) {
      console.error("Login error:", error)
      setAuthError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" })
      setIsAuthenticated(false)
      setPrompts([])
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const fetchPrompts = async () => {
    try {
      const res = await fetch("/api/admin/prompts")
      if (res.ok) {
        const data = await res.json()
        setPrompts(data.prompts || [])
      }
    } catch (error) {
      console.error("Fetch prompts error:", error)
    }
  }

  const showNotification = useCallback((type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size on client side first (max 700KB)
    const maxSize = 700 * 1024
    if (file.size > maxSize) {
      showNotification("error", "File too large. Maximum size is 700KB. Please compress your image first.")
      return
    }

    // If no auth token stored, prompt for password
    let token = authToken
    if (!token) {
      const pwd = window.prompt("Please enter your admin password to upload:")
      if (!pwd) {
        showNotification("error", "Password required for upload")
        return
      }
      token = pwd
      setAuthToken(pwd)
    }

    setUploadProgress(true)
    
    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (e) => setPreviewImage(e.target?.result as string)
    reader.readAsDataURL(file)

    try {
      // Upload to R2 via server route
      const formData = new FormData()
      formData.append("file", file)
      formData.append("auth", token)

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        // Handle non-JSON error responses
        const contentType = res.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          const data = await res.json()
          throw new Error(data.error || "Upload failed")
        } else {
          const text = await res.text()
          console.error("Non-JSON error response:", text)
          throw new Error("Upload failed. Please try a smaller image (max 700KB).")
        }
      }

      const data = await res.json()
      console.log("[v0] Upload response URL:", data.url)
      setNewPrompt(prev => ({ ...prev, image_url: data.url }))
      setPreviewImageError(false)
      setPreviewImageRetries(0)
      showNotification("success", "Image uploaded successfully")
    } catch (error) {
      console.error("Upload error:", error)
      const errorMessage = error instanceof Error ? error.message : "Upload failed"
      if (errorMessage.includes("Unauthorized")) {
        setAuthToken("")
      }
      showNotification("error", errorMessage)
      setPreviewImage(null)
    } finally {
      setUploadProgress(false)
    }
  }

  const handleAddPrompt = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPrompt.image_url || !newPrompt.title || !newPrompt.prompt) {
      showNotification("error", "Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-password": authToken,
        },
        body: JSON.stringify(newPrompt),
      })

      if (res.ok) {
        showNotification("success", "Prompt added successfully")
        setNewPrompt({
          category: "Beauty",
          image_url: "",
          title: "",
          prompt: "",
          sort_order: 0,
        })
        setPreviewImage(null)
        setIsAddingPrompt(false)
        fetchPrompts()
      } else {
        const data = await res.json()
        showNotification("error", data.error || "Failed to add prompt")
      }
    } catch (error) {
      console.error("Add prompt error:", error)
      showNotification("error", "Failed to add prompt")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePrompt = async (id: string, imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this prompt?")) return

    try {
      // Delete prompt from database
      const res = await fetch(`/api/admin/prompts?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": authToken },
      })

      if (res.ok) {
        // Try to delete image from blob storage (non-critical)
        try {
          await fetch("/api/admin/upload", {
            method: "DELETE",
            headers: { 
              "Content-Type": "application/json",
              "x-admin-password": authToken,
            },
            body: JSON.stringify({ url: imageUrl }),
          })
        } catch (e) {
          console.warn("Could not delete image from storage:", e)
        }

        showNotification("success", "Prompt deleted successfully")
        fetchPrompts()
      } else {
        showNotification("error", "Failed to delete prompt")
      }
    } catch (error) {
      console.error("Delete error:", error)
      showNotification("error", "Failed to delete prompt")
    }
  }

  const handlePreviewImageError = () => {
    console.log("[v0] Preview image failed to load, URL:", newPrompt.image_url, "Retries:", previewImageRetries)
    setPreviewImageError(true)
    
    // Retry loading after 1 second (up to 3 times)
    if (previewImageRetries < 3) {
      setTimeout(() => {
        setPreviewImageRetries(prev => prev + 1)
        setPreviewImageError(false)
      }, 1000)
    }
  }

  // Loading state
  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-[#9E3248]" />
      </div>
    )
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#9E3248]/20">
                <Lock className="h-8 w-8 text-[#9E3248]" />
              </div>
            </div>
            
            <h1 className="mb-2 text-center text-2xl font-bold text-white">Admin Access</h1>
            <p className="mb-6 text-center text-sm text-white/60">
              Enter your password to manage prompts
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors focus:border-[#9E3248]"
                  autoFocus
                />
              </div>

              {authError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm text-red-400"
                >
                  {authError}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full rounded-lg bg-[#9E3248] px-4 py-3 font-medium text-white transition-colors hover:bg-[#B73D56] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    )
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg px-4 py-3 ${
              notification.type === "success"
                ? "bg-green-500/90"
                : "bg-red-500/90"
            }`}
          >
            {notification.type === "success" ? (
              <Check className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">Prompt Admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/60">{prompts.length} prompts</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm transition-colors hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={() => setIsAddingPrompt(true)}
            className="flex items-center gap-2 rounded-lg bg-[#9E3248] px-4 py-3 font-medium transition-colors hover:bg-[#B73D56]"
          >
            <Plus className="h-5 w-5" />
            Add New Prompt
          </button>
          
          {prompts.length === 0 && (
            <button
              onClick={async () => {
                if (!confirm("This will migrate sample prompts to the database. Continue?")) return
                try {
                  const res = await fetch("/api/admin/migrate", { method: "POST" })
                  const data = await res.json()
                  if (res.ok) {
                    showNotification("success", data.message)
                    fetchPrompts()
                  } else {
                    showNotification("error", data.error || "Migration failed")
                  }
                } catch (error) {
                  console.error("Migration error:", error)
                  showNotification("error", "Migration failed")
                }
              }}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-medium transition-colors hover:bg-white/10"
            >
              <Database className="h-5 w-5" />
              Migrate Sample Prompts
            </button>
          )}
        </div>

        {/* Add Prompt Modal */}
        <AnimatePresence>
          {isAddingPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
              onClick={() => setIsAddingPrompt(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111] p-6"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Add New Prompt</h2>
                  <button
                    onClick={() => setIsAddingPrompt(false)}
                    className="rounded-lg p-2 transition-colors hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleAddPrompt} className="space-y-6">
                  {/* Image Upload */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Image *
                    </label>
                    <div className="relative">
                      {previewImage || newPrompt.image_url ? (
                        <div className="relative aspect-[4/5] w-full max-w-xs overflow-hidden rounded-lg">
                          <img
                            key={`preview-${previewImageRetries}`}
                            src={previewImage || newPrompt.image_url}
                            alt="Preview"
                            className="absolute inset-0 h-full w-full object-cover"
                            crossOrigin="anonymous"
                            onError={handlePreviewImageError}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewImage(null)
                              setNewPrompt(prev => ({ ...prev, image_url: "" }))
                            }}
                            className="absolute right-2 top-2 rounded-full bg-black/50 p-1 transition-colors hover:bg-black/70"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          {uploadProgress && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <label className="flex aspect-[4/5] w-full max-w-xs cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 transition-colors hover:border-[#9E3248]">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <ImageIcon className="mb-2 h-10 w-10 text-white/40" />
                          <span className="text-sm text-white/60">Click to upload</span>
                          <span className="mt-1 text-xs text-white/40">
                            JPEG, PNG, WebP, GIF (max 700KB)
                          </span>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Category *
                    </label>
                    <select
                      value={newPrompt.category}
                      onChange={(e) => setNewPrompt(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-colors focus:border-[#9E3248]"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="bg-[#111]">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={newPrompt.title}
                      onChange={(e) => setNewPrompt(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter prompt title"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors focus:border-[#9E3248]"
                    />
                  </div>

                  {/* Prompt */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Prompt Text *
                    </label>
                    <textarea
                      value={newPrompt.prompt}
                      onChange={(e) => setNewPrompt(prev => ({ ...prev, prompt: e.target.value }))}
                      placeholder="Enter the full prompt text..."
                      rows={6}
                      className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors focus:border-[#9E3248]"
                    />
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">
                      Sort Order (optional)
                    </label>
                    <input
                      type="number"
                      value={newPrompt.sort_order}
                      onChange={(e) => setNewPrompt(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition-colors focus:border-[#9E3248]"
                    />
                    <p className="mt-1 text-xs text-white/40">
                      Lower numbers appear first
                    </p>
                  </div>

                  {/* Submit */}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsAddingPrompt(false)}
                      className="flex-1 rounded-lg border border-white/10 px-4 py-3 font-medium transition-colors hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !newPrompt.image_url || !newPrompt.title || !newPrompt.prompt}
                      className="flex-1 rounded-lg bg-[#9E3248] px-4 py-3 font-medium transition-colors hover:bg-[#B73D56] disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                      ) : (
                        "Add Prompt"
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prompts Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {prompts.map((prompt) => (
            <motion.div
              key={prompt.id}
              layout
              className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-white/10 bg-white/5"
            >
              <img
                src={prompt.image_url}
                alt={prompt.title}
                className="absolute inset-0 h-full w-full object-cover"
                crossOrigin="anonymous"
                onError={() => console.error("[v0] Failed to load grid image:", prompt.image_url)}
              />
              
              {/* Overlay - always visible on mobile, hover on desktop */}
              <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                <div className="flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      handleDeletePrompt(prompt.id, prompt.image_url)
                    }}
                    className="rounded-lg bg-red-500/80 p-2 transition-colors hover:bg-red-500 active:bg-red-600"
                    aria-label="Delete prompt"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div>
                  <span className="mb-1 inline-block rounded-full bg-[#9E3248]/30 px-2 py-0.5 text-xs text-[#C74D64]">
                    {prompt.category}
                  </span>
                  <h3 className="text-sm font-medium text-white line-clamp-2">
                    {prompt.title}
                  </h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {prompts.length === 0 && (
          <div className="py-20 text-center">
            <ImageIcon className="mx-auto mb-4 h-12 w-12 text-white/20" />
            <p className="text-white/60">No prompts yet. Add your first one!</p>
          </div>
        )}
      </main>
    </div>
  )
}

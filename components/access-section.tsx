"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Lock, X } from "lucide-react"
import { useRouter } from "next/navigation"

// ========================================
// ACCESS CODE - Change this value anytime
// ========================================
const ACCESS_CODE = "197664321"
// ========================================

// Cookie utilities for persistent access
const COOKIE_NAME = "prompt_bank_access"
const COOKIE_EXPIRY_DAYS = 365 // Cookie lasts 1 year

function setCookie(name: string, value: string, days: number) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  // Use max-age for better browser compatibility along with expires
  const maxAge = days * 24 * 60 * 60
  const cookieString = `${name}=${value}; expires=${expires.toUTCString()}; max-age=${maxAge}; path=/; SameSite=Lax`
  document.cookie = cookieString
}

export function AccessSection() {
  const router = useRouter()
  const [accessCode, setAccessCode] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (accessCode === ACCESS_CODE) {
      setError("")
      setShowCodeModal(false)
      setShowSuccess(true)
      // Set cookie that lasts 1 year so user doesn't need to enter code again
      setCookie(COOKIE_NAME, "unlocked", COOKIE_EXPIRY_DAYS)
      // Show congratulations for 2.5 seconds, then redirect to prompts page
      setTimeout(() => {
        router.push("/prompts")
      }, 2500)
    } else {
      setError("Invalid access code. Please try again.")
      setAccessCode("")
    }
  }

  return (
    <section id="full-access" className="relative z-10 pt-32 md:pt-48 pb-16 md:pb-24 overflow-visible">
      {/* Striped burgundy background - fixed position for seamless connection */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url('/images/velvet-texture.jpg')`,
          backgroundSize: "auto",
          backgroundPosition: "top left",
          backgroundAttachment: "fixed",
          backgroundRepeat: "repeat",
        }}
      />
      {/* No top overlay - seamless with hero */}
      
      {/* Fade to black at bottom - larger and smoother */}
      <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-[#0a0a0a]" />
      
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            // Success State - Congratulations
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex min-h-[400px] flex-col items-center justify-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-8 rounded-full bg-gradient-to-br from-[#9E3248]/25 to-[#C74D64]/25 p-8"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  <Check className="h-16 w-16 text-green-400" />
                </motion.div>
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-3xl font-bold text-white md:text-4xl"
              >
                Congratulations!
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-4 text-lg text-white/60"
              >
                Access granted. Unlocking premium prompts...
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-8 flex items-center gap-2"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="h-2 w-2 rounded-full bg-[#9E3248]"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="h-2 w-2 rounded-full bg-[#9E3248]"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  className="h-2 w-2 rounded-full bg-[#9E3248]"
                />
              </motion.div>
            </motion.div>
          ) : (
            // Locked State - Access Code Entry
            <motion.div
              key="locked"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center"
            >
              {/* Get Full Access Section - Stan Store style */}
              <div className="relative mb-12 md:mb-20">
                {/* Rotated girly image on the right */}
                <motion.div
                  initial={{ opacity: 0, x: 50, rotate: 45 }}
                  animate={{ opacity: 1, x: 0, rotate: 45 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="absolute hidden lg:block"
                  style={{ 
                    right: "-240px",
                    top: "-40px",
                  }}
                >
                  {/* Paper clip at top */}
                  <div 
                    className="absolute z-30"
                    style={{
                      top: "-18px",
                      left: "50%",
                      transform: "translateX(-50%) rotate(-45deg)",
                    }}
                  >
                    <svg 
                      width="28" 
                      height="56" 
                      viewBox="0 0 28 56" 
                      fill="none"
                      style={{ filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.4))" }}
                    >
                      {/* Outer loop of paper clip */}
                      <path 
                        d="M14 4C8 4 4 8 4 14V42C4 48 8 52 14 52C20 52 24 48 24 42V14" 
                        stroke="url(#clipGradientRight)" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                        fill="none"
                      />
                      {/* Inner loop of paper clip */}
                      <path 
                        d="M14 12C11 12 9 14 9 17V38C9 41 11 43 14 43C17 43 19 41 19 38V17" 
                        stroke="url(#clipGradientRight)" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                        fill="none"
                      />
                      <defs>
                        <linearGradient id="clipGradientRight" x1="4" y1="4" x2="24" y2="52" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#d4d4d4" />
                          <stop offset="30%" stopColor="#a8a8a8" />
                          <stop offset="60%" stopColor="#c0c0c0" />
                          <stop offset="100%" stopColor="#888888" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="rounded-lg border-4 border-white p-1 shadow-2xl" style={{ boxShadow: "0 25px 50px rgba(0,0,0,0.4)" }}>
                    <img
                      src="/images/girly-decor.jpg"
                      alt="Feminine aesthetic decor"
                      className="h-48 w-32 rounded object-cover"
                    />
                  </div>
                </motion.div>
                
                {/* Rotated showcase image on the bottom left */}
                <motion.div
                  initial={{ opacity: 0, x: -50, rotate: -12 }}
                  animate={{ opacity: 1, x: 0, rotate: -12 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="absolute hidden lg:block"
                  style={{ 
                    left: "-220px",
                    bottom: "-180px",
                  }}
                >
                  {/* Paper clip at top */}
                  <div 
                    className="absolute z-30"
                    style={{
                      top: "-18px",
                      left: "50%",
                      transform: "translateX(-50%) rotate(12deg)",
                    }}
                  >
                    <svg 
                      width="28" 
                      height="56" 
                      viewBox="0 0 28 56" 
                      fill="none"
                      style={{ filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.4))" }}
                    >
                      {/* Outer loop of paper clip */}
                      <path 
                        d="M14 4C8 4 4 8 4 14V42C4 48 8 52 14 52C20 52 24 48 24 42V14" 
                        stroke="url(#clipGradientLeft)" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                        fill="none"
                      />
                      {/* Inner loop of paper clip */}
                      <path 
                        d="M14 12C11 12 9 14 9 17V38C9 41 11 43 14 43C17 43 19 41 19 38V17" 
                        stroke="url(#clipGradientLeft)" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                        fill="none"
                      />
                      <defs>
                        <linearGradient id="clipGradientLeft" x1="4" y1="4" x2="24" y2="52" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#d4d4d4" />
                          <stop offset="30%" stopColor="#a8a8a8" />
                          <stop offset="60%" stopColor="#c0c0c0" />
                          <stop offset="100%" stopColor="#888888" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="rounded-lg border-4 border-white p-1 shadow-2xl" style={{ boxShadow: "0 25px 50px rgba(0,0,0,0.4)" }}>
                    <img
                      src="/images/prompt-bank-showcase.jpg"
                      alt="Showcase portrait"
                      className="h-48 w-32 rounded object-cover"
                    />
                  </div>
                </motion.div>
                
                <h2 
                  className="text-3xl md:text-4xl md:text-5xl text-white italic"
                  style={{ fontFamily: "var(--font-corinthia), cursive" }}
                >
                  Get Full Access
                </h2>
                <p className="mt-3 md:mt-4 text-xs md:text-sm text-white/60 md:text-base px-4 md:px-0">
                  Unlock all premium prompts and start creating<br className="hidden md:block" />
                  stunning AI portraits today.
                </p>
                
                {/* Polaroid-style locked cards - matched to reference photo */}
                <div className="mt-6 md:mt-10 flex justify-center items-start gap-2 md:gap-5">
                  {[
                    { 
                      label: "WILD", 
                      rotation: "-8deg", 
                      marginTop: "20px",
                      mobileMarginTop: "14px",
                      tapeType: "clip",
                      tapePosition: "right",
                      tapeRotation: "8deg",
                    },
                    { 
                      label: "ICONIC", 
                      rotation: "2deg", 
                      marginTop: "0px",
                      mobileMarginTop: "0px",
                      tapeType: "tape",
                      tapePosition: "center",
                      tapeRotation: "-2deg",
                    },
                    { 
                      label: "LUXE", 
                      rotation: "8deg", 
                      marginTop: "16px",
                      mobileMarginTop: "10px",
                      tapeType: "clip",
                      tapePosition: "left",
                      tapeRotation: "-10deg",
                    },
                  ].map((card, index) => (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                      style={{ 
                        transform: `rotate(${card.rotation})`,
                        marginTop: isMobile ? card.mobileMarginTop : card.marginTop,
                        zIndex: index === 1 ? 10 : 5,
                      }}
                    >
                      {/* Tape or clip at top */}
                      {card.tapeType === "tape" ? (
                        // Center beige tape for ICONIC
                        <div 
                          className="absolute z-20"
                          style={{ 
                            top: "-10px",
                            left: "50%",
                            transform: `translateX(-50%) rotate(${card.tapeRotation})`,
                            width: "44px",
                            height: "20px",
                            background: "linear-gradient(180deg, rgba(212, 196, 168, 0.85) 0%, rgba(196, 178, 148, 0.85) 100%)",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
                            borderLeft: "1px solid rgba(255,255,255,0.2)",
                            borderRight: "1px solid rgba(0,0,0,0.1)",
                          }}
                        />
                      ) : (
                        // Small grey clip for side cards
                        <div 
                          className="absolute z-20"
                          style={{ 
                            top: "-6px",
                            [card.tapePosition === "right" ? "right" : "left"]: "18px",
                            transform: `rotate(${card.tapeRotation})`,
                            width: "16px",
                            height: "14px",
                            background: "linear-gradient(180deg, #a8a8a8 0%, #707070 50%, #555 100%)",
                            boxShadow: "0 2px 3px rgba(0,0,0,0.35)",
                            borderRadius: "1px",
                          }}
                        />
                      )}
                      {/* Polaroid frame - cream/off-white */}
                      <div 
                        className="bg-[#f5f1e8] p-2 pb-8 md:p-3 md:pb-12" 
                        style={{ 
                          boxShadow: "0 12px 25px rgba(0,0,0,0.45), 0 4px 10px rgba(0,0,0,0.3)",
                        }}
                      >
                        {/* Image area - square dark burgundy with radial vignette */}
                        <div 
                          className="relative w-20 h-20 md:w-32 md:h-32 flex items-center justify-center"
                          style={{ 
                            background: "radial-gradient(ellipse at center, #7a2838 0%, #5a1d2a 35%, #3a121c 70%, #2a0c14 100%)",
                          }}
                        >
                          <Lock 
                            className="w-4 h-4 md:w-6 md:h-6" 
                            strokeWidth={2}
                            style={{ color: "#a87a3e" }}
                          />
                        </div>
                        {/* Label below image */}
                        <p 
                          className="mt-2 md:mt-4 text-center text-[8px] md:text-[10px] uppercase"
                          style={{ 
                            color: "#5a5a5a",
                            letterSpacing: "0.2em",
                            fontFamily: "var(--font-mono), monospace",
                          }}
                        >
                          {card.label}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-8 md:mt-12 flex flex-col items-center gap-3 md:gap-4 sm:flex-row sm:justify-center px-4 md:px-0">
                  {/* Get Access button - animated glow */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative rounded-full px-6 py-2.5 text-sm font-semibold text-white md:px-8 md:py-3 md:text-[15px]"
                  >
                    {/* Animated outer glow ring */}
                    <motion.span
                      aria-hidden="true"
                      className="absolute -inset-1 rounded-full opacity-75 blur-xl"
                      style={{
                        background: "linear-gradient(90deg, #9E3248, #C74D64, #E56B82, #C74D64, #9E3248)",
                        backgroundSize: "200% 100%",
                      }}
                      animate={{
                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                        opacity: [0.6, 0.9, 0.6],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    {/* Pulsing outer ring */}
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full"
                      style={{
                        boxShadow: "0 0 0 0 rgba(199, 77, 100, 0.7)",
                      }}
                      animate={{
                        boxShadow: [
                          "0 0 0 0 rgba(199, 77, 100, 0.7)",
                          "0 0 0 12px rgba(199, 77, 100, 0)",
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                    {/* Inner gradient background */}
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "linear-gradient(135deg, #9E3248 0%, #C74D64 50%, #9E3248 100%)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3), 0 0 30px rgba(199, 77, 100, 0.5)",
                      }}
                    />
                    {/* Shine sweep effect */}
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-0 overflow-hidden rounded-full"
                    >
                      <motion.span
                        className="absolute inset-y-0 w-1/3"
                        style={{
                          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                        }}
                        animate={{
                          x: ["-150%", "350%"],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          repeatDelay: 1,
                        }}
                      />
                    </motion.span>
                    {/* Button label */}
                    <span className="relative z-10 flex items-center gap-2 tracking-wide drop-shadow-md">
                      Get Access $50
                    </span>
                  </motion.button>

                  {/* Access Code button - bigger, refined */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowCodeModal(true)}
                    className="rounded-full border border-[#C74D64]/40 bg-white/5 px-6 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-[#C74D64]/70 hover:bg-white/10 md:px-8 md:py-3 md:text-[15px]"
                  >
                    Access Code
                  </motion.button>
                </div>
              </div>

              {/* Access Code Modal */}
              {/* Modal rendered via portal to ensure it's always on top and clickable */}
              {mounted && createPortal(
                <AnimatePresence>
                  {showCodeModal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                      onClick={() => setShowCodeModal(false)}
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md rounded-3xl bg-[#141414] p-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setShowCodeModal(false)}
                          className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
                        >
                          <X className="h-5 w-5" />
                        </button>

                        <div className="flex flex-col items-center text-center">
                          <div className="mb-6 rounded-full bg-white/5 p-4">
                            <Lock className="h-10 w-10 text-white/60" />
                          </div>
                          
                          <h3 className="text-2xl font-bold text-white">Enter Access Code</h3>
                          <p className="mt-2 text-sm text-white/50">
                            Enter your code to unlock premium prompts
                          </p>

                          <form onSubmit={handleSubmit} className="mt-6 w-full">
                            <input
                              type="text"
                              value={accessCode}
                              onChange={(e) => setAccessCode(e.target.value)}
                              placeholder="Enter access code"
                              autoFocus
                              className="w-full rounded-full border border-white/10 bg-white/5 px-6 py-4 text-center text-lg tracking-widest text-white placeholder:text-white/30 focus:border-[#9E3248]/50 focus:outline-none focus:ring-2 focus:ring-[#9E3248]/20"
                            />
                            
                            {error && (
                              <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 text-sm text-red-400"
                              >
                                {error}
                              </motion.p>
                            )}

                            <motion.button
                              type="submit"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="mt-4 w-full rounded-full bg-white py-4 text-base font-semibold text-black transition-colors hover:bg-white/90"
                            >
                              Unlock Access
                            </motion.button>
                          </form>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>,
                document.body
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

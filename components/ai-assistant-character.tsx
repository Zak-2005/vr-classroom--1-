"use client"

import { useEffect, useRef, useState } from "react"
import type * as THREE from "three"
import LiveKitAIAssistant from "./livekit-ai-assistant"

interface AIAssistantCharacterProps {
  position?: [number, number, number]
  scale?: number
  onInteract?: () => void
}

export default function AIAssistantCharacter({
  position = [3, 0, -3],
  scale = 0.5,
  onInteract,
}: AIAssistantCharacterProps) {
  const characterRef = useRef<THREE.Group | null>(null)
  const [showAssistant, setShowAssistant] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    // This function will be called by the parent component to create the 3D character
    return () => {
      if (characterRef.current) {
        // Cleanup if needed
      }
    }
  }, [])

  const handleInteraction = () => {
    setShowAssistant(!showAssistant)
    if (onInteract) onInteract()
  }

  return (
    <>
      {/* LiveKit AI Assistant */}
      <LiveKitAIAssistant isOpen={showAssistant} onClose={() => setShowAssistant(false)} />

      {/* Floating button to open assistant (for non-VR mode) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleInteraction}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
          aria-label="Open AI Assistant"
        >
          {showAssistant ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z"
                fill="currentColor"
              />
              <path
                d="M17.91 11C17.91 11.41 17.87 11.8 17.82 12.18C17.72 12.9 18.26 13.5 18.98 13.5H19.04C19.56 13.5 20 13.07 20.1 12.56C20.16 12.12 20.2 11.66 20.2 11.19C20.2 7.09 17.11 3.72 13.17 3.08C12.64 2.99 12.1 3.37 12.1 3.91V4.14C12.1 4.6 12.43 4.98 12.89 5.06C15.9 5.58 18.21 8.06 18.21 11H17.91Z"
                fill="currentColor"
              />
              <path
                d="M4.09 11C4.09 8.06 6.4 5.58 9.41 5.06C9.87 4.98 10.2 4.6 10.2 4.14V3.91C10.2 3.37 9.66 2.99 9.13 3.08C5.19 3.72 2.1 7.09 2.1 11.19C2.1 11.66 2.14 12.12 2.2 12.56C2.3 13.07 2.74 13.5 3.26 13.5H3.32C4.04 13.5 4.58 12.9 4.48 12.18C4.43 11.8 4.39 11.41 4.39 11H4.09Z"
                fill="currentColor"
              />
              <path d="M12 22C14.2091 22 16 20.2091 16 18H8C8 20.2091 9.79086 22 12 22Z" fill="currentColor" />
            </svg>
          )}
        </button>
      </div>
    </>
  )
}


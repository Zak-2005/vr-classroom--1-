"use client"
import dynamic from "next/dynamic"

// Dynamically import the VRClassroom component to avoid SSR issues with Three.js
const VRClassroom = dynamic(() => import("@/components/vr-classroom"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-green-900 text-white">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold">Loading VR Classroom...</h2>
        <p>Preparing your virtual learning environment</p>
      </div>
    </div>
  ),
})

export default function Home() {
  return (
    <main className="h-screen w-full overflow-hidden">
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/70 p-2 text-center text-white">
        <p>Welcome to the VR Classroom</p>
        <p className="text-xs mt-1">VR Mode: Content is mirrored as textures for Meta Quest compatibility</p>
        <p className="text-xs mt-1">For best experience, try both desktop and VR modes</p>
      </div>
      <VRClassroom videoId="vr-classroom" />
    </main>
  )
}


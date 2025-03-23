"use client"

import { useEffect, useRef, useState } from "react"
import { LiveKitRoom, useRoomContext, useRemoteParticipants, useConnectionState } from "@livekit/components-react"
import { RoomEvent, type RemoteParticipant, ParticipantEvent } from "livekit-client"
import { CloseIcon } from "./icons"
import { NoAgentNotification } from "./no-agent-notification"

export type AgentState = "connecting" | "listening" | "thinking" | "speaking" | "error"

interface LiveKitAIAssistantProps {
  isOpen: boolean
  onClose: () => void
}

export default function LiveKitAIAssistant({ isOpen, onClose }: LiveKitAIAssistantProps) {
  const [token, setToken] = useState<string | null>(null)
  const [agentState, setAgentState] = useState<AgentState>("connecting")
  const [error, setError] = useState<string | null>(null)
  const [roomName, setRoomName] = useState<string>(`room-${Math.random().toString(36).substring(2, 9)}`)
  const [isLoading, setIsLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string>("")

  // Generate a token for connecting to LiveKit
  useEffect(() => {
    if (!isOpen) return

    const generateToken = async () => {
      try {
        setIsLoading(true)
        setDebugInfo("Generating token...")

        const response = await fetch("/api/get-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomName,
            participantName: "user",
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          setDebugInfo(`Token error: ${response.status} - ${errorText}`)
          throw new Error(`Failed to generate token: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        setToken(data.token)
        setDebugInfo("Token generated successfully")
        setIsLoading(false)
      } catch (err) {
        console.error("Error generating token:", err)
        setDebugInfo(`Error: ${err instanceof Error ? err.message : String(err)}`)
        setError("Failed to connect to voice assistant")
        setAgentState("error")
        setIsLoading(false)
      }
    }

    generateToken()
  }, [roomName, isOpen])

  if (!isOpen) return null

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[600px] bg-[#121212] rounded-xl overflow-hidden shadow-lg z-50 border border-gray-700">
      <div className="flex items-center justify-between p-4 bg-[#1E1E1E]">
        <h2 className="text-white font-medium">AI Voice Assistant</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close assistant">
          <CloseIcon />
        </button>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center h-[calc(100%-64px)] p-4">
          <div className="text-red-500 mb-2">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 8C12.5523 8 13 8.44772 13 9V13C13 13.5523 12.5523 14 12 14C11.4477 14 11 13.5523 11 13V9C11 8.44772 11.4477 8 12 8ZM12 16C12.5523 16 13 16.4477 13 17C13 17.5523 12.5523 18 12 18C11.4477 18 11 17.5523 11 17C11 16.4477 11.4477 16 12 16Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <p className="text-white text-center">{error}</p>
          <p className="text-xs text-gray-500 mt-2 text-center">{debugInfo}</p>
          <button
            onClick={() => {
              setError(null)
              setAgentState("connecting")
              setRoomName(`room-${Math.random().toString(36).substring(2, 9)}`)
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center h-[calc(100%-64px)]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-white">Connecting to LiveKit...</p>
          <p className="text-xs text-gray-500 mt-2">{debugInfo}</p>
        </div>
      ) : token ? (
        <LiveKitRoom
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://jarvis-rhfx31vd.livekit.cloud"}
          options={{ adaptiveStream: true, dynacast: true }}
          className="h-[calc(100%-64px)]"
          onError={(error) => {
            console.error("LiveKit error:", error)
            setDebugInfo(`LiveKit error: ${error.message}`)
            setError("Connection error: " + error.message)
          }}
        >
          <RoomContent agentState={agentState} setAgentState={setAgentState} setDebugInfo={setDebugInfo} />
          <NoAgentNotification state={agentState}>
            <p>Waiting for agent to connect...</p>
          </NoAgentNotification>
        </LiveKitRoom>
      ) : (
        <div className="flex flex-col items-center justify-center h-[calc(100%-64px)]">
          <p className="text-white mb-4">Failed to initialize LiveKit</p>
          <p className="text-xs text-gray-500">{debugInfo}</p>
          <button
            onClick={() => {
              setRoomName(`room-${Math.random().toString(36).substring(2, 9)}`)
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}

function RoomContent({
  agentState,
  setAgentState,
  setDebugInfo,
}: {
  agentState: AgentState
  setAgentState: (state: AgentState) => void
  setDebugInfo: (info: string) => void
}) {
  const room = useRoomContext()
  const connectionState = useConnectionState()
  const remoteParticipants = useRemoteParticipants()
  const agent = remoteParticipants.find((p) => p.identity.startsWith("agent-"))
  const [transcript, setTranscript] = useState<string[]>([])
  const [isListening, setIsListening] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Update debug info when connection state changes
  useEffect(() => {
    setDebugInfo(`Connection state: ${connectionState}`)
  }, [connectionState, setDebugInfo])

  // Update debug info when participants change
  useEffect(() => {
    setDebugInfo(`Participants: ${remoteParticipants.length} (Agent: ${agent ? "Yes" : "No"})`)
  }, [remoteParticipants, agent, setDebugInfo])

  // Handle agent state changes
  useEffect(() => {
    if (!agent) {
      setAgentState("connecting")
      return
    }

    const handleMetadataChanged = () => {
      try {
        if (!agent.metadata) return
        const metadata = JSON.parse(agent.metadata)
        if (metadata.state) {
          setAgentState(metadata.state as AgentState)
          setDebugInfo(`Agent state: ${metadata.state}`)
        }
      } catch (e) {
        console.error("Failed to parse agent metadata", e)
        setDebugInfo(`Metadata error: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    handleMetadataChanged()
    agent.on(ParticipantEvent.MetadataChanged, handleMetadataChanged)

    return () => {
      agent.off(ParticipantEvent.MetadataChanged, handleMetadataChanged)
    }
  }, [agent, setAgentState, setDebugInfo])

  // Handle agent messages
  useEffect(() => {
    if (!agent) return

    const handleDataReceived = (data: Uint8Array, _: RemoteParticipant) => {
      try {
        const decodedData = new TextDecoder().decode(data)
        const parsedData = JSON.parse(decodedData)

        if (parsedData.type === "transcript") {
          setTranscript((prev) => [...prev, parsedData.text])
          setDebugInfo(`Received transcript: ${parsedData.text.substring(0, 20)}...`)

          // Scroll to bottom
          if (contentRef.current) {
            setTimeout(() => {
              if (contentRef.current) {
                contentRef.current.scrollTop = contentRef.current.scrollHeight
              }
            }, 100)
          }
        }
      } catch (e) {
        console.error("Failed to parse data message", e)
        setDebugInfo(`Data error: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    room.on(RoomEvent.DataReceived, handleDataReceived)

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived)
    }
  }, [room, agent, setDebugInfo])

  // Toggle microphone
  const toggleMicrophone = async () => {
    try {
      if (isListening) {
        await room.localParticipant.setMicrophoneEnabled(false)
        setIsListening(false)
        setDebugInfo("Microphone disabled")
      } else {
        await room.localParticipant.setMicrophoneEnabled(true)
        setIsListening(true)
        setDebugInfo("Microphone enabled")
      }
    } catch (e) {
      console.error("Failed to toggle microphone", e)
      setDebugInfo(`Mic error: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // Fallback UI if no connection
  if (connectionState !== "connected") {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#121212] p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-white text-center">Connecting to LiveKit...</p>
        <p className="text-xs text-gray-500 mt-2 text-center">Status: {connectionState}</p>
        <p className="text-xs text-gray-500 mt-1 text-center">
          {remoteParticipants.length > 0
            ? `${remoteParticipants.length} participants connected`
            : "No participants connected yet"}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#121212]">
      <div ref={contentRef} className="flex-1 p-4 overflow-y-auto">
        {transcript.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-center">Start speaking to interact with the AI assistant</p>
            <p className="text-xs text-gray-500 mt-4">
              Connection status: {connectionState}
              <br />
              Agent connected: {agent ? "Yes" : "No"}
              <br />
              Agent state: {agentState}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transcript.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg max-w-[80%] ${index % 2 === 0 ? "bg-blue-600 ml-auto" : "bg-[#2A2A2A]"}`}
              >
                <p className="text-white">{message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-[#1E1E1E] flex items-center justify-center">
        <button
          onClick={toggleMicrophone}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isListening ? "bg-red-600" : "bg-blue-600"
          }`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z"
              fill="white"
            />
            <path
              d="M17.91 11C17.91 11.41 17.87 11.8 17.82 12.18C17.72 12.9 18.26 13.5 18.98 13.5H19.04C19.56 13.5 20 13.07 20.1 12.56C20.16 12.12 20.2 11.66 20.2 11.19C20.2 7.09 17.11 3.72 13.17 3.08C12.64 2.99 12.1 3.37 12.1 3.91V4.14C12.1 4.6 12.43 4.98 12.89 5.06C15.9 5.58 18.21 8.06 18.21 11H17.91Z"
              fill="white"
            />
            <path
              d="M4.09 11C4.09 8.06 6.4 5.58 9.41 5.06C9.87 4.98 10.2 4.6 10.2 4.14V3.91C10.2 3.37 9.66 2.99 9.13 3.08C5.19 3.72 2.1 7.09 2.1 11.19C2.1 11.66 2.14 12.12 2.2 12.56C2.3 13.07 2.74 13.5 3.26 13.5H3.32C4.04 13.5 4.58 12.9 4.48 12.18C4.43 11.8 4.39 11.41 4.39 11H4.09Z"
              fill="white"
            />
            <path d="M12 22C14.2091 22 16 20.2091 16 18H8C8 20.2091 9.79086 22 12 22Z" fill="white" />
          </svg>
        </button>

        <div className="ml-4 text-white text-sm">
          {agentState === "connecting" && "Connecting..."}
          {agentState === "listening" && "Listening..."}
          {agentState === "thinking" && "Thinking..."}
          {agentState === "speaking" && "Speaking..."}
          {agentState === "error" && "Error"}
        </div>
      </div>
    </div>
  )
}


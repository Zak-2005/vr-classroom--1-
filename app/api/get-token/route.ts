import { AccessToken } from "livekit-server-sdk"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { roomName, participantName } = body

    if (!roomName || !participantName) {
      return NextResponse.json({ error: "Missing roomName or participantName" }, { status: 400 })
    }

    // Use environment variables or fallback to the provided values
    const apiKey = process.env.LIVEKIT_API_KEY || "APIzpusYcunBM9Y"
    const apiSecret = process.env.LIVEKIT_API_SECRET || "dNj7eGg7QJ5aEdVHnagwyyasngZtiFjszBkesdg6wwh"

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: "Server misconfigured - missing API key or secret" }, { status: 500 })
    }

    // Create the access token with appropriate permissions
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
    })

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    const token = at.toJwt()

    return NextResponse.json({
      token,
      debug: {
        roomName,
        participantName,
        apiKeyLength: apiKey.length,
        apiSecretLength: apiSecret.length,
      },
    })
  } catch (error) {
    console.error("Error generating token:", error)
    return NextResponse.json(
      {
        error: "Failed to generate token",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}


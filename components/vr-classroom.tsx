"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer"
import { VRButton } from "three/examples/jsm/webxr/VRButton"
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory"
import AIAssistantCharacter from "./ai-assistant-character"

interface VRClassroomProps {
  videoId: string
}

export default function VRClassroom({ videoId }: VRClassroomProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const youtubeRef = useRef<HTMLDivElement>(null)
  const [isVRSupported, setIsVRSupported] = useState(false)
  const [isInVR, setIsInVR] = useState(false)
  const [videoTitle, setVideoTitle] = useState("YouTube Video")
  const [videoThumbnail, setVideoThumbnail] = useState("")
  const [ambientSound, setAmbientSound] = useState<HTMLAudioElement | null>(null)

  // Fetch video info when videoId changes
  useEffect(() => {
    // For the direct MP4 video, we'll use a simple title
    setVideoTitle("Educational Video")
    setVideoThumbnail("/placeholder.svg?height=720&width=1280&text=RickRoll")

    // Create ambient rainforest sounds
    const audio = new Audio("/sounds/rainforest-ambient.mp3")
    audio.loop = true
    audio.volume = 0.3
    setAmbientSound(audio)

    return () => {
      if (ambientSound) {
        ambientSound.pause()
        ambientSound.currentTime = 0
      }
    }
  }, [videoId])

  useEffect(() => {
    if (!containerRef.current) return

    // Play ambient sounds
    if (ambientSound) {
      ambientSound.play().catch((err) => console.log("Audio autoplay prevented:", err))
    }

    // Check if WebXR is supported
    const checkXRSupport = async () => {
      try {
        if ("xr" in navigator) {
          const isSupported = await (navigator as any).xr?.isSessionSupported("immersive-vr")
          setIsVRSupported(isSupported || false)
        } else {
          setIsVRSupported(false)
        }
      } catch (error) {
        console.warn("WebXR support check failed:", error)
        setIsVRSupported(false)
      }
    }

    checkXRSupport()

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a380a) // Dark green background for rainforest

    // Fog to create depth in the rainforest
    scene.fog = new THREE.FogExp2(0x0a380a, 0.02)

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 1.6, 3) // Position camera at human eye level

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.outputEncoding = THREE.sRGBEncoding
    containerRef.current.appendChild(renderer.domElement)

    // CSS3D Renderer for YouTube iframe and AI Assistant (only used in non-VR mode)
    const css3DRenderer = new CSS3DRenderer()
    css3DRenderer.setSize(window.innerWidth, window.innerHeight)
    css3DRenderer.domElement.style.position = "absolute"
    css3DRenderer.domElement.style.top = "0"
    css3DRenderer.domElement.style.pointerEvents = "none" // Allow click-through except for iframe
    containerRef.current.appendChild(css3DRenderer.domElement)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 1.6, 0)
    controls.update()

    // WebXR setup
    renderer.xr.enabled = true

    // Track VR session state
    renderer.xr.addEventListener("sessionstart", () => {
      setIsInVR(true)
      console.log("VR session started")

      // Hide CSS3D elements when in VR
      css3DRenderer.domElement.style.display = "none"
    })

    renderer.xr.addEventListener("sessionend", () => {
      setIsInVR(false)
      console.log("VR session ended")

      // Show CSS3D elements when exiting VR
      css3DRenderer.domElement.style.display = "block"
    })

    let vrButton: HTMLElement

    try {
      vrButton = VRButton.createButton(renderer)
      containerRef.current.appendChild(vrButton)
    } catch (error) {
      console.warn("Failed to create VR button:", error)
      // Create a disabled button as fallback
      vrButton = document.createElement("button")
      vrButton.textContent = "VR NOT AVAILABLE"
      vrButton.style.cssText = `
        position: absolute;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        border: 1px solid #fff;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.1);
        color: #fff;
        font: normal 13px sans-serif;
        opacity: 0.5;
        cursor: not-allowed;
      `
      containerRef.current.appendChild(vrButton)
    }

    // VR Controllers
    const controller1 = renderer.xr.getController(0)
    controller1.addEventListener("selectstart", () => {
      const tempMatrix = new THREE.Matrix4()
      tempMatrix.identity().extractRotation(controller1.matrixWorld)

      raycaster.ray.origin.setFromMatrixPosition(controller1.matrixWorld)
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix)

      const intersects = raycaster.intersectObjects(scene.children, true)

      for (let i = 0; i < intersects.length; i++) {
        const object = intersects[i].object
        if (object.name === "vrScreen") {
          if (videoElement.paused) {
            videoElement.play()
          } else {
            videoElement.pause()
          }
          break
        }
      }
    })
    scene.add(controller1)

    const controller2 = renderer.xr.getController(1)
    scene.add(controller2)

    const controllerModelFactory = new XRControllerModelFactory()

    const controllerGrip1 = renderer.xr.getControllerGrip(0)
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1))
    scene.add(controllerGrip1)

    const controllerGrip2 = renderer.xr.getControllerGrip(1)
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2))
    scene.add(controllerGrip2)

    // Lighting for rainforest
    // Ambient light (dim to simulate forest shade)
    const ambientLight = new THREE.AmbientLight(0x90c090, 0.4)
    scene.add(ambientLight)

    // Directional light (simulating sun rays through canopy)
    const directionalLight = new THREE.DirectionalLight(0xffeedd, 0.8)
    directionalLight.position.set(1, 10, 1)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.camera.left = -20
    directionalLight.shadow.camera.right = 20
    directionalLight.shadow.camera.top = 20
    directionalLight.shadow.camera.bottom = -20
    scene.add(directionalLight)

    // Add some spotlights to create dappled light effect
    for (let i = 0; i < 10; i++) {
      const spotLight = new THREE.SpotLight(0xffffaa, 0.5, 20, Math.PI / 8, 0.5, 1)
      spotLight.position.set(Math.random() * 20 - 10, 5 + Math.random() * 5, Math.random() * 20 - 10)
      spotLight.castShadow = true
      spotLight.shadow.mapSize.width = 512
      spotLight.shadow.mapSize.height = 512
      scene.add(spotLight)
    }

    // Rainforest environment
    createRainforest(scene)

    // Video screen setup (tree stump with screen)
    const screenGroup = new THREE.Group()
    scene.add(screenGroup)

    // Tree stump base for the screen
    const stumpGeometry = new THREE.CylinderGeometry(1.2, 1.5, 1.2, 16)
    const stumpMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9,
    })
    const stump = new THREE.Mesh(stumpGeometry, stumpMaterial)
    stump.position.set(0, 0.6, -4)
    stump.castShadow = true
    stump.receiveShadow = true
    screenGroup.add(stump)

    // Moss on the stump
    const mossGeometry = new THREE.CylinderGeometry(1.21, 1.51, 0.1, 16)
    const mossMaterial = new THREE.MeshStandardMaterial({
      color: 0x2e8b57,
      roughness: 0.8,
    })
    const moss = new THREE.Mesh(mossGeometry, mossMaterial)
    moss.position.set(0, 1.15, -4)
    screenGroup.add(moss)

    // Screen frame (made of wood)
    const frameGeometry = new THREE.BoxGeometry(2.2, 1.3, 0.1)
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
    })
    const frame = new THREE.Mesh(frameGeometry, frameMaterial)
    frame.position.set(0, 2.2, -4)
    frame.castShadow = true
    screenGroup.add(frame)

    // Create video element for non-VR mode
    const videoElement = document.createElement("video")
    videoElement.style.width = "1920px"
    videoElement.style.height = "1080px"
    videoElement.style.border = "none"
    videoElement.src = "/videos/videoplayback.mp4"
    videoElement.controls = true
    videoElement.loop = true
    videoElement.crossOrigin = "anonymous"
    videoElement.playsInline = true
    videoElement.muted = false // Set to true if autoplay is needed

    // Create CSS3D object for the video (only visible in non-VR mode)
    const videoScreen = new CSS3DObject(videoElement)
    videoScreen.scale.set(0.001, 0.001, 0.001) // Scale down to match Three.js units
    videoScreen.position.set(0, 2.2, -3.95) // Position slightly in front of frame
    scene.add(videoScreen)

    // Create a texture-based screen for VR mode
    // This will be updated dynamically to mirror content
    const youtubeCanvas = document.createElement("canvas")
    youtubeCanvas.width = 1920
    youtubeCanvas.height = 1080
    const youtubeContext = youtubeCanvas.getContext("2d")

    // Create a texture from the canvas
    const youtubeTexture = new THREE.CanvasTexture(youtubeCanvas)
    const screenGeometry = new THREE.PlaneGeometry(2, 1.125)
    const screenMaterial = new THREE.MeshBasicMaterial({
      map: youtubeTexture,
      side: THREE.FrontSide,
    })
    const vrScreen = new THREE.Mesh(screenGeometry, screenMaterial)
    vrScreen.position.set(0, 2.2, -3.95)
    vrScreen.name = "vrScreen"
    scene.add(vrScreen)

    // Function to update video canvas texture for VR mode
    function updateVideoTexture() {
      if (!youtubeContext) return

      // If video is playing, draw the video to the canvas
      if (videoElement && !videoElement.paused) {
        youtubeContext.drawImage(videoElement, 0, 0, youtubeCanvas.width, youtubeCanvas.height)
      } else {
        // Clear canvas
        youtubeContext.fillStyle = "#000000"
        youtubeContext.fillRect(0, 0, youtubeCanvas.width, youtubeCanvas.height)

        // Draw video player interface
        // Title
        youtubeContext.fillStyle = "#FFFFFF"
        youtubeContext.font = "bold 48px Arial"
        youtubeContext.textAlign = "center"
        youtubeContext.fillText(videoTitle, youtubeCanvas.width / 2, 120)

        // Play button
        youtubeContext.beginPath()
        youtubeContext.arc(youtubeCanvas.width / 2, youtubeCanvas.height / 2, 80, 0, Math.PI * 2)
        youtubeContext.fillStyle = "rgba(255, 255, 255, 0.8)"
        youtubeContext.fill()

        youtubeContext.beginPath()
        youtubeContext.moveTo(youtubeCanvas.width / 2 - 30, youtubeCanvas.height / 2 - 40)
        youtubeContext.lineTo(youtubeCanvas.width / 2 - 30, youtubeCanvas.height / 2 + 40)
        youtubeContext.lineTo(youtubeCanvas.width / 2 + 50, youtubeCanvas.height / 2)
        youtubeContext.fillStyle = "#FF0000"
        youtubeContext.fill()
      }

      // Update the texture
      youtubeTexture.needsUpdate = true
    }

    // Voice Assistant Panel (non-VR mode)
    // Create a frame for the voice assistant (tree hollow)
    const hollowGeometry = new THREE.CylinderGeometry(1, 1, 2.5, 32, 1, true)
    const hollowMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9,
      side: THREE.DoubleSide,
    })
    const hollow = new THREE.Mesh(hollowGeometry, hollowMaterial)
    hollow.position.set(-3.5, 1.5, -3.5)
    hollow.rotation.y = Math.PI / 6 // Slight angle for better visibility
    scene.add(hollow)

    // Inner bark texture
    const innerHollowGeometry = new THREE.CylinderGeometry(0.9, 0.9, 2.5, 32, 1, true)
    const innerHollowMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.7,
      side: THREE.DoubleSide,
    })
    const innerHollow = new THREE.Mesh(innerHollowGeometry, innerHollowMaterial)
    innerHollow.position.set(-3.5, 1.5, -3.5)
    innerHollow.rotation.y = Math.PI / 6
    scene.add(innerHollow)

    // Create a VR-compatible version of the assistant panel using canvas
    const assistantCanvas = document.createElement("canvas")
    assistantCanvas.width = 600
    assistantCanvas.height = 800
    const assistantContext = assistantCanvas.getContext("2d")

    const assistantVRTexture = new THREE.CanvasTexture(assistantCanvas)
    const assistantVRMaterial = new THREE.MeshBasicMaterial({
      map: assistantVRTexture,
      side: THREE.FrontSide,
    })
    const assistantVRGeometry = new THREE.PlaneGeometry(1.5, 2)
    const assistantVRScreen = new THREE.Mesh(assistantVRGeometry, assistantVRMaterial)
    assistantVRScreen.position.set(-3.5, 1.5, -3.4)
    assistantVRScreen.rotation.y = Math.PI / 6
    scene.add(assistantVRScreen)

    // Function to update assistant canvas texture
    function updateAssistantTexture() {
      if (!assistantContext) return

      // Clear canvas
      assistantContext.fillStyle = "#000000"
      assistantContext.fillRect(0, 0, assistantCanvas.width, assistantCanvas.height)

      // Draw assistant interface
      // Header
      assistantContext.fillStyle = "#1E1E1E"
      assistantContext.fillRect(0, 0, assistantCanvas.width, 60)

      // Title
      assistantContext.fillStyle = "#FFFFFF"
      assistantContext.font = "bold 28px Arial"
      assistantContext.textAlign = "center"
      assistantContext.fillText("Voice Assistant", assistantCanvas.width / 2, 40)

      // Chat area
      assistantContext.fillStyle = "#121212"
      assistantContext.fillRect(0, 60, assistantCanvas.width, assistantCanvas.height - 140)

      // Message
      assistantContext.fillStyle = "#2A2A2A"
      assistantContext.fillRect(20, 80, assistantCanvas.width - 40, 120)
      assistantContext.fillStyle = "#FFFFFF"
      assistantContext.font = "18px Arial"
      assistantContext.textAlign = "center"
      assistantContext.fillText("Click the microphone button", assistantCanvas.width / 2, 130)
      assistantContext.fillText("in the bottom right corner", assistantCanvas.width / 2, 160)
      assistantContext.fillText("to interact with the AI Assistant", assistantCanvas.width / 2, 190)

      // Input area
      assistantContext.fillStyle = "#1E1E1E"
      assistantContext.fillRect(0, assistantCanvas.height - 80, assistantCanvas.width, 80)

      // Microphone button
      assistantContext.beginPath()
      assistantContext.arc(assistantCanvas.width / 2, assistantCanvas.height - 40, 30, 0, Math.PI * 2)
      assistantContext.fillStyle = "#0B57D0"
      assistantContext.fill()

      // Microphone icon
      assistantContext.fillStyle = "#FFFFFF"
      assistantContext.beginPath()
      assistantContext.roundRect(assistantCanvas.width / 2 - 5, assistantCanvas.height - 55, 10, 20, 5)
      assistantContext.fill()
      assistantContext.beginPath()
      assistantContext.arc(assistantCanvas.width / 2, assistantCanvas.height - 35, 15, 0, Math.PI, true)
      assistantContext.stroke()

      // Update the texture
      assistantVRTexture.needsUpdate = true
    }

    // Initial update
    updateAssistantTexture()

    // Add a title above the assistant (leaf sign)
    const titleCanvas = document.createElement("canvas")
    const titleContext = titleCanvas.getContext("2d")
    titleCanvas.width = 512
    titleCanvas.height = 128

    if (titleContext) {
      titleContext.fillStyle = "#006400"
      titleContext.fillRect(0, 0, titleCanvas.width, titleCanvas.height)

      // Add leaf texture to the sign
      titleContext.strokeStyle = "#004d00"
      titleContext.lineWidth = 2
      for (let i = 0; i < 10; i++) {
        titleContext.beginPath()
        titleContext.moveTo(Math.random() * titleCanvas.width, 0)
        titleContext.bezierCurveTo(
          Math.random() * titleCanvas.width,
          Math.random() * titleCanvas.height,
          Math.random() * titleCanvas.width,
          Math.random() * titleCanvas.height,
          Math.random() * titleCanvas.width,
          titleCanvas.height,
        )
        titleContext.stroke()
      }

      titleContext.font = "Bold 36px Arial"
      titleContext.fillStyle = "#FFFFFF"
      titleContext.textAlign = "center"
      titleContext.fillText("Voice Assistant", titleCanvas.width / 2, titleCanvas.height / 2)
    }

    const titleTexture = new THREE.CanvasTexture(titleCanvas)
    const titleMaterial = new THREE.MeshBasicMaterial({
      map: titleTexture,
      transparent: true,
      side: THREE.DoubleSide,
    })
    const titleGeometry = new THREE.PlaneGeometry(1.5, 0.375)
    const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial)
    titleMesh.position.set(-3.5, 2.8, -3.5)
    titleMesh.rotation.y = Math.PI / 6 // Match hollow rotation
    scene.add(titleMesh)

    // Raycaster for interaction
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      css3DRenderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", handleResize)

    // Handle mouse click for interactions
    const handleClick = (event: MouseEvent) => {
      // Calculate mouse position in normalized device coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

      // Update the raycaster
      raycaster.setFromCamera(mouse, camera)

      // Check for intersections with interactive objects
      const intersects = raycaster.intersectObjects(scene.children, true)

      for (let i = 0; i < intersects.length; i++) {
        const object = intersects[i].object

        // Video screen interaction
        if (object.name === "vrScreen") {
          if (!isInVR) {
            // Allow pointer events on the video when clicked in desktop mode
            css3DRenderer.domElement.style.pointerEvents = "auto"

            // Reset pointer events after a short delay to allow for interaction
            setTimeout(() => {
              css3DRenderer.domElement.style.pointerEvents = "none"
            }, 5000)
          } else {
            // In VR mode, toggle video playback
            if (videoElement.paused) {
              videoElement.play()
            } else {
              videoElement.pause()
            }
          }
          break
        }
      }
    }

    window.addEventListener("click", handleClick)

    // Animation loop with dynamic texture updates
    const animate = () => {
      renderer.setAnimationLoop(() => {
        controls.update()

        // Update textures when in VR mode
        if (renderer.xr.isPresenting) {
          updateVideoTexture()
          updateAssistantTexture()
        }

        // Only render CSS3D when not in VR mode
        if (!renderer.xr.isPresenting) {
          css3DRenderer.render(scene, camera)
        }

        renderer.render(scene, camera)
      })
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("click", handleClick)
      renderer.setAnimationLoop(null)

      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
        containerRef.current.removeChild(css3DRenderer.domElement)
        if (vrButton && vrButton.parentNode) {
          vrButton.parentNode.removeChild(vrButton)
        }
      }
    }
  }, [videoId, videoTitle, videoThumbnail, ambientSound])

  // Function to create rainforest environment
  function createRainforest(scene: THREE.Scene) {
    // Forest floor
    const floorGeometry = new THREE.CircleGeometry(30, 32)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x553311,
      roughness: 0.9,
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    // Add some ground details (leaves, twigs, etc)
    const detailsGeometry = new THREE.PlaneGeometry(60, 60)
    const detailsMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d1e0f,
      roughness: 1.0,
      metalness: 0.0,
      transparent: true,
      alphaMap: createNoiseTexture(512, 512, 0.3),
      side: THREE.DoubleSide,
    })
    const details = new THREE.Mesh(detailsGeometry, detailsMaterial)
    details.rotation.x = -Math.PI / 2
    details.position.y = 0.01
    scene.add(details)

    // Sky dome (canopy)
    const skyGeometry = new THREE.SphereGeometry(40, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2)
    const skyMaterial = new THREE.MeshStandardMaterial({
      color: 0x88aa44,
      side: THREE.BackSide,
      roughness: 1.0,
    })
    const sky = new THREE.Mesh(skyGeometry, skyMaterial)
    sky.position.y = 0
    scene.add(sky)

    // Add trees
    for (let i = 0; i < 50; i++) {
      const treeGroup = new THREE.Group()

      // Random position, avoiding the center area
      let x, z
      do {
        x = Math.random() * 50 - 25
        z = Math.random() * 50 - 25
      } while (Math.sqrt(x * x + z * z) < 8) // Keep trees away from center

      treeGroup.position.set(x, 0, z)

      // Tree trunk
      const trunkHeight = 5 + Math.random() * 10
      const trunkGeometry = new THREE.CylinderGeometry(
        0.3 + Math.random() * 0.3,
        0.5 + Math.random() * 0.5,
        trunkHeight,
        8,
      )
      const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.9,
      })
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
      trunk.position.y = trunkHeight / 2
      trunk.castShadow = true
      trunk.receiveShadow = true
      treeGroup.add(trunk)

      // Tree foliage (multiple layers for more realistic canopy)
      const foliageSize = 2 + Math.random() * 3
      const foliageGeometry = new THREE.SphereGeometry(foliageSize, 8, 8)
      const foliageMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0.1 + Math.random() * 0.2, 0.5 + Math.random() * 0.3, 0.1 + Math.random() * 0.1),
        roughness: 1.0,
      })

      // Add multiple foliage clusters
      for (let j = 0; j < 3 + Math.floor(Math.random() * 3); j++) {
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial)
        foliage.position.y = trunkHeight - 1 + Math.random() * 2
        foliage.position.x = Math.random() * 2 - 1
        foliage.position.z = Math.random() * 2 - 1
        foliage.castShadow = true
        treeGroup.add(foliage)
      }

      scene.add(treeGroup)
    }

    // Add some bushes and undergrowth
    for (let i = 0; i < 100; i++) {
      const bushGroup = new THREE.Group()

      // Random position
      let x, z
      do {
        x = Math.random() * 40 - 20
        z = Math.random() * 40 - 20
      } while (Math.sqrt(x * x + z * z) < 6) // Keep bushes away from center

      bushGroup.position.set(x, 0, z)

      // Bush foliage
      const bushSize = 0.5 + Math.random() * 1
      const bushGeometry = new THREE.SphereGeometry(bushSize, 8, 8)
      const bushMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0.1 + Math.random() * 0.2, 0.4 + Math.random() * 0.4, 0.1 + Math.random() * 0.1),
        roughness: 1.0,
      })

      // Add multiple foliage clusters for each bush
      for (let j = 0; j < 2 + Math.floor(Math.random() * 3); j++) {
        const foliage = new THREE.Mesh(bushGeometry, bushMaterial)
        foliage.position.y = bushSize * 0.7
        foliage.position.x = Math.random() * 0.5 - 0.25
        foliage.position.z = Math.random() * 0.5 - 0.25
        foliage.castShadow = true
        bushGroup.add(foliage)
      }

      scene.add(bushGroup)
    }

    // Add some vines hanging from above
    for (let i = 0; i < 30; i++) {
      const vineGroup = new THREE.Group()

      // Random position
      const x = Math.random() * 40 - 20
      const z = Math.random() * 40 - 20
      const y = 5 + Math.random() * 10

      vineGroup.position.set(x, y, z)

      // Create a curved vine
      const vinePoints = []
      const segments = 10 + Math.floor(Math.random() * 10)
      const vineLength = 3 + Math.random() * 5

      for (let j = 0; j <= segments; j++) {
        const t = j / segments
        const xPos = Math.sin(t * Math.PI * 2) * 0.5
        const yPos = -t * vineLength
        const zPos = Math.cos(t * Math.PI * 2) * 0.5
        vinePoints.push(new THREE.Vector3(xPos, yPos, zPos))
      }

      const vineCurve = new THREE.CatmullRomCurve3(vinePoints)
      const vineGeometry = new THREE.TubeGeometry(vineCurve, segments, 0.05, 8, false)
      const vineMaterial = new THREE.MeshStandardMaterial({
        color: 0x2e8b57,
        roughness: 0.8,
      })

      const vine = new THREE.Mesh(vineGeometry, vineMaterial)
      vine.castShadow = true
      vineGroup.add(vine)

      scene.add(vineGroup)
    }

    // Add some rocks
    for (let i = 0; i < 20; i++) {
      const rockGroup = new THREE.Group()

      // Random position
      let x, z
      do {
        x = Math.random() * 40 - 20
        z = Math.random() * 40 - 20
      } while (Math.sqrt(x * x + z * z) < 7) // Keep rocks away from center

      rockGroup.position.set(x, 0, z)

      // Create irregular rock
      const rockGeometry = new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.5, 0)
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.9,
      })

      const rock = new THREE.Mesh(rockGeometry, rockMaterial)
      rock.position.y = 0.25
      rock.rotation.x = Math.random() * Math.PI
      rock.rotation.y = Math.random() * Math.PI
      rock.rotation.z = Math.random() * Math.PI
      rock.scale.set(1 + Math.random() * 0.5, 0.8 + Math.random() * 0.4, 1 + Math.random() * 0.5)
      rock.castShadow = true
      rock.receiveShadow = true
      rockGroup.add(rock)

      scene.add(rockGroup)
    }

    // Add a small stream/pond
    const pondGeometry = new THREE.CircleGeometry(3, 32)
    const pondMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e90ff,
      transparent: true,
      opacity: 0.7,
      roughness: 0.2,
    })
    const pond = new THREE.Mesh(pondGeometry, pondMaterial)
    pond.rotation.x = -Math.PI / 2
    pond.position.set(8, 0.05, -8)
    scene.add(pond)

    // Add some flowers
    for (let i = 0; i < 50; i++) {
      const flowerGroup = new THREE.Group()

      // Random position
      let x, z
      do {
        x = Math.random() * 40 - 20
        z = Math.random() * 40 - 20
      } while (Math.sqrt(x * x + z * z) < 6) // Keep flowers away from center

      flowerGroup.position.set(x, 0, z)

      // Stem
      const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8)
      const stemMaterial = new THREE.MeshStandardMaterial({
        color: 0x228b22,
        roughness: 0.8,
      })
      const stem = new THREE.Mesh(stemGeometry, stemMaterial)
      stem.position.y = 0.25
      flowerGroup.add(stem)

      // Flower
      const petalGeometry = new THREE.CircleGeometry(0.1, 8)
      const petalMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0.8 + Math.random() * 0.2, Math.random() * 0.8, Math.random() * 0.8),
        side: THREE.DoubleSide,
        roughness: 0.8,
      })

      // Create petals
      for (let j = 0; j < 6; j++) {
        const petal = new THREE.Mesh(petalGeometry, petalMaterial)
        petal.position.y = 0.5
        petal.rotation.y = (j * Math.PI) / 3
        petal.rotation.x = Math.PI / 4
        flowerGroup.add(petal)
      }

      scene.add(flowerGroup)
    }

    // Add some butterflies (animated particles)
    const butterflyGeometry = new THREE.BufferGeometry()
    const butterflyPositions = []
    const butterflyColors = []

    for (let i = 0; i < 30; i++) {
      // Random position
      const x = Math.random() * 40 - 20
      const y = 1 + Math.random() * 5
      const z = Math.random() * 40 - 20

      butterflyPositions.push(x, y, z)

      // Random color
      const r = 0.5 + Math.random() * 0.5
      const g = 0.5 + Math.random() * 0.5
      const b = 0.5 + Math.random() * 0.5

      butterflyColors.push(r, g, b)
    }

    butterflyGeometry.setAttribute("position", new THREE.Float32BufferAttribute(butterflyPositions, 3))
    butterflyGeometry.setAttribute("color", new THREE.Float32BufferAttribute(butterflyColors, 3))

    const butterflyMaterial = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    })

    const butterflies = new THREE.Points(butterflyGeometry, butterflyMaterial)
    scene.add(butterflies)
  }

  // Helper function to create noise texture
  function createNoiseTexture(width: number, height: number, alpha: number) {
    const size = width * height
    const data = new Uint8Array(4 * size)

    for (let i = 0; i < size; i++) {
      const stride = i * 4
      const noise = Math.random() * 255

      data[stride] = noise
      data[stride + 1] = noise
      data[stride + 2] = noise
      data[stride + 3] = Math.random() < alpha ? 255 : 0
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat)
    texture.needsUpdate = true
    return texture
  }

  // Hidden divs for off-screen rendering
  return (
    <div className="relative h-full w-full" ref={containerRef}>
      {/* Off-screen elements for content mirroring */}
      <div
        ref={youtubeRef}
        className="fixed opacity-0 pointer-events-none"
        style={{ width: "1920px", height: "1080px", position: "absolute", left: "-9999px" }}
      >
        <div className="bg-black w-full h-full flex flex-col">
          <div className="bg-red-600 h-12 flex items-center px-4">
            <span className="text-white font-bold text-xl">YouTube</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <h2 className="text-white text-2xl font-bold mb-4">{videoTitle}</h2>
            <div className="relative">
              <img
                src={videoThumbnail || "/placeholder.svg?height=720&width=1280"}
                alt="Video thumbnail"
                className="w-[640px] h-[360px] object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center">
                  <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-red-600 ml-1"></div>
                </div>
              </div>
            </div>
            <div className="w-[640px] h-2 bg-gray-700 mt-4">
              <div className="h-full bg-red-600 w-1/3"></div>
            </div>
            <div className="w-[640px] flex justify-between mt-2">
              <span className="text-white">1:23 / 4:56</span>
              <div className="flex space-x-4">
                <span className="text-white">HD</span>
                <span className="text-white">CC</span>
                <span className="text-white">Settings</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UI elements */}
      {!isVRSupported && (
        <div className="absolute bottom-4 left-4 z-10 rounded bg-red-600 p-2 text-white">
          <p>WebXR VR not supported in your browser or environment</p>
          <p className="text-xs mt-1">You can still explore in non-VR mode</p>
        </div>
      )}
      <div className="absolute top-4 left-4 z-10 bg-black/50 p-2 text-white rounded">
        <p className="text-sm">Controls: Click and drag to look around</p>
        <p className="text-xs mt-1">Click on the screen to interact with the video</p>
        <p className="text-xs mt-1">VR Mode: Content is mirrored as textures for compatibility</p>
      </div>
      <AIAssistantCharacter />
    </div>
  )
}


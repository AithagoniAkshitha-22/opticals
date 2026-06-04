import { Router, Request, Response } from "express"
import admin from "../lib/firebaseAdmin"

const router = Router()

// Verify Firebase ID token and check if user exists in Firebase
// This is called right after Google sign-in to confirm the user is pre-registered
router.post("/verify", async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body
    if (!idToken) {
      res.status(400).json({ success: false, error: "ID token required" })
      return
    }

    // Verify the token
    const decoded = await admin.auth().verifyIdToken(idToken)

    // Check if the user was newly created (not pre-registered)
    // Firebase sets creation time — if created within the last 10 seconds, it's a new sign-up
    const user = await admin.auth().getUser(decoded.uid)
    const createdAt = new Date(user.metadata.creationTime).getTime()
    const now = Date.now()
    const isNewUser = now - createdAt < 10000 // created less than 10 seconds ago

    if (isNewUser) {
      // Delete the auto-created user immediately
      await admin.auth().deleteUser(decoded.uid)
      res.status(403).json({ success: false, error: "Access denied. Your account is not authorized." })
      return
    }

    res.status(200).json({ success: true, email: decoded.email, uid: decoded.uid })
  } catch (err: any) {
    console.error("Auth verify error:", err)
    res.status(401).json({ success: false, error: "Invalid or expired token" })
  }
})

export default router

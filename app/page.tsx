// app/page.tsx
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import Navbar from '@/components/layout/Navbar'
import { Hero } from "@/components/layout/Hero"

export default async function Page() {
  const { userId } = await auth()

  let buttonText = "Create a workspace"
  let buttonHref = "/sign-in"

  if (userId) {
    await connectDB()
    const user = await User.findOne({ clerkId: userId }).lean() as any

    if (!user) {
      // first-time sign-in, no User doc created yet
      buttonText = "Create a workspace"
      buttonHref = "/join"
    } else if (user.lastWorkspaceUrl) {
      // returning user, has a workspace
      buttonText = "Open app"
      buttonHref = `/${user.lastWorkspaceUrl}/inbox`
    } else {
      // signed in, User doc exists, but no workspace yet
      buttonText = "Create a workspace"
      buttonHref = "/join"
    }
  }


  return (
    <div className='flex'>
      <Navbar />
      <Hero
        illustrationSrc="https://tally.so/images/demo/v2/roll-up-sleeves.png"
        illustrationAlt="A creative sketch of a person using a computer"
        title="Build your workspace for free"
        description="Create workspaces, build teams, assign issues, and manage projects — all in one place."
        buttonText={buttonText}
        buttonHref={buttonHref}
      />
    </div>
  )
}
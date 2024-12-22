import { auth } from '@/app/lib/auth'

export default async function StudentDashboard() {
  const session = await auth()
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">
        Welcome Student: {session?.user?.email}
      </h1>
    </div>
  )
} 
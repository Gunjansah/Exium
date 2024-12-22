import { auth } from '@/app/lib/auth'

export default async function TeacherDashboard() {
  const session = await auth()
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">
        Welcome Teacher: {session?.user?.email}
      </h1>
    </div>
  )
} 
'use client'

// Sample data - replace with real data from your backend
const subjects = [
  {
    id: 1,
    name: 'Data Structures',
    progress: 75,
    icon: '🔷'
  },
  {
    id: 2,
    name: 'System Design',
    progress: 45,
    icon: '🔶'
  },
  {
    id: 3,
    name: 'Web Security',
    progress: 90,
    icon: '🔸'
  },
  {
    id: 4,
    name: 'Cloud Computing',
    progress: 60,
    icon: '🔹'
  }
]

export default function HomeworkProgress() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Course Progress</h2>
        <div className="text-sm text-gray-500">
          Overall: 67%
        </div>
      </div>

      <div className="space-y-4">
        {subjects.map(subject => (
          <div key={subject.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span>{subject.icon}</span>
                <span className="font-medium">{subject.name}</span>
              </div>
              <span className="text-sm text-gray-600">{subject.progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${subject.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">12</div>
          <div className="text-sm text-gray-600">Assignments Completed</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">4</div>
          <div className="text-sm text-gray-600">Upcoming Deadlines</div>
        </div>
      </div>
    </div>
  )
} 
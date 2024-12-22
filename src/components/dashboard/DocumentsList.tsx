'use client'

import { FileText, FileCode, Download } from 'lucide-react'

// Sample data - replace with real data from your backend
const documents = [
  {
    id: 1,
    title: 'Algorithm Analysis Notes',
    type: 'pdf',
    date: '2024-03-10',
    size: '2.4 MB'
  },
  {
    id: 2,
    title: 'Practice Code Solutions',
    type: 'code',
    date: '2024-03-09',
    size: '156 KB'
  },
  {
    id: 3,
    title: 'System Design Patterns',
    type: 'pdf',
    date: '2024-03-08',
    size: '3.1 MB'
  }
]

export default function DocumentsList() {
  const getIcon = (type: string) => {
    switch (type) {
      case 'code':
        return <FileCode className="w-5 h-5 text-blue-600" />
      default:
        return <FileText className="w-5 h-5 text-blue-600" />
    }
  }

  return (
    <div className="space-y-2">
      {documents.map(doc => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <div className="flex items-center space-x-3">
            {getIcon(doc.type)}
            <div>
              <h4 className="text-sm font-medium text-gray-900">{doc.title}</h4>
              <p className="text-xs text-gray-500">
                {new Date(doc.date).toLocaleDateString()} • {doc.size}
              </p>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Download className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      ))}
    </div>
  )
} 
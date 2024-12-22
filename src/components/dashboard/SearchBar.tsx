'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

const BLOCKED_DOMAINS = [
  'chat.openai.com',
  'bard.google.com',
  'claude.ai',
  'copilot.microsoft.com'
]

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if the search query contains any blocked domains
    const containsBlockedDomain = BLOCKED_DOMAINS.some(domain => 
      searchQuery.toLowerCase().includes(domain)
    )

    if (containsBlockedDomain) {
      alert('Access to AI tools is not allowed during exams')
      return
    }

    // Construct Google search URL with restricted sites
    const restrictedSearch = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`
    window.open(restrictedSearch, '_blank', 'noopener,noreferrer')
  }

  return (
    <form onSubmit={handleSearch} className="relative">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search on Google..."
        className="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
    </form>
  )
} 
import Link from 'next/link'
import { Twitter, GitlabIcon as GitHub, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          <Link href="https://x.com/mandipadk7" target="_blank" className="text-gray-500 hover:text-gray-500">
            <span className="sr-only">Twitter</span>
            <Twitter className="h-6 w-6" aria-hidden="true" />
          </Link>
          <Link href="https://github.com/Gunjansah/Exium" target="_blank" className="text-gray-500 hover:text-gray-500">
            <span className="sr-only">GitHub</span>
            <GitHub className="h-6 w-6" aria-hidden="true" />
          </Link>
          <Link href="https://www.linkedin.com/in/gunjansahnp/" target="_blank" className="text-gray-500 hover:text-gray-500">
            <span className="sr-only">LinkedIn</span>
            <Linkedin className="h-6 w-6" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-8 md:mt-0 md:order-1">
          <p className="text-center text-base text-gray-500">&copy; 2024 Exium, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}


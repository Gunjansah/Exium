import Link from 'next/link'

export default function Hero() {
  return (
    <div className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <svg
            className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
            fill="currentColor"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polygon points="50,0 100,0 50,100 0,100" />
          </svg>

          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Secure Code Exams for</span>{' '}
                <span className="block text-indigo-600 xl:inline">Modern Education</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-auto">
                Revolutionize your computer science exams with state-of-the-art security and an intuitive interface. Ensure academic integrity effortlessly.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link
                    href="#"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                  >
                    Get started
                  </Link>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <Link
                    href="#"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10"
                  >
                    Live demo
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <svg
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
            viewBox="0 0 1200 800"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: 'relative', top: '50px' }}
          >
            <defs>
              <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#4F46E5', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#7C3AED', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <rect width="1200" height="800" fill="url(#bgGradient)" />
            {/* Code Editor */}
            <rect x="100" y="100" width="1000" height="600" rx="10" fill="#1E1E1E" />
            {/* Editor Header */}
            <rect x="100" y="100" width="1000" height="40" rx="10" fill="#2D2D2D" />
            <circle cx="130" cy="120" r="6" fill="#FF5F56" />
            <circle cx="150" cy="120" r="6" fill="#FFBD2E" />
            <circle cx="170" cy="120" r="6" fill="#27C93F" />
            {/* Code Lines */}
            <text x="120" y="180" fill="#9CDCFE" fontSize="14">import</text>
            <text x="180" y="180" fill="#C586C0" fontSize="14">{'{'}</text>
            <text x="200" y="180" fill="#4EC9B0" fontSize="14">SecureExam</text>
            <text x="300" y="180" fill="#C586C0" fontSize="14">{'}'}</text>
            <text x="320" y="180" fill="#9CDCFE" fontSize="14">from</text>
            <text x="370" y="180" fill="#CE9178" fontSize="14">'exium'</text>
            <text x="120" y="220" fill="#569CD6" fontSize="14">const</text>
            <text x="170" y="220" fill="#4FC1FF" fontSize="14">exam</text>
            <text x="220" y="220" fill="#D4D4D4" fontSize="14">=</text>
            <text x="240" y="220" fill="#569CD6" fontSize="14">new</text>
            <text x="280" y="220" fill="#4EC9B0" fontSize="14">SecureExam</text>
            <text x="380" y="220" fill="#D4D4D4" fontSize="14">({'{'}</text>
            <text x="140" y="260" fill="#9CDCFE" fontSize="14">title:</text>
            <text x="200" y="260" fill="#CE9178" fontSize="14">'Advanced Algorithms'</text>
            <text x="120" y="300" fill="#D4D4D4" fontSize="14">{'}'})</text>
            <text x="120" y="340" fill="#569CD6" fontSize="14">await</text>
            <text x="170" y="340" fill="#4FC1FF" fontSize="14">exam</text>
            <text x="220" y="340" fill="#D4D4D4" fontSize="14">.</text>
            <text x="230" y="340" fill="#DCDCAA" fontSize="14">start()</text>
            {/* Cursor */}
            <rect x="120" y="360" width="10" height="20" fill="#AEAFAD">
              <animate
                attributeName="opacity"
                values="0;1;0"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </rect>
          </svg>
        </div>
      </div>
    </div>
  )
}

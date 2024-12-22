import { Shield, Lock, Eye, Code } from 'lucide-react'

const features = [
  {
    name: 'Advanced Proctoring',
    description: 'AI-powered monitoring to detect and prevent cheating attempts in real-time.',
    icon: Eye,
  },
  {
    name: 'Secure Environment',
    description: 'Locked-down browser environment to prevent access to unauthorized resources.',
    icon: Lock,
  },
  {
    name: 'Plagiarism Detection',
    description: 'Sophisticated algorithms to identify code similarities and potential plagiarism.',
    icon: Shield,
  },
  {
    name: 'Multiple Language Support',
    description: 'Support for various programming languages to suit different course requirements.',
    icon: Code,
  },
]

export default function Features() {
  return (
    <div className="py-12 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            A better way to conduct exams
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Exium offers advanced features to ensure the integrity of your coding exams.
          </p>
        </div>

        <div className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            {features.map((feature) => (
              <div key={feature.name} className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{feature.name}</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}


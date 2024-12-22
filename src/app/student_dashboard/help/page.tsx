'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, MessageCircle, Phone, Mail } from 'lucide-react'

const faqs = [
  {
    question: "How do I start an exam?",
    answer: "You can start an exam from your dashboard by clicking on the 'Start Exam' button next to the scheduled exam. Make sure you're ready before starting as some exams may have time limits."
  },
  {
    question: "What happens if I lose internet connection during an exam?",
    answer: "Our system automatically saves your progress every few seconds. If you lose connection, try to reconnect quickly. Your answers will be preserved, and you can continue from where you left off."
  },
  {
    question: "How can I submit a complaint about an exam?",
    answer: "You can submit exam-related complaints through the 'Contact Support' section below. Please include your exam ID and specific concerns in your message."
  },
  {
    question: "Can I review my past exams?",
    answer: "Yes, you can access your past exams and results from the 'Analytics' section in the dashboard sidebar. This includes detailed feedback from your teachers."
  },
  {
    question: "How do I update my profile information?",
    answer: "Go to 'Profile Settings' in the dashboard sidebar to update your personal information, change your password, or modify other account settings."
  }
]

export default function Help() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
  })

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'STUDENT') {
    router.push('/signin')
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Form submitted:', contactForm)
    // Reset form
    setContactForm({ subject: '', message: '' })
    // Show success message
    alert('Your message has been sent. We will get back to you soon.')
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Help Center</h1>

      {/* Quick Support Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center">
          <MessageCircle className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="font-semibold mb-2">Live Chat</h3>
          <p className="text-sm text-gray-600 mb-4">Chat with our support team</p>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Start Chat</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center">
          <Phone className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="font-semibold mb-2">Phone Support</h3>
          <p className="text-sm text-gray-600 mb-4">Call us for immediate help</p>
          <a href="tel:+1234567890" className="text-blue-600 hover:text-blue-700 text-sm font-medium">+1 (234) 567-890</a>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center">
          <Mail className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="font-semibold mb-2">Email Support</h3>
          <p className="text-sm text-gray-600 mb-4">Get help via email</p>
          <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-700 text-sm font-medium">support@example.com</a>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
              <button
                className="flex justify-between items-center w-full text-left"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <span className="font-medium">{faq.question}</span>
                {openFaq === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {openFaq === index && (
                <p className="mt-2 text-gray-600 text-sm">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6">Contact Support</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              value={contactForm.subject}
              onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              id="message"
              rows={4}
              value={contactForm.message}
              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  )
} 
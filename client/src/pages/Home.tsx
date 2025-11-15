import { Link } from 'react-router-dom'
import {
  Store,
  MapPin,
  CreditCard,
  BarChart3,
  Bell,
  Shield,
  Zap,
  Users,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Smartphone
} from 'lucide-react'

const Home = () => {
  const features = [
    {
      icon: MapPin,
      title: 'Zone & Space Management',
      description: 'Real-time tracking and management of market zones and spaces with instant availability updates.',
      color: 'bg-blue-500'
    },
    {
      icon: Users,
      title: 'Seller Registration',
      description: 'Streamlined digital onboarding process with automated space allocation for new sellers.',
      color: 'bg-green-500'
    },
    {
      icon: CreditCard,
      title: 'Integrated Payment System',
      description: 'Secure mobile money and digital payment options with instant receipts and automated reconciliation.',
      color: 'bg-purple-500'
    },
    {
      icon: BarChart3,
      title: 'Comprehensive Reporting',
      description: 'Automated daily, weekly, and monthly reports with analytics for better decision-making.',
      color: 'bg-orange-500'
    },
    {
      icon: Bell,
      title: 'Automated Notifications',
      description: 'Instant notifications for payments, allocations, and important announcements.',
      color: 'bg-pink-500'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with role-based access control and data protection.',
      color: 'bg-red-500'
    },
  ]

  const benefits = [
    {
      icon: Zap,
      title: 'Faster Operations',
      description: 'Reduce administrative overhead through automation of routine processes.'
    },
    {
      icon: TrendingUp,
      title: 'Better Revenue',
      description: 'Improve revenue collection via secure and trackable payment systems.'
    },
    {
      icon: Clock,
      title: 'Time Saving',
      description: 'Faster and more transparent seller onboarding process.'
    },
    {
      icon: Smartphone,
      title: 'Mobile Ready',
      description: 'Access your dashboard and manage operations from any device.'
    },
  ]

  const stats = [
    { number: '100%', label: 'Digital Transformation' },
    { number: '24/7', label: 'System Availability' },
    { number: '99.9%', label: 'Uptime Guarantee' },
    { number: '1000+', label: 'Active Users' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <nav className="nav">
        <div className="container">
          <div className="nav-inner">
            <Link to="/" className="brand">
              <div className="brand-icon">
                <Store className="w-7 h-7 text-white" />
              </div>
              <span className="brand-text">MARKET SPOTON</span>
            </Link>
            <div className="nav-actions">
              <Link to="/login" className="link-muted hidden sm:inline">Sign In</Link>
              <Link to="/register" className="btn-primary px-7 py-3">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      <header className="relative bg-hero grid-pattern overflow-hidden">
        <div className="container py-24 lg:py-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="hero-badge">
                <CheckCircle className="w-4 h-4 mr-2" />
                Digital Market Management Platform
              </div>
              <h1 className="hero-title">
                Transform Your Market
                <span className="hero-subtitle">Operations Today</span>
              </h1>
              <p className="hero-text">
                Streamline zone and space allocation, seller registration, payment processing, and reporting with our comprehensive, secure, and user-friendly digital market management system.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="btn-primary flex items-center justify-center">
                  Get Started Free
                  <ArrowRight className="ml-2 w-6 h-6" />
                </Link>
                <Link to="/login" className="btn-outline">Sign In</Link>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1521335629791-ce4aec03f73a?auto=format&fit=crop&w=1600&q=80"
                alt="Modern market management"
                className="w-full rounded-3xl shadow-2xl object-cover h-[420px] lg:h-[520px]"
                loading="lazy"
              />
              <div className="absolute -bottom-6 -left-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 flex items-center gap-4">
                <div className="bg-teal-500 w-10 h-10 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Instant Payments</div>
                  <div className="text-xs text-gray-600">Mobile money + receipts</div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 flex items-center gap-4">
                <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Secure Access</div>
                  <div className="text-xs text-gray-600">Role-based control</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="section">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="section-title">Powerful Features for Modern Markets</h2>
            <p className="section-subtext">
              Everything you need to manage your market efficiently, ensure compliance, and maximize revenue growth.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="card">
                  <div className={`card-icon ${feature.color}`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="card-title">{feature.title}</h3>
                  <p className="card-desc">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="benefits-section">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="section-title">Measurable Benefits of Going Digital</h2>
            <p className="section-subtext">Experience increased efficiency and clear returns on your investment.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="benefit-card">
                  <div className="benefit-icon">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="benefit-title">{benefit.title}</h3>
                  <p className="benefit-desc">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="gallery-section">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="gallery-title">In Action</h2>
            <p className="gallery-subtext">See how Market SpotOn looks and feels in real environments.</p>
          </div>
          <div className="gallery-grid">
            <img src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80" alt="Market aerial" className="gallery-image" loading="lazy" />
            <img src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80" alt="Seller onboarding" className="gallery-image" loading="lazy" />
            <img src="https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=80" alt="Payment confirmation" className="gallery-image" loading="lazy" />
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container text-center">
          <h2 className="cta-title">Ready to Transform Your Market?</h2>
          <p className="cta-text">Join thousands of market managers and sellers who are already using Market SpotOn to digitize and grow.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-white hover:bg-gray-100 text-teal-600 px-10 py-4 rounded-xl font-extrabold text-lg transition-all transform hover:scale-[1.02] shadow-xl">Start Free Trial</Link>
            <Link to="/login" className="btn-outline">Contact Sales</Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-10">
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center mb-4">
                <div className="footer-brand-icon">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-extrabold text-white">MARKET SPOTON</span>
              </Link>
              <p className="text-sm max-w-sm">The leading digital market management platform designed to streamline operations and boost efficiency for municipal and private markets.</p>
            </div>
            <div>
              <h4 className="footer-title">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="footer-link">Features</a></li>
                <li><a href="#" className="footer-link">Pricing</a></li>
                <li><a href="#" className="footer-link">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="footer-title">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="footer-link">About Us</a></li>
                <li><a href="#" className="footer-link">Careers</a></li>
                <li><a href="#" className="footer-link">Support Center</a></li>
              </ul>
            </div>
            <div>
              <h4 className="footer-title">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="footer-link">Privacy Policy</a></li>
                <li><a href="#" className="footer-link">Terms of Service</a></li>
                <li><a href="#" className="footer-link">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} Market SpotOn System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
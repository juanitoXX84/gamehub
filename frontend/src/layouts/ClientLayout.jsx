import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

export function ClientLayout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">{children}</main>
      <Footer />
    </div>
  )
}

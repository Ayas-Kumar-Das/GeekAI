import { Link } from 'react-router-dom'
import { ScanLine } from 'lucide-react'

export default function Brand() {
  return <Link className="geek-brand" to="/"><ScanLine size={25} strokeWidth={2.2} aria-hidden="true" /> GeekAI</Link>
}

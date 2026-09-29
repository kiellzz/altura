import logo from '../assets/logo.png'

interface BrandProps {
  inverse?: boolean
}

export function Brand({ inverse = false }: BrandProps) {
  return (
    <a className="brand" href="/" aria-label="Altura — início">
      <img src={logo} width="38" height="37" alt="" />
      <span className={inverse ? 'text-white' : 'text-navy-900'}>Altura</span>
    </a>
  )
}

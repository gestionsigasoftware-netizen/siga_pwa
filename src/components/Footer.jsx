export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="text-xs text-muted text-center pt-6 mt-auto">
      <p className="text-secondary">SIGAP — Sistema Integrado de Gestión y Analítica Pastoral</p>
      <p className="mt-1">© {year} IPUC. Todos los derechos reservados. · By Jormelia Soft</p>
    </footer>
  )
}

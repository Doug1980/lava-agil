/** Footer minimalista do admin: apenas a barra de copyright em navy. */
export function AdminFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#0e2148]">
      <p className="mx-auto max-w-3xl px-4 py-3 text-center text-[11px] text-blue-100/60">
        © {new Date().getFullYear()} LavaÁgil. Todos os direitos reservados.
      </p>
    </footer>
  );
}

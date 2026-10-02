// Janela que abre por cima da tela (usada nos formulários)
export default function Modal({
  titulo,
  fechar,
  children,
}: {
  titulo: string
  fechar: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button onClick={fechar} className="px-2 text-lg font-bold text-gray-500 hover:text-gray-800" title="Fechar">
            X
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

import { Header } from '@/components/layout/header'
import { FileExplorer } from '@/components/files/file-explorer'

export default function FilesPage() {
  return (
    <>
      <Header title="Fichiers" />
      <div className="p-4">
        <FileExplorer />
      </div>
    </>
  )
}

import { MigrationFileName } from './types'

export const parseFileName = (fileName: string): MigrationFileName => {
  const fileNameRegex = /^V([0-9]*)__([0-9a-zA-Z_]*)\.sql$/i
  const match = fileName.match(fileNameRegex)
  if (!match || !match[1] || !match[2]) {
    // TODO: 命名規則をエラー内容に含める
    throw new Error('The specified file violates the naming convention')
  }
  return { fileName, version: match[1], description: match[2].replace(/_/g, ' ') }
}

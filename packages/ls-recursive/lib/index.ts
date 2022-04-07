import path from 'path'
import fsPromises from 'fs/promises'

export const lsRecursive = async (directory: string): Promise<string[]> => {
  const files: string[] = []
  const dirents = await fsPromises.readdir(directory, { withFileTypes: true })

  for (const dirent of dirents) {
    const fp = path.join(directory, dirent.name)
    if (dirent.isDirectory()) {
      ;(await lsRecursive(fp)).forEach((cfp) => files.push(cfp))
    } else {
      files.push(fp)
    }
  }
  return files
}

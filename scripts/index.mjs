import { NotionAPI } from "notion-client"
import { renderNotionPage } from './render/renderToHtmlString.js'
// export declare type BlockType = 'page' | 'text' | 'bookmark' | 'bulleted_list' | 'numbered_list' | 'header' | 'sub_header' | 'sub_sub_header' | 'quote' | 'equation' | 'to_do' | 'table_of_contents' | 'divider' | 'column_list' | 'column' | 'callout' | 'toggle' | 'image' | 'embed' | 'gist' | 'video' | 'figma' | 'typeform' | 'codepen' | 'excalidraw' | 'tweet' | 'maps' | 'pdf' | 'audio' | 'drive' | 'file' | 'code' | 'collection_view' | 'collection_view_page' | 'transclusion_container' | 'transclusion_reference' | 'alias' | 'table' | 'table_row' | 'external_object_instance' | string;
import path from 'path'
import fs from 'fs'
import AdmZip from 'adm-zip'

// npm run run-backup blockids "3c2614e58cf64399b5b561e873ef61e5, 26c9e464186648c38160ed5b8e5a3277"

console.log('-----notion backup start-----', process.argv)
console.log('read notion block id from your cmd argv')

if (!process.argv[2]) {
  throw 'can not get notion block id!'
}

const blockIdArr = process.argv[2].split(',').map(id => id.trim())

console.log('this is notion block id you want to back up:\n')
console.log(blockIdArr)

const NC2 = new NotionAPI()

function pureBlockId(blockId) {
  return blockId.replaceAll('-', '')
}
async function backupNotionPage(parentDir = '', blockId) {
  const res2 = await NC2.getPage(blockId)
  // fs.writeFileSync(path.resolve(__dirname, '../log' + `/res${blockId}.json`), JSON.stringify(res2))
  // console.log({res2})
  const dirPath = `${parentDir}/${pureBlockId(blockId)}`
  fs.mkdirSync(dirPath, { recursive: true })
  const { htmlStr, childPages: childPagesId } = renderNotionPage(dirPath, res2, blockId)
  fs.writeFileSync(`${dirPath}/index.html`, htmlStr)
  // console.log(
  //   {
  //     blockId,
  //     childPagesId
  // })
  if (childPagesId.length > 0) {
    const childDir = `${dirPath}/childPages`
    fs.mkdirSync(childDir, { recursive: true })
    await Promise.all(
      childPagesId.map(id => {
        return backupNotionPage(childDir, id)
      })
    )
  }
  return blockId
}

const backupDir = path.resolve(__dirname, '../backup')

async function sendBackupZipToGithubRepo(backupDir) {
  const now = new Date()
  const zip = new AdmZip()
  zip.addLocalFolder(backupDir)
  fs.mkdirSync( path.resolve(__dirname, `../backupZip`))
  const zipPath = path.resolve(__dirname, `../backupZip/backup-notion-${now.getTime()}.zip`)
  zip.writeZip(zipPath)
}


Promise.allSettled(
  blockIdArr.map(id => {
    try {
      return backupNotionPage(backupDir, id)
    } catch (err) {
      return id
    }
  })
).then(resultArr => {
  console.log('backup done')
  const successIds = resultArr.filter(({ status, value }) => {
    return status === 'fulfilled'
  }).map(i => i.value)
  const failIds = []
  blockIdArr.forEach(id => {
    if (!successIds.includes(id)) {
      failIds.push(id)
    }
  })
  console.table([{
    'backup success block id': successIds,
    'backup failed block id': failIds
  }])
  sendBackupZipToGithubRepo(backupDir)
}).catch(err => {
  console.error('fail~~', err)
})


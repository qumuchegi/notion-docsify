import { NotionAPI } from "notion-client"
import { renderNotionPage } from './render/renderToHtmlString.js'
import path from 'path'
import fs from 'fs'
import AdmZip from 'adm-zip'

const localNotionStyleFileName = 'style/notion-render.css'

console.log('-----notion backup start-----', process.argv)
console.log('reading notion page id from your cmd argv ...')


if (!process.argv[2]) {
  throw 'can not get notion page id! please add notion page ids on github setting secret'
}
if (process.argv[3]) {
  throw 'can not get notion token! please add notion page ids on github setting secret'
}

// 测试 notion page id：917c1456eb6b472590f3611fb57b691c（子页面不是直接子页面，而是其他页面的链接）
const blockIdArr = process.argv[2].split(',').map(id => id.trim())
const notionToken = process.argv[3]
const exportFileType = 'html' // process.argv[3]

console.log('this is notion block id you want to back up:\n')
console.log(blockIdArr)

const NC = new NotionAPI({
  notionToken: notionToken
})

function pureBlockId(blockId) {
  return blockId.replaceAll('-', '')
}

let failPageIdArr = []
async function backupNotionPage(parentDir = '', blockId, dirDeep = 0) {
  let res
  try {
    res = await NC.getPage(blockId, { fetchCollections: true })
  } catch (err) {
    failPageIdArr.push(blockId.replaceAll('-', ''))
    throw 'page fetch error'
  }
  // blockId === '917c1456eb6b472590f3611fb57b691c' &&
  // fs.writeFileSync(path.resolve(__dirname, '../log' + `/res${blockId}.json`), JSON.stringify(res))
  // console.log({res})
  const dirPath = `${parentDir}/${pureBlockId(blockId)}`
  fs.mkdirSync(dirPath, { recursive: true })
  const notionRenderStylePath = '../'.repeat((Math.max(dirDeep, 0)) * 2 + 1) + localNotionStyleFileName
  const { str, childPages: childPagesId } = renderNotionPage(dirPath, res, blockId, exportFileType, notionRenderStylePath)
  fs.writeFileSync(`${dirPath}/index.${exportFileType}`, str)
  // console.log(
  //   {
  //     blockId,
  //     childPagesId
  // })

  if (childPagesId.length > 0) {
    // console.log({
    //   'childPagesId length': childPagesId.length,
    //   childPagesId
    // })
    const childDir = `${dirPath}/childPages`
    fs.mkdirSync(childDir, { recursive: true })
    await Promise.allSettled( // 不能用 Promise.all，不能因为有一个 page 解析失败而影响后面全部的 page
      childPagesId.map(id => {
        return backupNotionPage(childDir, id.replaceAll('-', ''), dirDeep + 1)
      })
    )
  }
  return blockId
}

const backupDir = path.resolve(__dirname, '../backup')

async function zipBackupDir() {
  const now = new Date()
  const zip = new AdmZip()
  fs.mkdirSync( path.resolve(__dirname, `../backupZip`))
  const zipPath = path.resolve(__dirname, `../backupZip/backup-notion-${now.getTime()}.zip`)
  zip.addLocalFolder(backupDir)
  zip.writeZip(zipPath)
}

// 复制 css 文件
fs.cpSync(
  path.resolve(__dirname, './style/notion-render.css'),
  backupDir + '/style/notion-render.css'
)

Promise.allSettled(
  blockIdArr.map(id => {
    try {
      return backupNotionPage(backupDir, id, 0)
    } catch (err) {
      console.log(err)
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
  failPageIdArr.length > 0 &&
  console.log(
    'these pages backup failed, they are probably removed from notion: \n',
    failPageIdArr,
    '\n',
    `you can try to visit notion page with these page id, take the first page id for example, like this: https://www.notion.so/${failPageIdArr[0]}`
  )
  zipBackupDir(backupDir)
}).catch(err => {
  console.error('fail~~', err)
})


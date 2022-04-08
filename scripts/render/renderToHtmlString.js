import React from 'react';
import { renderToString } from 'react-dom/server'
import { NotionRenderer, Equation, Collection, CollectionRow, Code } from 'react-notion-x'
import convertHtmlToMd from './convertHtmlToMd'

const CLASSNAME_REWRITE__NOTION_LINK = 'notion-link-rewrite-base-path'
const CHILD_BLOCK_TYPE = [
  'page'
]

/**
 notion block type:
 
 export declare type BlockType = 
  | 'page'
  | 'text'
  | 'bookmark'
  | 'bulleted_list'
  | 'numbered_list'
  | 'header'
  | 'sub_header'
  | 'sub_sub_header'
  | 'quote'
  | 'equation'
  | 'to_do'
  | 'table_of_contents'
  | 'divider'
  | 'column_list'
  | 'column'
  | 'callout'
  | 'toggle'
  | 'image'
  | 'embed'
  | 'gist'
  | 'video'
  | 'figma'
  | 'typeform'
  | 'codepen'
  | 'excalidraw'
  | 'tweet'
  | 'maps'
  | 'pdf'
  | 'audio'
  | 'drive'
  | 'file'
  | 'code'
  | 'collection_view'
  | 'collection_view_page'
  | 'transclusion_container'
  | 'transclusion_reference'
  | 'alias'
  | 'table'
  | 'table_row'
  | 'external_object_instance'
  | string;

 */

function findPageBlockId(parentId, blockValue, blocks = [], collectionView = {}) {
  let childIds = []
  if (!blockValue.content) {
    return []
  }
  blocks.forEach(block => {
    // isSubPage 直接子页面
    const isSubPage = blockValue.content.includes(block.value.id) &&
      CHILD_BLOCK_TYPE.includes(block.value.type)
      // && block.value.id !== generatePageId(parentId)
    if (isSubPage) {
      childIds.push(block.value.id)
    }

    // collection sub page
    let collectionSubPageIds = []
    if (block.value.type === 'collection_view') {
      if (block.value.parent_id === generatePageId(parentId)) {
        block.value.view_ids.forEach(viewId => {
          collectionSubPageIds.push(
            ...(collectionView[viewId].value.page_sort)
          )
        })
      }
    }
    childIds.push(...collectionSubPageIds)
  })
  return childIds
}

const PageLink = (
  fileType, // html/md
  childPagesIdArr = []
) => (props) => {
  const id = props.href.match(/\/(.*)/)[1]
  const isSubPage = childPagesIdArr.includes(generatePageId(id))
  return <a
    {...props}
    className={props.className + (isSubPage ? ` ${CLASSNAME_REWRITE__NOTION_LINK}` : '')}
    href={
      isSubPage
      ? ('/childPages' +
        props.href +
        `/index.${fileType}`)
      : ('https://www.notion.so' + props.href)
    }
    target='_blank'
  >
    {props.children}
  </a>
}

export function renderNotionPage(
  parentDir,
  recordMap,
  blockId,
  fileType,
  notionRenderStylePath
) { // fileType html/md
  const childPages = findPageBlockId(
    blockId,
    recordMap.block[generatePageId(blockId)].value,
    Object.values(recordMap.block),
    recordMap['collection_view']
  ).filter(id => id !== blockId)

  let htmlStr = renderToString(
    <NotionRenderer
      recordMap={recordMap}
      previewImages
      fullPage={false}
      darkMode={false}
      showTableOfContents
      components={{
        equation: Equation,
        code: Code,
        collection: Collection, 
        collectionRow: CollectionRow,
        pageLink: PageLink(fileType, childPages)
      }}
    />
  )
  htmlStr = `<html>
      <head>
        <meta charset='utf-8'/>
        <meta name="viewport" content="width=device-width,user-scalable=0,initial-scale=1,maximum-scale=1, minimum-scale=1">
        <link rel='stylesheet' href='${notionRenderStylePath}'/>
        <script type='text/javascript'>
          window.onload = () => {
            const pageLinks = document.getElementsByClassName('${CLASSNAME_REWRITE__NOTION_LINK}')
            for(let i = 0; i < pageLinks.length; i++) {
              const linkNode = pageLinks[i]
              linkNode.href = window.location.href.replace('/index.html', '') + linkNode.href.replace('file:///', '/')
            }
          }
        </script>
      </head>
      <body>
        ${htmlStr}
      </body>
  </html>`
  return {
    str: fileType === 'html' ? htmlStr : convertHtmlToMd(htmlStr),
    childPages
  }
}

function generatePageId(rawPageId) {
  if (/[^-]{8}-[^-]{4}-[^-]{4}-[^-]{4}-[^-]{12}/.test(rawPageId)) {
    return rawPageId
  }
  return [
    rawPageId.slice(0, 8),
    rawPageId.slice(8, 12),
    rawPageId.slice(12, 16),
    rawPageId.slice(16, 20),
    rawPageId.slice(20, 32)
  ].join('-')
}


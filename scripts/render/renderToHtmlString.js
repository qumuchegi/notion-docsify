import React from 'react';
import { renderToString } from 'react-dom/server'
import { NotionRenderer, Equation, Collection, CollectionRow, Code } from 'react-notion-x'
// import { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } from 'node-html-markdown'
// import '../style/notion-render.css'

// const nhm = new NodeHtmlMarkdown(
//   /* options (optional) */ {}, 
//   /* customTransformers (optional) */ undefined,
//   /* customCodeBlockTranslators (optional) */ undefined
// );
const CHILD_BLOCK_TYPE = [
  'page'
]
function findPageBlockId(parentId, blockValue, blocks = [], collectionView = {}) {
  let childIds = []
  if (!blockValue.content) {
    return []
  }
  blocks.forEach(block => {
    const isSubPage = blockValue.content.includes(block.value.id)
      && CHILD_BLOCK_TYPE.includes(block.value.type)
    if (isSubPage) {
      childIds.push(block.value.id)
    }
    let collectionSubPageIds = []
    if (block.value.type === 'collection_view') {
      if (block.value.parent_id === generatePageId(parentId)) {
        collectionSubPageIds = collectionView[
          block.value.view_ids[0]
        ].value.page_sort
      }
    }
    childIds.push(...collectionSubPageIds)
  })
  return childIds
}

const PageLink = (
  redirectBaseUrl
) => (props) => {
  // console.log({props})
  // 把 backup 前面的去掉
  // const relativePath = redirectBaseUrl.match(/.*?(backup\/)(.*)/)[2]
  return <a
    {...props}
    href={
      // relativePath +
      '/childPages' +
      props.href +
      '/index.html'
    }
    target='_blank'
  >
    {props.children}
  </a>
}

export function renderNotionPage(parentDir, recordMap, blockId) {
  const htmlStr = renderToString(
    <NotionRenderer
      recordMap={recordMap}
      previewImages
      fullPage={false}
      darkMode={false}
      showTableOfContents
      // disableHeader
      components={{
        equation: Equation,
        code: Code,
        collection: Collection, 
        collectionRow: CollectionRow,
        pageLink: PageLink(parentDir)
      }}
    />
  )
  const notionRenderCSSCDN = 'https://cdn.jsdelivr.net/npm/react-notion-x@4.13.0/src/styles.css'
  return {
    htmlStr: `<html>
          <head>
            <link rel='stylesheet' href='${notionRenderCSSCDN}'/>
          </head>
          <body>
            ${htmlStr}
          </body>
      </html>`,

    childPages: findPageBlockId(
      blockId,
      recordMap.block[generatePageId(blockId)].value,
      Object.values(recordMap.block),
      recordMap['collection_view']
    ).filter(id => id !== blockId)
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


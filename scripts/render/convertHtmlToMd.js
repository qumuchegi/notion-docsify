import { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } from 'node-html-markdown'

const nhm = new NodeHtmlMarkdown(
  /* options (optional) */ 
  {
    preferNativeParser: true,

  },
  /* customTransformers (optional) */ undefined,
  /* customCodeBlockTranslators (optional) */ undefined
);

export default function convertHtmlToMd(htmlStr) {
  return nhm.translate(htmlStr)
}
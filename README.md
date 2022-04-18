# 备份 notion

利用 GitHub Action 的 cron jobs 自动定时备份 notion

## 数据安全

1. 备份的数据只会在自己的 GitHub 账户下面可见，没有登录 GitHub 账户无法下载备份数据

2. notion 页面只能通过个人的 token 读取，不会分享到 web，不会被浏览和篡改内容

## 动机

- notion 是美帝公司，可能由于一些政治因素国内的用户突然访问不了

- notion 本身可能服务崩溃，数据丢失

出于这些原因，我们有必要给一些重要的数据做备份

## 使用指南

1. 获取 Notion 的 token_v2，
   
   打开 `https://www.notion.so`，用你自己的账户登录，登录后，
   f12 打开开发者面板，在 ‘应用’ => 'Cookie' => 'token_v2'， 复制 token_v2

    ![](/readmeAssets/img/-1.png)

2. 复制你需要备份的 notion 页面

    **获取 notion page id**: 在你需要备份的 notion 页面的右上角，点击 share 后，点击 'Copy Link', 得到一个 URL，比如 `https://www.notion.so/chegi/1c3ca781039447228f3c0bbf9b8ed74c` 这个 URL 我们可以复制到浏览器上查看这个 notion 页面 (只有页面主任可以登录查看). 我们把 url 后面的一部分的最后 32 位字符串复制下来，这 32 位就是这个 notion  page id

    ![](/readmeAssets/img/7.png)

    （注意，你不需要 share 一个页面下面的子页面，只要顶级页面 share 了，那么子页面也会被 share）:
   
3. fork 此项目仓库

4. 在 GitHub secrets 填写 token_v2 和 notion page id

    在 fork 的仓库详情页（如下图），打开 `Setting` tab, 设置环境变量 `NOTION_PAGE_IDS`, 变量的值是你需要备份的 notion 页面的 id。（**如果有多个页面，就用 ',' 隔开，需要注意： 1. 要用英文的顿号；2. 顿号前后不要留空格**）

    ![](/readmeAssets/img/5.png)

    填写 notion page id:

    ![](/readmeAssets/img/6.png)

    同样的方法我们新建一个名为 `NOTION_TOKEN` 的环境变量，它的值是我们在上面复制的 token_v2。

    ```yml title=".github/workflows/backupAction.yml 执行备份的 action"

    name: backup-notion

    on:
      push:
      schedule:
        - cron: "10 23,4,11 * * *" #在北京时间 早上 7:10、中午 12:10、晚上 19:10 点各备份一次，也就是每天备份三次
    jobs:
      backup-notion:
        runs-on: ubuntu-latest
        steps:
          - name: checkout
            uses: actions/checkout@v2
          - uses: actions/setup-node@v2
            with:
              node-version: "17"
          - run: npm install
          - name: build script
            run: npm run build
            continue-on-error: true
          - run: npm run run-backup ${{ secrets.NOTION_PAGE_IDS }} ${{ secrets.NOTION_TOKEN }}
          - name: backup as artifact
            uses: actions/upload-artifact@v3
            with: 
              name: notion-backup-zip
              path: backupZip

    ```
5. 上面的步骤做好后，只需等待备份任务自动运行。备份时间是每天三次自动备份（在北京时间 早上 7:10、中午 12:10、晚上 19:10 点各备份一次）。备份的结果会放在每次备份任务的 `Artifacts`，你可以在这里 (Actions) 下载备份结果。

    ![](/readmeAssets/img/4.png)

    备份结果：

    ![](/readmeAssets/img/2.png)

     下载备份结果到本地，解压，只需要把顶级的 `index.html` 在浏览器打开，里面的子页面的链接会自动改成本地的地址，点击 `index.html` 里面的链接可以在浏览器自动打开子页面。

     ![](/readmeAssets/img/3.png)

  6. 定期更新 `token_v2`
  
      `token_v2` 的有效期为 1 年，如果过期了，你需要再按照第 1 步和第 4 步更新 `token_v2`。


## 目前存在问题

1. 递归备份子页面只支持在父页面上创建的子页面，从其他 notion 页面复制的子页面链接不能被备份，但是点击这种子页面的链接会跳到 notion 的页面，不影响查看内容

2. 图片等非文字静态资源暂时不会备份，这些资源被 notion 放在 AWS 的服务器，不受 notion 的影响

3. 导出格式为 HTML 的时候格式和 notion 保持一样，但是转化为 markdown 的时候 collection 格式会失真

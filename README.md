## 备份 notion

定时备份 notion

## 动机

- notion 是美帝公司，可能由于一些政治因素国内的用户突然访问不了

- notion 本身可能服务崩溃，数据丢失

出于这些原因，我们有必要给一些重要的数据做备份

### use

1. 把你需要备份的 notion 页面 share, 只要在点击 'Share', 打开 share to web 即可，然后复制 URL 后面那一串 id，这个 id 就是这个页面在 notion 的全局 id（注意，你不需要 share 一个页面下面的子页面，只要顶级页面 share 了，那么子页面也会被 share）:

   ![](/readmeAssets/img/1.png)
   比如在上面这个 notion page 上，它的 id 就是 'b01547ea....'
   
2. fork 此项目仓库

3. git clone 这个仓库在你本地，然后打开 `.github/wrokflows.testAction.yml`，把 `NOTION_BLOCK_ID` 后面那一行的内容改成你自己的 notion 页面的 id。（**如果有多个页面，就用 ',' 隔开，需要注意： 1. 要用英文的顿号；2. 顿号前后不要留空格**）

   另外注意的是，你不需要单独把子页面的 id 放在这里，只要有父页面的 id，子页面也会被备份，父页面下的所有子页面会被递归备份。

    ```yml
    name: backup-notion
    env:
      NOTION_BLOCK_ID: 917c1456eb6b472590f3611fb57b691c
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
          - run: npm run run-backup $NOTION_BLOCK_ID
          - name: backup as artifact
            uses: actions/upload-artifact@v3
            with: 
              name: notion-backup-zip
              path: backupZip

    ```
4. 本地仓库根目录运行 `git commit` ， `git push`

    这个 `.github/wrokflows.testAction.yml` 会每天三次做一次自动备份。备份的结果会放在每次备份任务的 `Artifacts`，你可以在这里 (Actions) 下载备份结果。

    ![](/readmeAssets/img/4.png)

    ![](/readmeAssets/img/2.png)

     下载备份结果到本地，解压，只需要把顶级的 `index.html` 在浏览器打开，里面的子页面的链接会自动改成本地的地址，点击 `index.html` 里面的链接可以在浏览器自动打开子页面。

     ![](/readmeAssets/img/3.png)
'use strict'
// 当点击扩展图标时，切换显示/隐藏下载面板
chrome.browserAction.onClicked.addListener(function(tab) {
  // 打开下载面板
  chrome.tabs.sendMessage(tab.id, {
    msg: 'click_icon'
  })
})
// 因为下载完成的顺序和发送顺序可能不一致，所以需要存储任务的数据
let dlData = {}
// 储存下载任务的索引，用来判断重复的任务
let dlIndex = []
// 储存下载任务的批次编号，用来判断不同批次的下载
let dlBatch = []
// 接收下载请求
chrome.runtime.onMessage.addListener(function(msg, sender) {
  // 接收下载任务
  if (msg.msg === 'send_download') {
    const tabId = sender.tab.id
    // 如果开始了新一批的下载，重设批次编号，清空下载索引
    if (dlBatch[tabId] !== msg.taskBatch) {
      dlBatch[tabId] = msg.taskBatch
      dlIndex[tabId] = []
    }
    // 检查任务是否重复，不重复则下载
    if (dlIndex[tabId][msg.thisIndex] !== 1) {
      // 储存该任务的索引
      dlIndex[tabId][msg.thisIndex] = 1
      // 开始下载
      chrome.downloads.download(
        {
          url: msg.fileUrl,
          filename: msg.fileName,
          conflictAction: 'overwrite',
          saveAs: false
        },
        id => {
          // id 是 Chrome 新建立的下载任务的 id
          dlData[id] = {
            no: msg.no,
            url: msg.fileUrl,
            thisIndex: msg.thisIndex,
            tabId: tabId,
            uuid: false
          }
        }
      )
    }
  }
})
// 判断文件名是否含有 UUID 格式。因为文件名处于整个绝对路径的中间，所以没加首尾标记 ^ $
const UUIDRegexp = /[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}/
// 监听下载事件
chrome.downloads.onChanged.addListener(function(detail) {
  // 根据 detail.id 取出保存的数据
  const data = dlData[detail.id]
  if (data) {
    let msg = ''
    let err = ''
    // 判断当前文件名是否正常。下载时必定会有一次 detail.filename.current 有值
    if (detail.filename && detail.filename.current) {
      let changedName = detail.filename.current
      if (
        changedName.endsWith('jfif') ||
        changedName.match(UUIDRegexp) !== null
      ) {
        // 文件名是 UUID
        data.uuid = true
      }
    }
    if (detail.state && detail.state.current === 'complete') {
      msg = 'downloaded'
    }
    if (detail.error && detail.error.current) {
      msg = 'download_err'
      err = detail.error.current
      dlIndex[data.tabId][data.thisIndex] = 0 // 从任务列表里删除它，以便前台重试下载
    }
    // 返回信息
    if (msg) {
      chrome.tabs.sendMessage(data.tabId, { msg, data, err })
      // 清除这个任务的数据
      dlData[detail.id] = null
    }
  }
})

'use strict'
/// <reference path = "./content.d.ts" />
/// <reference path = "../../node_modules/viewerjs/types/index.d.ts" />
/*
 * project: Powerful Pixiv Downloader
 * author:  xuejianxianzun; 雪见仙尊
 * license: GPL-3.0-or-later; http://www.gnu.org/licenses/gpl-3.0.txt
 * Github： https://github.com/xuejianxianzun/PixivBatchDownloader
 * Releases: https://github.com/xuejianxianzun/PixivBatchDownloader/releases
 * Wiki:    https://github.com/xuejianxianzun/PixivBatchDownloader/wiki
 * Website: https://pixiv.download/
 * E-mail:  xuejianxianzun@gmail.com
 * QQ group:499873152
 */
// 语言类
class Lang {
    constructor() {
        this.langType = 0
        this.getLangType()
    }
    // 设置语言类型
    getLangType() {
        const userLang = document.documentElement.lang // 获取语言标识
        switch (userLang) {
            case 'zh':
            case 'zh-CN':
            case 'zh-Hans':
                this.langType = 0 // 设置为简体中文
                break
            case 'ja':
                this.langType = 1 // 设置为日语
                break
            case 'zh-Hant':
            case 'zh-tw':
            case 'zh-TW':
                this.langType = 3 // 设置为繁体中文
                break
            default:
                this.langType = 2 // 设置为英语
                break
        }
    }
    // translate 翻译
    transl(name, ...arg) {
        let content = langText[name][this.langType]
        arg.forEach(val => (content = content.replace('{}', val)))
        return content
    }
}
// 颜色
class Colors { }
Colors.blue = '#0ea8ef'
Colors.green = '#14ad27'
Colors.red = '#f33939'
// 事件类
class Evt {
    constructor() {
        this.events = {
            crawlStart: 'crawlStart',
            crawlFinish: 'crawlFinish',
            crawlEmpty: 'crawlEmpty',
            crawlError: 'crawlError',
            convertChange: 'convertChange',
            output: 'output',
            downloadStart: 'downloadStart',
            downloadPause: 'downloadPause',
            downloadStop: 'downloadStop',
            downloadSucccess: 'downloadSucccess',
            downloadComplete: 'downloadComplete',
            downloadError: 'downloadError',
            pageSwitch: 'pageSwitch',
            pageTypeChange: 'pageTypeChange'
        }
    }
    fire(type, data = '') {
        const event = new CustomEvent(type, {
            detail: { data: data }
        })
        window.dispatchEvent(event)
    }
}
// 日志类
class Log {
    constructor() {
        this.logArea = document.createElement('div') // 输出日志的区域
        this.id = 'logWrap' // 日志区域元素的 id
        this.refresh = document.createElement('span') // 刷新时使用的元素
        this.colors = ['#00ca19', '#d27e00', '#f00']
    }
    // 如果日志元素没有添加到页面上，则添加上去
    checkElement() {
        let test = document.getElementById(this.id)
        if (test === null) {
            this.logArea.id = this.id
            DOM.insertToHead(this.logArea)
        }
    }
    // 清空日志
    clear() {
        this.logArea.innerHTML = ''
    }
    // 添加日志
    /*
      str 日志文本
      level 日志等级
      br 换行标签的个数
      keepShow 追加日志的模式，默认为 true，把这一条日志添加后不再修改。false 则是刷新显示这条消息。
    
      level 日志等级：
      -1 auto 不设置颜色
      0 success 绿色
      1 warning 黄色
      2 error 红色
      */
    add(str, level, br, keepShow) {
        let span = document.createElement('span')
        if (!keepShow) {
            span = this.refresh
        }
        span.innerHTML = str
        if (level > -1) {
            span.style.color = this.colors[level]
        }
        while (br > 0) {
            span.appendChild(document.createElement('br'))
            br--
        }
        this.logArea.appendChild(span)
    }
    log(str, br = 1, keepShow = true) {
        this.checkElement()
        this.add(str, -1, br, keepShow)
    }
    success(str, br = 1, keepShow = true) {
        this.checkElement()
        this.add(str, 0, br, keepShow)
    }
    warning(str, br = 1, keepShow = true) {
        this.add(str, 1, br, keepShow)
    }
    error(str, br = 1, keepShow = true) {
        this.add(str, 2, br, keepShow)
    }
}
// api 类
// 不依赖页面元素或者下载器的状态，可独立使用
class API {
    // 根据对象某个属性的值，排序对象。返回的结果是倒序排列
    static sortByProperty(propertyName) {
        return function (object1, object2) {
            // 排序的内容有时可能是字符串，需要转换成数字排序
            const value1 = parseInt(object1[propertyName])
            const value2 = parseInt(object2[propertyName])
            if (value2 < value1) {
                return -1
            } else if (value2 > value1) {
                return 1
            } else {
                return 0
            }
        }
    }
    // 检查给定的字符串解析为数字后，是否大于 0
    static checkNumberGreater0(arg) {
        let num = parseInt(arg)
        // 空值会是 NaN
        if (!isNaN(num) && num > 0) {
            // 符合条件
            return {
                result: true,
                value: num
            }
        }
        // 不符合条件
        return {
            result: false,
            value: 0
        }
    }
    // 从 url 中获取指定的查询字段的值
    // 注意这里进行了一次编码，所以不要对这个 API 的结果再次进行编码
    static getURLField(url, query) {
        const result = new URL(url).searchParams.get(query)
        if (result !== null) {
            return encodeURIComponent(result)
        } else {
            return ''
        }
    }
    // 更新 token
    // 从网页源码里获取用户 token，并储存起来
    static updateToken() {
        fetch('https://www.pixiv.net/artworks/62751951')
            .then(response => {
                return response.text()
            })
            .then(data => {
                let result = data.match(/token":"(\w+)"/)
                if (result) {
                    localStorage.setItem('xzToken', result[1])
                } else {
                    console.warn('UpdateToken failed: no token found!')
                }
            })
    }
    // 获取 token
    // 从本地存储里获取用户 token
    static getToken() {
        let result = localStorage.getItem('xzToken')
        if (result) {
            return result
        } else {
            this.updateToken()
            return ''
        }
    }
    // 从 url 里获取作品 id
    // 可以传入 url，无参数则使用当前页面的 url
    static getIllustId(url) {
        const str = url || window.location.search || location.href
        if (str.includes('illust_id')) {
            // 传统 url
            return /illust_id=(\d*\d)/.exec(str)[1]
        } else if (str.includes('/artworks/')) {
            // 新版 url
            return /artworks\/(\d*\d)/.exec(str)[1]
        } else {
            // 直接取出 url 中的数字，不保证准确
            return /\d*\d/.exec(location.href)[0]
        }
    }
    // 通用的请求流程
    // 发送 get 请求，返回 json 数据，抛出异常
    static request(url) {
        return new Promise((resolve, reject) => {
            fetch(url, {
                method: 'get',
                credentials: 'same-origin'
            })
                .then(response => {
                    if (response.ok) {
                        return response.json()
                    } else {
                        // 第一种异常，请求成功但状态不对
                        reject({
                            status: response.status,
                            statusText: response.statusText
                        })
                    }
                })
                .then(data => {
                    resolve(data)
                })
                .catch(error => {
                    // 第二种异常，请求失败
                    reject(error)
                })
        })
    }
    // 获取收藏数据
    static async getBookmarkData(id, tag, offset, hide = false) {
        const url = `https://www.pixiv.net/ajax/user/${id}/illusts/bookmarks?tag=${encodeURI(
            tag
        )}&offset=${offset}&limit=100&rest=${
            hide ? 'hide' : 'show'
            }&rdm=${Math.random()}`
        return this.request(url)
    }
    // 添加收藏
    static async addBookmark(id, tags, token, hide) {
        let restrict
        if (!hide) {
            // 公开作品
            restrict = 0
        } else {
            // 非公开作品
            restrict = 1
        }
        return fetch('https://www.pixiv.net/rpc/index.php', {
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            credentials: 'same-origin',
            body: `mode=save_illust_bookmark&illust_id=${id}&restrict=${restrict}&comment=&tags=${tags}&tt=${token}`
        })
    }
    // 获取用户信息
    static getUserProfile(id) {
        // full=1 在画师的作品列表页使用，获取详细信息
        // full=0 在作品页内使用，只获取少量信息
        const url = `https://www.pixiv.net/ajax/user/${id}?full=1`
        return this.request(url)
    }
    // 获取用户指定类型的作品列表
    // 返回作品的 id 列表，不包含详细信息
    static async getUserWorksByType(id, type = ['illusts', 'manga']) {
        let typeSet = new Set(type)
        let result = []
        const url = `https://www.pixiv.net/ajax/user/${id}/profile/all`
        let data = await this.request(url)
        for (const type of typeSet.values()) {
            result = result.concat(Object.keys(data.body[type]))
        }
        return result
    }
    // 获取用户指定类型、并且指定 tag 的作品列表
    // 返回整个请求的结果，里面包含作品的详细信息
    // 必须带 tag 使用。不带 tag 虽然也能获得数据，但是获得的并不全，很奇怪。
    static getUserWorksByTypeWithTag(id, type, tag, offset = 0, number = 999999) {
        // https://www.pixiv.net/ajax/user/2369321/illusts/tag?tag=Fate/GrandOrder&offset=0&limit=9999999
        const url = `https://www.pixiv.net/ajax/user/${id}/${type}/tag?tag=${tag}&offset=${offset}&limit=${number}`
        return this.request(url)
    }
    // 获取作品的详细信息
    static getWorksData(id) {
        const url = `https://www.pixiv.net/ajax/illust/${id}`
        return this.request(url)
    }
    // 获取作品的动图信息
    static getUgoiraMeta(id) {
        const url = `https://www.pixiv.net/ajax/illust/${id}/ugoira_meta`
        return this.request(url)
    }
    // 获取相关作品
    static getRelatedData(id) {
        // 最后的 18 是预加载首屏的多少个作品的信息，和下载并没有关系
        const url = `https://www.pixiv.net/ajax/illust/${id}/recommend/init?limit=18`
        return this.request(url)
    }
    // 获取排行榜数据
    // 排行榜数据基本是一批 50 条作品信息
    static getRankingData(option) {
        let url = `https://www.pixiv.net/ranking.php?mode=${option.mode}&p=${option.p}&format=json`
        // 把可选项添加到 url 里
        let temp = new URL(url)
        // 下面两项需要判断有值再添加。不可以添加了这些字段却使用空值。
        if (option.worksType) {
            temp.searchParams.set('content', option.worksType)
        }
        if (option.date) {
            temp.searchParams.set('date', option.date)
        }
        url = temp.toString()
        return this.request(url)
    }
    // 获取收藏后的相似作品数据
    // 需要传入作品 id 和要抓取的数量。但是实际获取到的数量会比指定的数量少一些
    static getRecommenderData(id, number) {
        const url = `/rpc/recommender.php?type=illust&sample_illusts=${id}&num_recommendations=${number}`
        return this.request(url)
    }
    // 获取搜索数据
    static getSearchData(word, type = 'artworks', p = 1, option = {}) {
        // 基础的 url
        let url = `https://www.pixiv.net/ajax/search/${type}/${encodeURIComponent(
            word
        )}?word=${encodeURIComponent(word)}&p=${p}`
        // 把可选项添加到 url 里
        let temp = new URL(url)
        for (const [key, value] of Object.entries(option)) {
            if (value) {
                temp.searchParams.set(key, value)
            }
        }
        url = temp.toString()
        return this.request(url)
    }
    // 获取大家的新作品的数据
    static getNewIllustData(option) {
        let url = `https://www.pixiv.net/ajax/illust/new?lastId=${option.lastId}&limit=${option.limit}&type=${option.type}&r18=${option.r18}`
        return this.request(url)
    }
    // 获取关注的的新作品的数据
    static getBookmarkNewIllustData(p = 1, r18 = false) {
        let path = r18 ? 'bookmark_new_illust_r18' : 'bookmark_new_illust'
        let url = `https://www.pixiv.net/${path}.php?p=${p}`
        return new Promise((resolve, reject) => {
            fetch(url, {
                method: 'get',
                credentials: 'same-origin'
            })
                .then(response => {
                    if (response.ok) {
                        return response.text()
                    } else {
                        throw new Error(response.status.toString())
                    }
                })
                .then(data => {
                    let listPageDocument = new window.DOMParser().parseFromString(
                        data,
                        'text/html'
                    )
                    let worksInfoText = listPageDocument.querySelector(
                        '#js-mount-point-latest-following'
                    ).dataset.items
                    resolve(JSON.parse(worksInfoText))
                })
                .catch(error => {
                    reject(error)
                })
        })
    }
}
// DOM 操作类
// 提供公用的 DOM 操作方法，以及从 DOM 中获取数据的 API
class DOM {
    // 获取指定元素里，可见的结果
    static getVisibleEl(selector) {
        const list = document.querySelectorAll(selector)
        return Array.from(list).filter(el => {
            return el.style.display !== 'none'
        })
    }
    // 删除 DOM 元素
    static removeEl(el) {
        if (Reflect.has(el, 'length')) {
            // 如果有 length 属性则循环删除。
            el.forEach(el => el.parentNode.removeChild(el))
        } else {
            // 没有 length 属性的直接删除（querySelector 的返回值是 HTMLElement）
            el.parentNode.removeChild(el)
        }
    }
    // 切换 DOM 元素的可见性
    static toggleEl(el) {
        el.style.display = el.style.display === 'block' ? 'none' : 'block'
    }
    // 将元素插入到页面顶部
    /*
      newindex-inner 是在未登录时的用户作品列表页面使用的
      layout-body 是在未登录时的搜索页使用的
      */
    static insertToHead(el) {
        if (document.body) {
            document.body.insertAdjacentElement('afterbegin', el)
        } else {
            ; (
                document.querySelector('header') ||
                document.querySelector('.newindex-inner') ||
                document.querySelector('.layout-body')
            ).insertAdjacentElement('beforebegin', el)
        }
    }
    // 获取用户 id
    static getUserId() {
        // 首先尝试从 url 中获取
        const test = /(\?|&)id=(\d{1,9})/.exec(window.location.search)
        if (test && test.length > 1) {
            return test[2]
        }
        // 从 head 里匹配
        let test2 = document.head.innerHTML.match(/"userId":"(\d{1,9})"/)
        if (!test2) {
            test2 = document.head.innerHTML.match(
                /authorId&quot;:&quot;(\d{1,9})&quot/
            )
        }
        if (test2 && test2.length > 1) {
            return test2[1]
        }
        // 从 body 里匹配
        let test3 = /member\.php\?id=(\d{1,9})/.exec(document.body.innerHTML)
        if (test3) {
            return test3[1]
        }
        // 从旧版页面的头像获取（主要是在旧版书签页面使用）
        const nameElement = document.querySelector('.user-name')
        if (nameElement) {
            return /\?id=(\d{1,9})/.exec(nameElement.href)[1]
        }
        // 如果都没有获取到
        throw new Error('getUserId failed!')
    }
}
// 用户界面
// 提供中间面板和右侧下载按钮
class UI {
    constructor() {
        this.tipEl = document.createElement('div') // tip 元素
        this.rightBtn = document.createElement('div') // 右侧按钮
        this.centerPanel = document.createElement('div') // 中间面板
        this.reserveArea = document.createElement('div') // 下载区域容器
        // 创建 UI
        this.addUI()
    }
    // 向预留区域追加元素
    insertHTML(html) {
        this.reserveArea.insertAdjacentHTML('beforeend', html)
    }
    // 添加右侧下载按钮
    addRightButton() {
        this.rightBtn = document.createElement('div')
        this.rightBtn.textContent = '↓'
        this.rightBtn.id = 'rightButton'
        document.body.appendChild(this.rightBtn) // 绑定切换右侧按钮显示的事件
        this.rightBtn.addEventListener(
            'click',
            () => {
                this.showCenterPanel()
            },
            false
        )
    }
    // 显示中间面板上的提示。参数 arg 指示鼠标是移入还是移出，并包含鼠标位置
    showTip(text, arg) {
        if (!text) {
            throw new Error('No tip text.')
        }
        if (arg.type === 1) {
            this.tipEl.innerHTML = text
            this.tipEl.style.left = arg.x + 30 + 'px'
            this.tipEl.style.top = arg.y - 30 + 'px'
            this.tipEl.style.display = 'block'
        } else if (arg.type === 0) {
            this.tipEl.style.display = 'none'
        }
    }
    // 添加中间面板
    addCenterPanel() {
        const centerPanelHTML = `
      <div class="centerWrap">
      <div class="centerWrap_head">
      <span class="centerWrap_title blue"> ${lang.transl('_下载设置')}</span>
      <div class="btns">
      <a class="has_tip centerWrap_top_btn update" data-tip="${lang.transl(
            '_newver'
        )}" href="https://github.com/xuejianxianzun/PixivBatchDownloader/releases/latest" target="_blank">
      <svg t="1574401457339" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4736" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16"><defs><style type="text/css"></style></defs><path d="M894.72 795.477333l-85.418667-85.418667c0.128-0.170667 0.170667-0.341333 0.298667-0.512l-158.890667-158.890667c0.042667-0.597333 37.248-37.248 37.248-37.248l178.773333 0 1.706667-1.493333c-0.853333-196.736-160.426667-356.053333-357.418667-356.053333-72.704 0-140.202667 22.016-196.650667 59.306667L228.949333 129.664C307.968 71.466667 405.333333 36.650667 511.018667 36.650667c263.296 0 476.757333 213.461333 476.757333 476.714667C987.776 619.093333 952.96 716.416 894.72 795.477333zM369.493333 476.117333c-0.042667 0.597333-37.248 37.248-37.248 37.248l-178.773333 0c0 197.461333 160.085333 357.546667 357.546667 357.546667 72.192 0 139.093333-21.76 195.285333-58.538667l85.589333 85.589333c-78.848 57.685333-175.701333 92.117333-280.874667 92.117333-263.296 0-476.757333-213.461333-476.757333-476.757333 0-105.173333 34.474667-202.069333 92.16-280.874667l85.589333 85.589333C211.925333 318.208 211.882667 318.336 211.797333 318.464L369.493333 476.117333z" p-id="4737"></path></svg>
      </a>
      <a class="has_tip centerWrap_top_btn wiki_url" data-tip="${lang.transl(
            '_wiki'
        )}" href="https://github.com/xuejianxianzun/PixivBatchDownloader/wiki" target="_blank">
      <svg t="1574400169015" class="icon" widht="16" height="16" viewBox="0 0 1088 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1872" xmlns:xlink="http://www.w3.org/1999/xlink" width="17" height="16"><defs><style type="text/css"></style></defs><path d="M1044.286732 3.51978A1138.616836 1138.616836 0 0 0 618.841322 58.172364a198.963565 198.963565 0 0 0-26.814324 10.815324V1023.936004l0.895944-0.383976a979.52278 979.52278 0 0 1 443.236298-68.411724 47.741016 47.741016 0 0 0 51.580776-43.261296V50.172864a47.165052 47.165052 0 0 0-43.453284-46.653084z m-74.299356 632.15249h-224.369977V541.470158h224.369977v94.202112z m0-231.921504h-224.369977V309.484657h224.369977v94.266109zM469.154678 58.172364A1138.296856 1138.296856 0 0 0 43.645272 3.455784 47.421036 47.421036 0 0 0 0 50.172864V908.103244a46.653084 46.653084 0 0 0 15.35904 34.493844 48.060996 48.060996 0 0 0 36.285732 12.415224 980.610712 980.610712 0 0 1 443.300294 68.347728l0.895944 0.575964V68.7957a202.099369 202.099369 0 0 0-26.686332-10.751328zM351.146053 635.800262H126.776076V541.59815h224.369977v94.202112z m0-231.921504H126.776076V309.612649h224.369977v94.266109z" p-id="1873"></path></svg>
      </a>
      <a class="has_tip centerWrap_top_btn" data-tip="${lang.transl(
            '_github'
        )}" href="https://github.com/xuejianxianzun/PixivBatchDownloader" target="_blank">
      <svg t="1574401005111" class="icon" widht="16" height="16" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2594" xmlns:xlink="http://www.w3.org/1999/xlink><defs><style type="text/css"></style></defs><path d="M0 520.886c0-69.368 13.51-135.697 40.498-199.02 26.987-63.323 63.322-117.826 109.006-163.51 45.65-45.65 100.154-81.985 163.51-109.006A502.289 502.289 0 0 1 512 8.92c69.335 0 135.663 13.477 198.986 40.497 63.356 26.988 117.86 63.323 163.51 109.007 45.684 45.65 82.02 100.154 109.006 163.51A502.289 502.289 0 0 1 1024 520.852c0 111.318-32.504 211.472-97.511 300.494-64.975 88.989-148.48 150.825-250.484 185.476-5.351 0-9.348-0.99-11.99-2.973-2.676-1.982-4.196-3.997-4.526-6.012a59.458 59.458 0 0 1-0.495-8.984 7.663 7.663 0 0 1-0.991-3.006v-128.99c0-40.63-14.336-75.314-43.008-103.986 76.667-13.345 134.011-41.819 171.999-85.487 37.987-43.669 57.013-96.52 57.013-158.522 0-58.005-18.663-108.346-56.022-150.99 13.345-42.678 11-87.668-6.97-135.003-18.697-1.322-39.011 1.85-61.01 9.513-22 7.663-38.318 14.831-49.02 21.47-10.637 6.673-20.316 13.016-28.97 19.027-38.68-10.669-81.854-16.02-129.486-16.02-47.7 0-90.509 5.351-128.529 16.02-7.333-5.35-15.855-11.164-25.5-17.507-9.68-6.342-26.493-14.005-50.507-22.99-23.982-9.018-45.65-12.85-65.008-11.495-18.663 47.996-20.645 93.646-5.979 136.984-36.665 42.678-54.998 92.986-54.998 150.99 0 62.002 18.663 114.689 55.99 157.994 37.326 43.339 94.67 72.01 171.998 86.016a142.303 142.303 0 0 0-39.969 70.029c-56.683 13.972-96.355 3.963-119.015-30.06-42.017-61.308-79.674-83.307-113.003-65.965-4.69 4.657-3.997 9.48 1.982 14.501 6.012 4.988 14.996 11.66 27.02 19.985 11.99 8.357 20.976 17.507 26.987 27.515 0.661 1.322 2.51 6.177 5.517 14.502a831.917 831.917 0 0 0 8.985 23.981c2.973 7.663 8.654 16.186 17.011 25.5 8.324 9.349 18.003 17.178 29.003 23.52 11 6.309 26.161 11 45.485 14.006 19.324 2.972 41.323 3.138 65.998 0.495v100.484c0 0.991-0.165 2.643-0.495 5.021-0.33 2.312-0.991 3.964-1.982 4.955-0.991 1.024-2.345 2.015-4.03 3.039a12.52 12.52 0 0 1-6.474 1.486c-2.676 0-6.012-0.33-10.009-0.99-101.343-35.345-183.825-97.182-247.51-185.51C31.842 731.037 0 631.577 0 520.92z" p-id="2595"></path></svg>
      </a>
        <div class="has_tip centerWrap_top_btn centerWrap_toogle_option" data-tip="${lang.transl(
            '_收起展开设置项'
        )}">▲</div>
        <div class="has_tip centerWrap_top_btn centerWrap_close" data-tip="${lang.transl(
            '_快捷键切换显示隐藏'
        )}">
        <svg t="1574392276519" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1123" data-spm-anchor-id="a313x.7781069.0.i0" xmlns:xlink="http://www.w3.org/1999/xlink" width="14" height="14"><defs><style type="text/css"></style></defs><path d="M521.693867 449.297067L111.4112 39.0144a51.2 51.2 0 1 0-72.430933 72.362667l410.282666 410.3168-410.282666 410.3168a51.2 51.2 0 1 0 72.3968 72.3968l410.3168-410.282667 410.3168 410.282667a51.2 51.2 0 1 0 72.3968-72.362667l-410.282667-410.350933 410.282667-410.282667a51.2 51.2 0 1 0-72.3968-72.3968l-410.282667 410.282667z" p-id="1124"></path></svg>
        </div>
      </div>
      </div>
      <div class="centerWrap_con">
      <form class="settingForm">
      <div class="option_area1">
      <p class="formOption1">
      <span class="setWantPageWrap">
      <span class="has_tip settingNameStyle1 setWantPageTip1" data-tip="${lang.transl(
            '_页数'
        )}" style="margin-right: 0px;">${lang.transl(
            '_页数'
        )}</span><span class="gray1" style="margin-right: 10px;"> ? </span>
      <input type="text" name="setWantPage" class="setinput_style1 blue setWantPage"
      value = '-1'
      >
      &nbsp;&nbsp;&nbsp;
      <span class="setWantPageTip2 gray1">-1 或者大于 0 的数字</span>
      </span>
      </p>
      <p class="formOption3">
      <span class="has_tip settingNameStyle1" data-tip="${lang.transl(
            '_多p下载前几张提示'
        )}">${lang.transl('_多p下载前几张')}<span class="gray1"> ? </span></span>
      <input type="text" name="imgNumberPerWork" class="setinput_style1 blue" value="0">
      </p>
      <p class="formOption5">
      <span class="has_tip settingNameStyle1" data-tip="${lang.transl(
            '_下载作品类型的提示Center'
        )}">${lang.transl('_下载作品类型')}<span class="gray1"> ? </span></span>
      <label for="setWorkType0"><input type="checkbox" name="setWorkType0" id="setWorkType0" checked> ${lang.transl(
            '_插画'
        )}&nbsp;</label>
      <label for="setWorkType1"><input type="checkbox" name="setWorkType1" id="setWorkType1" checked> ${lang.transl(
            '_漫画'
        )}&nbsp;</label>
      <label for="setWorkType2"><input type="checkbox" name="setWorkType2" id="setWorkType2" checked> ${lang.transl(
            '_动图'
        )}&nbsp;</label>
      </p>
      <p class="formOption12">
      <span class="has_tip settingNameStyle1" data-tip="${lang.transl(
            '_动图保存格式title'
        )}">${lang.transl('_动图保存格式')}<span class="gray1"> ? </span></span>
      <label for="ugoiraSaveAs1"><input type="radio" name="ugoiraSaveAs" id="ugoiraSaveAs1" value="webm" checked> ${lang.transl(
            '_webmVideo'
        )} &nbsp;</label>
      <label for="ugoiraSaveAs3"><input type="radio" name="ugoiraSaveAs" id="ugoiraSaveAs3" value="gif"> ${lang.transl(
            '_gif'
        )} &nbsp;</label>
      <label for="ugoiraSaveAs2"><input type="radio" name="ugoiraSaveAs" id="ugoiraSaveAs2" value="zip"> ${lang.transl(
            '_zipFile'
        )} &nbsp;</label>
      </p>
      <p class="formOption2">
      <span class="has_tip settingNameStyle1" data-tip="${lang.transl(
            '_筛选收藏数的提示Center'
        )}">${lang.transl(
            '_筛选收藏数Center'
        )}<span class="gray1"> ? </span></span>
      <input type="text" name="setFavNum" class="setinput_style1 blue" value="0">&nbsp;&nbsp;&nbsp;&nbsp;
      </p>
      <p class="formOption11">
      <span class="has_tip settingNameStyle1" data-tip="${lang.transl(
            '_只下载已收藏的提示'
        )}">${lang.transl('_只下载已收藏')}<span class="gray1"> ? </span></span>
      <label for="setOnlyBmk"><input type="checkbox" name="setOnlyBmk" id="setOnlyBmk"> ${lang.transl(
            '_启用'
        )}</label>
      </p>
      <p class="formOption4">
      <span class="has_tip settingNameStyle1" data-tip="${lang.transl(
            '_筛选宽高的按钮Title'
        )} ${lang.transl('_筛选宽高的提示文字')}">${lang.transl(
            '_筛选宽高的按钮文字'
        )}<span class="gray1"> ? </span></span>
      <input type="text" name="setWidth" class="setinput_style1 blue" value="0">
      <input type="radio" name="setWidthAndOr" id="setWidth_AndOr1" value="&" checked> <label for="setWidth_AndOr1">and&nbsp;</label>
      <input type="radio" name="setWidthAndOr" id="setWidth_AndOr2" value="|"> <label for="setWidth_AndOr2">or&nbsp;</label>
      <input type="text" name="setHeight" class="setinput_style1 blue" value="0">
      </p>
      <p class="formOption13">
      <span class="has_tip settingNameStyle1" data-tip="${lang.transl(
            '_设置宽高比例Title'
        )}">${lang.transl('_设置宽高比例')}<span class="gray1"> ? </span></span>
      <input type="radio" name="ratio" id="ratio0" value="0" checked> <label for="ratio0"> ${lang.transl(
            '_不限制'
        )}&nbsp; </label>
      <input type="radio" name="ratio" id="ratio1" value="1"> <label for="ratio1"> ${lang.transl(
            '_横图'
        )}&nbsp; </label>
      <input type="radio" name="ratio" id="ratio2" value="2"> <label for="ratio2"> ${lang.transl(
            '_竖图'
        )}&nbsp; </label>
      <input type="radio" name="ratio" id="ratio3" value="3"> <label for="ratio3"> ${lang.transl(
            '_输入宽高比'
        )}<input type="text" name="userRatio" class="setinput_style1 blue" value="1.4"></label>
      </p>
      <p class="formOption6">
      <span class="has_tip settingNameStyle1" data-tip="${lang.transl(
            '_必须tag的提示文字'
        )}">${lang.transl('_必须含有tag')}<span class="gray1"> ? </span></span>
      <input type="text" name="needTag" class="setinput_style1 blue setinput_tag">
      </p>
      <p class="formOption7">
      <span class="has_tip settingNameStyle1" data-tip="${lang.transl(
            '_排除tag的提示文字'
        )}">${lang.transl('_不能含有tag')}<span class="gray1"> ? </span></span>
      <input type="text" name="notNeedTag" class="setinput_style1 blue setinput_tag">
      </p>
      <p class="formOption8">
      <span class="has_tip settingNameStyle1" data-tip="${lang.transl(
            '_快速下载的提示'
        )}">${lang.transl('_是否自动下载')}<span class="gray1"> ? </span></span>
      <label for="setQuietDownload"><input type="checkbox" name="quietDownload" id="setQuietDownload" checked> ${lang.transl(
            '_启用'
        )}</label>
      </p>
      <input type="hidden" name="debut" value="0">
      </div>
      <div class="centerWrap_btns centerWrap_btns_free" id="centerWrap_btns_free">
  
      </div>
      <p> ${lang.transl(
            '_设置命名规则3',
            '<span class="fwb blue imgNum">0</span>'
        )}</p>
      <p>
      <span class="has_tip settingNameStyle1" data-tip="${lang.transl(
            '_线程数字'
        )}">${lang.transl('_设置下载线程')}<span class="gray1"> ? </span></span>
      <input type="text" name="downloadThread" class="setinput_style1 blue" value="5">
      </p>
      <p>
      <span class="has_tip settingNameStyle1" data-tip="${lang.transl(
            '_设置文件夹名的提示'
        )}">${lang.transl('_设置文件名')}<span class="gray1"> ? </span></span>
      <input type="text" name="userSetName" class="setinput_style1 blue fileNameRule" value="{id}">
      &nbsp;
      <select name="pageInfoSelect" id="pageInfoSelect">
      </select>
      &nbsp;
      <select name="fileNameSelect">
        <option value="default">…</option>
        <option value="{id}">{id}</option>
        <option value="{title}">{title}</option>
        <option value="{tags}">{tags}</option>
        <option value="{tags_translate}">{tags_translate}</option>
        <option value="{user}">{user}</option>
        <option value="{userid}">{userid}</option>
        <option value="{type}">{type}</option>
        <option value="{date}">{date}</option>
        <option value="{bmk}">{bmk}</option>
        <option value="{px}">{px}</option>
        <option value="{rank}">{rank}</option>
        <option value="{id_num}">{id_num}</option>
        <option value="{p_num}">{p_num}</option>
        </select>
      &nbsp;&nbsp;
      <span class="gray1 showFileNameTip">？</span>
      </p>
      <p class="fileNameTip tip">
      ${lang.transl('_设置文件夹名的提示').replace('<br>', '. ')}
      <br>
      <span class="blue">{p_user}</span>
      ${lang.transl('_文件夹标记PUser')}
      <br>
      <span class="blue">{p_uid}</span>
      ${lang.transl('_文件夹标记PUid')}
      <br>
      <span class="blue">{p_tag}</span>
      ${lang.transl('_文件夹标记PTag')}
      <br>
      <span class="blue">{p_title}</span>
      ${lang.transl('_文件夹标记PTitle')}
      <br>
      <span class="blue">{id}</span>
      ${lang.transl('_命名标记1')}
      <br>
      <span class="blue">{title}</span>
      ${lang.transl('_命名标记2')}
      <br>
      <span class="blue">{tags}</span>
      ${lang.transl('_命名标记3')}
      <br>
      <span class="blue">{tags_translate}</span>
      ${lang.transl('_命名标记11')}
      <br>
      <span class="blue">{user}</span>
      ${lang.transl('_命名标记4')}
      <br>
      <span class="blue">{userid}</span>
      ${lang.transl('_命名标记6')}
      <br>
      <span class="blue">{date}</span>
      ${lang.transl('_命名标记12')}
      <br>
      <span class="blue">{type}</span>
      ${lang.transl('_命名标记14')}
      <br>
      <span class="blue">{bmk}</span>
      ${lang.transl('_命名标记8')}
      <br>
      <span class="blue">{px}</span>
      ${lang.transl('_命名标记7')}
      <br>
      <span class="blue">{id_num}</span>
      ${lang.transl('_命名标记9')}
      <br>
      <span class="blue">{p_num}</span>
      ${lang.transl('_命名标记10')}
      <br>
      <span class="blue">{rank}</span>
      ${lang.transl('_命名标记13')}
      <br>
      ${lang.transl('_命名标记提醒')}
      </p>
      <p class="formOption10">
      <span class="has_tip settingNameStyle1" data-tip="${lang.transl(
            '_添加字段名称提示'
        )}">${lang.transl('_添加字段名称')}<span class="gray1"> ? </span></span>
      <label for="setTagNameToFileName"><input type="checkbox" name="tagNameToFileName" id="setTagNameToFileName" checked> ${lang.transl(
            '_启用'
        )}</label>
      &nbsp;&nbsp;&nbsp;
      <span class="gray1 showFileNameResult"> ${lang.transl(
            '_预览文件名'
        )}</span>
      </p>
      </form>
      <div class="reserve_area"></div>
      <p class="gray1 bottom_help_bar"> 
      <span class="showDownTip">${lang.transl('_常见问题')}</span>
      <a class="wiki2" href="https://github.com/xuejianxianzun/PixivBatchDownloader/wiki" target="_blank"> ${lang.transl(
            '_wiki'
        )}</a>
      <span id="resetOption">${lang.transl('_重置设置')}</span>
      </p>
      <p class="downTip tip"> ${lang.transl('_下载说明')}</p>
      </div>
      </div>
      `
        document.body.insertAdjacentHTML('beforeend', centerPanelHTML)
        this.centerPanel = document.querySelector('.centerWrap')
        this.reserveArea = document.querySelector('.reserve_area')
    }
    // 显示提示
    addTipEl() {
        const tipHTML = `<div id="tip"></div>`
        document.body.insertAdjacentHTML('beforeend', tipHTML)
        this.tipEl = document.getElementById('tip')
        const tips = this.centerPanel.querySelectorAll('.has_tip')
        for (const el of tips) {
            for (const ev of ['mouseenter', 'mouseleave']) {
                el.addEventListener(ev, event => {
                    const e = event || window.event
                    const text = el.dataset.tip
                    this.showTip(text, {
                        type: ev === 'mouseenter' ? 1 : 0,
                        x: e.clientX,
                        y: e.clientY
                    })
                })
            }
        }
    }
    // 绑定中间面板上的事件
    bindEvents() {
        // 监听点击扩展图标的消息，开关中间面板
        chrome.runtime.onMessage.addListener(msg => {
            if (msg.msg === 'click_icon') {
                if (this.centerPanel.style.display === 'block') {
                    this.hideCenterPanel()
                } else {
                    this.showCenterPanel()
                }
            }
        })
        // 关闭按钮
        document
            .querySelector('.centerWrap_close')
            .addEventListener('click', () => {
                this.hideCenterPanel()
            })
        // 使用快捷键 Alt + x 切换中间面板显示隐藏
        window.addEventListener(
            'keydown',
            event => {
                const e = event || window.event
                if (e.altKey && e.keyCode === 88) {
                    const nowDisplay = this.centerPanel.style.display
                    if (nowDisplay === 'block') {
                        this.hideCenterPanel()
                    } else {
                        this.showCenterPanel()
                    }
                }
            },
            false
        )
        // 预览文件名
        document
            .querySelector('.showFileNameResult')
            .addEventListener('click', () => {
                const text = this.previewFileName()
                evt.fire(evt.events.output, text)
            })
        // 显示命名字段提示
        document
            .querySelector('.showFileNameTip')
            .addEventListener('click', () =>
                DOM.toggleEl(document.querySelector('.fileNameTip'))
            )
        // 显示下载说明
        document
            .querySelector('.showDownTip')
            .addEventListener('click', () =>
                DOM.toggleEl(document.querySelector('.downTip'))
            )
        this.form = this.centerPanel.querySelector('.settingForm')
        // 输入框获得焦点时自动选择文本（文件名输入框例外）
        const centerInputs = this.form.querySelectorAll('input[type=text]')
        for (const el of centerInputs) {
            if (el.name !== 'userSetName') {
                el.addEventListener('focus', function () {
                    this.select()
                })
            }
        }
        // 把下拉框的选择项插入到文本框里
        this.insertValueToInput(this.form.pageInfoSelect, this.form.userSetName)
        this.insertValueToInput(this.form.fileNameSelect, this.form.userSetName)
        // 重置设置
        document.getElementById('resetOption').addEventListener('click', () => {
            this.form.reset()
            saveOption.reset()
        })
    }
    // 添加 UI
    async addUI() {
        this.addRightButton()
        this.addCenterPanel()
        this.addTipEl()
        this.bindEvents()
    }
    // 收起展开选项设置区域
    toggleOptionArea(bool) {
        const OptionArea = this.centerPanel.querySelector('.option_area1')
        OptionArea.style.display = bool ? 'block' : 'none'
        this.centerPanel.querySelector('.centerWrap_toogle_option').innerHTML = bool
            ? '▲'
            : '▼'
    }
    // 把下拉框的选择项插入到文本框里
    insertValueToInput(from, to) {
        from.addEventListener('change', () => {
            if (from.value !== 'default') {
                // 把选择项插入到光标位置,并设置新的光标位置
                const position = to.selectionStart
                to.value =
                    to.value.substr(0, position) +
                    from.value +
                    to.value.substr(position, to.value.length)
                to.selectionStart = position + from.value.length
                to.selectionEnd = position + from.value.length
                to.focus()
            }
        })
    }
    // 显示中间区域
    showCenterPanel() {
        this.centerPanel.style.display = 'block'
        this.rightBtn.style.display = 'none'
    }
    // 隐藏中间区域
    hideCenterPanel() {
        this.centerPanel.style.display = 'none'
        this.rightBtn.style.display = 'block'
    }
    // 向中间面板添加按钮
    addCenterButton(bg = Colors.blue, text = '', attr = []) {
        const e = document.createElement('button')
        e.type = 'button'
        e.style.backgroundColor = bg
        e.textContent = text
        for (const [key, value] of attr) {
            e.setAttribute(key, value)
        }
        let centerBtnWrap = document.getElementById('centerWrap_btns_free')
        centerBtnWrap.appendChild(e)
        return e
    }
    // 获取排除类型
    getNotDownType() {
        let result = Array.from(
            ui.form.querySelectorAll('.formOption5 input')
        ).reduce((result, el, index) => {
            const thisElement = el
            if (thisElement.checked === false) {
                return (result += index)
            } else {
                return result
            }
        }, '')
        return result
    }
    // 预览文件名
    previewFileName() {
        let result = ''
        result = store.result.reduce((total, now) => {
            return (total +=
                now.url.replace(/.*\//, '') + ': ' + fileName.getFileName(now) + '<br>') // 在每个文件名前面加上它的原本的名字，方便用来做重命名
        }, result)
        return result
    }
}
// 获取页面类型
class PageType {
    constructor() {
        this.type = 0
        this.type = this.getPageType()
        // 页面切换时检查新旧页面是否不同
        window.addEventListener(evt.events.pageSwitch, () => {
            this.checkPageTypeIsNew()
        })
    }
    // 判断页面类型
    // 有些页面类型（如小说）虽然不支持，但它和支持的页面是无刷新切换的，所以视为支持的页面。等到开始抓取时再次判断是否可以抓取
    getPageType() {
        const url = window.location.href
        let type
        if (
            window.location.hostname === 'www.pixiv.net' &&
            (window.location.pathname === '/' || window.location.pathname === '/en/')
        ) {
            type = 0
        } else if (
            (url.includes('illust_id') || url.includes('/artworks/')) &&
            !url.includes('mode=manga') &&
            !url.includes('bookmark_detail') &&
            !url.includes('bookmark_add') &&
            !url.includes('response.php')
        ) {
            type = 1
        } else if (
            !url.includes('mode=manga&illust_id') &&
            (/member_illust\.php\?.*id=/.test(url) ||
                url.includes('member.php?id=') ||
                url.includes('bookmark.php'))
        ) {
            type = 2
        } else if (
            url.includes('search.php?') ||
            url.includes('tags.php?') ||
            url.includes('/tags/')
        ) {
            type = 5
        } else if (
            url.includes('ranking_area.php') &&
            url !== 'https://www.pixiv.net/ranking_area.php'
        ) {
            type = 6
        } else if (window.location.pathname === '/ranking.php') {
            type = 7
        } else if (
            url.includes('https://www.pixivision.net') &&
            url.includes('/a/')
        ) {
            type = 8
        } else if (
            url.includes('/bookmark_add.php?id=') ||
            url.includes('/bookmark_detail.php?illust_id=')
        ) {
            type = 9
        } else if (
            url.includes('/bookmark_new_illust.php') ||
            url.includes('/bookmark_new_illust_r18.php')
        ) {
            type = 10
        } else if (window.location.pathname === '/discovery') {
            type = 11
        } else if (
            url.includes('/new_illust.php') ||
            url.includes('/new_illust_r18.php')
        ) {
            type = 12
        } else {
            // 没有匹配到可用的页面类型
            throw new Error('Page type matching failed')
        }
        return type
    }
    // 检查是不是进入到了新的页面类型
    checkPageTypeIsNew() {
        let newType = this.getPageType()
        if (this.type !== newType) {
            evt.fire(evt.events.pageTypeChange, newType)
        }
        // 保存当前页面类型
        this.type = newType
    }
}
// 获取页面上的一些信息，用于文件名中
class PageInfo {
    constructor() {
        // 预设为 1 是为了指示这个标记有值，这样在获取到实际值之前，就可以把它插入到下拉框里。
        this.pageTitle = '1'
        this.pageUserName = ''
        this.pageUserID = ''
        this.pageTag = ''
        this.getPageInfo(pageType.getPageType())
        // 页面切换时获取新的页面信息
        window.addEventListener(evt.events.pageSwitch, () => {
            this.getPageInfo(pageType.getPageType())
        })
    }
    get getPageTag() {
        return this.pageTag
    }
    // 重置
    // 切换页面时可能旧页面的一些标记在新页面没有了，所以要先重置
    reset() {
        this.pageUserName = ''
        this.pageUserID = ''
        this.pageTag = ''
    }
    // 储存信息
    // 开始抓取时，把此时的页面信息保存到 store 里。这样即使下载时页面切换了，使用的刚开始抓取时的信息。
    async store() {
        await this.getPageInfo(pageType.getPageType())
        store.pageInfo.pageUserName = this.pageUserName
        store.pageInfo.pageUserID = this.pageUserID
        store.pageInfo.pageTag = this.pageTag
    }
    // 获取当前页面的一些信息，用于文件名中
    async getPageInfo(type) {
        this.reset()
        // 设置用户信息
        if (type === 1 || type === 2) {
            // 只有 1 和 2 可以使用页面上的用户信息
            let data = await API.getUserProfile(DOM.getUserId())
            this.pageUserID = data.body.userId
            this.pageUserName = data.body.name
        }
        // 获取当前页面的 tag
        if (type === 5) {
            // pathname 获取到的 tag 不需要再编码
            this.pageTag = decodeURIComponent(
                location.pathname.split('tags/')[1].split('/')[0]
            )
        } else {
            this.pageTag = decodeURIComponent(
                API.getURLField(window.location.href, 'tag')
            )
        }
        // 将可用选项添加到下拉选项里
        this.initPageInfoSelector()
    }
    initPageInfoSelector() {
        let optionHtml = '<option value="default">…</option>'
        const info = new Map([
            ['p_title', this.pageTitle],
            ['p_user', this.pageUserName],
            ['p_uid', this.pageUserID],
            ['p_tag', this.pageTag]
        ])
        for (let [key, value] of info.entries()) {
            if (value) {
                optionHtml += `<option value="{${key}}">{${key}}</option>`
            }
        }
        let target = document.getElementById('pageInfoSelect')
        if (target) {
            target.innerHTML = optionHtml
        }
    }
}
// 在标题栏上显示下载器工作状态
class TitleBar {
    constructor() {
        this.titleTimer = 0 // 修改 title 的定时器
    }
    // 检查标题里有没有本程序定义的状态字符
    titleHasState(status = '') {
        const titleStatus = ['[↑]', '[→]', '[▶]', '[↓]', '[║]', '[■]', '[√]', '[ ]']
        if (!status) {
            // 没有传递 status，则检查所有标记
            for (const str of titleStatus) {
                if (document.title.includes(str)) {
                    return true
                }
            }
        } else {
            // 检查指定标记
            return document.title.includes(status)
        }
        return false
    }
    // 重设 title
    reset() {
        const type = pageType.getPageType()
        clearInterval(this.titleTimer)
        // 储存标题的 mete 元素。在某些页面不存在，有时也与实际上的标题不一致。
        const ogTitle = document.querySelector('meta[property="og:title"]')
        // 无刷新自动加载的页面里，og:title 标签是最早更新标题的，内容也一致。
        if (ogTitle && (type == 1 || type === 2)) {
            document.title = ogTitle.content
        } else {
            // 如果当前 title 里有状态提醒，则设置为状态后面的文字
            if (this.titleHasState()) {
                const index = document.title.indexOf(']')
                document.title = document.title.substr(index + 1, document.title.length)
            }
        }
    }
    // 修改title
    changeTitle(string) {
        // 本程序的状态会以 [string] 形式添加到 title 最前面，并闪烁提醒
        /*
          ↑ 抓取中
          → 等待下一步操作（tag搜索页）
          ▶  准备下载
          ↓ 下载中
          ║ 下载暂停
          ■ 下载停止
          √ 下载完毕
          */
        const state = `[${string}]`
        // 如果 title 里没有状态，就添加状态
        if (!this.titleHasState()) {
            document.title = `${state} ${document.title}`
        } else {
            // 如果已经有状态了，则替换为新当前传入的状态
            document.title = document.title.replace(/\[.?\]/, state)
        }
        // 当需要执行下一步操作时，闪烁提醒
        if (string === '▶' || string === '→') {
            this.titleTimer = setInterval(() => {
                if (this.titleHasState(state)) {
                    document.title = document.title.replace(state, '[ ]')
                } else {
                    document.title = document.title.replace('[ ]', state)
                }
            }, 500)
        } else {
            clearInterval(this.titleTimer)
        }
    }
}
// 过滤器
// 审查每个作品的数据，决定是否要下载它。下载区域有一些选项是过滤器选项。
class Filter {
    constructor() {
        this.notdownType = '' // 设置不要下载的作品类型
        this.includeTag = '' // 必须包含的tag的列表
        this.excludeTag = '' // 要排除的tag的列表
        this.BMKNum = 0 // 要求收藏达到指定数量
        this.onlyBmk = false // 是否只下载收藏的作品
        // 宽高条件
        this.filterWh = {
            andOr: '&',
            width: 0,
            height: 0
        }
        this.ratioType = '0' // 宽高比例的类型
        this.debut = false // 只下载首次登场的作品
    }
    // 从下载区域上获取过滤器的各个选项
    init() {
        // 检查排除作品类型的设置
        this.notdownType = this.getNotDownType()
        // 检查是否设置了收藏数要求
        this.BMKNum = this.getBmkNum()
        // 检查是否设置了只下载书签作品
        this.onlyBmk = this.getOnlyBmk()
        // 检查是否设置了宽高条件
        this.filterWh = this.getSetWh()
        // 检查宽高比设置
        this.ratioType = this.getRatio()
        // 获取必须包含的tag
        this.includeTag = this.getIncludeTag()
        // 获取要排除的tag
        this.excludeTag = this.getExcludeTag()
        // 检查是否设置了只下载首次登场
        this.debut = this.getDebut()
    }
    // 检查作品是否符合过滤器的要求
    // 想要检查哪些数据就传递哪些数据，不需要传递 FilterOption 的所有选项
    check(option) {
        // 储存每一项检查的结果. true 表示保留这个作品
        let result = []
        // 检查排除类型设置
        result.push(this.checkNotDownType(option.illustType))
        // 检查收藏数要求
        result.push(this.checkBMK(option.bookmarkCount))
        // 检查只下载书签作品的要求
        result.push(this.checkOnlyBmk(option.bookmarkData))
        // 检查要排除的 tag
        result.push(this.checkExcludeTag(option.tags))
        // 检查必须包含的 tag
        result.push(this.checkIncludeTag(option.tags))
        // 检查宽高设置
        result.push(this.checkSetWh(option.width, option.height))
        // 检查宽高比设置
        result.push(this.checkRatio(option.width, option.height))
        // 检查首次登场设置
        result.push(this.checkDebut(option.yes_rank))
        // 结果里不包含 false 时，检查通过。只要有一个 false 就不通过
        return !result.includes(false)
    }
    // 获取排除类型
    getNotDownType() {
        let result = ui.getNotDownType()
        // 如果全部排除则取消任务
        if (result.includes('012')) {
            // notdownType 的结果是顺序的，所以可以直接查找 012
            window.alert(lang.transl('_checkNotdownTypeResult1弹窗'))
            const msg = lang.transl('_checkNotdownTypeResult1Html')
            log.error(msg, 2)
            throw new Error(msg)
        }
        // 排除了至少一种时，显示提示
        if (result.includes('0') || result.includes('1') || result.includes('2')) {
            log.warning(
                lang.transl('_checkNotdownTypeResult3Html') +
                result
                    .replace('0', lang.transl('_插画'))
                    .replace('1', lang.transl('_漫画'))
                    .replace('2', lang.transl('_动图'))
            )
        }
        return result
    }
    // 获取必须包含的tag
    getIncludeTag() {
        const result = '' || this.checkTagString(ui.form.needTag.value)
        if (result) {
            log.warning(lang.transl('_设置了必须tag之后的提示') + result)
        }
        return result
    }
    // 获取要排除的tag
    getExcludeTag() {
        const result = '' || this.checkTagString(ui.form.notNeedTag.value)
        if (result) {
            log.warning(lang.transl('_设置了排除tag之后的提示') + result)
        }
        return result
    }
    // 获取过滤宽高的设置
    getSetWh() {
        let result = {
            andOr: '&',
            width: 0,
            height: 0
        }
        const checkWidth = API.checkNumberGreater0(ui.form.setWidth.value)
        const checkHeight = API.checkNumberGreater0(ui.form.setHeight.value)
        // 宽高只要有一个条件大于 0 即可
        if (checkWidth.value > 0 || checkHeight.value > 0) {
            result = {
                andOr: ui.form.setWidthAndOr.value,
                width: checkWidth ? checkWidth.value : 0,
                height: checkHeight ? checkHeight.value : 0
            }
            log.warning(
                lang.transl('_设置了筛选宽高之后的提示文字p1') +
                result.width +
                result.andOr
                    .replace('|', lang.transl('_或者'))
                    .replace('&', lang.transl('_并且')) +
                lang.transl('_高度设置') +
                result.height
            )
        }
        return result
    }
    // 获取收藏数要求
    getBmkNum() {
        const check = API.checkNumberGreater0(ui.form.setFavNum.value)
        if (check.result) {
            log.warning(lang.transl('_设置了筛选收藏数之后的提示文字') + check.value)
        }
        return check.value
    }
    // 获取只下载书签作品的设置
    getOnlyBmk() {
        const result = ui.form.setOnlyBmk.checked
        if (result) {
            log.warning(lang.transl('_只下载已收藏的提示'))
        }
        return result
    }
    // 获取宽高比的设置
    getRatio() {
        let result = ui.form.ratio.value
        if (result === '1') {
            log.warning(lang.transl('_设置了宽高比之后的提示', lang.transl('_横图')))
        } else if (result === '2') {
            log.warning(lang.transl('_设置了宽高比之后的提示', lang.transl('_竖图')))
        } else if (result === '3') {
            // 由用户输入
            const typeNum = parseFloat(ui.form.userRatio.value)
            if (isNaN(typeNum)) {
                result = '0'
                ui.form.ratio.value = result
                window.alert(lang.transl('_宽高比必须是数字'))
            } else {
                log.warning(lang.transl('_输入宽高比') + ui.form.userRatio.value)
            }
        }
        return result
    }
    // 获取首次登场设置
    getDebut() {
        const result = ui.form.debut.value === '1'
        if (result) {
            log.warning(lang.transl('_抓取首次登场的作品Title'))
        }
        return result
    }
    // 检查排除类型设置
    checkNotDownType(illustType) {
        if (illustType === undefined) {
            return true
        } else {
            if (this.notdownType.includes(illustType.toString())) {
                return false
            } else {
                return true
            }
        }
    }
    // 检查收藏数要求
    checkBMK(bmk) {
        if (bmk === undefined) {
            return true
        } else {
            return bmk >= this.BMKNum
        }
    }
    // 检查作品是否符合【只下载书签作品】的条件,返回值 true 表示包含这个作品
    checkOnlyBmk(bookmarked) {
        // 如果设置了只下载书签作品
        if (this.onlyBmk) {
            return !!bookmarked
        }
        return true
    }
    // 检查用户输入的 tag 内容
    checkTagString(str) {
        let result = ''
        if (str) {
            let tempArr = str.split(',')
            // 如果用户在末尾也输入了逗号，则会产生一个空值，去掉它
            if (tempArr[tempArr.length - 1] === '') {
                tempArr.pop()
            }
            result = tempArr.join(',')
        }
        return result
    }
    // 检查作品是否符合包含 tag 的条件, 如果设置了多个 tag，需要作品里全部包含。返回值表示是否保留这个作品。
    checkIncludeTag(tags) {
        let result = false
        if (!this.includeTag || tags === undefined) {
            return true
        }
        let tempArr = this.includeTag.split(',')
        // 如果设置了必须的 tag
        if (tempArr.length > 0) {
            let tagNeedMatched = 0
            const tempTags = new Set()
            // 如果不区分大小写的话，Fate/grandorder 和 Fate/GrandOrder 会被算作符合两个 tag，所以用 Set 结构去重。测试 id 51811780
            for (const tag of tags) {
                tempTags.add(tag.toLowerCase())
            }
            for (const tag of tempTags) {
                for (const need of tempArr) {
                    if (tag === need.toLowerCase()) {
                        tagNeedMatched++
                        break
                    }
                }
            }
            // 如果全部匹配
            if (tagNeedMatched >= tempArr.length) {
                result = true
            }
        } else {
            result = true
        }
        return result
    }
    // 检查作品是否符合排除 tag 的条件, 只要作品包含其中一个就排除。返回值表示是否保留这个作品。
    checkExcludeTag(tags) {
        let result = true
        if (!this.excludeTag || tags === undefined) {
            return true
        }
        let tempArr = this.excludeTag.split(',')
        // 如果设置了排除 tag
        if (tempArr.length > 0) {
            for (const tag of tags) {
                for (const notNeed of tempArr) {
                    if (tag.toLowerCase() === notNeed.toLowerCase()) {
                        result = false
                        break
                    }
                }
            }
        }
        return result
    }
    // 检查作品是否符合过滤宽高的条件
    checkSetWh(width, height) {
        if (width === undefined) {
            width = 0
        }
        if (height === undefined) {
            height = 0
        }
        if (this.filterWh.width > 0 || this.filterWh.height > 0) {
            // 如果宽高都小于要求的宽高
            if (width < this.filterWh.width && height < this.filterWh.height) {
                return false
            } else {
                if (this.filterWh.andOr === '|') {
                    // 判断or的情况
                    if (width >= this.filterWh.width || height >= this.filterWh.height) {
                        return true
                    } else {
                        return false
                    }
                } else if (this.filterWh.andOr === '&') {
                    // 判断and的情况
                    if (width >= this.filterWh.width && height >= this.filterWh.height) {
                        return true
                    } else {
                        return false
                    }
                }
            }
        }
        return true
    }
    // 检查作品是否符合宽高比条件
    checkRatio(width, height) {
        if (width === undefined) {
            width = 0
        }
        if (height === undefined) {
            height = 0
        }
        if (this.ratioType === '0') {
            return true
        } else if (this.ratioType === '1') {
            return width / height > 1
        } else if (this.ratioType === '2') {
            return width / height < 1
        } else {
            return width / height >= parseFloat(ui.form.userRatio.value)
        }
    }
    // 检查首次登场设置
    // yes_rank 是昨日排名，如果为 0，则此作品是“首次登场”的作品
    checkDebut(yes_rank) {
        if (!this.debut) {
            return true
        } else {
            if (yes_rank === 0 || yes_rank === undefined) {
                return true
            } else {
                return false
            }
        }
    }
}
// 保存和初始化下载区域的设置项
// 只有部分设置会被保存
class SaveOption {
    constructor() {
        // 本地存储中使用的 name
        this.storeName = 'xzSetting'
        // 需要持久化保存的设置的默认值
        this.needSaveOptsDefault = {
            imgNumberPerWork: 0,
            notdownType: '',
            ugoiraSaveAs: 'webm',
            needTag: '',
            notNeedTag: '',
            quietDownload: true,
            downloadThread: 5,
            userSetName: '{id}',
            tagNameToFileName: true,
            showOptions: true
        }
        // 储存需要持久化保存的设置
        this.needSaveOpts = this.needSaveOptsDefault
        // 排除类型的按钮 name
        this.notdownTypeName = ['setWorkType0', 'setWorkType1', 'setWorkType2']
        this.restoreOption()
        this.bindOptionEvent()
    }
    // 从持久化设置里恢复下载区域的设置
    // 可以执行多次
    restoreOption() {
        let str = localStorage.getItem(this.storeName)
        // 如果之前已经持久化，则读取设置，初始化下载区域的选项
        if (str) {
            this.needSaveOpts = JSON.parse(str)
        } else {
            // 如果没有保存过，则不做处理
            return
        }
        // 设置是否显示选项区域
        ui.toggleOptionArea(this.needSaveOpts.showOptions)
        // 设置作品张数
        ui.form.imgNumberPerWork.value = (
            this.needSaveOpts.imgNumberPerWork | 0
        ).toString()
        // 设置排除类型
        for (let index = 0; index < this.notdownTypeName.length; index++) {
            // 根据 notdownType 里的记录，选中或者取消选中
            let element = ui.form[this.notdownTypeName[index]]
            if (this.needSaveOpts.notdownType.includes(index.toString())) {
                element.checked = false
            } else {
                element.checked = true
            }
        }
        // 设置动图格式选项
        ui.form.ugoiraSaveAs.value = this.needSaveOpts.ugoiraSaveAs
        // 设置必须的 tag
        ui.form.needTag.value = this.needSaveOpts.needTag
        // 设置排除的 tag
        ui.form.notNeedTag.value = this.needSaveOpts.notNeedTag
        // 设置快速下载
        ui.form.quietDownload.checked = this.needSaveOpts.quietDownload
        // 设置下载线程
        ui.form.downloadThread.value = this.needSaveOpts.downloadThread.toString()
        // 设置文件命名规则
        const fileNameRuleInput = ui.form.userSetName
        // pixivision 里，文件名只有 id 标记会生效，所以把文件名部分替换成 id
        if (pageType.getPageType() === 8) {
            fileNameRuleInput.value = '{p_title}/{id}'
        } else {
            fileNameRuleInput.value = this.needSaveOpts.userSetName
        }
        // 设置是否添加标记名称
        ui.form.tagNameToFileName.checked = this.needSaveOpts.tagNameToFileName
    }
    // 绑定选项的事件，主要是当选项变动时保存。
    // 只可执行一次，否则事件会重复绑定
    bindOptionEvent() {
        const that = this
        // 保存是否显示选项区域
        const showOptionsBtn = document.querySelector('.centerWrap_toogle_option')
        showOptionsBtn.addEventListener('click', () => {
            this.needSaveOpts.showOptions = !this.needSaveOpts.showOptions
            this.saveSetting('showOptions', this.needSaveOpts.showOptions)
            ui.toggleOptionArea(this.needSaveOpts.showOptions)
        })
        // 保存作品张数
        ui.form.imgNumberPerWork.addEventListener('change', function () {
            if (parseInt(this.value) >= 0) {
                that.saveSetting('imgNumberPerWork', this.value)
            }
        })
        // 保存排除类型
        for (let i = 0; i < this.notdownTypeName.length; i++) {
            // 根据 notdownType 里的记录，选中或者取消选中
            let element = ui.form[this.notdownTypeName[i]]
            element.addEventListener('click', () => {
                this.saveSetting('notdownType', ui.getNotDownType())
            })
        }
        // 保存动图格式选项
        for (const input of ui.form.ugoiraSaveAs) {
            input.addEventListener('click', function () {
                that.saveSetting('ugoiraSaveAs', this.value)
            })
        }
        // 保存必须的 tag设置
        ui.form.needTag.addEventListener('change', function () {
            that.saveSetting('needTag', this.value)
        })
        // 保存排除的 tag设置
        ui.form.notNeedTag.addEventListener('change', function () {
            that.saveSetting('notNeedTag', this.value)
        })
        // 保存快速下载
        ui.form.quietDownload.addEventListener('click', function () {
            that.saveSetting('quietDownload', this.checked)
        })
        // 保存下载线程
        ui.form.downloadThread.addEventListener('change', function () {
            if (parseInt(this.value) > 0) {
                that.saveSetting('downloadThread', this.value)
            }
        })
            ;['change', 'focus'].forEach(ev => {
                ui.form.userSetName.addEventListener(ev, function () {
                    that.saveSetting('userSetName', this.value)
                })
            })
        // 保存是否添加标记名称
        ui.form.tagNameToFileName.addEventListener('click', function () {
            that.saveSetting('tagNameToFileName', this.checked)
        })
    }
    // 持久化保存设置
    saveSetting(key, value) {
        this.needSaveOpts[key] = value
        localStorage.setItem(this.storeName, JSON.stringify(this.needSaveOpts))
    }
    // 重设选项
    reset() {
        // 将 needSaveOpts 恢复为默认值
        this.needSaveOpts = this.needSaveOptsDefault
        // 覆写本地存储里的设置为默认值
        localStorage.setItem(this.storeName, JSON.stringify(this.needSaveOpts))
        // 使用默认值重设选项
        this.restoreOption()
    }
}
// 删除页面上的作品元素
class DeleteWorks {
    constructor(worksSelector) {
        this.worksSelector = '' // 选择页面上所有作品的选择器
        this.multipleSelector = '._3b8AXEx' // 多图作品特有的元素的标识
        this.ugoiraSelector = '.AGgsUWZ' // 动图作品特有的元素的标识
        this.delWork = false // 是否处于删除作品状态
        this.worksSelector = worksSelector
    }
    // 清除多图作品的按钮
    addClearMultipleBtn() {
        ui.addCenterButton(Colors.red, lang.transl('_清除多图作品'), [
            ['title', lang.transl('_清除多图作品Title')]
        ]).addEventListener(
            'click',
            () => {
                ui.hideCenterPanel()
                this.clearMultiple()
            },
            false
        )
    }
    // 清除动图作品的按钮
    addClearUgoiraBtn() {
        ui.addCenterButton(Colors.red, lang.transl('_清除动图作品'), [
            ['title', lang.transl('_清除动图作品Title')]
        ]).addEventListener(
            'click',
            () => {
                ui.hideCenterPanel()
                this.ClearUgoira()
            },
            false
        )
    }
    // 手动删除作品的按钮
    addManuallyDeleteBtn() {
        const delBtn = ui.addCenterButton(
            Colors.red,
            lang.transl('_手动删除作品'),
            [['title', lang.transl('_手动删除作品Title')]]
        )
        delBtn.addEventListener('click', () => {
            this.manuallyDelete(delBtn)
        })
    }
    // 清除多图作品
    clearMultiple() {
        const allPicArea = document.querySelectorAll(this.worksSelector)
        allPicArea.forEach(el => {
            if (el.querySelector(this.multipleSelector)) {
                el.remove()
            }
        })
        this.outputNowResult()
    }
    // 清除动图作品
    ClearUgoira() {
        const allPicArea = document.querySelectorAll(this.worksSelector)
        allPicArea.forEach(el => {
            if (el.querySelector(this.ugoiraSelector)) {
                el.remove()
            }
        })
        this.outputNowResult()
    }
    // 手动删除作品
    manuallyDelete(delBtn) {
        this.delWork = !this.delWork
        // 给作品绑定删除属性
        const listElement = document.querySelectorAll(this.worksSelector)
        listElement.forEach(el => {
            el.onclick = e => {
                e = e || window.event
                if (this.delWork) {
                    e.preventDefault()
                    DOM.removeEl(e.currentTarget)
                    if (store.states.allowWork) {
                        this.outputNowResult()
                    }
                }
            }
        })
        if (this.delWork) {
            delBtn.textContent = lang.transl('_退出手动删除')
            setTimeout(() => {
                ui.hideCenterPanel()
            }, 300)
        } else {
            delBtn.textContent = lang.transl('_手动删除作品')
        }
    }
    // 显示调整后，列表里的作品数量。仅在搜索页和发现页面中使用
    outputNowResult() {
        const selector = this.worksSelector
        log.success(
            lang.transl('_调整完毕', DOM.getVisibleEl(selector).length.toString()),
            2,
            false
        )
    }
}
// 快速收藏
class QuickBookmark {
    constructor() {
        this.quickBookmarkEl = document.createElement('a') // 快速收藏的元素
        this.quickBookmark()
    }
    // 快速收藏
    quickBookmark() {
        // 因为切换作品（pushstate）时，不能准确的知道 toolbar 何时更新，而且获取 token 也可能需要时间，所以只能不断检测
        setTimeout(() => {
            this.quickBookmark()
        }, 300)
        // 如果获取不到 token，则不展开快速收藏功能
        if (!API.getToken()) {
            return
        }
        // 因为 p 站改版 class 经常变，所以从父元素查找，父元素的 class 变化没那么频繁
        const toolbarParent = document.querySelectorAll('main > section')
        let toolbar // 作品下方的工具栏
        for (const el of toolbarParent) {
            const test = el.querySelector('div>section')
            if (test) {
                toolbar = test
                break
            }
        }
        if (toolbar) {
            this.quickBookmarkEl = document.querySelector('#quickBookmarkEl')
            // 如果没有 quick 元素则添加
            if (!this.quickBookmarkEl) {
                // 创建快速收藏元素
                this.quickBookmarkEl = document.createElement('a')
                this.quickBookmarkEl.id = 'quickBookmarkEl'
                this.quickBookmarkEl.textContent = '✩'
                this.quickBookmarkEl.href = 'javascript:void(0)'
                this.quickBookmarkEl.title = lang.transl('_快速收藏')
                toolbar.insertBefore(this.quickBookmarkEl, toolbar.childNodes[3])
                // 隐藏原来的收藏按钮并检测收藏状态
                const orgIcon = toolbar.childNodes[2]
                if (!orgIcon) {
                    // 当用户处于自己作品的页面时，是没有收藏按钮的，停止执行
                    return
                } else {
                    orgIcon.style.display = 'none'
                }
                const heart = orgIcon.querySelector('svg')
                if (window.getComputedStyle(heart)['fill'] === 'rgb(255, 64, 96)') {
                    // 如果已经收藏过了
                    this.quickBookmarkEnd()
                } else {
                    // 准备快速收藏
                    this.readyQuickBookmark()
                }
            } else {
                // 如果有 quick 元素，什么都不做
                return
            }
        }
    }
    // 准备快速收藏
    readyQuickBookmark() {
        this.quickBookmarkEl.addEventListener('click', () => {
            document.querySelector('._35vRH4a').click() // 自动点赞
            // 储存 tag
            const tagElements = document.querySelectorAll('._1LEXQ_3 li')
            const tagArray = Array.from(tagElements).map(el => {
                const nowA = el.querySelector('a')
                if (nowA) {
                    let nowTag = nowA.textContent
                    // 对于原创作品，非日文的页面上只显示了用户语言的“原创”，替换成日文 tag “オリジナル”。
                    if (nowTag === '原创' || nowTag === 'Original' || nowTag === '창작') {
                        nowTag = 'オリジナル'
                    }
                    return nowTag
                }
            })
            const tagString = encodeURI(tagArray.join(' '))
            // 调用添加收藏的 api
            API.addBookmark(API.getIllustId(), tagString, API.getToken(), false)
                .then(response => response.json())
                .then(data => {
                    if (data.error !== undefined && data.error === false) {
                        this.quickBookmarkEnd()
                    }
                })
        })
    }
    // 如果这个作品已收藏，则改变样式
    quickBookmarkEnd() {
        this.quickBookmarkEl.style.color = '#FF4060'
        this.quickBookmarkEl.href = `/bookmark_add.php?type=illust&illust_id=${API.getIllustId()}`
    }
}
// 给收藏里的未分类作品批量添加 tag
class BookmarksAddTag {
    constructor(btn) {
        this.addTagList = [] // 需要添加 tag 的作品列表
        this.btn = btn
        this.init()
    }
    init() {
        this.btn.addEventListener('click', () => {
            this.addTagList = [] // 每次点击清空结果
            this.btn = document.getElementById('add_tag_btn')
            this.btn.setAttribute('disabled', 'disabled')
            this.btn.textContent = `Checking`
            this.readyAddTag()
        })
        // 显示/隐藏按钮
        this.toogleAddTagBtn()
            ;['pushState', 'popstate'].forEach(item => {
                window.addEventListener(item, () => {
                    this.toogleAddTagBtn()
                })
            })
    }
    // 如果是书签页则显示添加 tag 的按钮，否则隐藏
    toogleAddTagBtn() {
        const isBookmarkPage = location.href.includes('bookmark.php')
        if (this.btn) {
            if (isBookmarkPage) {
                this.btn.classList.remove('hidden')
            } else {
                this.btn.classList.add('hidden')
            }
        }
    }
    // 准备添加 tag。loop 表示这是第几轮循环
    async readyAddTag(loop = 0) {
        const offset = loop * 100 // 一次请求只能获取 100 个，所以可能有多次请求，要计算偏移量
        // 发起请求
        const [showData, hideData] = await Promise.all([
            API.getBookmarkData(DOM.getUserId(), '未分類', offset, false),
            API.getBookmarkData(DOM.getUserId(), '未分類', offset, true)
        ]).catch(error => {
            if (error.status && error.status === 403) {
                this.btn.textContent = `× Permission denied`
            }
            throw new Error('Permission denied')
        })
        // 保存有用的数据
        for (const data of [showData, hideData]) {
            const works = data.body.works
            // 如果作品的 bookmarkData 为假说明没有实际数据，可能是在获取别人的收藏数据。
            if (works.length > 0 && works[0].bookmarkData) {
                works.forEach(work => {
                    this.addTagList.push({
                        id: work.id,
                        tags: encodeURI(work.tags.join(' ')),
                        restrict: work.bookmarkData.private
                    })
                })
            }
        }
        // 进行下一步的处理
        if (this.addTagList.length === 0) {
            // 如果结果为空，不需要处理
            this.btn.textContent = `√ No need`
            this.btn.removeAttribute('disabled')
            return
        } else {
            // 判断是否获取完毕，如果本次请求获取的数据为空，则已经没有后续数据
            if (
                showData.body.works.length === 0 &&
                hideData.body.works.length === 0
            ) {
                // 已经获取完毕
                this.addTag(0, this.addTagList, API.getToken())
            } else {
                // 需要继续获取
                this.readyAddTag(++loop)
            }
        }
    }
    // 给未分类作品添加 tag
    async addTag(index, addList, tt) {
        const item = addList[index]
        await API.addBookmark(item.id, item.tags, tt, item.restrict)
        if (index < addList.length - 1) {
            index++
            this.btn.textContent = `${index} / ${addList.length}`
            // 继续添加下一个
            this.addTag(index, addList, tt)
        } else {
            this.btn.textContent = `√ Complete`
            this.btn.removeAttribute('disabled')
        }
    }
}
// 图片查看器类
class ImgViewer {
    constructor() {
        this.viewerUl = document.createElement('ul') // 图片列表的 ul 元素
        this.viewerWarpper = document.createElement('div') // 图片列表的容器
    }
    // 初始化图片查看器
    newViewer(pageCount, firsturl) {
        // 因为选项里的 size 是枚举类型，所以在这里也要定义一个枚举
        let ToolbarButtonSize
            ; (function (ToolbarButtonSize) {
                ToolbarButtonSize['Small'] = 'small'
                ToolbarButtonSize['Medium'] = 'medium'
                ToolbarButtonSize['Large'] = 'large'
            })(ToolbarButtonSize || (ToolbarButtonSize = {}))
        this.myViewer = new Viewer(this.viewerUl, {
            toolbar: {
                zoomIn: 0,
                zoomOut: 0,
                oneToOne: 1,
                reset: 0,
                prev: 1,
                play: {
                    show: 0,
                    size: ToolbarButtonSize.Large
                },
                next: 1,
                rotateLeft: 0,
                rotateRight: 0,
                flipHorizontal: 0,
                flipVertical: 0
            },
            url(image) {
                return image.dataset.src
            },
            viewed(event) {
                // 当图片显示完成（加载完成）后，预加载下一张图片
                const ev = event || window.event
                let index = ev.detail.index
                if (index < pageCount - 1) {
                    index++
                }
                const nextImg = firsturl.replace('p0', 'p' + index)
                const img = new Image()
                img.src = nextImg
            },
            // 取消一些动画，比如切换图片时，图片从小变大出现的动画
            transition: false,
            // 取消键盘支持，主要是用键盘左右方向键切换的话，会和 pixiv 页面产生冲突。（pixiv 页面上，左右方向键会切换作品）
            keyboard: false,
            // 不显示 title（图片名和宽高信息）
            title: false,
            // 不显示缩放比例
            tooltip: false
        })
    }
    // 初始化图片查看器
    initViewer() {
        // 检查图片查看器元素是否已经生成
        if (!document.getElementById('viewerWarpper')) {
            // 创建图片查看器
            this.createViewer()
        } else {
            // 更新数据
            this.updateViewer()
        }
    }
    // 创建图片查看器 html 元素，并绑定一些事件，这个函数只会在初始化时执行一次
    createViewer() {
        if (!document.querySelector('main figcaption')) {
            // 等到作品主体部分的元素生成之后再创建查看器
            setTimeout(() => {
                this.createViewer()
            }, 300)
            return
        }
        // 查看器图片列表元素的结构： div#viewerWarpper > ul > li > img
        this.viewerWarpper = document.createElement('div')
        this.viewerWarpper.id = 'viewerWarpper'
        this.viewerUl = document.createElement('ul')
        this.viewerWarpper.appendChild(this.viewerUl)
        document
            .querySelector('main figcaption')
            .insertAdjacentElement('beforebegin', this.viewerWarpper)
        // 图片查看器显示之后
        this.viewerUl.addEventListener('shown', () => {
            // 显示相关元素
            this.showViewerOther()
            // 点击 1：1 按钮时，全屏查看
            document
                .querySelector('.viewer-one-to-one')
                .addEventListener('click', () => {
                    this.hideViewerOther() // 隐藏查看器的其他元素
                    // 进入全屏
                    document.body.requestFullscreen()
                    // 使图片居中显示，必须加延迟
                    setTimeout(() => {
                        this.setViewerCenter()
                    }, 100)
                })
        })
        // 全屏状态下，查看和切换图片时，显示比例始终为 100%
        this.viewerUl.addEventListener('view', () => {
            if (this.isFullscreen()) {
                setTimeout(() => {
                    // 通过点击 1:1 按钮，调整为100%并居中。这里必须要加延时，否则点击的时候图片还是旧的
                    document.querySelector('.viewer-one-to-one').click()
                }, 50)
            }
        })
        // 隐藏查看器时，如果还处于全屏，则退出全屏
        this.viewerUl.addEventListener('hidden', () => {
            if (this.isFullscreen()) {
                document.exitFullscreen()
            }
        })
        // esc 退出图片查看器
        document.addEventListener('keyup', event => {
            const e = event || window.event
            if (e.keyCode === 27) {
                // 按下 esc
                // 如果非全屏，且查看器已经打开，则退出查看器
                if (!this.isFullscreen() && this.viewerIsShow()) {
                    document.querySelector('.viewer-close').click()
                }
            }
        })
        void [
            'fullscreenchange',
            'webkitfullscreenchange',
            'mozfullscreenchange'
        ].forEach(arg => {
            // 检测全屏状态变化，目前有兼容性问题（这里也相当于绑定了按 esc 退出的事件）
            document.addEventListener(arg, () => {
                // 退出全屏
                if (!this.isFullscreen()) {
                    this.showViewerOther()
                }
            })
        })
        this.updateViewer()
    }
    // 根据作品信息，更新图片查看器配置。每当页面更新时执行一次
    async updateViewer() {
        this.viewerWarpper.style.display = 'none' // 先隐藏 viewerWarpper
        // 获取作品信息
        const data = await API.getWorksData(API.getIllustId())
        const thisOneData = data.body
        // 处理插画或漫画作品，不处理动图作品
        if (thisOneData.illustType === 0 || thisOneData.illustType === 1) {
            // 有多张图片时，创建缩略图
            if (thisOneData.pageCount > 1) {
                const { thumb, original } = thisOneData.urls
                this.viewerUl.innerHTML = new Array(thisOneData.pageCount)
                    .fill(1)
                    .reduce((html, now, index) => {
                        return (html += `<li><img src="${thumb.replace(
                            'p0',
                            'p' + index
                        )}" data-src="${original.replace('p0', 'p' + index)}"></li>`)
                    }, '')
                // 数据更新后，显示 viewerWarpper
                this.viewerWarpper.style.display = 'block'
                // 销毁看图组件
                if (this.myViewer) {
                    this.myViewer.destroy()
                }
                // 重新配置看图组件
                this.newViewer(thisOneData.pageCount, original)
                // 预加载第一张图片
                const img = new Image()
                img.src = original
            }
        }
    }
    // 隐藏查看器的其他元素
    hideViewerOther() {
        document
            .querySelector('.viewer-container')
            .classList.add('black-background')
        // 隐藏底部的其他元素，仍然显示左右切换按钮
        const close = document.querySelector('.viewer-close')
        const oneToOne = document.querySelector('.viewer-one-to-one')
        const navbar = document.querySelector('.viewer-navbar')
        for (const element of [close, oneToOne, navbar]) {
            element.style.display = 'none'
        }
    }
    // 显示查看器的其他元素
    showViewerOther() {
        document
            .querySelector('.viewer-container')
            .classList.remove('black-background')
        // 显示底部隐藏的元素
        const close = document.querySelector('.viewer-close')
        const oneToOne = document.querySelector('.viewer-one-to-one')
        const navbar = document.querySelector('.viewer-navbar')
        for (const element of [close, oneToOne, navbar]) {
            element.style.display = 'block'
        }
    }
    // 在图片100%显示时，使其居中
    setViewerCenter() {
        // 获取图片宽高
        const imgInfo = document.querySelector('.viewer-title').textContent
        // 如果图片尚未加载出来的话，就没有内容，就过一会儿再执行
        if (!imgInfo) {
            setTimeout(() => {
                this.setViewerCenter()
            }, 200)
            return
        }
        const [imgWidth, imgHeight] = /\d{1,5} × \d{1,5}/
            .exec(imgInfo)[0]
            .split(' × ')
        // > '66360324_p5_master1200.jpg (919 × 1300)'
        // < ["919", "1300"]
        this.myViewer.zoomTo(1)
        // 获取网页宽高
        const htmlWidth = document.documentElement.clientWidth
        const htmlHeight = document.documentElement.clientHeight
        // 设置边距
        const setWidth = (htmlWidth - parseInt(imgWidth)) / 2
        let setHeight = (htmlHeight - parseInt(imgHeight)) / 2
        // 当图片高度大于浏览器窗口高度时，居顶显示而不是居中
        if (setHeight < 0) {
            setHeight = 0
        }
        this.myViewer.moveTo(setWidth, setHeight)
    }
    // 判断是否处于全屏状态
    isFullscreen() {
        return !!document.fullscreenElement
    }
    // 判断看图器是否处于显示状态
    viewerIsShow() {
        const viewerContainer = document.querySelector('.viewer-container')
        if (viewerContainer) {
            return viewerContainer.classList.contains('viewer-in')
        } else {
            return false
        }
    }
}
// 仓库
// 存储抓取结果和状态
class Store {
    constructor() {
        this.result = [] // 储存图片信息
        this.idList = [] // 储存从列表中抓取到的作品的 id
        this.rankList = {} // 储存作品在排行榜中的排名
        // 储存和下载有关的状态
        this.states = {
            allowWork: true,
            quickDownload: false // 快速下载当前作品，这个只在作品页内直接下载时使用
        }
        // 储存页面信息，用来生成文件名
        this.pageInfo = {
            pageUserName: '',
            pageUserID: '',
            pageTag: ''
        }
        const truesEvent = [
            evt.events.crawlFinish,
            evt.events.crawlEmpty,
            evt.events.crawlError,
            evt.events.downloadPause,
            evt.events.downloadStop
        ]
        truesEvent.forEach(type => {
            window.addEventListener(type, () => {
                this.states.allowWork = true
            })
        })
        const falseEvent = [evt.events.crawlStart, evt.events.downloadStart]
        falseEvent.forEach(type => {
            window.addEventListener(type, () => {
                this.states.allowWork = false
            })
        })
        window.addEventListener(evt.events.crawlStart, () => {
            this.resetResult()
        })
        window.addEventListener(evt.events.downloadComplete, () => {
            this.resetStates()
        })
    }
    /*
       id - 其实是默认名，包含两部分：id + 序号，如 44920385_p0。动图只有 id 没有序号
       url - 图片大图的 url
       title - 作品的标题
       tags - 作品的 tag 列表
       tagsTranslated - 作品的 tag 列表，附带翻译后的 tag（如果有）
       user - 作品的画师名字
       userid - 作品的画师id
       fullWidth - 第一张图片的宽度
       fullHeight - 第一张图片的高度
       ext - 图片下载时使用的后缀名
       bmk - 作品的收藏数量
       date - 作品的创建日期，格式为 yyyy-MM-dd。如 2019-08-29
       type - 作品的类型，分为 illustration、manga、ugoira
       rank - 作品在排行榜中的排名
       ugoiraInfo - 当作品是动图时才有值，包含 frames（数组）和 mimeType（string）属性
       */
    // 添加每个图片的信息。只需要传递有值的属性
    addResult(data) {
        // 图片详细信息的默认值
        const dataDefault = {
            id: '',
            url: '',
            title: '',
            tags: [],
            tagsTranslated: [],
            user: '',
            userid: '',
            fullWidth: 0,
            fullHeight: 0,
            ext: '',
            bmk: 0,
            date: '',
            type: 0,
            rank: '',
            ugoiraInfo: null
        }
        this.result.push(Object.assign(dataDefault, data))
    }
    getRankList(index) {
        return this.rankList[index]
    }
    setRankList(id, rank) {
        this.rankList[id] = rank
    }
    resetResult() {
        this.result = []
        this.idList = []
        this.rankList = {}
    }
    resetStates() {
        this.states.allowWork = true
        this.states.quickDownload = false
    }
}
// 生成文件名
class FileName {
    constructor() {
        // 用正则过滤不安全的字符，（Chrome 和 Windows 不允许做文件名的字符）
        // 不安全的字符，这里多数是控制字符，需要替换掉
        this.unsafeStr = new RegExp(
            /[\u0001-\u001f\u007f-\u009f\u00ad\u0600-\u0605\u061c\u06dd\u070f\u08e2\u180e\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u206f\ufdd0-\ufdef\ufeff\ufff9-\ufffb\ufffe\uffff]/g
        )
        // 一些需要替换成全角字符的符号，左边是正则表达式的字符
        this.fullWidthDict = [
            ['\\\\', '＼'],
            ['/', '／'],
            [':', '：'],
            ['\\?', '？'],
            ['"', '＂'],
            ['<', '＜'],
            ['>', '＞'],
            ['\\*', '＊'],
            ['\\|', '｜'],
            ['~', '～']
        ]
    }
    // 把一些特殊字符替换成全角字符
    replaceUnsafeStr(str) {
        str = str.replace(this.unsafeStr, '')
        for (let index = 0; index < this.fullWidthDict.length; index++) {
            const rule = this.fullWidthDict[index]
            const reg = new RegExp(rule[0], 'g')
            str = str.replace(reg, rule[1])
        }
        return str
    }
    // 生成文件名，传入参数为图片信息
    getFileName(data) {
        let result = ui.form.userSetName.value
        // 为空时使用 {id}
        result = result || '{id}' // 生成文件名
        const illustTypes = ['illustration', 'manga', 'ugoira'] // 作品类型 0 插画 1 漫画 2 动图
        // 储存每个文件名标记的配置
        const cfg = [
            {
                name: '{p_user}',
                // 标记
                value: store.pageInfo.pageUserName,
                // 值
                prefix: '',
                // 添加在前面的标记
                safe: false
                // 是否是安全的文件名。如果可能包含一些特殊字符，就不安全，要进行替换
            },
            {
                name: '{p_uid}',
                value: store.pageInfo.pageUserID || '',
                prefix: '',
                safe: true
            },
            {
                name: '{p_title}',
                value: document.title
                    .replace(/\[(0|↑|→|▶|↓|║|■|√| )\] /, '')
                    .replace(/^\(\d.*\) /, ''),
                // 去掉标题上的下载状态、消息数量提示
                prefix: '',
                safe: false
            },
            {
                name: '{p_tag}',
                value: store.pageInfo.pageTag,
                prefix: '',
                safe: false
            },
            {
                name: '{id}',
                value: data.id,
                prefix: '',
                safe: true
            },
            {
                name: '{id_num}',
                value: parseInt(data.id),
                prefix: '',
                safe: true
            },
            {
                name: '{p_num}',
                value: parseInt(/\d*$/.exec(data.id)[0]),
                prefix: '',
                safe: true
            },
            {
                name: '{rank}',
                value: data.rank,
                prefix: '',
                safe: true
            },
            {
                name: '{title}',
                value: data.title,
                prefix: 'title_',
                safe: false
            },
            {
                name: '{user}',
                value: data.user,
                prefix: 'user_',
                safe: false
            },
            {
                name: '{userid}',
                value: data.userid,
                prefix: 'uid_',
                safe: true
            },
            {
                name: '{px}',
                value: (function () {
                    if (result.includes('{px}') && data.fullWidth !== undefined) {
                        return data.fullWidth + 'x' + data.fullHeight
                    } else {
                        return ''
                    }
                })(),
                prefix: '',
                safe: true
            },
            {
                name: '{tags}',
                value: data.tags.join(','),
                prefix: 'tags_',
                safe: false
            },
            {
                name: '{tags_translate}',
                value: data.tagsTranslated.join(','),
                prefix: 'tags_',
                safe: false
            },
            {
                name: '{bmk}',
                value: data.bmk,
                prefix: 'bmk_',
                safe: true
            },
            {
                name: '{date}',
                value: data.date,
                prefix: '',
                safe: true
            },
            {
                name: '{type}',
                value: illustTypes[data.type],
                prefix: '',
                safe: true
            }
        ]
        // 替换命名规则里的特殊字符
        result = this.replaceUnsafeStr(result)
        // 上一步会把斜线 / 替换成全角的斜线 ／，这里再替换回来，否则就不能建立文件夹了
        result = result.replace(/／/g, '/')
        // 把命名规则的标记替换成实际值
        for (const item of cfg) {
            if (
                result.includes(item.name) &&
                item.value !== '' &&
                item.value !== null
            ) {
                // 只有当标记有值时才继续操作. 所以没有值的标记会原样保留
                let once = String(item.value)
                // 处理标记值中的特殊字符
                if (!item.safe) {
                    once = this.replaceUnsafeStr(once)
                }
                // 添加标记名称
                if (ui.form.tagNameToFileName.checked) {
                    once = item.prefix + once
                }
                result = result.replace(new RegExp(item.name, 'g'), once) // 将标记替换成最终值，如果有重复的标记，全部替换
            }
        }
        // 处理空值，连续的 '//'。 有时候两个斜线中间的字段是空值，最后就变成两个斜线挨在一起了
        result = result.replace(/undefined/g, '').replace(/\/{2,9}/, '/')
        // 对每一层路径进行处理
        let tempArr = result.split('/')
        tempArr.forEach((str, index, arr) => {
            // 替换路径首尾的空格
            // 把每层路径头尾的 . 变成全角的．因为 Chrome 不允许头尾使用 .
            arr[index] = str
                .trim()
                .replace(/^\./g, '．')
                .replace(/\.$/g, '．')
        })
        result = tempArr.join('/')
        // 去掉头尾的 /
        if (result.startsWith('/')) {
            result = result.replace('/', '')
        }
        if (result.endsWith('/')) {
            result = result.substr(0, result.length - 1)
        }
        // 快速下载时，如果只有一个文件，则不建立文件夹
        if (store.states.quickDownload && store.result.length === 1) {
            const index = result.lastIndexOf('/')
            result = result.substr(index + 1, result.length)
        }
        // 添加后缀名
        result += '.' + data.ext
        return result
    }
}
// 输出传递的文本
class Output {
    constructor() {
        this.outputPanel = document.createElement('div') // 输出面板
        this.outputContent = document.createElement('div') // 输出文本的容器元素
        this.addOutPutPanel()
        this.bindEvent()
    }
    // 添加输出面板
    addOutPutPanel() {
        const outputPanelHTML = `
    <div class="outputWrap">
    <div class="outputClose" title="${lang.transl('_关闭')}">X</div>
    <div class="outputTitle">${lang.transl('_输出信息')}</div>
    <div class="outputContent"></div>
    <div class="outputFooter">
    <div class="outputCopy" title="">${lang.transl('_复制')}</div>
    </div>
    </div>
    `
        document.body.insertAdjacentHTML('beforeend', outputPanelHTML)
        this.outputPanel = document.querySelector('.outputWrap')
        this.outputContent = document.querySelector('.outputContent')
    }
    bindEvent() {
        // 关闭输出面板
        document.querySelector('.outputClose').addEventListener('click', () => {
            this.outputPanel.style.display = 'none'
            this.outputContent.innerHTML = ''
        })
        // 复制输出内容
        document.querySelector('.outputCopy').addEventListener('click', () => {
            const range = document.createRange()
            range.selectNodeContents(this.outputContent)
            window.getSelection().removeAllRanges()
            window.getSelection().addRange(range)
            document.execCommand('copy')
            // 改变提示文字
            document.querySelector('.outputCopy').textContent = lang.transl(
                '_已复制到剪贴板'
            )
            setTimeout(() => {
                window.getSelection().removeAllRanges()
                document.querySelector('.outputCopy').textContent = lang.transl('_复制')
            }, 1000)
        })
        window.addEventListener(evt.events.output, ev => {
            this.output(ev.detail.data)
        })
    }
    // 输出内容
    output(text) {
        if (text) {
            this.outputContent.innerHTML = text
            this.outputPanel.style.display = 'block'
        }
    }
}
// 转换动图
class ConvertUgoira {
    constructor() {
        this.gifWorkerUrl = ''
        this.tip = ''
        this.count = 0 // 统计有几个转换任务
        this.loadWorkerJS()
        this.working = false
    }
    set setCount(num) {
        this.count = num
        // 在下载区域显示转换数量
        if (this.count > 0) {
            this.tip = '正在转换动图，剩余排队个数：' + (this.count - 1).toString()
        } else {
            this.tip = ''
        }
        evt.fire(evt.events.convertChange, this.tip)
    }
    async loadWorkerJS() {
        // 添加 zip 的 worker 文件
        let zipWorker = await fetch(chrome.extension.getURL('lib/z-worker.js'))
        const zipWorkerBolb = await zipWorker.blob()
        const zipWorkerUrl = URL.createObjectURL(zipWorkerBolb)
        if (zip) {
            zip.workerScripts = {
                inflater: [zipWorkerUrl]
            }
        }
        // 添加 gif 的 worker 文件
        let gifWorker = await fetch(chrome.extension.getURL('lib/gif.worker.js'))
        const gifWorkerBolb = await gifWorker.blob()
        this.gifWorkerUrl = URL.createObjectURL(gifWorkerBolb)
    }
    // 解压 zip 文件
    async readZip(zipFile, ugoiraInfo) {
        return new Promise(function (resolve, reject) {
            zip.createReader(
                new zip.BlobReader(zipFile),
                zipReader => {
                    // 读取成功时的回调函数，files 保存了文件列表的信息
                    zipReader.getEntries(files => {
                        // 创建数组，长度与文件数量一致
                        const imgFile = new Array(files.length)
                        // 获取每个文件的数据。因为这个操作是异步的，所以必须检查图片数量
                        files.forEach(file => {
                            file.getData(
                                new zip.Data64URIWriter(ugoiraInfo.mime_type),
                                data => {
                                    const fileNo = parseInt(file.filename)
                                    imgFile[fileNo] = data
                                    // 把图片按原编号存入对应的位置。这是因为我怀疑有时候 zip.Data64URIWriter 的回调顺序不一致，直接 push 可能导致图片的顺序乱掉
                                    for (let i = 0; i < imgFile.length; i++) {
                                        // 检测到空值说明没有添加完毕，退出循环
                                        if (!imgFile[i]) {
                                            break
                                        }
                                        // 如果检查到最后一项，说明添加完毕
                                        if (i === imgFile.length - 1) {
                                            resolve(imgFile)
                                        }
                                    }
                                }
                            )
                        })
                    })
                },
                message => {
                    log.error('error: readZIP error.', 2)
                    reject(new Error('readZIP error: ' + message))
                }
            )
        })
    }
    // 添加每一帧的数据
    async getFrameData(imgFile, type = 'webm') {
        const resultList = new Array(imgFile.length)
        return new Promise(function (resolve, reject) {
            const drawImg = function (index) {
                const img = new Image()
                img.onload = function (event) {
                    // 处理视频
                    if (type === 'webm') {
                        const canvasEl = document.createElement('canvas')
                        const ctx = canvasEl.getContext('2d')
                        canvasEl.width = img.width
                        canvasEl.height = img.height
                        ctx.drawImage(img, 0, 0)
                        resultList[index] = canvasEl
                    }
                    // 处理 gif
                    if (type === 'gif') {
                        resultList[index] = img
                    }
                    // 继续下一个
                    if (index < imgFile.length - 1) {
                        index++
                        drawImg(index)
                    } else {
                        resolve(resultList)
                    }
                }
                img.src = imgFile[index]
            }
            // onload 完成时的顺序和添加事件时的顺序不一致，为了避免图片顺序乱掉，这里逐个添加每个图片
            drawImg(0)
        })
    }
    // 编码视频
    async encodeVideo(encoder) {
        return new Promise(function (resolve, reject) {
            encoder.compile(false, function (video) {
                resolve(video)
            })
        })
    }
    // 开始转换，主要是解压文件
    async start(file, info) {
        return new Promise(async (resolve, reject) => {
            // 将压缩包里的图片转换为 base64 字符串
            const base64Arr = await this.readZip(file, info)
            resolve(base64Arr)
        })
    }
    complete() {
        this.setCount = this.count - 1
        this.working = false
    }
    // 转换成 webm
    async webm(file, info) {
        return new Promise(async (resolve, reject) => {
            // 创建视频编码器
            const encoder = new Whammy.Video()
            // 获取解压后的图片数据
            const base64Arr = await this.start(file, info)
            // 生成每一帧的数据
            const canvasData = await this.getFrameData(base64Arr)
            // 添加帧数据
            for (let index = 0; index < canvasData.length; index++) {
                const base64 = canvasData[index]
                encoder.add(base64, info.frames[index].delay)
            }
            // 获取生成的视频
            file = await this.encodeVideo(encoder)
            this.complete()
            resolve(file)
        })
    }
    // 转换成 gif
    async gif(file, info) {
        return new Promise(async (resolve, reject) => {
            // 配置 gif.js
            let gif = new GIF({
                workers: 4,
                quality: 10,
                workerScript: this.gifWorkerUrl
            })
            // 绑定渲染完成事件
            gif.on('finished', file => {
                this.complete()
                resolve(file)
            })
            // 获取解压后的图片数据
            const base64Arr = await this.start(file, info)
            // 生成每一帧的数据
            const imgData = await this.getFrameData(base64Arr, 'gif')
            // 添加帧数据
            for (let index = 0; index < imgData.length; index++) {
                gif.addFrame(imgData[index], {
                    delay: info.frames[index].delay
                })
            }
            // 渲染 gif
            gif.render()
        })
    }
}
// 针对不同页面类型，进行初始化
class InitPageBase {
    constructor(crawler) {
        this.setWantPageWrap = ui.form.querySelector('.formOption1')
        this.setWantPage = this.setWantPageWrap.querySelector('.setWantPage')
        this.setWantPageTip1 = this.setWantPageWrap.querySelector(
            '.setWantPageTip1'
        )
        this.setWantPageTip2 = this.setWantPageWrap.querySelector(
            '.setWantPageTip2'
        )
    }
    // 初始化
    init() {
        this.clearOldElements()
        this.appendCenterBtns()
        this.setFormOptin()
        this.appendElseEl()
    }
    // 清空之前添加的元素
    clearOldElements() {
        document.getElementById('centerWrap_btns_free').innerHTML = ''
        // 删除右侧的快速下载按钮
        const quickDownBtn = document.getElementById('quick_down_btn')
        if (quickDownBtn) {
            quickDownBtn.remove()
        }
        // 删除快速筛选元素
        const fastScreen = document.querySelector('.fastScreenArea')
        if (fastScreen) {
            fastScreen.remove()
        }
    }
    // 添加中间按钮
    appendCenterBtns() { }
    // 添加其他元素（如果有）
    appendElseEl() { }
    // 在某些页面里，隐藏不需要的选项。参数是数组，传递设置项的编号。
    hideNotNeedOption(no) {
        for (const num of no) {
            const el = ui.form.querySelector('.formOption' + num.toString())
            el.style.display = 'none'
        }
    }
    // 设置表单里的选项。主要是设置页数，隐藏不需要的选项。
    setFormOptin() {
        // 设置页数
        this.setWantPageTip1.textContent = lang.transl('_页数')
        this.setWantPageTip1.dataset.tip = lang.transl('_checkWantPageRule1Arg8')
        this.setWantPageTip2.textContent = lang.transl('_数字提示1')
        this.setWantPage.value = '1'
    }
}
// 初始化首页
class InitIndexPage extends InitPageBase {
    constructor(crawler) {
        super(crawler)
        this.downIdButton = document.createElement('button')
        this.downIdInput = document.createElement('textarea')
        this.ready = false
        this.crawler = crawler
    }
    appendCenterBtns() {
        this.downIdButton = ui.addCenterButton(
            Colors.blue,
            lang.transl('_输入id进行抓取'),
            [['id', 'down_id_button']]
        )
        this.downIdButton.addEventListener(
            'click',
            () => {
                if (!this.ready) {
                    // 还没准备好
                    ui.hideCenterPanel()
                    this.downIdInput.style.display = 'block'
                    this.downIdInput.focus()
                    document.documentElement.scrollTop = 0
                } else {
                    this.crawler.readyCrawl()
                }
            },
            false
        )
    }
    appendElseEl() {
        // 用于输入id的输入框
        this.downIdInput = document.createElement('textarea')
        this.downIdInput.id = 'down_id_input'
        this.downIdInput.style.display = 'none'
        this.downIdInput.setAttribute(
            'placeholder',
            lang.transl('_输入id进行抓取的提示文字')
        )
        DOM.insertToHead(this.downIdInput)
        this.downIdInput.addEventListener('change', () => {
            // 当输入框内容改变时检测，非空值时显示下载区域
            if (this.downIdInput.value !== '') {
                this.ready = true
                ui.showCenterPanel()
                this.downIdButton.textContent = lang.transl('_开始抓取')
            } else {
                this.ready = false
                ui.hideCenterPanel()
                this.downIdButton.textContent = lang.transl('_输入id进行抓取')
            }
        })
    }
    setFormOptin() {
        this.hideNotNeedOption([1])
    }
}
//初始化作品页
class InitWorksPage extends InitPageBase {
    constructor(crawler) {
        super(crawler)
        this.crawler = crawler
        // 初始化快速收藏功能和图片查看器
        new QuickBookmark()
        viewer.initViewer()
        // 页面切换时初始化图片查看器
        window.addEventListener(evt.events.pageSwitch, () => {
            viewer.initViewer()
        })
    }
    appendCenterBtns() {
        ui.addCenterButton(
            Colors.blue,
            lang.transl('_从本页开始抓取new')
        ).addEventListener('click', () => {
            this.crawler.crawlDirection = -1
            this.crawler.readyCrawl()
        })
        ui.addCenterButton(
            Colors.blue,
            lang.transl('_从本页开始抓取old')
        ).addEventListener('click', () => {
            this.crawler.crawlDirection = 1
            this.crawler.readyCrawl()
        })
        const downRelatedBtn = ui.addCenterButton(
            Colors.blue,
            lang.transl('_抓取相关作品')
        )
        downRelatedBtn.addEventListener(
            'click',
            () => {
                this.crawler.crawlRelated = true
                this.crawler.readyCrawl()
            },
            false
        )
    }
    appendElseEl() {
        // 在右侧创建快速下载按钮
        const quickDownBtn = document.createElement('div')
        quickDownBtn.id = 'quick_down_btn'
        quickDownBtn.textContent = '↓'
        quickDownBtn.setAttribute('title', lang.transl('_快速下载本页'))
        document.body.appendChild(quickDownBtn)
        quickDownBtn.addEventListener(
            'click',
            () => {
                store.states.quickDownload = true
                this.crawler.readyCrawl()
            },
            false
        )
    }
    setFormOptin() {
        // 设置抓取的作品数量
        this.setWantPageTip1.textContent = lang.transl('_个数')
        this.setWantPageTip1.dataset.tip =
            lang.transl('_checkWantPageRule1Arg8') +
            '<br>' +
            lang.transl('_相关作品大于0')
        this.setWantPageTip2.textContent = lang.transl('_数字提示1')
        this.setWantPage.value = '-1'
    }
}
// 初始化用户页面
class InitUserPage extends InitPageBase {
    constructor(crawler) {
        super(crawler)
        this.crawler = crawler
    }
    appendCenterBtns() {
        ui.addCenterButton(Colors.blue, lang.transl('_开始抓取'), [
            ['title', lang.transl('_开始抓取') + lang.transl('_默认下载多页')]
        ]).addEventListener('click', () => {
            this.crawler.readyCrawl()
        })
        // 添加下载推荐作品的按钮，只在旧版收藏页面使用
        const columnTitle = document.querySelector('.column-title')
        if (columnTitle) {
            const downRecmdBtn = ui.addCenterButton(
                Colors.blue,
                lang.transl('_抓取推荐作品'),
                [['title', lang.transl('_抓取推荐作品Title')]]
            )
            downRecmdBtn.addEventListener(
                'click',
                () => {
                    this.crawler.crawlRecommended = true
                    this.crawler.readyCrawl()
                },
                false
            )
        }
        // 如果存在 token，则添加“添加 tag”按钮
        if (API.getToken()) {
            let btn = ui.addCenterButton(Colors.green, lang.transl('_添加tag'), [
                ['title', lang.transl('_添加tag')]
            ])
            btn.id = 'add_tag_btn'
            new BookmarksAddTag(btn)
        }
    }
    setFormOptin() {
        // 设置页数
        this.setWantPageTip1.textContent = lang.transl('_页数')
        this.setWantPageTip1.dataset.tip = lang.transl('_checkWantPageRule1Arg8')
        this.setWantPageTip2.textContent = lang.transl('_数字提示1')
        this.setWantPage.value = '-1'
        // 在书签页面隐藏只要书签选项
        if (location.href.includes('bookmark.php')) {
            this.hideNotNeedOption([11])
        }
    }
}
// 初始化搜索页
class InitSearchPage extends InitPageBase {
    constructor(crawler) {
        super(crawler)
        this.crawler = crawler
    }
    appendCenterBtns() {
        ui.addCenterButton(Colors.blue, lang.transl('_开始抓取'), [
            ['title', lang.transl('_开始抓取') + lang.transl('_默认下载多页')]
        ]).addEventListener('click', () => {
            this.crawler.readyCrawl()
        })
    }
    appendElseEl() {
        this.fastScreen()
    }
    // 打开快速筛选链接
    openFastScreenLink(secondTag) {
        // 拼接两个 tag。因为搜索页面可以无刷新切换搜索的 tag，所以从这里动态获取
        const firstTag = pageInfo.getPageTag.split(' ')[0]
        const fullTag = encodeURIComponent(firstTag + ' ' + secondTag)
        // 用新的 tag 替换掉当前网址里的 tag
        let newURL = location.href.replace(
            encodeURIComponent(pageInfo.getPageTag),
            fullTag
        )
        // 添加 s_mode=s_tag 宽松匹配标签
        let u = new URL(newURL)
        u.searchParams.set('s_mode', 's_tag')
        location.href = u.toString()
    }
    // 添加快速筛选功能
    fastScreen() {
        // 判断插入点的元素有没有加载出来
        let target = document.querySelector('header')
        if (!target) {
            setTimeout(() => {
                this.fastScreen()
            }, 300)
            return
        }
        const favNums = [
            '100users入り',
            '500users入り',
            '1000users入り',
            '3000users入り',
            '5000users入り',
            '10000users入り',
            '20000users入り',
            '30000users入り',
            '50000users入り'
        ] // 200 和 2000 的因为数量太少，不添加。40000 的也少
        const fastScreenArea = document.createElement('div')
        fastScreenArea.className = 'fastScreenArea'
        favNums.forEach(secondTag => {
            let a = document.createElement('a')
            a.innerText = secondTag
            a.href = 'javascript:viod(0)'
            a.onclick = () => {
                this.openFastScreenLink(secondTag)
            }
            fastScreenArea.appendChild(a)
        })
        target.insertAdjacentElement('afterend', fastScreenArea)
    }
    setFormOptin() {
        this.crawler.maxCount = 1000
        this.setWantPageTip1.textContent = lang.transl('_页数')
        this.setWantPageTip1.dataset.tip = lang.transl('_checkWantPageRule1Arg8')
        this.setWantPageTip2.textContent = `1 - ${this.crawler.maxCount}`
        this.setWantPage.value = this.crawler.maxCount.toString()
    }
}
// 初始化地区排行榜页面
class InitAreaRankingPage extends InitPageBase {
    constructor(crawler) {
        super(crawler)
        this.crawler = crawler
    }
    appendCenterBtns() {
        ui.addCenterButton(Colors.blue, lang.transl('_抓取本页作品'), [
            ['title', lang.transl('_抓取本页作品Title')]
        ]).addEventListener('click', () => {
            this.crawler.readyCrawl()
        })
    }
    setFormOptin() {
        this.hideNotNeedOption([1])
    }
}
// 初始化排行榜页面
class InitRankingPage extends InitPageBase {
    constructor(crawler) {
        super(crawler)
        this.crawler = crawler
    }
    appendCenterBtns() {
        ui.addCenterButton(Colors.blue, lang.transl('_抓取本排行榜作品'), [
            ['title', lang.transl('_抓取本排行榜作品Title')]
        ]).addEventListener('click', () => {
            this.crawler.readyCrawl()
        })
        // 判断当前页面是否有“首次登场”标记
        let debutModes = ['daily', 'daily_r18', 'rookie', '']
        let mode = API.getURLField(location.href, 'mode')
        if (debutModes.includes(mode)) {
            ui.addCenterButton(Colors.blue, lang.transl('_抓取首次登场的作品'), [
                ['title', lang.transl('_抓取首次登场的作品Title')]
            ]).addEventListener('click', () => {
                ui.form.debut.value = '1'
                this.crawler.readyCrawl()
            })
        }
    }
    setFormOptin() {
        // 设置抓取的作品数量
        this.crawler.maxCount = 500
        this.setWantPageTip1.textContent = lang.transl('_个数')
        this.setWantPageTip1.dataset.tip = lang.transl('_要获取的作品个数2')
        this.setWantPageTip2.textContent = `1 - ${this.crawler.maxCount}`
        this.setWantPage.value = this.crawler.maxCount.toString()
    }
}
// 初始化 pixivision 页面
class InitPixivisionPage extends InitPageBase {
    constructor(crawler) {
        super(crawler)
        this.crawler = crawler
    }
    appendCenterBtns() {
        const typeA = document.querySelector('a[data-gtm-action=ClickCategory]')
        const type = typeA.dataset.gtmLabel
        if (type === 'illustration' || type === 'manga' || type === 'cosplay') {
            // 在插画、漫画、cosplay类型的页面上创建下载功能
            ui.addCenterButton(
                Colors.blue,
                lang.transl('_抓取该页面的图片')
            ).addEventListener(
                'click',
                () => {
                    this.crawler.readyCrawl()
                },
                false
            )
        }
    }
    setFormOptin() {
        this.hideNotNeedOption([1, 2, 3, 4, 5, 6, 7, 11, 12, 13])
    }
}
// 初始化 bookmark_detail 页面
class InitBookmarkDetailPage extends InitPageBase {
    constructor(crawler) {
        super(crawler)
        this.crawler = crawler
    }
    appendCenterBtns() {
        ui.addCenterButton(Colors.blue, lang.transl('_抓取相似图片'), [
            ['title', lang.transl('_抓取相似图片')]
        ]).addEventListener(
            'click',
            () => {
                this.crawler.readyCrawl()
            },
            false
        )
    }
    setFormOptin() {
        // 设置抓取的作品数量
        // 实际上的数字可以更大，这里只是预设一个限制。
        this.crawler.maxCount = 500
        this.setWantPageTip1.textContent = lang.transl('_个数')
        this.setWantPageTip1.dataset.tip = lang.transl('_要获取的作品个数2')
        this.setWantPageTip2.textContent = `1 - ${this.crawler.maxCount}`
        this.setWantPage.value = this.crawler.maxCount.toString()
    }
}
// 初始化 关注的新作品页面
class InitBookmarkNewIllustPage extends InitPageBase {
    constructor(crawler) {
        super(crawler)
        this.crawler = crawler
    }
    appendCenterBtns() {
        ui.addCenterButton(Colors.blue, lang.transl('_开始抓取'), [
            ['title', lang.transl('_开始抓取') + lang.transl('_默认下载多页')]
        ]).addEventListener('click', () => {
            this.crawler.readyCrawl()
        })
    }
    appendElseEl() {
        // 添加 R-18 页面的链接
        const r18Link = `<li><a href="/bookmark_new_illust_r18.php">R-18</a></li>`
        const target = document.querySelector('.menu-items')
        if (target) {
            target.insertAdjacentHTML('beforeend', r18Link)
        }
    }
    setFormOptin() {
        // 设置页数
        this.crawler.maxCount = 100
        this.setWantPageTip1.textContent = lang.transl('_页数')
        this.setWantPageTip1.dataset.tip = lang.transl('_checkWantPageRule1Arg8')
        this.setWantPageTip2.textContent = `1 - ${this.crawler.maxCount}`
        this.setWantPage.value = this.crawler.maxCount.toString()
    }
}
// 初始化 大家的新作品页面
class InitNewIllustPage extends InitPageBase {
    constructor(crawler) {
        super(crawler)
        this.timer = 0
        this.crawler = crawler
    }
    appendCenterBtns() {
        ui.addCenterButton(Colors.blue, lang.transl('_开始抓取'), [
            ['title', lang.transl('_下载大家的新作品')]
        ]).addEventListener('click', () => {
            this.crawler.readyCrawl()
        })
    }
    appendElseEl() {
        // 添加 R-18 页面的链接
        const r18Link = `<a href="/new_illust_r18.php" style="color:#179fdd;padding-left:20px;">R-18</a>`
        const target = document.querySelector('#root h1')
        if (target) {
            target.insertAdjacentHTML('beforeend', r18Link)
            clearTimeout(this.timer)
        } else {
            this.timer = setTimeout(() => {
                this.appendElseEl()
            }, 300)
        }
    }
    setFormOptin() {
        // 设置抓取的作品数量
        // 最大有 10000 个。但是输入框的默认值设置的少一些比较合理。
        this.crawler.maxCount = 10000
        this.setWantPageTip1.textContent = lang.transl('_个数')
        this.setWantPageTip1.dataset.tip = lang.transl('_要获取的作品个数2')
        this.setWantPageTip2.textContent = `1 - ${this.crawler.maxCount}`
        this.setWantPage.value = '100'
    }
}
// 初始化发现页面
class InitDiscoverPage extends InitPageBase {
    constructor(crawler) {
        super(crawler)
        this.crawler = crawler
    }
    appendCenterBtns() {
        ui.addCenterButton(Colors.blue, lang.transl('_抓取当前作品'), [
            ['title', lang.transl('_抓取当前作品Title')]
        ]).addEventListener('click', () => {
            this.crawler.readyCrawl()
        })
    }
    setFormOptin() {
        this.hideNotNeedOption([1])
    }
    appendElseEl() {
        const deleteWorks = new DeleteWorks('._2RNjBox')
        deleteWorks.addClearMultipleBtn()
        deleteWorks.addClearUgoiraBtn()
        deleteWorks.addManuallyDeleteBtn()
    }
}
// 定义每个页面的抓取流程
class CrawlPageBase {
    constructor() {
        /*
            一般流程：
            准备抓取
            获取作品列表
            获取作品列表完毕
            获取作品信息
            获取作品信息完毕
            */
        this.crawlNumber = 0 // 要抓取的个数/页数
        this.imgNumberPerWork = 0 // 每个作品下载几张图片。0为不限制，全部下载。改为1则只下载第一张。这是因为有时候多p作品会导致要下载的图片过多，此时可以设置只下载前几张，减少下载量
        this.maxCount = 1000 // 当前页面类型最多有多少个页面/作品
        this.startpageNo = 1 // 列表页开始抓取时的页码，只在 api 需要页码时使用。目前有搜索页、排行榜页、关注的新作品页使用。
        this.listPageFinished = 0 // 记录一共抓取了多少个列表页。使用范围同上。
        this.ajaxThreadsDefault = 10 // 抓取时的并发连接数默认值，也是最大值
        this.ajaxThreads = this.ajaxThreadsDefault // 抓取时的并发连接数
        this.ajaxThreadsFinished = 0 // 统计有几个并发线程完成所有请求。统计的是并发线程（ ajaxThreads ）而非请求数
    }
    // 作品个数/页数的输入不合法
    getWantPageError() {
        evt.fire(evt.events.crawlError)
        const msg = lang.transl('_参数不合法')
        window.alert(msg)
        throw new Error(msg)
    }
    // 检查用户输入的页数/个数设置，并返回提示信息
    // 可以为 -1，或者大于 0
    checkWantPageInput(crawlPartTip, crawlAllTip) {
        const temp = parseInt(ui.form.setWantPage.value)
        // 如果比 1 小，并且不是 -1，则不通过
        if ((temp < 1 && temp !== -1) || isNaN(temp)) {
            // 比 1 小的数里，只允许 -1 , 0 也不行
            this.getWantPageError()
        }
        if (temp >= 1) {
            log.warning(crawlPartTip.replace('-num-', temp.toString()))
        } else if (temp === -1) {
            log.warning(crawlAllTip)
        }
        return temp
    }
    // 检查用户输入的页数/个数设置
    // 必须大于 0
    checkWantPageInputGreater0() {
        const result = API.checkNumberGreater0(ui.form.setWantPage.value)
        if (result.result) {
            return result.value
        } else {
            this.getWantPageError()
        }
    }
    // 获取作品张数设置
    getImgNumberPerWork() {
        const check = API.checkNumberGreater0(ui.form.imgNumberPerWork.value)
        if (check.result) {
            log.warning(lang.transl('_作品张数提醒', check.value.toString()))
            return check.value
        } else {
            return 0
        }
    }
    // 设置要获取的作品数或页数。有些页面使用，有些页面不使用。使用时再具体定义
    getWantPage() { }
    checkNotAllowPage() {
        if (location.href.includes('novel')) {
            window.alert('Not support novel page!')
            throw new Error('Not support novel page!')
        }
        if (location.href.includes('/tags.php')) {
            window.alert('Not support page!')
            throw new Error('Not support page!')
        }
    }
    // 准备抓取，进行抓取之前的一些检查工作。必要时可以在子类中改写
    async readyCrawl() {
        // 检查是否可以开始抓取
        this.checkNotAllowPage()
        if (!store.states.allowWork) {
            window.alert(lang.transl('_当前任务尚未完成2'))
            return
        }
        evt.fire(evt.events.crawlStart)
        log.clear()
        log.success(lang.transl('_任务开始0'))
        titleBar.changeTitle('↑')
        ui.hideCenterPanel()
        this.getWantPage()
        filter.init()
        // 检查是否设置了作品张数限制
        this.imgNumberPerWork = this.getImgNumberPerWork()
        await pageInfo.store()
        // 进入第一个抓取方法
        this.nextStep()
    }
    // 当可以开始抓取时，进入下一个流程。默认情况下，开始获取作品列表。如有不同，由子类具体定义
    nextStep() {
        this.getIdList()
    }
    // 作品列表获取完毕，开始抓取作品内容页
    getIdListFinished() {
        // 列表页获取完毕后，可以在这里重置一些变量
        this.resetGetIdListStatus()
        if (store.idList.length === 0) {
            return this.noResult()
        }
        if (store.idList.length <= this.ajaxThreadsDefault) {
            this.ajaxThreads = store.idList.length
        } else {
            this.ajaxThreads = this.ajaxThreadsDefault
        }
        for (let i = 0; i < this.ajaxThreads; i++) {
            this.getWorksData()
        }
    }
    // 获取作品的数据
    // 在重试时会传入要重试的 id
    async getWorksData(id) {
        id = id || store.idList.shift()
        let data
        try {
            // 发起请求
            data = await API.getWorksData(id)
        } catch (error) {
            //  请求成功，但 response.ok 错误。不重试请求，跳过该作品继续抓取
            if (error.status) {
                this.logErrorStatus(error.status, id)
                this.afterGetWorksData()
            } else {
                // 请求失败，会重试这个请求
                setTimeout(() => {
                    this.getWorksData(id)
                }, 2000)
            }
            return
        }
        // 获取需要检查的信息
        const body = data.body
        const fullWidth = body.width // 原图宽度
        const fullHeight = body.height // 原图高度
        const bmk = body.bookmarkCount // 收藏数
        const tagArr = body.tags.tags // 取出 tag 信息
        const tags = [] // 保存 tag 列表
        const tagTranslation = [] // 保存 tag 列表，附带翻译后的 tag
        for (const tagData of tagArr) {
            tags.push(tagData.tag)
            tagTranslation.push(tagData.tag)
            if (tagData.translation && tagData.translation.en) {
                tagTranslation.push(tagData.translation.en)
            }
        }
        const filterOpt = {
            illustType: body.illustType,
            tags: tags,
            bookmarkCount: bmk,
            bookmarkData: body.bookmarkData,
            width: fullWidth,
            height: fullHeight
        }
        // 检查通过
        if (filter.check(filterOpt)) {
            const illustId = body.illustId
            const title = body.illustTitle // 作品标题
            const userid = body.userId // 用户id
            const user = body.userName // 用户名
            let rank = '' // 保存作品在排行榜上的编号
            let testRank = store.getRankList(body.illustId)
            if (testRank !== undefined) {
                rank = '#' + testRank
            }
            // 储存作品信息
            if (body.illustType !== 2) {
                // 插画或漫画
                // 下载该作品的前面几张
                let pNo = body.pageCount
                if (this.imgNumberPerWork > 0 && this.imgNumberPerWork <= pNo) {
                    pNo = this.imgNumberPerWork
                }
                const imgUrl = body.urls.original // 作品的原图 URL
                const tempExt = imgUrl.split('.')
                const ext = tempExt[tempExt.length - 1]
                // 添加作品信息
                // 通过循环添加每个图片的 id 和 url
                for (let i = 0; i < pNo; i++) {
                    store.addResult({
                        id: illustId + '_p' + i,
                        url: imgUrl.replace('p0', 'p' + i),
                        title: title,
                        tags: tags,
                        tagsTranslated: tagTranslation,
                        user: user,
                        userid: userid,
                        fullWidth: fullWidth,
                        fullHeight: fullHeight,
                        ext: ext,
                        bmk: bmk,
                        date: body.createDate.split('T')[0],
                        type: body.illustType,
                        rank: rank
                    })
                }
                this.outputImgNum()
            } else if (body.illustType === 2) {
                // 动图
                // 获取动图的信息
                const meta = await API.getUgoiraMeta(illustId)
                // 动图帧延迟数据
                const ugoiraInfo = {
                    frames: meta.body.frames,
                    mime_type: meta.body.mime_type
                }
                const ext = ui.form.ugoiraSaveAs.value // 扩展名可能是 webm、gif、zip
                store.addResult({
                    id: illustId,
                    url: meta.body.originalSrc,
                    title: title,
                    tags: tags,
                    tagsTranslated: tagTranslation,
                    user: user,
                    userid: userid,
                    fullWidth: fullWidth,
                    fullHeight: fullHeight,
                    ext: ext,
                    bmk: bmk,
                    date: body.createDate.split('T')[0],
                    type: body.illustType,
                    rank: rank,
                    ugoiraInfo: ugoiraInfo
                })
                this.outputImgNum()
            }
        }
        this.afterGetWorksData()
    }
    // 每当获取完一个作品的信息
    afterGetWorksData() {
        if (store.idList.length > 0) {
            // 如果存在下一个作品，则
            this.getWorksData()
        } else {
            // 没有剩余作品
            this.ajaxThreadsFinished++
            if (this.ajaxThreadsFinished === this.ajaxThreads) {
                // 如果所有并发请求都执行完毕，复位
                this.ajaxThreadsFinished = 0
                this.crawFinished()
            }
        }
    }
    // 抓取完毕
    crawFinished() {
        if (store.result.length === 0) {
            return this.noResult()
        }
        this.sortResult()
        log.log(lang.transl('_抓取完毕'), 2)
        evt.fire(evt.events.crawlFinish)
        // 显示中间面板
        if (!store.states.quickDownload) {
            ui.showCenterPanel()
        }
    }
    // 网络请求状态异常时输出提示
    logErrorStatus(status, id) {
        log.error(lang.transl('_无权访问2', id), 1)
        switch (status) {
            case 0:
                console.log(lang.transl('_作品页状态码0'))
                break
            case 400:
                console.log(lang.transl('_作品页状态码400'))
                break
            case 403:
                console.log(lang.transl('_作品页状态码403'))
                break
            case 404:
                console.log(lang.transl('_作品页状态码404') + ' ' + id)
                break
            default:
                break
        }
    }
    // 在抓取图片网址时，输出提示
    outputImgNum() {
        log.log(
            lang.transl('_抓取图片网址的数量', store.result.length.toString()),
            1,
            false
        )
    }
    // 抓取结果为 0 时输出提示
    noResult() {
        evt.fire(evt.events.crawlEmpty)
        titleBar.reset()
        log.error(lang.transl('_抓取结果为零'), 2)
        window.alert(lang.transl('_抓取结果为零'))
    }
    // 抓取完成后，对结果进行排序
    sortResult() { }
}
// 抓取首页
class CrawlIndexPage extends CrawlPageBase {
    nextStep() {
        // 在主页通过id抓取时，不需要获取列表页，直接完成
        log.log(lang.transl('_开始获取作品页面'))
        this.getIdList()
    }
    getWantPage() { }
    getIdList() {
        const textarea = document.getElementById('down_id_input')
        // 检查 id
        const tempSet = new Set(textarea.value.split('\n'))
        const idValue = Array.from(tempSet)
        for (const id of idValue) {
            // 如果有 id 不是数字，或者处于非法区间，中止任务
            const nowId = parseInt(id)
            if (isNaN(nowId) || nowId < 22 || nowId > 99999999) {
                log.error(lang.transl('_id不合法'), 0, false)
            } else {
                store.idList.push(nowId.toString())
            }
        }
        this.getIdListFinished()
    }
    resetGetIdListStatus() { }
}
// 抓取作品页
class CrawlWorksPage extends CrawlPageBase {
    constructor() {
        super(...arguments)
        this.crawlDirection = 0 // 抓取方向，在作品页内指示抓取新作品还是旧作品
        /*
            -1 抓取新作品
            0 不设置抓取方向
            1 抓取旧作品
            */
        this.crawlRelated = false // 是否下载相关作品（作品页内的）
    }
    getWantPage() {
        if (store.states.quickDownload) {
            // 快速下载
            this.crawlNumber = 1
        } else {
            // 检查下载页数的设置
            if (!this.crawlRelated) {
                this.crawlNumber = this.checkWantPageInput(
                    lang.transl('_checkWantPageRule1Arg3'),
                    lang.transl('_checkWantPageRule1Arg4')
                )
            } else {
                // 相关作品的提示
                this.crawlNumber = this.checkWantPageInput(
                    lang.transl('_checkWantPageRule1Arg9'),
                    lang.transl('_checkWantPageRule1Arg10')
                )
            }
        }
    }
    nextStep() {
        // 下载相关作品
        if (this.crawlRelated) {
            this.getRelatedList()
        } else if (store.states.quickDownload) {
            // 快速下载
            store.idList.push(API.getIllustId(window.location.href))
            log.log(lang.transl('_开始获取作品页面'))
            this.getIdListFinished()
        } else {
            // 向前向后下载
            this.getIdList()
        }
    }
    async getIdList() {
        let type = ['illusts', 'manga']
        let idList = await API.getUserWorksByType(DOM.getUserId(), type)
        // 储存符合条件的 id
        let nowId = parseInt(API.getIllustId(window.location.href))
        idList.forEach(id => {
            let idNum = parseInt(id)
            // 新作品
            if (idNum >= nowId && this.crawlDirection === -1) {
                store.idList.push(id)
            } else if (idNum <= nowId && this.crawlDirection === 1) {
                // 旧作品
                store.idList.push(id)
            }
        })
        // 当设置了下载个数时，进行裁剪
        if (this.crawlNumber !== -1) {
            // 新作品 升序排列
            if (this.crawlDirection === -1) {
                store.idList.sort(function (x, y) {
                    return parseInt(x) - parseInt(y)
                })
            } else {
                // 旧作品 降序排列
                store.idList.sort(function (x, y) {
                    return parseInt(y) - parseInt(x)
                })
            }
            store.idList = store.idList.splice(0, this.crawlNumber)
        }
        log.log(
            lang.transl('_列表抓取完成开始获取作品页', store.idList.length.toString())
        )
        this.getIdListFinished()
    }
    // 下载相关作品时使用
    async getRelatedList() {
        let data = await API.getRelatedData(API.getIllustId())
        const recommendData = data.body.recommendMethods
        // 取出相关作品的 id 列表
        let recommendIdList = Object.keys(recommendData)
        // 当设置了下载个数时，进行裁剪
        if (this.crawlNumber !== -1) {
            recommendIdList = recommendIdList.reverse().slice(0, this.crawlNumber)
        }
        store.idList = store.idList.concat(recommendIdList)
        log.log(lang.transl('_相关作品抓取完毕', store.idList.length.toString()))
        this.getIdListFinished()
    }
    resetGetIdListStatus() {
        this.crawlDirection = 0 // 解除下载方向的标记
        this.crawlRelated = false // 解除下载相关作品的标记
    }
}
// 抓取用户页面
class CrawlUserPage extends CrawlPageBase {
    constructor() {
        super(...arguments)
        this.idList = [] // 储存从列表页获取到的 id
        this.hasTag = false // 是否带 tag
        this.tag = '' // 储存当前页面带的 tag，不过有时并没有
        this.listType = 0 // pageType 2 里的页面类型，都是列表页
        this.requsetNumber = 0 // 根据页数，计算要抓取的作品个数
        this.onceRequest = 100 // 每次请求多少个数量
        this.offset = 0 // 要去掉的作品数量
        this.crawlRecommended = false // 是否抓取推荐作品（收藏页面下方）
    }
    getWantPage() {
        let pageTip = lang.transl('_checkWantPageRule1Arg7')
        if (this.crawlRecommended) {
            pageTip = lang.transl('_checkWantPageRule1Arg11')
        }
        this.crawlNumber = this.checkWantPageInput(
            lang.transl('_checkWantPageRule1Arg6'),
            pageTip
        )
    }
    nextStep() {
        if (this.crawlRecommended) {
            // 下载推荐图片
            this.getRecommendedList()
        } else {
            this.readyGetIdList()
        }
    }
    readyGetIdList() {
        // 每次开始时重置一些条件
        this.offset = 0
        this.idList = []
        this.listType = 0
        // 每页个数
        let onceNumber = 48 // 新版每页 48 个作品（因为新版不显示无法访问的作品，所以有时候一页不足这个数量）
        // 旧版每页 20 个作品
        if (document.querySelector('.user-name')) {
            onceNumber = 20
        }
        // 如果前面有页数，就去掉前面页数的作品数量。即：从本页开始下载
        const nowPage = API.getURLField(location.href, 'p') // 判断当前处于第几页，页码从 1 开始。也可能没有页码
        if (nowPage) {
            this.offset = (parseInt(nowPage) - 1) * onceNumber
        }
        if (this.offset < 0) {
            this.offset = 0
        }
        // 根据页数设置，计算要下载的个数
        this.requsetNumber = 0
        if (this.crawlNumber === -1) {
            this.requsetNumber = 9999999
        } else {
            this.requsetNumber = onceNumber * this.crawlNumber
        }
        // 设置列表页面的类型
        // listType:
        // 0 插画和漫画全都要，但是不带 tag
        // 4 插画和漫画全都要，带 tag
        // 1 只要插画
        // 2 只要漫画
        // 3 书签作品
        if (location.href.includes('member.php?id=')) {
            // 用户资料页主页
            this.listType = 0
        } else if (/member_illust\.php\?.*id=/.test(location.href)) {
            // 作品列表页
            if (API.getURLField(location.href, 'type') === 'illust') {
                // 插画分类
                this.listType = 1
            } else if (API.getURLField(location.href, 'type') === 'manga') {
                // 漫画分类
                this.listType = 2
            } else if (API.getURLField(location.href, 'tag')) {
                // url 里没有标识插画还是漫画，但是有 tag，则是在用户首页点击了 tag，需要同时获取插画和漫画
                this.listType = 4
            }
        } else if (location.href.includes('bookmark.php')) {
            // 书签页面，需要多次循环获取
            this.listType = 3
        }
        // 是否带有 tag
        this.tag = decodeURI(API.getURLField(location.href, 'tag'))
        if (this.listType === 3) {
            // 书签页面固定设置为有 tag（虽然有时候并没有带 tag，但数据结构和带 tag 是一样的）
            this.hasTag = true
        } else {
            this.hasTag = !!this.tag
        }
        // 根据不同的页面类型，选择不同的 API 来获取 id 列表
        /*
            1.非书签页
              1.1 无 tag 通过 profileAll 获取
              1.2 有 tag 通过指定的作品类型获取
            2.书签页，单独抓取
             */
        if (this.listType !== 3) {
            if (!this.hasTag) {
                this.getIdList()
            } else {
                if (this.listType === 1) {
                    this.getIdListByTag('illusts')
                } else if (this.listType === 2) {
                    this.getIdListByTag('manga')
                } else if (this.listType === 4) {
                    this.getIdListByTag('illustmanga')
                } else {
                    // 无法处理的情况
                    evt.fire(evt.events.crawlError)
                    throw new Error('Unknown instance.')
                }
            }
        } else {
            // 书签页面
            // 在“未分类”页面时，设置 tag
            if (parseInt(API.getURLField(location.href, 'untagged')) === 1) {
                this.tag = '未分類'
            }
            // 判断是公开收藏还是非公开收藏
            let hide = false
            if (API.getURLField(location.href, 'rest') === 'hide') {
                hide = true
            }
            this.getBookmarkIdList(hide)
        }
        log.log(lang.transl('_正在抓取'))
        if (this.listType === 3 && this.crawlNumber === -1) {
            log.log(lang.transl('_获取全部书签作品'))
        }
    }
    // 获取用户的全部作品列表
    async getIdList() {
        let type = []
        // 插画和漫画列表页
        if (this.listType === 0) {
            type = ['illusts', 'manga']
        } else if (this.listType === 1) {
            // 插画列表页，包含动图
            type = ['illusts']
        } else if (this.listType === 2) {
            // 漫画列表页
            type = ['manga']
        }
        this.idList = await API.getUserWorksByType(DOM.getUserId(), type)
        this.afterGetListPage()
    }
    // 获取用户某一类型的作品列表（附带 tag）
    async getIdListByTag(type) {
        let data = await API.getUserWorksByTypeWithTag(
            DOM.getUserId(),
            type,
            this.tag,
            this.offset,
            this.requsetNumber
        )
        data.body.works.forEach(data => this.idList.push(data.id))
        this.afterGetListPage()
    }
    // 获取用户的收藏作品列表
    async getBookmarkIdList(isHide) {
        let bmkGetEnd = false // 书签作品是否获取完毕
        let data
        try {
            data = await API.getBookmarkData(
                DOM.getUserId(),
                this.tag,
                this.offset,
                isHide
            )
        } catch (error) {
            this.getBookmarkIdList(isHide)
            return
        }
        if (
            data.body.works.length === 0 ||
            this.idList.length >= this.requsetNumber
        ) {
            bmkGetEnd = true // 书签页获取完毕
            this.afterGetListPage()
        }
        // 如果书签页没有获取完毕
        if (!bmkGetEnd) {
            // 没有抓取完毕时，才添加数据。抓取完毕之后不添加数据
            data.body.works.forEach(data => this.idList.push(data.id))
            this.offset += this.onceRequest // 每次增加偏移量
            // 重复抓取过程
            this.getBookmarkIdList(isHide)
        }
    }
    // 获取作品 id 列表完毕之后
    afterGetListPage() {
        // 非书签页，并且非 tag 页
        if (this.listType !== 3 && !this.hasTag) {
            // 在获取全部作品时，由于 API 里不能设置 requset_number，所以在这里去掉多余的作品。
            // 把 id 从小到大排序
            let tempList = []
            // 转换成数字
            tempList = this.idList.map(id => {
                return parseInt(id)
            })
            // 升序排列
            tempList.sort(function (x, y) {
                return x - y
            })
            // 保存到结果中
            this.idList = tempList.map(id => {
                return id.toString()
            })
            // 删除后面的 id（删除不需要的近期作品）
            this.idList.splice(this.idList.length - this.offset, this.idList.length)
        }
        // 删除多余的作品
        if (this.idList.length > this.requsetNumber) {
            if (this.listType !== 3) {
                // 非书签页，删除前面部分（早期作品）
                this.idList.splice(0, this.idList.length - this.requsetNumber)
            } else {
                // 书签页，删除后面部分（较早收藏的）
                this.idList.splice(this.requsetNumber, this.idList.length)
                // 书签页面的 api 没有考虑页面上的排序顺序，获取到的 id 列表始终是按收藏顺序由最晚到最早排列的
            }
        }
        store.idList = store.idList.concat(this.idList)
        log.log(
            lang.transl('_列表抓取完成开始获取作品页', store.idList.length.toString())
        )
        this.getIdListFinished()
    }
    // 获取书签页面下方的推荐作品列表
    getRecommendedList() {
        // 获取下方已经加载出来的作品
        const elements = document.querySelectorAll('#illust-recommend .image-item')
        if (elements.length === 0) {
            this.crawlRecommended = false
            return this.noResult()
        }
        // 添加作品列表
        for (const li of elements) {
            const a = li.querySelector('a')
            store.idList.push(API.getIllustId(a.href))
        }
        this.getIdListFinished()
    }
    resetGetIdListStatus() {
        this.listPageFinished = 0
        this.crawlRecommended = false // 解除下载推荐作品的标记
    }
    sortResult() {
        if (!location.href.includes('bookmark.php')) {
            // 如果是其他列表页，把作品数据按 id 倒序排列，id 大的在前面，这样可以先下载最新作品，后下载早期作品
            store.result.sort(API.sortByProperty('id'))
        } else {
            // 如果是书签页，把作品数据反转，这样可以先下载收藏时间早的，后下载收藏时间近的
            store.result.reverse()
        }
        // 这里如果在控制台打印 result，可能看到修改前后的数据是一样的，这时因为 result 是引用类型导致的，实际上正常。
    }
}
// 抓取搜索页
class CrawlSearchPage extends CrawlPageBase {
    constructor() {
        super(...arguments)
        this.worksType = ''
        this.option = {}
        this.worksNoPerPage = 60 // 每个页面有多少个作品
        this.needCrawlPageCount = 0 // 一共有有多少个列表页面
        this.sendCrawlTaskCount = 0 // 已经抓取了多少个列表页面
        this.allOption = [
            'order',
            'type',
            'wlt',
            'hlt',
            'ratio',
            'tool',
            's_mode',
            'mode',
            'scd',
            'ecd',
            'blt',
            'bgt'
        ]
    }
    getWantPage() {
        this.crawlNumber = this.checkWantPageInput(
            lang.transl('_checkWantPageRule1Arg6'),
            lang.transl('_checkWantPageRule1Arg7')
        )
        if (this.crawlNumber === -1 || this.crawlNumber > this.maxCount) {
            this.crawlNumber = this.maxCount
        }
    }
    // 获取搜索页的数据。因为有多处使用，所以进行了封装
    async getSearchData(p) {
        let data = await API.getSearchData(
            pageInfo.getPageTag,
            this.worksType,
            p,
            this.option
        )
        return data.body.illust || data.body.illustManga || data.body.manga
    }
    async nextStep() {
        this.initFetchURL()
        this.needCrawlPageCount = await this.calcNeedCrawlPageCount()
        if (this.needCrawlPageCount === 0) {
            return this.noResult()
        }
        this.startGetIdList()
    }
    // 组织要请求的 url 中的参数
    initFetchURL() {
        // 从 URL 中获取分类。网址中可能有语言标识。
        /*
            https://www.pixiv.net/tags/Fate%2FGrandOrder/illustrations
            https://www.pixiv.net/en/tags/Fate%2FGrandOrder/illustrations
            */
        let URLType = location.pathname.split('tags/')[1].split('/')[1]
        // 但在“顶部”页面的时候是没有分类的，会是 undefined
        if (URLType === undefined) {
            URLType = ''
        }
        switch (URLType) {
            case '':
                this.worksType = 'artworks'
                break
            case 'illustrations':
            case 'illust_and_ugoira':
            case 'ugoira':
            case 'illust':
                this.worksType = 'illustrations'
                break
            case 'manga':
                this.worksType = 'manga'
                break
            default:
                this.worksType = 'artworks'
                break
        }
        let p = API.getURLField(location.href, 'p')
        this.startpageNo = parseInt(p) || 1
        // 从页面 url 中获取可以使用的选项
        this.option = {}
        this.allOption.forEach(param => {
            let value = API.getURLField(location.href, param)
            if (value !== '') {
                this.option[param] = value
            }
        })
    }
    // 计算应该抓取多少页
    async calcNeedCrawlPageCount() {
        let data = await this.getSearchData(1)
        // 计算总页数
        let pageCount = Math.ceil(data.total / this.worksNoPerPage)
        if (pageCount > this.maxCount) {
            // 最大为 1000
            pageCount = this.maxCount
        }
        // 计算从本页开始抓取的话，有多少页
        let needFetchPage = pageCount - this.startpageNo + 1
        // 比较用户设置的页数，取较小的那个数值
        if (needFetchPage < this.crawlNumber) {
            return needFetchPage
        } else {
            return this.crawlNumber
        }
    }
    // 计算页数之后，准备建立并发抓取线程
    startGetIdList() {
        if (this.needCrawlPageCount <= this.ajaxThreadsDefault) {
            this.ajaxThreads = this.needCrawlPageCount
        } else {
            this.ajaxThreads = this.ajaxThreadsDefault
        }
        for (let i = 0; i < this.ajaxThreads; i++) {
            this.getIdList()
        }
    }
    async getIdList() {
        let p = this.startpageNo + this.sendCrawlTaskCount
        this.sendCrawlTaskCount++
        // 发起请求，获取列表页
        let data
        try {
            data = await this.getSearchData(p)
        } catch (_a) {
            this.getIdList()
            return
        }
        data = data.data
        for (const nowData of data) {
            // 排除广告信息
            if (nowData.isAdContainer) {
                continue
            }
            const filterOpt = {
                width: nowData.width,
                height: nowData.height,
                bookmarkData: nowData.bookmarkData,
                illustType: nowData.illustType,
                tags: nowData.tags
            }
            if (filter.check(filterOpt)) {
                store.idList.push(nowData.illustId)
            }
        }
        this.listPageFinished++
        log.log(
            lang.transl('_列表页抓取进度', this.listPageFinished.toString()),
            1,
            false
        )
        if (this.sendCrawlTaskCount + 1 <= this.needCrawlPageCount) {
            // 继续发送抓取任务（+1 是因为 sendCrawlTaskCount 从 0 开始）
            this.getIdList()
        } else {
            // 抓取任务已经全部发送
            if (this.listPageFinished === this.needCrawlPageCount) {
                // 抓取任务全部完成
                log.log(lang.transl('_列表页抓取完成'))
                this.getIdListFinished()
            }
        }
    }
    resetGetIdListStatus() {
        this.listPageFinished = 0
        this.sendCrawlTaskCount = 0
    }
    // 搜索页把下载任务按收藏数从高到低下载
    sortResult() {
        store.result.sort(API.sortByProperty('bmk'))
    }
}
// 抓取地区排行榜页面
class CrawlAreaRankingPage extends CrawlPageBase {
    getIdList() {
        // 地区排行榜
        const allPicArea = document.querySelectorAll('.ranking-item>.work_wrapper')
        for (const el of allPicArea) {
            const img = el.querySelector('._thumbnail')
            // img.dataset.type 全都是 "illust"，因此不能用来区分作品类型
            // 提取出 tag 列表
            const tags = img.dataset.tags.split(' ')
            const bookmarked = el
                .querySelector('._one-click-bookmark')
                .classList.contains('on')
            const filterOpt = {
                tags: tags,
                bookmarkData: bookmarked
            }
            if (filter.check(filterOpt)) {
                const id = API.getIllustId(el.querySelector('a').href)
                store.idList.push(id)
            }
        }
        log.log(
            lang.transl('_列表抓取完成开始获取作品页', store.idList.length.toString())
        )
        this.getIdListFinished()
    }
    resetGetIdListStatus() { }
}
// 抓取排行榜页面
class CrawlRankingPage extends CrawlPageBase {
    constructor() {
        super(...arguments)
        this.pageCount = 10 // 排行榜的页数
        this.option = this.resetOption()
    }
    resetOption() {
        return { mode: 'daily', p: 1, worksType: '', date: '' }
    }
    setPartNum() {
        // 设置页数。排行榜页面一页有50张作品，当页面到达底部时会加载下一页
        if (location.pathname.includes('r18g')) {
            // r18g 只有1个榜单，固定1页
            this.pageCount = 1
        } else if (location.pathname.includes('_r18')) {
            // r18 模式，这里的6是最大值，有的排行榜并没有6页
            this.pageCount = 6
        } else {
            // 普通模式，这里的10也是最大值。如果实际没有10页，则在检测到404页面的时候停止抓取下一页
            this.pageCount = 10
        }
    }
    getWantPage() {
        this.listPageFinished = 0
        // 检查下载页数的设置
        this.crawlNumber = this.checkWantPageInput(
            lang.transl('_checkWantPageRule1Arg12'),
            lang.transl('_checkWantPageRule1Arg4')
        )
        // 如果设置的作品个数是 -1，则设置为下载所有作品
        if (this.crawlNumber === -1) {
            this.crawlNumber = 500
        }
    }
    nextStep() {
        // 设置 option 信息
        // mode 一定要有值，其他选项不需要
        this.option = this.resetOption()
        this.option.mode = API.getURLField(location.href, 'mode') || 'daily'
        this.option.worksType = API.getURLField(location.href, 'content')
        this.option.date = API.getURLField(location.href, 'date')
        this.startpageNo = 1
        this.setPartNum()
        this.getIdList()
    }
    async getIdList() {
        this.option.p = this.startpageNo + this.listPageFinished
        // 发起请求，获取作品列表
        let data
        try {
            data = await API.getRankingData(this.option)
        } catch (error) {
            if (error.status === 404) {
                // 如果发生了404错误，则中断抓取，直接下载已有部分。因为可能确实没有下一部分了
                console.log('404错误，直接下载已有部分')
                log.log(lang.transl('_排行榜任务完成', store.idList.length.toString()))
                this.getIdListFinished()
            }
            return
        }
        this.listPageFinished++
        let complete = false // 如果数量足够，就标记为完成
        const contents = data.contents // 取出作品信息列表
        for (const data of contents) {
            // 下载排行榜所有作品时，会检查是否已经抓取到了指定数量的作品。下载首次登场作品时不检查，抓取所有作品。
            if (ui.form.debut.value === '0' && data.rank > this.crawlNumber) {
                complete = true
                break
            }
            // 目前，数据里并没有包含收藏数量，所以在这里没办法检查收藏数量要求
            const filterOpt = {
                illustType: parseInt(data.illust_type),
                tags: data.tags,
                bookmarkData: data.is_bookmarked,
                width: data.width,
                height: data.height,
                yes_rank: data.yes_rank
            }
            if (filter.check(filterOpt)) {
                store.setRankList(data.illust_id.toString(), data.rank.toString())
                store.idList.push(data.illust_id.toString())
            }
        }
        log.log(
            lang.transl('_排行榜进度', this.listPageFinished.toString()),
            1,
            false
        )
        // 抓取完毕
        if (complete || this.listPageFinished === this.pageCount) {
            log.log(lang.transl('_排行榜任务完成', store.idList.length.toString()))
            this.getIdListFinished()
        } else {
            // 继续抓取
            this.getIdList()
        }
    }
    resetGetIdListStatus() {
        this.listPageFinished = 0
        ui.form.debut.value = '0'
    }
}
// 抓取 pixivision 页面
class CrawlPixivisionPage extends CrawlPageBase {
    constructor() {
        super(...arguments)
        this.tested = 0 // 检查图片后缀名时的计数
    }
    nextStep() {
        this.getPixivision()
    }
    getIdList() { }
    resetGetIdListStatus() { }
    // 保存要下载的图片的信息
    addResult(id, url, ext) {
        store.addResult({
            id: id,
            url: url,
            ext: ext
        })
    }
    getPixivision() {
        const a = document.querySelector('a[data-gtm-action=ClickCategory]')
        const type = a.dataset.gtmLabel
        if (type === 'illustration') {
            // 插画页面，需要对图片进行测试获取原图 url
            const imageList = document.querySelectorAll('.am__work__main img')
            const urls = Array.from(imageList).map(el => {
                return el.src
                    .replace('c/768x1200_80/img-master', 'img-original')
                    .replace('_master1200', '')
            })
            this.tested = 0
            urls.forEach(url => {
                let arr = url.split('/')
                const id = arr[arr.length - 1].split('.')[0] // 取出作品 id
                this.testExtName(url, urls.length, id)
            })
        } else {
            // 漫画和 cosplay ，直接保存页面上的图片
            let selector = ''
            if (type === 'manga') {
                selector = '.am__work__illust'
            } else if (type === 'cosplay') {
                selector = '.fab__image-block__image img'
            }
            // 把图片url添加进数组
            const imageList = document.querySelectorAll(selector)
            Array.from(imageList).forEach(el => {
                const url = el.src
                if (url !== 'https://i.pximg.net/imgaz/upload/20170407/256097898.jpg') {
                    // 跳过Cure的logo图片
                    const arr = url.split('/')
                    const id = arr[arr.length - 1].split('.')[0] // 作品id
                    const ext = arr[arr.length - 1] // 扩展名
                    this.addResult(id, url, ext)
                }
            })
            this.crawFinished()
        }
    }
    // 测试图片 url 是否正确的函数。pixivision 页面直接获取的图片 url，后缀都是jpg的，所以要测试实际上是jpg还是png
    testExtName(url, imgNumber, id) {
        let ext = ''
        const testImg = new Image()
        testImg.src = url
        testImg.onload = () => next(true)
        testImg.onerror = () => next(false)
        let next = bool => {
            if (bool) {
                ext = 'jpg'
            } else {
                url = url.replace('.jpg', '.png')
                ext = 'png'
            }
            this.addResult(id, url, ext)
            this.outputImgNum()
            if (imgNumber !== undefined) {
                this.tested++
                if (this.tested === imgNumber) {
                    // 如果所有请求都执行完毕
                    this.crawFinished()
                }
            }
        }
    }
}
// 抓取 bookmark_detail 页面
class CrawlBookmarkDetailPage extends CrawlPageBase {
    getWantPage() {
        const check = this.checkWantPageInputGreater0()
        if (check == undefined) {
            return
        }
        this.crawlNumber = check
        if (this.crawlNumber > this.maxCount) {
            this.crawlNumber = this.maxCount
        }
    }
    // 获取相似的作品列表
    async getIdList() {
        let data = await API.getRecommenderData(API.getIllustId(), this.crawlNumber)
        for (const id of data.recommendations) {
            store.idList.push(id.toString())
        }
        log.log(lang.transl('_排行榜任务完成', store.idList.length.toString()))
        this.getIdListFinished()
    }
    resetGetIdListStatus() { }
}
// 抓取关注的新作品页面
class CrawlBookmarkNewIllustPage extends CrawlPageBase {
    constructor() {
        super(...arguments)
        this.r18 = false
    }
    getWantPage() {
        const check = this.checkWantPageInputGreater0()
        if (check == undefined) {
            return
        }
        this.crawlNumber = check
        if (this.crawlNumber > this.maxCount) {
            this.crawlNumber = this.maxCount
        }
        this.listPageFinished = 0
        log.warning(lang.transl('_任务开始1', this.crawlNumber.toString()))
    }
    nextStep() {
        this.r18 = location.pathname.includes('r18')
        const p = API.getURLField(location.href, 'p')
        this.startpageNo = parseInt(p) || 1
        this.getIdList()
    }
    async getIdList() {
        let p = this.startpageNo + this.listPageFinished
        // 发起请求，获取列表页
        let worksData
        try {
            worksData = await API.getBookmarkNewIllustData(p, this.r18)
        } catch (error) {
            this.getIdList()
            return
        }
        // 检查一些此时可以进行检查的设置项
        for (const data of worksData) {
            const filterOpt = {
                width: data.width,
                height: data.height,
                bookmarkData: data.isBookmarked,
                illustType: parseInt(data.illustType),
                tags: data.tags
            }
            if (filter.check(filterOpt)) {
                store.idList.push(data.illustId)
            }
        }
        this.listPageFinished++
        log.log(
            lang.transl('_列表页抓取进度', this.listPageFinished.toString()),
            1,
            false
        )
        // 判断任务状态
        // 如果抓取了所有页面，或者抓取完指定页面
        if (p >= 100 || this.listPageFinished === this.crawlNumber) {
            log.log(lang.transl('_列表页抓取完成'))
            this.getIdListFinished()
        } else {
            // 继续抓取
            this.getIdList()
        }
    }
    resetGetIdListStatus() {
        this.listPageFinished = 0
    }
}
// 抓取 大家的新作品页面
class CrawlNewIllustPage extends CrawlPageBase {
    constructor() {
        super(...arguments)
        this.option = this.resetOption()
        this.limitMax = 20 // 每次请求的数量最大是 20
        this.fetchCount = 0 // 已请求的作品数量
    }
    getWantPage() {
        const check = this.checkWantPageInputGreater0()
        if (check == undefined) {
            return
        }
        this.crawlNumber = check
        if (this.crawlNumber > this.maxCount) {
            this.crawlNumber = this.maxCount
        }
        log.warning(lang.transl('_抓取多少个作品', this.crawlNumber.toString()))
    }
    nextStep() {
        this.initFetchURL()
        this.getIdList()
    }
    resetOption() {
        return {
            lastId: '0',
            limit: '20',
            type: '',
            r18: ''
        }
    }
    // 组织要请求的 url
    initFetchURL() {
        this.option = this.resetOption()
        if (this.crawlNumber < this.limitMax) {
            this.option.limit = this.crawlNumber.toString()
        } else {
            this.option.limit = this.limitMax.toString()
        }
        this.fetchCount = 0
        // 当前页面的作品类型，默认是 illust
        this.option.type = API.getURLField(location.href, 'type') || 'illust'
        // 是否是 R18 模式
        this.option.r18 = (location.href.includes('_r18.php') || false).toString()
    }
    async getIdList() {
        let data
        try {
            data = await API.getNewIllustData(this.option)
        } catch (error) {
            this.getIdList()
            return
        }
        let useData = data.body.illusts
        for (const nowData of useData) {
            // 抓取够了指定的数量
            if (this.fetchCount + 1 > this.crawlNumber) {
                break
            } else {
                this.fetchCount++
            }
            // 排除广告信息
            if (nowData.isAdContainer) {
                continue
            }
            const filterOpt = {
                width: nowData.width,
                height: nowData.height,
                bookmarkData: nowData.bookmarkData,
                illustType: nowData.illustType,
                tags: nowData.tags
            }
            if (filter.check(filterOpt)) {
                store.idList.push(nowData.illustId)
            }
        }
        log.log(lang.transl('_新作品进度', this.fetchCount.toString()), 1, false)
        // 抓取完毕
        if (
            this.fetchCount >= this.crawlNumber ||
            this.fetchCount >= this.maxCount
        ) {
            log.log(lang.transl('_开始获取作品页面'))
            this.getIdListFinished()
            return
        }
        // 继续抓取
        this.option.lastId = data.body.lastId
        this.getIdList()
    }
    resetGetIdListStatus() { }
}
// 抓取发现页面
class CrawlDiscoverPage extends CrawlPageBase {
    getWantPage() { }
    getIdList() {
        // 在发现页面，仅下载已有部分，所以不需要去获取列表页
        const nowIllust = document.querySelectorAll('figure>div>a')
        // 获取已有作品的 id
        Array.from(nowIllust).forEach(el => {
            // discovery 列表的 url 是有额外后缀的，需要去掉
            const id = API.getIllustId(el.href.split('&uarea')[0])
            store.idList.push(id)
        })
        log.log(lang.transl('_排行榜任务完成', store.idList.length.toString()))
        this.getIdListFinished()
    }
    resetGetIdListStatus() { }
}
// 初始化页面，初始化抓取流程
class InitCrawlProcess {
    constructor() {
        this.initPage()
        // 页面类型变化时，初始化抓取流程
        window.addEventListener(evt.events.pageTypeChange, () => {
            this.initPage()
            // 切换不同页面时，如果任务已经完成，则清空输出区域，避免日志一直堆积。
            if (store.states.allowWork) {
                log.clear()
            }
        })
    }
    initPage() {
        let result
        switch (pageType.getPageType()) {
            case 0:
                result = new InitIndexPage(new CrawlIndexPage())
                break
            case 1:
                result = new InitWorksPage(new CrawlWorksPage())
                break
            case 2:
                result = new InitUserPage(new CrawlUserPage())
                break
            case 5:
                result = new InitSearchPage(new CrawlSearchPage())
                break
            case 6:
                result = new InitAreaRankingPage(new CrawlAreaRankingPage())
                break
            case 7:
                result = new InitRankingPage(new CrawlRankingPage())
                break
            case 8:
                result = new InitPixivisionPage(new CrawlPixivisionPage())
                break
            case 9:
                result = new InitBookmarkDetailPage(new CrawlBookmarkDetailPage())
                break
            case 10:
                result = new InitBookmarkNewIllustPage(new CrawlBookmarkNewIllustPage())
                break
            case 11:
                result = new InitDiscoverPage(new CrawlDiscoverPage())
                break
            case 12:
                result = new InitNewIllustPage(new CrawlNewIllustPage())
                break
            default:
                throw new Error('InitCrawlProcess error: Illegal parameter.')
        }
        result.init()
    }
}
// 下载控制
class DownloadControl {
    constructor() {
        this.downloadThreadMax = 5 // 同时下载的线程数的最大值，也是默认值
        this.downloadThread = this.downloadThreadMax // 同时下载的线程数
        this.taskBatch = 0 // 标记任务批次，每次重新下载时改变它的值，传递给后台使其知道这是一次新的下载
        this.downloadStatesList = [] // 标记每个下载任务的完成状态
        this.downloaded = 0 // 已下载的任务数量
        this.reTryTimer = 0 // 重试下载的定时器
        this.downloadArea = document.createElement('div') // 下载区域
        this.downStatusEl = document.createElement('span')
        this.convertTipEL = document.createElement('div') // 转换动图时显示提示的元素
        this.downloadStop = false // 是否停止下载
        this.downloadPause = false // 是否暂停下载
        // 所有下载进度条
        this.allDownloadBar = document.querySelectorAll('.downloadBar')
        this.createDownloadArea()
        window.addEventListener(evt.events.crawlStart, () => {
            this.hideDownloadArea()
            this.reset()
        })
        window.addEventListener(evt.events.crawlFinish, () => {
            this.showDownloadArea()
            this.beforeDownload()
        })
        window.addEventListener(evt.events.convertChange, ev => {
            this.convertTipEL.innerHTML = ev.detail.data
            this.LogDownloadProgress(ev.detail.data)
        })
        window.addEventListener(evt.events.downloadSucccess, ev => {
            const data = ev.detail.data
            this.downloadSuccess(data)
        })
        window.addEventListener(evt.events.downloadError, () => {
            this.reTryDownload()
        })
    }
    // 显示总的下载进度
    showDownloadProgress(downloaded) {
        // 在总进度条上显示已下载数量
        document.querySelector('.downloaded').textContent = downloaded.toString()
        // 设置总进度条的进度
        const progress = (downloaded / store.result.length) * 100
        const progressBar = document.querySelector('.progress1')
        progressBar.style.width = progress + '%'
    }
    set setDownloaded(val) {
        this.downloaded = val
        this.showDownloadProgress(this.downloaded)
        this.LogDownloadProgress()
        // 重置下载进度信息
        if (this.downloaded === 0) {
            this.resetDownloadArea()
        }
        // 下载完毕
        if (this.downloaded === store.result.length) {
            evt.fire(evt.events.downloadComplete)
            this.reset()
            this.setDownStateText(lang.transl('_下载完毕'))
            log.success(lang.transl('_下载完毕'), 2)
            titleBar.changeTitle('√')
        }
    }
    downloadedAdd() {
        this.setDownloaded = this.downloaded + 1
    }
    // 返回任务停止状态。暂停和停止都视为停止下载
    get downloadStopped() {
        return this.downloadPause || this.downloadStop
    }
    // 显示或隐藏下载区域
    showDownloadArea() {
        this.downloadArea.style.display = 'block'
    }
    hideDownloadArea() {
        this.downloadArea.style.display = 'none'
    }
    // 重置下载区域的信息
    resetDownloadArea() {
        this.setDownStateText(lang.transl('_未开始下载'))
        for (const el of document.querySelectorAll('.imgNum')) {
            el.textContent = store.result.length.toString()
        }
        for (const el of document.querySelectorAll('.download_fileName')) {
            el.textContent = ''
        }
        for (const el of document.querySelectorAll('.loaded')) {
            el.textContent = '0/0'
        }
        for (const el of document.querySelectorAll('.progress')) {
            el.style.width = '0%'
        }
    }
    // 设置下载状态文本，默认颜色为主题蓝色
    setDownStateText(str, color = '') {
        const el = document.createElement('span')
        el.textContent = str
        if (color) {
            el.style.color = color
        }
        this.downStatusEl.innerHTML = ''
        this.downStatusEl.appendChild(el)
    }
    reset() {
        this.downloadStatesList = []
        this.downloadPause = false
        this.downloadStop = false
        clearTimeout(this.reTryTimer)
    }
    createDownloadArea() {
        const html = `<div class="download_area">
    <div class="centerWrap_btns">
    <button class="startDownload" type="button" style="background:${
            Colors.blue
            };"> ${lang.transl('_下载按钮1')}</button>
    <button class="pauseDownload" type="button" style="background:#e49d00;"> ${lang.transl(
                '_下载按钮2'
            )}</button>
    <button class="stopDownload" type="button" style="background:${
            Colors.red
            };"> ${lang.transl('_下载按钮3')}</button>
    <button class="copyUrl" type="button" style="background:${
            Colors.green
            };"> ${lang.transl('_下载按钮4')}</button>
    </div>
    <div class="centerWrap_down_tips">
    <p>
    ${lang.transl('_当前状态')}
    <span class="down_status blue"><span>${lang.transl(
                '_未开始下载'
            )}</span></span>
    <span class="convert_tip blue"></span>
    </p>
    <div class="progressBarWrap">
    <span class="text">${lang.transl('_下载进度')}</span>
    <div class="right1">
    <div class="progressBar progressBar1">
    <div class="progress progress1"></div>
    </div>
    <div class="progressTip progressTip1">
    <span class="downloaded">0</span>
    /
    <span class="imgNum">0</span>
    </div>
    </div>
    </div>
    </div>
    <div>
    <ul class="centerWrap_down_list">
    <li class="downloadBar">
    <div class="progressBar progressBar2">
    <div class="progress progress2"></div>
    </div>
    <div class="progressTip progressTip2">
    <span class="download_fileName"></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${lang.transl(
                '_已下载'
            )}&nbsp;&nbsp;<span class="loaded">0/0</span>KB
    </div>
    </li>
    </ul>
    </div>
    </div>`
        ui.insertHTML(html)
        this.downloadArea = document.querySelector('.download_area')
        this.downStatusEl = document.querySelector('.down_status ')
        this.convertTipEL = document.querySelector('.convert_tip')
        document.querySelector('.startDownload').addEventListener('click', () => {
            this.startDownload()
        })
        document.querySelector('.pauseDownload').addEventListener('click', () => {
            this.pauseDownload()
        })
        document.querySelector('.stopDownload').addEventListener('click', () => {
            this.stopDownload()
        })
        document.querySelector('.copyUrl').addEventListener('click', () => {
            const text = this.showURLs()
            evt.fire(evt.events.output, text)
        })
    }
    // 显示 url
    showURLs() {
        let result = ''
        result = store.result.reduce((total, now) => {
            return (total += now.url + '<br>')
        }, result)
        return result
    }
    // 重设下载进度条的数量
    resetDownloadBar(num) {
        const centerWrapDownList = document.querySelector('.centerWrap_down_list')
        this.allDownloadBar = centerWrapDownList.querySelectorAll('.downloadBar')
        if (this.allDownloadBar.length !== num) {
            centerWrapDownList.innerHTML = this.allDownloadBar[0].outerHTML.repeat(
                num
            )
        }
        centerWrapDownList.style.display = 'block'
        // 缓存所有下载进度条元素
        this.allDownloadBar = centerWrapDownList.querySelectorAll('.downloadBar')
    }
    // 设置单个进度条的信息
    setDownloadBar(index, name, loaded, total) {
        const el = this.allDownloadBar[index]
        el.querySelector('.download_fileName').textContent = name
        const loadedBar = el.querySelector('.loaded')
        loadedBar.textContent = `${Math.floor(loaded / 1024)}/${Math.floor(
            total / 1024
        )}`
        const progressBar = el.querySelector('.progress')
        let progress = loaded / total
        if (isNaN(progress)) {
            progress = 0
        }
        progressBar.style.width = progress * 100 + '%'
    }
    // 抓取完毕之后，已经可以开始下载时，根据一些状态进行处理
    beforeDownload() {
        this.setDownloaded = 0
        let autoDownload = ui.form.quietDownload.checked
        if (!autoDownload && !store.states.quickDownload) {
            titleBar.changeTitle('▶')
        }
        // 视情况自动开始下载
        if (autoDownload || store.states.quickDownload) {
            this.startDownload()
        }
    }
    // 开始下载
    startDownload() {
        // 如果正在下载中，或无图片，则不予处理
        if (!store.states.allowWork || store.result.length === 0) {
            return
        }
        // 如果之前不是暂停状态，则需要重新下载
        if (!this.downloadPause) {
            this.setDownloaded = 0
            // 初始化下载记录
            // 状态：
            // -1 未使用
            // 0 使用中
            // 1 已完成
            this.downloadStatesList = new Array(store.result.length).fill(-1)
            this.taskBatch = new Date().getTime() // 修改本批下载任务的标记
        } else {
            // 继续下载
            // 把“使用中”的下载状态重置为“未使用”
            for (let index = 0; index < this.downloadStatesList.length; index++) {
                if (this.downloadStatesList[index] === 0) {
                    this.downloadStatesList[index] = -1
                }
            }
        }
        // 下载线程设置
        const setThread = parseInt(ui.form.downloadThread.value)
        if (
            setThread < 1 ||
            setThread > this.downloadThreadMax ||
            isNaN(setThread)
        ) {
            // 如果数值非法，则重设为默认值
            this.downloadThread = this.downloadThreadMax
        } else {
            this.downloadThread = setThread // 设置为用户输入的值
        }
        // 如果剩余任务数量少于下载线程数
        if (store.result.length - this.downloaded < this.downloadThread) {
            this.downloadThread = store.result.length - this.downloaded
        }
        // 重设下载进度条的数量
        this.resetDownloadBar(this.downloadThread)
        // 重置一些条件
        evt.fire(evt.events.downloadStart)
        this.downloadPause = false
        this.downloadStop = false
        clearTimeout(this.reTryTimer)
        // 启动或继续下载，建立并发下载线程
        for (let i = 0; i < this.downloadThread; i++) {
            const { data, index } = this.getDownloadData()
            dlFile.download(data, index, i, this.taskBatch)
        }
        this.setDownStateText(lang.transl('_正在下载中'))
        log.log(lang.transl('_正在下载中'))
    }
    // 暂停下载
    pauseDownload() {
        clearTimeout(this.reTryTimer)
        if (store.result.length === 0) {
            return
        }
        // 停止的优先级高于暂停。点击停止可以取消暂停状态，但点击暂停不能取消停止状态
        if (this.downloadStop === true) {
            return
        }
        if (this.downloadPause === false) {
            // 如果正在下载中
            if (!store.states.allowWork) {
                convert.working = false
                this.downloadPause = true // 发出暂停信号
                evt.fire(evt.events.downloadPause)
                titleBar.changeTitle('║')
                this.setDownStateText(lang.transl('_已暂停'), '#f00')
                log.warning(lang.transl('_已暂停'), 2)
            } else {
                // 不在下载中的话不允许启用暂停功能
                return
            }
        }
    }
    // 停止下载
    stopDownload() {
        clearTimeout(this.reTryTimer)
        if (store.result.length === 0 || this.downloadStop) {
            return
        }
        convert.working = false
        this.downloadStop = true
        evt.fire(evt.events.downloadStop)
        titleBar.changeTitle('■')
        this.setDownStateText(lang.transl('_已停止'), '#f00')
        log.error(lang.transl('_已停止'), 2)
        this.downloadPause = false
    }
    // 重试下载
    reTryDownload() {
        // 如果下载已经完成，则不执行操作
        if (this.downloaded === store.result.length) {
            return
        }
        // 暂停下载并在一定时间后重试下载
        this.pauseDownload()
        this.reTryTimer = setTimeout(() => {
            this.startDownload()
        }, 1000)
    }
    downloadSuccess(data) {
        // 更改这个任务状态为“已完成”
        this.setDownloadedIndex(data.index, 1)
        // 增加已下载数量
        this.downloadedAdd()
        // 是否继续下载
        const no = data.no
        if (this.checkContinueDownload()) {
            const { data, index } = this.getDownloadData()
            dlFile.download(data, index, no, this.taskBatch)
        }
    }
    // 设置已下载列表中的标记
    setDownloadedIndex(index, value) {
        this.downloadStatesList[index] = value
    }
    // 当一个文件下载完成后，检查是否还有后续下载任务
    checkContinueDownload() {
        // 如果没有全部下载完毕
        if (this.downloaded < store.result.length) {
            // 如果任务已停止
            if (this.downloadPause || this.downloadStop) {
                return false
            }
            // 如果已完成的数量 加上 线程中未完成的数量，仍然没有达到文件总数，继续添加任务
            if (this.downloaded + this.downloadThread - 1 < store.result.length) {
                return true
            } else {
                return false
            }
        } else {
            return false
        }
    }
    // 在日志上显示下载进度
    LogDownloadProgress(add = '') {
        let text = `${this.downloaded} / ${store.result.length}`
        // 追加转换动图的提示
        if (add) {
            text += ', ' + add
        }
        log.log(text, 2, false)
    }
    // 获取要下载的任务的编号
    getDownloadData() {
        let length = this.downloadStatesList.length
        let index
        for (let i = 0; i < length; i++) {
            if (this.downloadStatesList[i] === -1) {
                this.downloadStatesList[i] = 0
                index = i
                break
            }
        }
        if (index === undefined) {
            throw new Error('There are no data to download')
        } else {
            return {
                data: store.result[index],
                index
            }
        }
    }
}
// 下载文件，发送给浏览器下载
class DownloadFile {
    constructor() {
        this.downloadTime = 0 // 把下载完成的文件交给浏览器保存的时间戳
        this.timeInterval = 200 // 设置向浏览器发送下载任务的间隔时间。如果在很短时间内让浏览器建立大量下载任务，有一些下载任务就会丢失，所以设置这个参数。
        this.taskBatch = 0 // 任务批次
        this.listenDownloaded()
    }
    // 监听浏览器下载文件后，返回的消息
    listenDownloaded() {
        chrome.runtime.onMessage.addListener(msg => {
            // 文件下载成功
            if (msg.msg === 'downloaded') {
                // 释放 BLOBURL
                URL.revokeObjectURL(msg.data.url)
                evt.fire(evt.events.downloadSucccess, msg.data)
            } else if (msg.msg === 'download_err') {
                // 下载出错
                log.error(
                    `${store.result[msg.data.index].id}: download error! code: ${msg.err}`
                )
                evt.fire(evt.events.downloadError)
            }
            // UUID 的情况
            if (msg.data && msg.data.uuid) {
                log.error(lang.transl('_uuid'))
            }
        })
    }
    // 下载文件。参数是要使用的下载栏的序号
    download(data, index, progressBarNo, taskBatch) {
        titleBar.changeTitle('↓')
        this.taskBatch = taskBatch
        // 获取文件名
        let fullFileName = fileName.getFileName(data)
        // 重设当前下载栏的信息
        dlCtrl.setDownloadBar(index, progressBarNo, fullFileName, 0, 0)
        // 下载图片
        let xhr = new XMLHttpRequest()
        xhr.open('GET', data.url, true)
        xhr.responseType = 'blob'
        // 显示下载进度
        xhr.addEventListener('progress', function (e) {
            if (dlCtrl.downloadStopped) {
                xhr.abort()
                xhr = null
                return
            }
            e = e || window.event
            dlCtrl.setDownloadBar(index, progressBarNo, fullFileName, e.loaded, e.total)
        })
        // 下载完成
        xhr.addEventListener('loadend', () => {
            if (dlCtrl.downloadStopped) {
                xhr = null
                return
            }
            let file = xhr.response // 要下载的文件
            // 正常下载完毕的状态码是 200
            if (xhr.status !== 200) {
                // 404 时不进行重试，因为重试也依然会是 404
                if (xhr.status === 404) {
                    // 输出提示信息
                    log.error(lang.transl('_file404', data.id), 1)
                    // 404 错误时创建 txt 文件，并保存提示信息
                    file = new Blob([`${lang.transl('_file404', data.id)}`], {
                        type: 'text/plain'
                    })
                    fullFileName = fullFileName.replace(
                        /\.jpg$|\.png$|\.zip$|\.gif$|\.webm$/,
                        '.txt'
                    )
                } else {
                    evt.fire(evt.events.downloadError)
                    return
                }
            } else if (
                (data.ext === 'webm' || data.ext === 'gif') &&
                data.ugoiraInfo
            ) {
                convert.setCount = convert.count + 1
                const interval = setInterval(async () => {
                    if (dlCtrl.downloadStopped) {
                        clearInterval(interval);
                        return
                    }
                    if (!convert.working) {
                        clearInterval(interval);
                        convert.working = true
                        // 如果需要转换成视频
                        if (data.ext === 'webm') {
                            file = await convert.webm(file, data.ugoiraInfo)
                        }
                        // 如果需要转换成动图
                        if (data.ext === 'gif') {
                            file = await convert.gif(file, data.ugoiraInfo)
                        }
                        down()
                    }
                }, 1000);
                return
            }
            down()
            function down() {
                // 生成下载链接
                const blobUrl = URL.createObjectURL(file)
                // 向浏览器发送下载任务
                dlFile.browserDownload(blobUrl, fullFileName, progressBarNo, index)
                xhr = null
                file = null
            }
        })
        xhr.send()
    }
    // 向浏览器发送下载任务
    browserDownload(blobUrl, fullFileName, downloadBarNo, index) {
        // 如果前后两次任务的时间间隔小于 time_interval，则延迟一定时间使间隔达到 time_interval。
        const t = new Date().getTime() - this.downloadTime
        if (t < this.timeInterval) {
            setTimeout(() => {
                this.browserDownload(blobUrl, fullFileName, downloadBarNo, index)
            }, this.timeInterval - t)
            return
        }
        // 如果任务已停止，不会向浏览器发送下载任务
        if (dlCtrl.downloadStopped) {
            // 释放 bloburl
            URL.revokeObjectURL(blobUrl)
            return
        }
        this.downloadTime = new Date().getTime()
        const sendData = {
            msg: 'send_download',
            fileUrl: blobUrl,
            fileName: fullFileName,
            no: downloadBarNo,
            index: index,
            taskBatch: this.taskBatch
        }
        chrome.runtime.sendMessage(sendData)
    }
}
// 辅助功能
class Support {
    constructor() {
        this.checkConflict()
        this.supportListenHistory()
        this.listenPageSwitch()
        this.checkNew()
        this.showNew('_xzNew306')
        API.updateToken()
    }
    // 处理和脚本版的冲突
    checkConflict() {
        // 标注自己
        window.sessionStorage.setItem('xz_pixiv_extension', '1')
        // 把脚本版的标记设置为 0，这样脚本版就不会运行
        window.sessionStorage.setItem('xz_pixiv_userscript', '0')
    }
    // 检查新版本
    async checkNew() {
        // 显示更新按钮
        const show = function () {
            const updateIco = document.querySelector('.centerWrap_top_btn.update')
            updateIco.style.display = 'inline-block'
        }
        // 读取上一次检查的时间，如果超过一小时则检查 GitHub 上的信息
        const lastTime = localStorage.getItem('xzUpdateTime')
        if (
            !lastTime ||
            new Date().getTime() - parseInt(lastTime) > 60 * 60 * 1000
        ) {
            // 获取最新的 releases 信息
            const latest = await fetch(
                'https://api.github.com/repos/xuejianxianzun/PixivBatchDownloader/releases/latest'
            )
            const latestJson = await latest.json()
            const latestVer = latestJson.name
            // 保存 GitHub 上的版本信息
            localStorage.setItem('xzGithubVer', latestVer)
            // 保存本次检查的时间戳
            localStorage.setItem('xzUpdateTime', new Date().getTime().toString())
        }
        // 获取本地扩展的版本号
        const manifest = await fetch(chrome.extension.getURL('manifest.json'))
        const manifestJson = await manifest.json()
        const manifestVer = manifestJson.version
        // 比较大小
        const latestVer = localStorage.getItem('xzGithubVer')
        if (latestVer && manifestVer < latestVer) {
            show()
        }
    }
    // 显示最近更新内容
    showNew(tag) {
        if (
            window.location.host.includes('pixiv.net') &&
            !localStorage.getItem(tag)
        ) {
            const whatIsNewHtml = `
      <div class="xz_new">
        <p class="title">Powerful Pixiv Downloader ${lang.transl(
                '_最近更新'
            )}</p>
        <p class="content">${lang.transl(tag)}</p>
        <button class="btn">${lang.transl('_确定')}</button>
      </div>`
            document.body.insertAdjacentHTML('afterbegin', whatIsNewHtml)
            const whatIsNewEl = document.querySelector('.xz_new')
            whatIsNewEl.querySelector('.btn').addEventListener('click', () => {
                localStorage.setItem(tag, '1')
                whatIsNewEl.parentNode.removeChild(whatIsNewEl)
            })
        }
    }
    // 使用无刷新加载的页面需要监听 url 的改变，这里为这些事件添加监听支持
    supportListenHistory() {
        const element = document.createElement('script')
        element.setAttribute('type', 'text/javascript')
        element.innerHTML = `
    let _wr = function (type) {
      let orig = history[type];
      return function () {
        let rv = orig.apply(this, arguments);
        let e = new Event(type);
        e.arguments = arguments;
        window.dispatchEvent(e);
        return rv;
      };
    };
    history.pushState = _wr('pushState');
    history.replaceState = _wr('replaceState');
    `
        document.head.appendChild(element)
    }
    // 监听页面的无刷新切换。某些页面可以无刷新切换，这时需要进行一些处理
    listenPageSwitch() {
        // 绑定无刷新切换页面的事件，只绑定一次
        // pixiv 的后退使用 replaceState
        // pushState 判断从列表页进入作品页的情况，popstate 判断从作品页退回列表页的情况
        ;['pushState', 'popstate', 'replaceState'].forEach(item => {
            window.addEventListener(item, () => {
                evt.fire(evt.events.pageSwitch)
            })
        })
    }
}
const evt = new Evt()
const store = new Store()
const log = new Log()
const lang = new Lang()
const pageType = new PageType()
const ui = new UI() // 依赖于 UI 的类放到 ui 后面
new Output()
const pageInfo = new PageInfo()
const fileName = new FileName()
const filter = new Filter()
const saveOption = new SaveOption()
const convert = new ConvertUgoira()
const viewer = new ImgViewer()
const titleBar = new TitleBar()
const dlCtrl = new DownloadControl()
const dlFile = new DownloadFile()
new InitCrawlProcess()
new Support()

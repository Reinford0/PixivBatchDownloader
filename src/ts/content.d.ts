declare let zip: any

declare let Whammy: any

declare let GIF: any

// 下载时要使用的作品信息
interface WorkInfo {
  id: string
  url: string
  title: string
  tags: string[]
  tagsTranslated: string[]
  user: string
  userid: string
  fullWidth: number
  fullHeight: number
  ext: string
  bmk: number
  date: string
  type: number
  rank: string
  ugoiraInfo: UgoiraInfo
}

// tag 搜索页的作品数据
interface TagSearchResult {
  id: number
  el: string
  num: number
}

// 获取书签数据
interface BookmarkData {
  error: boolean
  message: string
  body: {
    works: BookmarkWork[]
    total: number
    zoneConfig: {
      '500x500': {
        url: string
      }
      header: {
        url: string
      }
      footer: {
        url: string
      }
      logo: {
        url: string
      }
    }
    extraData: {
      meta: {
        title: string
        description: string
        canonical: string
        ogp: {
          description: string
          image: string
          title: string
          type: string
        }
        twitter: {
          description: string
          image: string
          title: string
          card: string
        }
      }
    }
  }
}

// 获取书签的数据里，作品的数据
interface BookmarkWork {
  illustId: string
  illustTitle: string
  id: string
  title: string
  illustType: number
  xRestrict: number
  restrict: number
  sl: number
  url: string
  description: string
  tags: string[]
  userId: string
  userName: string
  width: number
  height: number
  pageCount: number
  isBookmarkable: boolean
  bookmarkData: {
    id: string
    private: boolean
  }
  profileImageUrl: string
}

// 从未分类书签中取出一些需要的数据
interface BookmarkResult {
  id: string
  tags: string
  restrict: boolean
}

// 动图信息
interface UgoiraData {
  error: boolean
  message: string
  body: {
    originalSrc: string
    src: string
    mime_type: string
    frames: { file: string; delay: number }[]
  }
}

// 动图每一帧的文件名和延迟
interface UgoiraInfo {
  mime_type: string
  frames: { file: string; delay: number }[]
}

// tag 搜索页里，作品信息的数据
interface BookMarkNewData {
  bookmarkCount: number
  height: number
  illustId: string
  illustTitle: string
  illustType: '0' | '1' | '2'
  isBookmarkable: boolean
  isBookmarked: boolean
  isPrivateBookmark: boolean
  isAdContainer: boolean
  pageCount: number
  responseCount: number
  tags: string[]
  url: string
  userId: string
  userImage: string
  userName: string
  width: number
}

// 画师列表页的列表数据，不带 tag。一些不需要使用的数据就简化了
interface UserProfileAllData {
  error: boolean
  message: string
  body: {
    illusts:
      | []
      | {
          [key: string]: null
        }
    manga:
      | []
      | {
          [key: string]: null
        }
    novels:
      | []
      | {
          [key: string]: null
        }
    mangaSeries: [] | {}
    novelSeries: [] | {}
    pickup: object
    bookmarkCount: object
    externalSiteWorksStatus: object
  }
}

type userWorksType = 'illusts' | 'manga' | 'novels'

// 画师列表页的列表数据，带 tag。一些不需要使用的数据就简化了
interface UserWorksWithTag {
  error: boolean
  message: string
  body: {
    works: {
      illustId: string
      illustTitle: string
      id: string
      title: string
      illustType: number
      xRestrict: number
      restrict: number
      sl: number
      url: string
      description: string
      tags: string[]
      userId: string
      userName: string
      width: number
      height: number
      pageCount: number
      isBookmarkable: boolean
      bookmarkData: null | {
        id: string
        private: boolean
      }
    }[]
    total: number
    zoneConfig: {
      [key: string]: {
        [key: string]: string
      }
    }
    extraData: {
      meta: {
        [key: string]: {
          [key: string]: string
        }
      }
    }
  }
}

// 作品的数据
interface IllustData {
  error: boolean
  message: string
  body: {
    illustId: string
    illustTitle: string
    illustComment: string
    id: string
    title: string
    description: string
    illustType: 0 | 1 | 2
    createDate: string
    uploadDate: string
    restrict: number
    xRestrict: number
    sl: number
    urls: {
      mini: string
      thumb: string
      small: string
      regular: string
      original: string
    }
    tags: {
      authorId: string
      isLocked: boolean
      tags: {
        tag: string
        locked: boolean
        deletable: boolean
        userId: string
        romaji: string
        translation?: {
          en: string
        }
        userName: string
      }[]
      writable: boolean
    }
    storableTags: string[]
    userId: string
    userName: string
    userAccount: string
    userIllusts: {
      [key: string]: null | {
        illustId: string
        illustTitle: string
        id: string
        title: string
        illustType: number
        xRestrict: number
        restrict: number
        sl: number
        url: string
        description: string
        tags: string[]
        userId: string
        userName: string
        width: number
        height: number
        pageCount: number
        isBookmarkable: boolean
        bookmarkData: null | {
          id: string
          private: boolean
        }
      }
    }
    likeData: boolean
    width: number
    height: number
    pageCount: number
    bookmarkCount: number
    likeCount: number
    commentCount: number
    responseCount: number
    viewCount: number
    isHowto: boolean
    isOriginal: boolean
    imageResponseOutData: []
    imageResponseData: []
    imageResponseCount: number
    pollData: null
    seriesNavData: null
    descriptionBoothId: null
    descriptionYoutubeId: null
    comicPromotion: null
    contestBanners: []
    isBookmarkable: boolean
    bookmarkData: null | {
      id: string
      private: boolean
    }
    contestData: null
    zoneConfig: {
      responsive: {
        url: string
      }
      '300x250': {
        url: string
      }
      '500x500': {
        url: string
      }
      header: {
        url: string
      }
      footer: {
        url: string
      }
      expandedFooter: {
        url: string
      }
      logo: {
        url: string
      }
    }
    extraData: {
      meta: {
        title: string
        description: string
        canonical: string
        alternateLanguages: []
        descriptionHeader: string
        ogp: {
          description: string
          image: string
          title: string
          type: string
        }
        twitter: {
          description: string
          image: string
          title: string
          card: string
        }
      }
    }
  }
}

// 作品信息的通用格式
interface WorksInfo {
  illustId: string
  illustTitle: string
  id: string
  title: string
  illustType: number
  xRestrict: number
  restrict: number
  sl: number
  url: string
  description: string
  tags: string[]
  userId: string
  userName: string
  width: number
  height: number
  pageCount: number
  isBookmarkable: boolean
  bookmarkData: null | {
    id: string
    private: boolean
  }
  alt: string
}

// 画师信息的数据 user/id/profile/Top
interface UserProfileTop {
  error: boolean
  message: string
  body: {
    illusts: {
      [key: string]: WorksInfo
    }
    manga: {
      [key: string]: WorksInfo
    }
    novels: []
    zoneConfig: {
      header: {
        url: string
      }
      footer: {
        url: string
      }
      logo: {
        url: string
      }
      '500x500': {
        url: string
      }
    }
    extraData: {
      meta: {
        title: string
        description: string
        canonical: string
        ogp: {
          description: string
          image: string
          title: string
          type: string
        }
        twitter: {
          description: string
          image: string
          title: string
          card: string
        }
      }
    }
  }
}

// 画师账户信息 user/id?full=1
interface UserProfile {
  error: boolean
  message: '' | string
  body: {
    userId: string
    name: string
    image: string
    imageBig: string
    premium: boolean
    isFollowed: boolean
    isMypixiv: boolean
    isBlocking: boolean
    background: null | {
      repeat: null
      color: null
      url: string
      isPrivate: boolean
    }
    partial: number
    following: number
    followedBack: boolean
    comment: string
    commentHtml: string
    webpage: null | string
    social: null | {
      twitter?: {
        url: string
      }
      facebook?: {
        url: string
      }
      pawoo?: {
        url: string
      }
    }
    region: {
      name: null | string
      privacyLevel: null | string
    }
    birthDay: {
      name: null | string
      privacyLevel: null | string
    }
    gender: {
      name: null | string
      privacyLevel: null | string
    }
    job: {
      name: null | string
      privacyLevel: null | string
    }
    workspace: null | {
      userWorkspaceMonitor?: string
      userWorkspaceTool?: string
      userWorkspaceScanner?: string
      userWorkspaceTablet?: string
      userWorkspaceMouse?: string
      userWorkspacePrinter?: string
      userWorkspaceDesktop?: string
    }
    official: boolean
    group:
      | null
      | {
          id: string
          title: string
          iconUrl: string
        }[]
  }
}

// xzTip 的参数
interface XzTipArg {
  type: number
  x: number
  y: number
}

// 表单
interface XzForm extends HTMLFormElement {
  setWantPage: HTMLInputElement
  imgNumberPerWork: HTMLInputElement
  setWorkType0: HTMLInputElement
  setWorkType1: HTMLInputElement
  setWorkType2: HTMLInputElement
  ugoiraSaveAs: RadioNodeList
  setFavNum: HTMLInputElement
  setOnlyBmk: HTMLInputElement
  setWidth: HTMLInputElement
  setWidthAndOr: RadioNodeList
  setHeight: HTMLInputElement
  ratio: RadioNodeList
  userRatio: HTMLInputElement
  needTag: HTMLInputElement
  notNeedTag: HTMLInputElement
  quietDownload: HTMLInputElement
  downloadThread: HTMLInputElement
  userSetName: HTMLInputElement
  pageInfoSelect: HTMLSelectElement
  fileNameSelect: HTMLSelectElement
  tagNameToFileName: HTMLInputElement
  debut: HTMLInputElement
}

// xzSetting
interface XzSetting {
  imgNumberPerWork: number
  notdownType: string
  ugoiraSaveAs: 'webm' | 'gif' | 'zip'
  needTag: string
  notNeedTag: string
  quietDownload: boolean
  downloadThread: number
  userSetName: string
  tagNameToFileName: boolean
  showOptions: boolean
  [key: string]: string | number | boolean
}

// 是否处于全屏状态
interface IsFullscreen {
  [key: string]: Element | null
}

// 前台向后台发送的任务信息
interface SendInfo {
  msg: string
  fileUrl: string
  fileName: string
  no: number
  thisIndex: number
  taskBatch: number
}

// 浏览器下载时每个任务的信息
interface DonwloadInfo {
  no: number
  url: string
  thisIndex: number
  tabId: number
  uuid: boolean
}

// 所有任务的信息
interface DonwloadListData {
  [key: number]: DonwloadInfo | null
}

// 下载完成后返回的信息
interface DownloadedMsg {
  msg: string
  data: DonwloadInfo
  err?: string
}

// 书签页面下方推荐作品的格式
interface Recommendations {
  recommendations: number[]
}

// 排行榜 api 返回的数据
interface Rank {
  contents: {
    title: string
    date: string
    tags: string[]
    url: string
    illust_type: string
    illust_book_style: string
    illust_page_count: string
    user_name: string
    profile_img: string
    illust_content_type: {
      sexual: number
      lo: boolean
      grotesque: boolean
      violent: boolean
      homosexual: boolean
      drug: boolean
      thoughts: boolean
      antisocial: boolean
      religion: boolean
      original: boolean
      furry: boolean
      bl: boolean
      yuri: boolean
    }
    illust_series: boolean
    illust_id: number
    width: number
    height: number
    user_id: number
    rank: number
    yes_rank: number
    rating_count: number
    view_count: number
    illust_upload_timestamp: number
    attr: string
    is_bookmarked: boolean
    bookmarkable: boolean
  }[]
  mode: string
  content: string
  page: number
  prev: boolean
  next: number
  date: string
  prev_date: string
  next_date: boolean
  rank_total: number
}

// 储存作品在排行榜中的排名
interface RankList {
  [key: string]: string
}

interface Setting1 {
  [key: string]: any
}

interface FilterWh {
  andOr: '&' | '|'
  width: number
  height: number
}

interface GetIllustDataError {
  status: number
  statusText: string
}

// 获取作品下方的相关作品数据。只有 recommendMethods 里的 id 列表是完整的。最多有 180 个，但经常会少一些。
interface RecommendData {
  error: false | true
  message: string
  body: {
    illusts: WorksInfo[]
    nextIds: string[]
    recommendMethods: {
      [key: string]: string
    }
  }
}

interface RankingData {
  contents: [
    {
      title: string
      date: string
      tags: string[]
      url: string
      illust_type: '0' | '1' | '2'
      illust_book_style: string
      illust_page_count: string
      user_name: string
      profile_img: string
      illust_content_type: {
        sexual: number
        lo: boolean
        grotesque: boolean
        violent: boolean
        homosexual: boolean
        drug: boolean
        thoughts: boolean
        antisocial: boolean
        religion: boolean
        original: boolean
        furry: boolean
        bl: boolean
        yuri: boolean
      }
      illust_series: boolean
      illust_id: number
      width: number
      height: number
      user_id: number
      rank: number
      yes_rank: number
      rating_count: number
      view_count: number
      illust_upload_timestamp: number
      attr: string
      is_bookmarked: boolean
      bookmarkable: boolean
    }
  ]
  mode: string
  content: string
  page: number
  prev: boolean
  next: number
  date: string
  prev_date: string
  next_date: boolean
  rank_total: number
}

// 收藏后的相似作品数据
interface RecommenderData {
  recommendations: number[]
}

// 搜索页的数据格式，删除了 body 里没有使用的部分
interface SearchData {
  error: boolean
  body: Record<
    'illustManga' | 'manga' | 'illust',
    {
      data: {
        illustId: string
        illustTitle: string
        id: string
        title: string
        illustType: 0 | 1 | 2
        xRestrict: number
        restrict: number
        sl: number
        url: string
        description: string
        tags: string[]
        userId: string
        userName: string
        width: number
        height: number
        pageCount: number
        isBookmarkable: boolean
        bookmarkData: null | {
          id: string
          private: boolean
        }
        alt: string
        isAdContainer: boolean
        profileImageUrl: string
      }[]
      total: number
    }
  >
}

// 大家的新作品的数据格式
interface NewIllustData {
  error: boolean
  message: string
  body: {
    illusts: {
      illustId: string
      illustTitle: string
      id: string
      title: string
      illustType: 0 | 1 | 2
      xRestrict: number
      restrict: number
      sl: number
      url: string
      description: string
      tags: string[]
      userId: string
      userName: string
      width: number
      height: number
      pageCount: number
      isBookmarkable: boolean
      bookmarkData: null | {
        id: string
        private: boolean
      }
      alt: string
      isAdContainer: boolean
      profileImageUrl: string
      type: string
    }[]
    lastId: string
    zoneConfig: {
      header: {
        url: string
      }
      logo: {
        url: string
      }
    }
  }
}

// 大家的新作品的 API 参数
interface NewIllustOption {
  lastId: string
  limit: string
  type: string
  r18: string
}

// 排行榜的 API 参数
interface RankingOption {
  mode: string
  p: number
  worksType?: string
  date?: string
}

// 过滤器的选项
interface FilterOption {
  illustType?: 0 | 1 | 2
  tags?: string[]
  bookmarkCount?: number
  bookmarkData?: any
  width?: number
  height?: number
  yes_rank?: number
}

// 排行榜的 api 所要求的参数
interface RankingParams {
  mode: string
  content: string
  date: string
  p: string
}

// 搜索 api 使用的选项（过滤选项）
interface SearchOption {
  order?: string
  type?: string
  wlt?: string
  hlt?: string
  ratio?: string
  tool?: string
  s_mode?: string
  mode?: string
  scd?: string
  ecd?: string
  blt?: string
  bgt?: string
  [key: string]: string | undefined
}

// 删除作品的接口
interface DeleteWorksInterface {
  worksSelector: string // 选择页面上所有作品的选择器
  multipleSelector: string // 多图作品特有的元素的标识
  ugoiraSelector: string // 动图作品特有的元素的标识
}

interface IllustPageMembers {
  crawlDirection: number
  crawlRelated: boolean
}

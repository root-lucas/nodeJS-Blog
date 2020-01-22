const getList = (author, keyword) => {
    // 先返回假数据 (保证格式是正确的)
    return [
        {
            id: 1,
            title: '标题A',
            content: '我是内容1',
            createTime: 1546461231456,
            author: 'zhangsan'
        },
        {
            id: 2,
            title: '标题B',
            content: '我是内容2',
            createTime: 1546461231456,
            author: 'lisi'
        }

    ]
}

const getDetail = (id) => {
    // 先返回假数据
    return {
        id: 1,
        title: '标题A',
        content: '内容A',
        createTime: 1546461231457,
        author: 'lucas'
    }
}

module.exports = {
    getList,
    getDetail
}
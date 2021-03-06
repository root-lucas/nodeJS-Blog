const querystring = require('querystring');
const { get, set } = require('./src/db/redis');
const { access } = require('./src/utils/log')
const handleBlogRouter = require('./src/router/blog');
const handleUserRouter = require('./src/router/user');


// 获取 cookie 的过期时间
const getCookieExpires = () => {
    const d = new Date();
    d.setTime(d.getTime() + (24 * 60 * 60 * 1000)); // 24小时
    return d.toGMTString()
}

// session 数据
// const SESSION_DATA = {};

// 用于处理 post data
const getPostData = (req) => {
    const promise = new Promise((resolve, reject) => {
        if (req.method !== 'POST') {
            resolve({});
            return
        }
        if (req.headers['content-type'] !== 'application/json') {
            resolve({});
            return
        }
        let postData = '';
        req.on('data', chunk => {
            postData += chunk.toString()
        })
        req.on('end', () => {
            if (!postData) {
                resolve({});
                return
            }
            resolve(
                JSON.parse(postData)
            )
        })
    })
    return promise;
} 

const serverHandle = (req, res) => {
    // 记录 access log
    access(`${req.method} -- ${req.url} -- ${req.headers['user-agent']} -- ${Date.now()}`)
  
    // 设置返回格式 JSON
    res.setHeader('Content-type', 'application/json');

    // 获取 path
    const url = req.url;
    req.path = url.split('?')[0]

    // 解析 query
    req.query = querystring.parse(url.split('?')[1]);

    // 解析 cookie (仅用于测试)
    req.cookie = {};
    const cookieStr = req.headers.cookie || '';
    cookieStr.split(';').forEach(item => {
        if (!item) {
            return
        }
        const arr = item.split('=');
        const key = arr[0];
        const val = arr[1];
        req.cookie[key] = val;
    })

    // // 解析 session
    // let needSetCookie = false;
    // let userId = req.cookie.userid;
    // if (userId) {
    //     if (!SESSION_DATA[userId]) {
    //         SESSION_DATA[userId] = {}
    //     } 
    // } else {
    //     needSetCookie = true;
    //     userId = `${Date.now()}_${Math.random()}`;
    //     SESSION_DATA[userId] = {}
    // }
    // req.session = SESSION_DATA[userId];
    
  // 解析session（使用redis）
    let needSetCookie = false;
    let userId = req.cookie.userid;
    if (!userId) {
        needSetCookie = true;
        userId = `${Date.now()}_${Math.random()}`;
        // 初始化redis 中session的初始值
        set(userId, {});
    }
    req.sessionId = userId;
    get(req.sessionId)
    .then(sessionData => {
        if (!sessionData) {
            // 初始化redis 中session的初始值
            set(req.sessionId, {});
            // 设置session
            req.session = {};
        } else {
            req.session = sessionData;
        }
        // console.log("req.session:", req.session);
        return getPostData(req);
    })
    .then(postData => {
        req.body = postData;

        // 处理 blog 路由
        // const blogData = handleBlogRouter(req, res);
        // if (blogData) {
        //     res.end(
        //         JSON.stringify(blogData)
        //     );
        //     return
        // }
        const blogResult = handleBlogRouter(req, res);
        if (blogResult) {
            blogResult.then(blogData => {
                if (needSetCookie) {
                    // 操作 cookie, httpOnly属性是限制客户端js脚本获取该条cookie信息, 防止xss攻击
                    res.setHeader('Set-Cookie', `userid=${userId}; path=/; httpOnly; expires=${getCookieExpires()}`); // 不写path的话默认是api/user/login生效
                }
                res.end(
                    JSON.stringify(blogData)
                );    
            })
            return
        }

        // 处理 user路由
        // const userData = handleUserRouter(req, res);
        // if (userData) {
        //     res.end(
        //         JSON.stringify(userData)
        //     );
        //     return
        // }
        const userResult = handleUserRouter(req, res);
        if (userResult) {
            userResult.then(userData => {
                if (needSetCookie) {
                    res.setHeader('Set-Cookie', `userid=${userId}; path=/; httpOnly; expires=${getCookieExpires()}`); // 不写path的话默认是api/user/login生效
                }
                res.end(
                    JSON.stringify(userData)
                )
            })
            return 
        }

        // 未命中路由, 返回 404
        res.writeHead(404, {"Content-type":"text/plain"});
        res.write('404 Not Found\n');
        res.end();
    })
} 

module.exports = serverHandle;

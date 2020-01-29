const { login } = require('../controller/user');
const { SuccessModel, ErrorModel } = require('../model/resModel');

// 获取 cookie 的过期时间
const getCookieExpires = () => {
    const d = new Date();
    d.setTime(d.getTime() + (24 * 60 * 60 * 1000)); // 24小时
    return d.toGMTString()
}

const handleUserRouter = (req, res) => {
    const method = req.method; //GET POST


    // 登录
    if (method === 'GET' && req.path === '/api/user/login') {
        // const { username, password } = req.body;
        const { username, password} = req.query;
        const result = login(username, password);
        return result.then(data => {
            if (data.username) {
                // 操作 cookie, httpOnly属性是限制客户端js脚本获取该条cookie信息, 防止xss攻击
                res.setHeader('Set-Cookie', `username=${data.username}; path=/; httpOnly; expires=${getCookieExpires()}`); // 不写path的话默认是api/user/login生效
                return new SuccessModel();
            }
            return new ErrorModel("登录失败");
        })
            
    }

    // 这是登录验证的测试
    if (method === 'GET' && req.path === '/api/user/login-test') {
        if (req.cookie.username) {
            return Promise.resolve(
                new SuccessModel({username: req.cookie.username})
            );
        }
        return Promise.resolve(new ErrorModel("尚未登录"));
    }
}

module.exports = handleUserRouter;
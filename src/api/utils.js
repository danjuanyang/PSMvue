/**
 * 生成用于文件预览的 URL。
 * 这个函数不发送请求，只是构建一个可以直接在浏览器中打开的链接。
 * @param {string} modelName - 模型的名称 ('project' 或 'announcement').
 * @param {number} fileId - 文件或附件的 ID.
 * @returns {string} - 完整的预览 URL.
 */
export function getFilePreviewUrl(modelName, fileId) {
    // baseURL 在 vue.config.js 中被代理到后端服务器
    // 后端 utils 蓝图的 url_prefix 是 /api/utils
    return `/api/utils/preview/${modelName}/${fileId}`;
}
  